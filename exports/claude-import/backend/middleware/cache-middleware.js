/**
 * Cache Middleware for Sunzi Cerebro Enterprise
 * Intelligent response caching with cache-control headers
 */

import cacheService, { cacheHelpers } from '../services/cache-service.js';
import logger from '../config/logger.js';

/**
 * Response caching middleware
 */
export const cacheResponse = (options = {}) => {
  const {
    ttl = cacheService.ttlConfig.apiResponse,
    namespace = 'response',
    keyGenerator = null,
    condition = null,
    skipMethods = ['POST', 'PUT', 'DELETE', 'PATCH'],
    skipStatuses = [201, 202, 204, 400, 401, 403, 404, 500, 502, 503],
    vary = ['Accept-Encoding', 'Authorization'],
    maxSize = 1024 * 1024 // 1MB max response size
  } = options;

  return async (req, res, next) => {
    // Skip if method should not be cached
    if (skipMethods.includes(req.method)) {
      return next();
    }

    // Skip if condition function returns false
    if (condition && !condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? keyGenerator(req) : generateDefaultCacheKey(req);

    try {
      // Try to get cached response
      const cachedResponse = await cacheService.get(cacheKey, namespace);

      if (cachedResponse) {
        logger.debug(`Cache hit for key: ${cacheKey}`);

        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`,
          'Vary': vary.join(', ')
        });

        // Set original headers
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            if (!res.get(key)) {
              res.set(key, value);
            }
          });
        }

        return res.status(cachedResponse.status || 200).send(cachedResponse.body);
      }

    } catch (error) {
      logger.error('Cache retrieval error:', error);
    }

    // Cache miss - intercept response
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    let responseBody = null;
    let responseSent = false;

    // Override send method
    res.send = function(body) {
      if (!responseSent) {
        responseBody = body;
        cacheIfAppropriate.call(this, body);
      }
      return originalSend.call(this, body);
    };

    // Override json method
    res.json = function(obj) {
      if (!responseSent) {
        responseBody = JSON.stringify(obj);
        cacheIfAppropriate.call(this, responseBody);
      }
      return originalJson.call(this, obj);
    };

    // Override end method
    res.end = function(chunk, encoding) {
      if (!responseSent && chunk) {
        responseBody = chunk;
        cacheIfAppropriate.call(this, chunk);
      }
      return originalEnd.call(this, chunk, encoding);
    };

    // Cache the response if appropriate
    async function cacheIfAppropriate(body) {
      if (responseSent) return;
      responseSent = true;

      try {
        // Don't cache if status should be skipped
        if (skipStatuses.includes(this.statusCode)) {
          logger.debug(`Skipping cache for status ${this.statusCode}`);
          return;
        }

        // Don't cache if body is too large
        const bodySize = Buffer.byteLength(body || '', 'utf8');
        if (bodySize > maxSize) {
          logger.debug(`Skipping cache - response too large: ${bodySize} bytes`);
          return;
        }

        // Prepare cached response
        const cachedResponse = {
          status: this.statusCode,
          headers: {},
          body: body,
          timestamp: Date.now(),
          size: bodySize
        };

        // Store selected headers
        const headersToCache = ['Content-Type', 'Content-Encoding', 'ETag'];
        headersToCache.forEach(header => {
          const value = this.get(header);
          if (value) {
            cachedResponse.headers[header] = value;
          }
        });

        // Cache the response
        await cacheService.set(cacheKey, cachedResponse, ttl, namespace);

        // Set cache miss headers
        this.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`,
          'Vary': vary.join(', ')
        });

        logger.debug(`Cached response for key: ${cacheKey} (${bodySize} bytes)`);

      } catch (error) {
        logger.error('Error caching response:', error);
      }
    }

    next();
  };
};

/**
 * Session caching middleware
 */
export const cacheSession = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next();
  }

  const sessionKey = `user:${req.user.id}:session`;

  try {
    // Try to get cached session data
    const cachedSession = await cacheService.get(sessionKey, 'session');

    if (cachedSession) {
      // Merge cached data with request user
      req.user = { ...req.user, ...cachedSession };
      logger.debug(`Session cache hit for user ${req.user.id}`);
    } else {
      // Cache current session data
      const sessionData = {
        tenant_id: req.user.tenant_id,
        role: req.user.role,
        permissions: req.user.permissions,
        last_login: req.user.last_login_at,
        preferences: req.user.preferences
      };

      await cacheService.set(sessionKey, sessionData, cacheService.ttlConfig.session, 'session');
      logger.debug(`Session cached for user ${req.user.id}`);
    }

  } catch (error) {
    logger.error('Session cache error:', error);
  }

  next();
};

/**
 * Tool result caching middleware
 */
