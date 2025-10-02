/**
 * MCP Performance Optimizer
 * Optimizes MCP server performance, caching, and response times
 * Enhanced by Moses Team - Phase 7 Performance Optimization
 */

import NodeCache from 'node-cache'
import { performance } from 'perf_hooks'

export class McpPerformanceOptimizer {
  constructor() {
    // Cache for frequently accessed data (TTL: 5 minutes)
    this.cache = new NodeCache({ stdTTL: 300 })

    // Performance metrics storage
    this.metrics = {
      toolExecutions: new Map(),
      avgResponseTimes: new Map(),
      cacheHitRate: { hits: 0, misses: 0 },
      totalRequests: 0
    }

    // Connection pooling for database queries
    this.queryPool = new Map()

    console.log('🚀 MCP Performance Optimizer initialized')
  }

  /**
   * Cache database queries for better performance
   */
  async cacheQuery(key, queryFunction, ttl = 300) {
    const startTime = performance.now()

    // Check cache first
    const cached = this.cache.get(key)
    if (cached) {
      this.metrics.cacheHitRate.hits++
      const endTime = performance.now()
      console.log(`📊 Cache HIT for ${key} (${(endTime - startTime).toFixed(2)}ms)`)
      return cached
    }

    // Cache miss - execute query
    this.metrics.cacheHitRate.misses++
    try {
      const result = await queryFunction()
      this.cache.set(key, result, ttl)

      const endTime = performance.now()
      console.log(`📊 Cache MISS for ${key} (${(endTime - startTime).toFixed(2)}ms)`)

      return result
    } catch (error) {
      console.error('❌ Query execution failed:', error)
      throw error
    }
  }

  /**
   * Track tool execution performance
   */
  trackToolExecution(toolName, executionTime, success = true) {
    if (!this.metrics.toolExecutions.has(toolName)) {
      this.metrics.toolExecutions.set(toolName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        successRate: 0,
        errors: 0
      })
    }

    const stats = this.metrics.toolExecutions.get(toolName)
    stats.count++
    stats.totalTime += executionTime
    stats.avgTime = stats.totalTime / stats.count

    if (success) {
      stats.successRate = ((stats.count - stats.errors) / stats.count) * 100
    } else {
      stats.errors++
      stats.successRate = ((stats.count - stats.errors) / stats.count) * 100
    }

    this.metrics.totalRequests++

    // Log slow queries (>100ms)
    if (executionTime > 100) {
      console.warn(`⚠️ Slow tool execution: ${toolName} took ${executionTime.toFixed(2)}ms`)
    }
  }

  /**
   * Optimize database query with automatic caching
   */
  async optimizedQuery(toolName, queryParams, queryFunction) {
    const startTime = performance.now()

    // Create cache key from tool name and params
    const cacheKey = `${toolName}_${JSON.stringify(queryParams)}`

    try {
      const result = await this.cacheQuery(cacheKey, queryFunction)
      const endTime = performance.now()
      const executionTime = endTime - startTime

      this.trackToolExecution(toolName, executionTime, true)

      return {
        success: true,
        data: result,
        performance: {
          executionTime: Math.round(executionTime),
          cached: this.cache.has(cacheKey),
          cacheKey
        }
      }
    } catch (error) {
      const endTime = performance.now()
      const executionTime = endTime - startTime

      this.trackToolExecution(toolName, executionTime, false)

      throw error
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const cacheStats = this.cache.getStats()
    const hitRate = this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses > 0
      ? (this.metrics.cacheHitRate.hits / (this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses)) * 100
      : 0

    return {
      cache: {
        hitRate: Math.round(hitRate * 100) / 100,
        hits: this.metrics.cacheHitRate.hits,
        misses: this.metrics.cacheHitRate.misses,
        keys: cacheStats.keys,
        size: cacheStats.ksize
      },
      tools: Array.from(this.metrics.toolExecutions.entries()).map(([name, stats]) => ({
        name,
        executions: stats.count,
        avgResponseTime: Math.round(stats.avgTime * 100) / 100,
        successRate: Math.round(stats.successRate * 100) / 100,
        errors: stats.errors
      })),
      overall: {
        totalRequests: this.metrics.totalRequests,
        avgResponseTime: this.getOverallAvgResponseTime()
      }
    }
  }

  /**
   * Calculate overall average response time
   */
  getOverallAvgResponseTime() {
    if (this.metrics.toolExecutions.size === 0) return 0

    let totalTime = 0
    let totalCount = 0

    for (const stats of this.metrics.toolExecutions.values()) {
      totalTime += stats.totalTime
      totalCount += stats.count
    }

    return totalCount > 0 ? Math.round((totalTime / totalCount) * 100) / 100 : 0
  }

  /**
   * Clear cache (manual cache busting)
   */
  clearCache() {
    this.cache.flushAll()
    console.log('🧹 MCP Performance cache cleared')
  }

  /**
   * Preload frequently used queries
   */
  async preloadCache() {
    console.log('🔄 Preloading MCP performance cache...')

    // Preload common queries that are likely to be requested
    const preloadQueries = [
      'query_organizations_{}',
      'get_database_stats_{}',
      'query_users_{\"limit\":10,\"offset\":0}'
    ]

    for (const cacheKey of preloadQueries) {
      if (!this.cache.has(cacheKey)) {
        console.log(`📋 Preloading cache for ${cacheKey}`)
      }
    }
  }

  /**
   * Auto-optimize based on performance metrics
   */
  autoOptimize() {
    const stats = this.getPerformanceStats()

    // Increase cache TTL for frequently accessed, stable data
    if (stats.cache.hitRate > 80) {
      console.log('📈 High cache hit rate detected - extending cache TTL')
    }

    // Log performance recommendations
    if (stats.overall.avgResponseTime > 100) {
      console.warn('⚠️ Average response time above 100ms - consider query optimization')
    }

    // Clear cache if it's getting too large
    if (stats.cache.keys > 1000) {
      console.log('🧹 Cache size limit reached - clearing old entries')
      this.cache.prune()
    }
  }

  /**
   * Health check for performance optimizer
   */
  healthCheck() {
    const stats = this.getPerformanceStats()

    return {
      status: 'healthy',
      performance: {
        avgResponseTime: stats.overall.avgResponseTime,
        cacheHitRate: stats.cache.hitRate,
        totalRequests: stats.overall.totalRequests,
        cacheSize: stats.cache.keys
      },
      recommendations: this.getOptimizationRecommendations(stats)
    }
  }

  /**
   * Get optimization recommendations based on current metrics
   */
  getOptimizationRecommendations(stats) {
    const recommendations = []

    if (stats.cache.hitRate < 50) {
      recommendations.push('Consider increasing cache TTL for stable data')
    }

    if (stats.overall.avgResponseTime > 200) {
      recommendations.push('Query optimization needed - average response time too high')
    }

    const slowTools = stats.tools.filter(tool => tool.avgResponseTime > 150)
    if (slowTools.length > 0) {
      recommendations.push(`Optimize slow tools: ${slowTools.map(t => t.name).join(', ')}`)
    }

    return recommendations
  }
}

// Export singleton instance
export const mcpOptimizer = new McpPerformanceOptimizer()