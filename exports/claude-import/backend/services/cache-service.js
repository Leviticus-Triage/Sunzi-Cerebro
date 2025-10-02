/**
 * Redis Cache Service for Sunzi Cerebro Enterprise
 * High-performance caching layer with intelligent eviction and monitoring
 */

import Redis from 'redis';
import { promisify } from 'util';
import logger from '../config/logger.js';
import { metricsCollector } from '../middleware/metrics.js';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
    this.retryDelay = 1000; // Start with 1 second

    // Cache statistics for monitoring
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };

    // Cache configuration
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: parseInt(process.env.REDIS_DB) || 0,
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // IPv4
      keyPrefix: process.env.REDIS_PREFIX || 'sunzi:cerebro:'
    };

    // Default TTLs for different cache types (in seconds)
    this.ttlConfig = {
      default: 3600,        // 1 hour
      short: 300,           // 5 minutes
      medium: 1800,         // 30 minutes
      long: 86400,          // 24 hours
      session: 28800,       // 8 hours
      toolResult: 7200,     // 2 hours
      userProfile: 3600,    // 1 hour
      apiResponse: 600,     // 10 minutes
      vulnerability: 86400, // 24 hours
      systemInfo: 300       // 5 minutes
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      this.client = Redis.createClient({
        ...this.config,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }

          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }

          if (options.attempt > this.maxRetryAttempts) {
            logger.error('Max Redis retry attempts reached');
            return new Error('Max retry attempts reached');
          }

          // Exponential backoff
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.retryAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('Redis error:', error);
        this.isConnected = false;
        this.stats.errors++;
        metricsCollector.recordCacheOperation('error', 'error');
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
        this.retryAttempts++;
      });

      // Connect to Redis
      await this.client.connect();

      logger.info('✅ Redis Cache Service initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Redis Cache Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable() {
    return this.isConnected && this.client && this.client.isOpen;
  }

  /**
   * Generate cache key with prefix
   */
  _generateKey(key, namespace = 'default') {
    return `${this.config.keyPrefix}${namespace}:${key}`;
  }

  /**
   * Get value from cache
   */
  async get(key, namespace = 'default') {
    if (!this.isAvailable()) {
      this.stats.misses++;
      return null;
    }

    try {
      const cacheKey = this._generateKey(key, namespace);
      const value = await this.client.get(cacheKey);

      if (value !== null) {
        this.stats.hits++;
        metricsCollector.recordCacheOperation('get', 'hit');

        // Try to parse JSON, return as-is if not valid JSON
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      } else {
        this.stats.misses++;
        metricsCollector.recordCacheOperation('get', 'miss');
        return null;
      }

    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('get', 'error');
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = null, namespace = 'default') {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this._generateKey(key, namespace);
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      const cacheTtl = ttl || this.ttlConfig.default;

      await this.client.setEx(cacheKey, cacheTtl, serializedValue);

      this.stats.sets++;
      metricsCollector.recordCacheOperation('set', 'success');
      return true;

    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('set', 'error');
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key, namespace = 'default') {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this._generateKey(key, namespace);
      const deleted = await this.client.del(cacheKey);

      this.stats.deletes++;
      metricsCollector.recordCacheOperation('delete', deleted > 0 ? 'success' : 'not_found');
      return deleted > 0;

    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('delete', 'error');
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key, namespace = 'default') {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this._generateKey(key, namespace);
      const exists = await this.client.exists(cacheKey);
      return exists === 1;

    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration for existing key
   */
  async expire(key, ttl, namespace = 'default') {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this._generateKey(key, namespace);
      const result = await this.client.expire(cacheKey, ttl);
      return result === 1;

    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple values at once
   */
  async mget(keys, namespace = 'default') {
    if (!this.isAvailable() || !keys.length) {
      return {};
    }

    try {
      const cacheKeys = keys.map(key => this._generateKey(key, namespace));
      const values = await this.client.mGet(cacheKeys);

      const result = {};
      keys.forEach((key, index) => {
        if (values[index] !== null) {
          this.stats.hits++;
          try {
            result[key] = JSON.parse(values[index]);
          } catch {
            result[key] = values[index];
          }
        } else {
          this.stats.misses++;
        }
      });

      metricsCollector.recordCacheOperation('mget', 'success');
      return result;

    } catch (error) {
      logger.error('Cache mget error:', error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('mget', 'error');
      return {};
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(keyValuePairs, ttl = null, namespace = 'default') {
    if (!this.isAvailable() || !Object.keys(keyValuePairs).length) {
      return false;
    }

    try {
      const cacheTtl = ttl || this.ttlConfig.default;
      const pipeline = this.client.multi();

      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const cacheKey = this._generateKey(key, namespace);
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        pipeline.setEx(cacheKey, cacheTtl, serializedValue);
      });

      await pipeline.exec();
      this.stats.sets += Object.keys(keyValuePairs).length;
      metricsCollector.recordCacheOperation('mset', 'success');
      return true;

    } catch (error) {
      logger.error('Cache mset error:', error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('mset', 'error');
      return false;
    }
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern, namespace = 'default') {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const searchPattern = this._generateKey(pattern, namespace);
      const keys = await this.client.keys(searchPattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.client.del(keys);
      this.stats.deletes += deleted;
      metricsCollector.recordCacheOperation('delete_pattern', 'success');
      return deleted;

    } catch (error) {
      logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('delete_pattern', 'error');
      return 0;
    }
  }

  /**
   * Increment numeric value
   */
  async incr(key, by = 1, namespace = 'default') {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cacheKey = this._generateKey(key, namespace);
      const result = by === 1
        ? await this.client.incr(cacheKey)
        : await this.client.incrBy(cacheKey, by);

      metricsCollector.recordCacheOperation('incr', 'success');
      return result;

    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('incr', 'error');
      return null;
    }
  }

  /**
   * Decrement numeric value
   */
  async decr(key, by = 1, namespace = 'default') {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cacheKey = this._generateKey(key, namespace);
      const result = by === 1
        ? await this.client.decr(cacheKey)
        : await this.client.decrBy(cacheKey, by);

      metricsCollector.recordCacheOperation('decr', 'success');
      return result;

    } catch (error) {
      logger.error(`Cache decr error for key ${key}:`, error);
      this.stats.errors++;
      metricsCollector.recordCacheOperation('decr', 'error');
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;

    return {
      ...this.stats,
      hitRate: hitRate,
      isConnected: this.isConnected,
      retryAttempts: this.retryAttempts
    };
  }

  /**
   * Update cache hit ratio metrics
   */
  updateMetrics() {
    const stats = this.getStats();
    metricsCollector.updateCacheHitRatio('redis', stats.hitRate);
  }

  /**
   * Clear all cache in namespace
   */
  async clearNamespace(namespace = 'default') {
    return this.deletePattern('*', namespace);
  }

  /**
   * Get cache info
   */
  async getInfo() {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Cache info error:', error);
      return null;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis Cache Service shut down gracefully');
      } catch (error) {
        logger.error('Error during Redis shutdown:', error);
        await this.client.disconnect();
      }
    }
  }
}

// Create and export singleton instance
const cacheService = new CacheService();

// Helper functions for common cache patterns
export const cacheHelpers = {
  // Cache-aside pattern with fallback
  async getOrSet(key, fetchFunction, ttl = null, namespace = 'default') {
    let value = await cacheService.get(key, namespace);

    if (value === null) {
      try {
        value = await fetchFunction();
        if (value !== null && value !== undefined) {
          await cacheService.set(key, value, ttl, namespace);
        }
      } catch (error) {
        logger.error('Error in cache getOrSet fallback:', error);
        throw error;
      }
    }

    return value;
  },

  // Invalidate cache with dependencies
  async invalidateWithDeps(key, dependencies = [], namespace = 'default') {
    const promises = [cacheService.del(key, namespace)];

    dependencies.forEach(dep => {
      promises.push(cacheService.del(dep, namespace));
    });

    await Promise.all(promises);
  },

  // Time-based cache warming
  async warmCache(key, fetchFunction, ttl, namespace = 'default') {
    try {
      const value = await fetchFunction();
      await cacheService.set(key, value, ttl, namespace);
      return value;
    } catch (error) {
      logger.error('Error warming cache:', error);
      throw error;
    }
  }
};

export default cacheService;