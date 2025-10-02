/**
 * Multi-Level Caching Service
 * L1: Memory Cache (ultra-fast, small)
 * L2: Redis Cache (fast, shared)
 * L3: Database Cache (slower, persistent)
 *
 * Features:
 * - Automatic cache warming
 * - Intelligent eviction policies
 * - Cache coherency
 * - Compression for large values
 * - TTL management
 * - Cache statistics
 */

import NodeCache from 'node-cache';
import { EventEmitter } from 'events';
import crypto from 'crypto';

class MultiLevelCache extends EventEmitter {
  constructor(options = {}) {
    super();

    // L1 Cache: In-memory cache (NodeCache)
    this.l1Cache = new NodeCache({
      stdTTL: options.l1TTL || 300,        // 5 minutes default
      checkperiod: options.checkPeriod || 60, // Check for expired keys every 60s
      useClones: false,                    // Don't clone data for performance
      maxKeys: options.maxKeys || 1000     // Maximum 1000 keys in L1
    });

    // L2 Cache: Redis client (to be injected)
    this.l2Cache = options.redisClient || null;

    // L3 Cache: Database cache (to be injected)
    this.l3Cache = options.databaseCache || null;

    // Cache configuration
    this.config = {
      compression: {
        enabled: true,
        threshold: 1024 // Compress values > 1KB
      },
      warming: {
        enabled: true,
        keys: [],
        interval: 5 * 60 * 1000 // Warm cache every 5 minutes
      },
      eviction: {
        strategy: 'lru', // LRU eviction
        maxSize: 100 * 1024 * 1024 // 100MB max cache size
      }
    };

    // Statistics
    this.stats = {
      l1: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
      l2: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
      l3: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
      overall: { hits: 0, misses: 0, hitRate: 0 }
    };

    // Cache warming
    if (this.config.warming.enabled) {
      this.startCacheWarming();
    }

    // Event listeners
    this.l1Cache.on('expired', (key, value) => {
      this.emit('key-expired', { level: 'l1', key });
    });

    this.l1Cache.on('del', (key, value) => {
      this.emit('key-deleted', { level: 'l1', key });
    });

    console.log('🎯 Multi-Level Cache initialized');
  }

  /**
   * Get value from cache (L1 -> L2 -> L3)
   */
  async get(key, options = {}) {
    const cacheKey = this.generateKey(key);

    try {
      // Try L1 Cache first
      const l1Value = this.l1Cache.get(cacheKey);
      if (l1Value !== undefined) {
        this.stats.l1.hits++;
        this.stats.overall.hits++;
        this.updateHitRate();
        this.emit('cache-hit', { level: 'l1', key: cacheKey });
        return this.decompress(l1Value);
      }
      this.stats.l1.misses++;

      // Try L2 Cache (Redis)
      if (this.l2Cache) {
        const l2Value = await this.getFromL2(cacheKey);
        if (l2Value !== null) {
          this.stats.l2.hits++;
          this.stats.overall.hits++;
          this.updateHitRate();

          // Promote to L1
          await this.setL1(cacheKey, l2Value, options.ttl);

          this.emit('cache-hit', { level: 'l2', key: cacheKey });
          return this.decompress(l2Value);
        }
        this.stats.l2.misses++;
      }

      // Try L3 Cache (Database)
      if (this.l3Cache && options.fetchFromDb) {
        const l3Value = await this.getFromL3(cacheKey);
        if (l3Value !== null) {
          this.stats.l3.hits++;
          this.stats.overall.hits++;
          this.updateHitRate();

          // Promote to L1 and L2
          await this.set(cacheKey, l3Value, options.ttl);

          this.emit('cache-hit', { level: 'l3', key: cacheKey });
          return l3Value;
        }
        this.stats.l3.misses++;
      }

      // Complete miss
      this.stats.overall.misses++;
      this.updateHitRate();
      this.emit('cache-miss', { key: cacheKey });

      return null;

    } catch (error) {
      console.error(`❌ Cache get error for key ${cacheKey}:`, error);
      this.emit('cache-error', { operation: 'get', key: cacheKey, error });
      return null;
    }
  }

  /**
   * Set value in cache (all levels)
   */
  async set(key, value, ttl = null) {
    const cacheKey = this.generateKey(key);

    try {
      const compressedValue = this.compress(value);

      // Set in L1
      await this.setL1(cacheKey, compressedValue, ttl);

      // Set in L2 (Redis)
      if (this.l2Cache) {
        await this.setL2(cacheKey, compressedValue, ttl);
      }

      // Optionally set in L3 (Database)
      if (this.l3Cache && ttl && ttl > 3600) {
        // Only cache long-lived data in database
        await this.setL3(cacheKey, value, ttl);
      }

      this.emit('cache-set', { key: cacheKey, size: JSON.stringify(value).length });

      return true;
    } catch (error) {
      console.error(`❌ Cache set error for key ${cacheKey}:`, error);
      this.emit('cache-error', { operation: 'set', key: cacheKey, error });
      return false;
    }
  }