export const cacheToolResult = async (toolName, parameters, result, tenantId) => {
  const cacheKey = generateToolResultKey(toolName, parameters, tenantId);

  try {
    const cacheData = {
      result: result,
      timestamp: Date.now(),
      tool_name: toolName,
      parameters: parameters
    };

    await cacheService.set(
      cacheKey,
      cacheData,
      cacheService.ttlConfig.toolResult,
      'tool_results'
    );

    logger.debug(`Tool result cached: ${toolName} for tenant ${tenantId}`);

  } catch (error) {
    logger.error('Tool result cache error:', error);
  }
};

/**
 * Get cached tool result
 */
export const getCachedToolResult = async (toolName, parameters, tenantId) => {
  const cacheKey = generateToolResultKey(toolName, parameters, tenantId);

  try {
    const cachedResult = await cacheService.get(cacheKey, 'tool_results');

    if (cachedResult) {
      logger.debug(`Tool result cache hit: ${toolName} for tenant ${tenantId}`);
      return cachedResult;
    }

    return null;

  } catch (error) {
    logger.error('Tool result cache retrieval error:', error);
    return null;
  }
};

/**
 * Invalidate user-related caches
 */
export const invalidateUserCaches = async (userId, tenantId) => {
  try {
    const patterns = [
      `user:${userId}:*`,
      `tenant:${tenantId}:user:${userId}:*`,
      `response:*user_id=${userId}*`,
      `response:*tenant_id=${tenantId}*`
    ];

    for (const pattern of patterns) {
      await cacheService.deletePattern(pattern);
    }

    logger.debug(`Invalidated caches for user ${userId}`);

  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

/**
 * Invalidate tenant-related caches
 */
export const invalidateTenantCaches = async (tenantId) => {
  try {
    await cacheService.deletePattern(`*tenant_id=${tenantId}*`);
    await cacheService.clearNamespace(`tenant:${tenantId}`);

    logger.debug(`Invalidated caches for tenant ${tenantId}`);

  } catch (error) {
    logger.error('Tenant cache invalidation error:', error);
  }
};

/**
 * Cache statistics endpoint
 */
export const cacheStats = async (req, res) => {
  try {
    const stats = cacheService.getStats();
    const info = await cacheService.getInfo();

    res.json({
      success: true,
      data: {
        cache_stats: stats,
        redis_info: info ? parseRedisInfo(info) : null,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
      }
    });

  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics'
    });
  }
};

/**
 * Cache management endpoints
 */
export const cacheManagement = {
  // Clear specific namespace
  clearNamespace: async (req, res) => {
    try {
      const { namespace } = req.params;
      const cleared = await cacheService.clearNamespace(namespace);

      res.json({
        success: true,
        message: `Cleared ${cleared} keys from namespace: ${namespace}`
      });

    } catch (error) {
      logger.error('Cache clear error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache namespace'
      });
    }
  },

  // Clear cache by pattern
  clearPattern: async (req, res) => {
    try {
      const { pattern } = req.body;
      const namespace = req.body.namespace || 'default';

      if (!pattern) {
        return res.status(400).json({
          success: false,
          error: 'Pattern is required'
        });
      }

      const cleared = await cacheService.deletePattern(pattern, namespace);

      res.json({
        success: true,
        message: `Cleared ${cleared} keys matching pattern: ${pattern}`
      });

    } catch (error) {
      logger.error('Cache pattern clear error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache pattern'
      });
    }
  },

  // Warm cache with specific data
  warmCache: async (req, res) => {
    try {
      const { key, value, ttl, namespace } = req.body;

      if (!key || !value) {
        return res.status(400).json({
          success: false,
          error: 'Key and value are required'
        });
      }

      await cacheService.set(key, value, ttl, namespace);

      res.json({
        success: true,
        message: `Cache warmed for key: ${key}`
      });

    } catch (error) {
      logger.error('Cache warm error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to warm cache'
      });
    }
  }
};

// Helper functions

/**
 * Generate default cache key for HTTP requests
 */
function generateDefaultCacheKey(req) {
  const url = req.originalUrl || req.url;
  const method = req.method;
  const userId = req.user?.id || 'anonymous';
  const tenantId = req.user?.tenant_id || 'default';

  return `${method}:${url}:user:${userId}:tenant:${tenantId}`;
}

/**
 * Generate cache key for tool results
 */
function generateToolResultKey(toolName, parameters, tenantId) {
  const paramHash = hashObject(parameters);
  return `${toolName}:${paramHash}:tenant:${tenantId}`;
}

/**
 * Simple hash function for objects
 */
function hashObject(obj) {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Parse Redis INFO output
 */
function parseRedisInfo(infoStr) {
  const info = {};
  const lines = infoStr.split('\r\n');

  lines.forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      if (key && value) {
        info[key] = isNaN(value) ? value : parseFloat(value);
      }
    }
  });

  return info;
}

export default {
  cacheResponse,
  cacheSession,
  cacheToolResult,
  getCachedToolResult,
  invalidateUserCaches,
  invalidateTenantCaches,
  cacheStats,
  cacheManagement
};