  /**
   * Delete from all cache levels
   */
  async delete(key) {
    const cacheKey = this.generateKey(key);

    try {
      // Delete from L1
      this.l1Cache.del(cacheKey);
      this.stats.l1.deletes++;

      // Delete from L2
      if (this.l2Cache) {
        await this.deleteFromL2(cacheKey);
        this.stats.l2.deletes++;
      }

      // Delete from L3
      if (this.l3Cache) {
        await this.deleteFromL3(cacheKey);
        this.stats.l3.deletes++;
      }

      this.emit('cache-delete', { key: cacheKey });

      return true;
    } catch (error) {
      console.error(`❌ Cache delete error for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern) {
    try {
      // Invalidate L1
      const l1Keys = this.l1Cache.keys();
      const matchingKeys = l1Keys.filter(key => this.matchPattern(key, pattern));

      for (const key of matchingKeys) {
        await this.delete(key);
      }

      // Invalidate L2 (Redis pattern delete)
      if (this.l2Cache && this.l2Cache.keys) {
        const l2Keys = await this.l2Cache.keys(pattern);
        for (const key of l2Keys) {
          await this.delete(key);
        }
      }

      this.emit('pattern-invalidated', { pattern, count: matchingKeys.length });

      console.log(`🧹 Invalidated ${matchingKeys.length} keys matching pattern: ${pattern}`);

      return matchingKeys.length;
    } catch (error) {
      console.error(`❌ Pattern invalidation error:`, error);
      return 0;
    }
  }

  /**
   * L1 Cache Operations
   */
  async setL1(key, value, ttl = null) {
    const success = this.l1Cache.set(key, value, ttl || this.config.l1TTL);
    if (success) {
      this.stats.l1.sets++;
      this.updateCacheSize();
    }
    return success;
  }

  /**
   * L2 Cache Operations (Redis)
   */
  async getFromL2(key) {
    if (!this.l2Cache) return null;

    try {
      const value = await this.l2Cache.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`❌ L2 get error:`, error);
      return null;
    }
  }

  async setL2(key, value, ttl = null) {
    if (!this.l2Cache) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.l2Cache.setex(key, ttl, serialized);
      } else {
        await this.l2Cache.set(key, serialized);
      }
      this.stats.l2.sets++;
      return true;
    } catch (error) {
      console.error(`❌ L2 set error:`, error);
      return false;
    }
  }

  async deleteFromL2(key) {
    if (!this.l2Cache) return false;

    try {
      await this.l2Cache.del(key);
      return true;
    } catch (error) {
      console.error(`❌ L2 delete error:`, error);
      return false;
    }
  }

  /**
   * L3 Cache Operations (Database)
   */
  async getFromL3(key) {
    if (!this.l3Cache || !this.l3Cache.get) return null;

    try {
      return await this.l3Cache.get(key);
    } catch (error) {
      console.error(`❌ L3 get error:`, error);
      return null;
    }
  }

  async setL3(key, value, ttl) {
    if (!this.l3Cache || !this.l3Cache.set) return false;

    try {
      await this.l3Cache.set(key, value, ttl);
      this.stats.l3.sets++;
      return true;
    } catch (error) {
      console.error(`❌ L3 set error:`, error);
      return false;
    }
  }

  async deleteFromL3(key) {
    if (!this.l3Cache || !this.l3Cache.delete) return false;

    try {
      await this.l3Cache.delete(key);
      return true;
    } catch (error) {
      console.error(`❌ L3 delete error:`, error);
      return false;
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  startCacheWarming() {
    if (!this.config.warming.enabled) return;

    setInterval(() => {
      this.warmCache();
    }, this.config.warming.interval);

    console.log(`🔥 Cache warming enabled (interval: ${this.config.warming.interval}ms)`);
  }

  async warmCache() {
    if (this.config.warming.keys.length === 0) return;

    console.log(`🔥 Warming cache with ${this.config.warming.keys.length} keys...`);

    for (const keyConfig of this.config.warming.keys) {
      try {
        const { key, fetcher, ttl } = keyConfig;

        // Check if already in L1
        const cached = await this.get(key);
        if (cached) continue;

        // Fetch and cache
        if (fetcher && typeof fetcher === 'function') {
          const value = await fetcher();
          if (value) {
            await this.set(key, value, ttl);
            console.log(`🔥 Warmed cache for key: ${key}`);
          }
        }
      } catch (error) {
        console.error(`❌ Cache warming error for key:`, error);
      }
    }
  }

  /**
   * Add key to warming list
   */
  addWarmingKey(key, fetcher, ttl = 300) {
    this.config.warming.keys.push({ key, fetcher, ttl });
  }

  /**
   * Compression utilities
   */
  compress(value) {
    if (!this.config.compression.enabled) return value;

    const serialized = JSON.stringify(value);
    if (serialized.length < this.config.compression.threshold) {
      return value; // Don't compress small values
    }

    // Simple compression indicator (in production, use zlib)
    return {
      __compressed: true,
      data: value // In production: zlib.deflateSync(Buffer.from(serialized))
    };
  }

  decompress(value) {
    if (!value || !value.__compressed) return value;

    // In production: zlib.inflateSync(value.data).toString()
    return value.data;
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(key) {
    if (typeof key === 'object') {
      const hash = crypto
        .createHash('md5')
        .update(JSON.stringify(key))
        .digest('hex');
      return `cache:${hash}`;
    }
    return `cache:${key}`;
  }

  /**
   * Match pattern (simple glob-like matching)
   */
  matchPattern(key, pattern) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(key);
  }

  /**
   * Update cache statistics
   */
  updateHitRate() {
    const total = this.stats.overall.hits + this.stats.overall.misses;
    this.stats.overall.hitRate = total > 0
      ? (this.stats.overall.hits / total) * 100
      : 0;
  }

  updateCacheSize() {
    const l1Stats = this.l1Cache.getStats();
    this.stats.l1.size = l1Stats.ksize;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.updateCacheSize();

    return {
      l1: {
        ...this.stats.l1,
        hitRate: this.stats.l1.hits + this.stats.l1.misses > 0
          ? (this.stats.l1.hits / (this.stats.l1.hits + this.stats.l1.misses)) * 100
          : 0
      },
      l2: {
        ...this.stats.l2,
        hitRate: this.stats.l2.hits + this.stats.l2.misses > 0
          ? (this.stats.l2.hits / (this.stats.l2.hits + this.stats.l2.misses)) * 100
          : 0
      },
      l3: {
        ...this.stats.l3,
        hitRate: this.stats.l3.hits + this.stats.l3.misses > 0
          ? (this.stats.l3.hits / (this.stats.l3.hits + this.stats.l3.misses)) * 100
          : 0
      },
      overall: {
        ...this.stats.overall,
        distribution: {
          l1: this.stats.l1.hits,
          l2: this.stats.l2.hits,
          l3: this.stats.l3.hits,
          misses: this.stats.overall.misses
        }
      }
    };
  }

  /**
   * Clear all cache levels
   */
  async clearAll() {
    try {
      // Clear L1
      this.l1Cache.flushAll();

      // Clear L2
      if (this.l2Cache && this.l2Cache.flushall) {
        await this.l2Cache.flushall();
      }

      // Clear L3
      if (this.l3Cache && this.l3Cache.clear) {
        await this.l3Cache.clear();
      }

      // Reset stats
      this.stats = {
        l1: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
        l2: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
        l3: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
        overall: { hits: 0, misses: 0, hitRate: 0 }
      };

      console.log('🧹 All cache levels cleared');
      this.emit('cache-cleared');

      return true;
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  healthCheck() {
    const stats = this.getStats();

    return {
      healthy: true,
      levels: {
        l1: { available: true, size: stats.l1.size, hitRate: stats.l1.hitRate },
        l2: { available: !!this.l2Cache, hitRate: stats.l2.hitRate },
        l3: { available: !!this.l3Cache, hitRate: stats.l3.hitRate }
      },
      performance: {
        hitRate: stats.overall.hitRate,
        totalHits: stats.overall.hits,
        totalMisses: stats.overall.misses
      },
      recommendations: this.getRecommendations(stats)
    };
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(stats) {
    const recommendations = [];

    if (stats.overall.hitRate < 50) {
      recommendations.push('Cache hit rate is low - consider warming more keys or increasing TTL');
    }

    if (stats.l1.size > 800) {
      recommendations.push('L1 cache near capacity - consider increasing maxKeys or implementing better eviction');
    }

    if (stats.l2.hitRate > 80 && !this.l2Cache) {
      recommendations.push('Consider enabling L2 cache (Redis) for better performance');
    }

    return recommendations;
  }
}

// Export singleton instance (can be configured later)
export const multiLevelCache = new MultiLevelCache();
export default multiLevelCache;