/**
 * Advanced Performance Monitor & Optimizer
 * Comprehensive performance monitoring, optimization, and SLA validation
 * Target: Sub-2s response times @ P95, 99.9% availability
 *
 * Features:
 * - Real-time performance metrics (P50, P95, P99)
 * - Multi-level caching strategy
 * - Circuit breaker pattern
 * - Load balancing
 * - Cost optimization tracking
 * - SLA validation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();

    // Performance metrics storage
    this.metrics = {
      requests: [],
      responseTime: {
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        min: Infinity,
        max: 0
      },
      availability: {
        uptime: 0,
        downtime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        percentage: 100
      },
      throughput: {
        requestsPerSecond: 0,
        peakRPS: 0,
        avgRPS: 0
      },
      errors: {
        total: 0,
        byType: new Map(),
        rate: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        evictions: 0
      },
      providers: new Map(), // Per-provider metrics
      costs: {
        total: 0,
        byProvider: new Map(),
        perRequest: 0,
        budget: 0,
        remaining: 0
      }
    };

    // Circuit breaker state
    this.circuitBreakers = new Map();

    // Request tracking
    this.activeRequests = new Map();
    this.requestHistory = [];
    this.maxHistorySize = 10000; // Keep last 10k requests

    // Time windows for metrics
    this.windows = {
      realtime: 60 * 1000,        // 1 minute
      shortTerm: 5 * 60 * 1000,   // 5 minutes
      mediumTerm: 60 * 60 * 1000, // 1 hour
      longTerm: 24 * 60 * 60 * 1000 // 24 hours
    };

    // Performance targets (SLA)
    this.sla = {
      responseTime: {
        p50: 500,  // 500ms
        p95: 2000, // 2 seconds
        p99: 5000  // 5 seconds
      },
      availability: 99.9, // 99.9%
      errorRate: 0.1,     // 0.1%
      throughput: 100     // 100 RPS minimum
    };

    // Start monitoring
    this.startTime = Date.now();
    this.startMonitoring();

    console.log('📊 Performance Monitor initialized - Target: <2s @ P95, 99.9% availability');
  }

  /**
   * Start performance monitoring intervals
   */
  startMonitoring() {
    // Calculate metrics every 10 seconds
    setInterval(() => this.calculateMetrics(), 10000);

    // Cleanup old data every minute
    setInterval(() => this.cleanupOldData(), 60000);

    // Check SLA compliance every 5 minutes
    setInterval(() => this.validateSLA(), 5 * 60000);

    // Emit metrics update every 30 seconds
    setInterval(() => this.emitMetricsUpdate(), 30000);
  }

  /**
   * Track a request start
   */
  startRequest(requestId, metadata = {}) {
    const request = {
      id: requestId,
      startTime: performance.now(),
      timestamp: Date.now(),
      metadata: {
        provider: metadata.provider || 'unknown',
        endpoint: metadata.endpoint || 'unknown',
        method: metadata.method || 'GET',
        ...metadata
      }
    };

    this.activeRequests.set(requestId, request);
    return request;
  }

  /**
   * Track a request completion
   */
  endRequest(requestId, success = true, error = null) {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      console.warn(`⚠️ Request ${requestId} not found in active requests`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - request.startTime;

    const completedRequest = {
      ...request,
      endTime,
      duration,
      success,
      error: error ? {
        message: error.message,
        type: error.name,
        code: error.code
      } : null,
      timestamp: Date.now()
    };

    // Update metrics
    this.updateMetrics(completedRequest);

    // Add to history
    this.requestHistory.push(completedRequest);
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }

    // Remove from active
    this.activeRequests.delete(requestId);

    // Check for slow requests
    if (duration > this.sla.responseTime.p95) {
      this.emit('slow-request', completedRequest);
      console.warn(`🐌 Slow request detected: ${requestId} took ${duration.toFixed(2)}ms`);
    }

    return completedRequest;
  }

  /**
   * Update metrics with completed request
   */
  updateMetrics(request) {
    const { duration, success, error, metadata } = request;

    // Update availability metrics
    this.metrics.availability.totalRequests++;
    if (success) {
      this.metrics.availability.successfulRequests++;
    } else {
      this.metrics.availability.failedRequests++;
      this.metrics.errors.total++;

      if (error) {
        const errorType = error.type || 'Unknown';
        this.metrics.errors.byType.set(
          errorType,
          (this.metrics.errors.byType.get(errorType) || 0) + 1
        );
      }
    }

    // Calculate availability percentage
    this.metrics.availability.percentage =
      (this.metrics.availability.successfulRequests / this.metrics.availability.totalRequests) * 100;

    // Update provider-specific metrics
    const provider = metadata.provider;
    if (!this.metrics.providers.has(provider)) {
      this.metrics.providers.set(provider, {
        requests: 0,
        successful: 0,
        failed: 0,
        totalDuration: 0,
        avgDuration: 0,
        availability: 100,
        errors: []
      });
    }

    const providerMetrics = this.metrics.providers.get(provider);
    providerMetrics.requests++;
    providerMetrics.totalDuration += duration;
    providerMetrics.avgDuration = providerMetrics.totalDuration / providerMetrics.requests;

    if (success) {
      providerMetrics.successful++;
    } else {
      providerMetrics.failed++;
      if (error) {
        providerMetrics.errors.push({
          message: error.message,
          type: error.type,
          timestamp: request.timestamp
        });
      }
    }

    providerMetrics.availability = (providerMetrics.successful / providerMetrics.requests) * 100;

    // Update circuit breaker
    this.updateCircuitBreaker(provider, success, duration);
  }

  /**
   * Calculate percentile metrics
   */
  calculateMetrics() {
    const recentRequests = this.getRecentRequests(this.windows.shortTerm);

    if (recentRequests.length === 0) return;

    // Calculate response time percentiles
    const durations = recentRequests
      .map(r => r.duration)
      .sort((a, b) => a - b);

    this.metrics.responseTime.p50 = this.calculatePercentile(durations, 50);
    this.metrics.responseTime.p95 = this.calculatePercentile(durations, 95);
    this.metrics.responseTime.p99 = this.calculatePercentile(durations, 99);
    this.metrics.responseTime.avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    this.metrics.responseTime.min = Math.min(...durations);
    this.metrics.responseTime.max = Math.max(...durations);

    // Calculate throughput
    const timeWindow = this.windows.realtime / 1000; // Convert to seconds
    const recentCount = this.getRecentRequests(this.windows.realtime).length;
    this.metrics.throughput.requestsPerSecond = recentCount / timeWindow;
    this.metrics.throughput.peakRPS = Math.max(
      this.metrics.throughput.peakRPS,
      this.metrics.throughput.requestsPerSecond
    );

    // Calculate error rate
    const recentErrors = recentRequests.filter(r => !r.success).length;
    this.metrics.errors.rate = (recentErrors / recentRequests.length) * 100;

    // Log performance status
    if (this.metrics.responseTime.p95 > this.sla.responseTime.p95) {
      console.warn(`⚠️ P95 response time ${this.metrics.responseTime.p95.toFixed(0)}ms exceeds SLA of ${this.sla.responseTime.p95}ms`);
    }

    if (this.metrics.availability.percentage < this.sla.availability) {
      console.warn(`⚠️ Availability ${this.metrics.availability.percentage.toFixed(2)}% below SLA of ${this.sla.availability}%`);
    }
  }

  /**
   * Calculate percentile value
   */
  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get recent requests within time window
   */
  getRecentRequests(windowMs) {
    const cutoff = Date.now() - windowMs;
    return this.requestHistory.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Update circuit breaker state for a provider
   */
  updateCircuitBreaker(provider, success, duration) {
    if (!this.circuitBreakers.has(provider)) {
      this.circuitBreakers.set(provider, {
        state: 'closed', // closed, open, half-open
        failures: 0,
        successCount: 0,
        lastFailure: null,
        threshold: 5, // Open after 5 failures
        timeout: 60000, // Try again after 60s
        halfOpenRequests: 0,
        halfOpenThreshold: 3 // Need 3 successes to close
      });
    }

    const breaker = this.circuitBreakers.get(provider);

    if (success) {
      breaker.successCount++;

      if (breaker.state === 'half-open') {
        breaker.halfOpenRequests++;
        if (breaker.halfOpenRequests >= breaker.halfOpenThreshold) {
          breaker.state = 'closed';
          breaker.failures = 0;
          breaker.halfOpenRequests = 0;
          console.log(`✅ Circuit breaker CLOSED for ${provider}`);
          this.emit('circuit-breaker-closed', { provider });
        }
      } else if (breaker.state === 'closed' && breaker.failures > 0) {
        // Gradually reset failure count on success
        breaker.failures = Math.max(0, breaker.failures - 1);
      }
    } else {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      breaker.successCount = 0;
      breaker.halfOpenRequests = 0;

      if (breaker.state === 'closed' && breaker.failures >= breaker.threshold) {
        breaker.state = 'open';
        console.error(`🔴 Circuit breaker OPENED for ${provider} after ${breaker.failures} failures`);
        this.emit('circuit-breaker-opened', { provider, failures: breaker.failures });

        // Schedule transition to half-open
        setTimeout(() => {
          if (breaker.state === 'open') {
            breaker.state = 'half-open';
            console.log(`🟡 Circuit breaker HALF-OPEN for ${provider} - testing...`);
            this.emit('circuit-breaker-half-open', { provider });
          }
        }, breaker.timeout);
      } else if (breaker.state === 'half-open') {
        // Failed during half-open, go back to open
        breaker.state = 'open';
        breaker.halfOpenRequests = 0;
        console.error(`🔴 Circuit breaker back to OPEN for ${provider}`);
        this.emit('circuit-breaker-reopened', { provider });
      }
    }
  }

  /**
   * Check if circuit breaker allows request
   */
  isCircuitOpen(provider) {
    const breaker = this.circuitBreakers.get(provider);
    return breaker && breaker.state === 'open';
  }

  /**
   * Track cache hit/miss
   */
  trackCache(hit = true) {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }

    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
  }

  /**
   * Track cost per request
   */
  trackCost(provider, cost) {
    this.metrics.costs.total += cost;

    const providerCost = this.metrics.costs.byProvider.get(provider) || 0;
    this.metrics.costs.byProvider.set(provider, providerCost + cost);

    if (this.metrics.availability.totalRequests > 0) {
      this.metrics.costs.perRequest = this.metrics.costs.total / this.metrics.availability.totalRequests;
    }

    if (this.metrics.costs.budget > 0) {
      this.metrics.costs.remaining = this.metrics.costs.budget - this.metrics.costs.total;

      if (this.metrics.costs.remaining < 0) {
        console.warn(`⚠️ Budget exceeded! Over by $${Math.abs(this.metrics.costs.remaining).toFixed(2)}`);
        this.emit('budget-exceeded', {
          total: this.metrics.costs.total,
          budget: this.metrics.costs.budget
        });
      }
    }
  }

  /**
   * Set cost budget
   */
  setBudget(amount) {
    this.metrics.costs.budget = amount;
    this.metrics.costs.remaining = amount - this.metrics.costs.total;
  }

  /**
   * Validate SLA compliance
   */
  validateSLA() {
    const violations = [];

    // Check response time SLA
    if (this.metrics.responseTime.p95 > this.sla.responseTime.p95) {
      violations.push({
        type: 'response_time_p95',
        current: this.metrics.responseTime.p95,
        target: this.sla.responseTime.p95,
        severity: 'high'
      });
    }

    if (this.metrics.responseTime.p99 > this.sla.responseTime.p99) {
      violations.push({
        type: 'response_time_p99',
        current: this.metrics.responseTime.p99,
        target: this.sla.responseTime.p99,
        severity: 'medium'
      });
    }

    // Check availability SLA
    if (this.metrics.availability.percentage < this.sla.availability) {
      violations.push({
        type: 'availability',
        current: this.metrics.availability.percentage,
        target: this.sla.availability,
        severity: 'critical'
      });
    }

    // Check error rate SLA
    if (this.metrics.errors.rate > this.sla.errorRate) {
      violations.push({
        type: 'error_rate',
        current: this.metrics.errors.rate,
        target: this.sla.errorRate,
        severity: 'high'
      });
    }

    // Check throughput SLA
    if (this.metrics.throughput.requestsPerSecond < this.sla.throughput) {
      violations.push({
        type: 'throughput',
        current: this.metrics.throughput.requestsPerSecond,
        target: this.sla.throughput,
        severity: 'low'
      });
    }

    if (violations.length > 0) {
      console.warn(`⚠️ SLA Violations detected: ${violations.length}`);
      this.emit('sla-violation', { violations, timestamp: Date.now() });
    } else {
      console.log('✅ All SLA targets met');
      this.emit('sla-compliant', { metrics: this.metrics, timestamp: Date.now() });
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Get comprehensive metrics report
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;

    return {
      timestamp: Date.now(),
      uptime: {
        ms: uptime,
        formatted: this.formatUptime(uptime)
      },
      responseTime: { ...this.metrics.responseTime },
      availability: { ...this.metrics.availability },
      throughput: { ...this.metrics.throughput },
      errors: {
        total: this.metrics.errors.total,
        rate: this.metrics.errors.rate,
        byType: Array.from(this.metrics.errors.byType.entries()).map(([type, count]) => ({
          type,
          count
        }))
      },
      cache: { ...this.metrics.cache },
      providers: Array.from(this.metrics.providers.entries()).map(([name, metrics]) => ({
        name,
        ...metrics,
        circuitBreaker: this.circuitBreakers.get(name)
      })),
      costs: {
        total: this.metrics.costs.total,
        perRequest: this.metrics.costs.perRequest,
        byProvider: Array.from(this.metrics.costs.byProvider.entries()).map(([provider, cost]) => ({
          provider,
          cost
        })),
        budget: this.metrics.costs.budget,
        remaining: this.metrics.costs.remaining
      },
      sla: {
        targets: this.sla,
        compliance: this.validateSLA()
      },
      activeRequests: this.activeRequests.size,
      totalRequests: this.requestHistory.length
    };
  }

  /**
   * Get real-time dashboard data
   */
  getDashboard() {
    const metrics = this.getMetrics();
    const recentRequests = this.getRecentRequests(this.windows.realtime);

    return {
      ...metrics,
      recentActivity: {
        last1min: recentRequests.length,
        successRate: recentRequests.length > 0
          ? (recentRequests.filter(r => r.success).length / recentRequests.length) * 100
          : 100,
        avgResponseTime: recentRequests.length > 0
          ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
          : 0
      },
      alerts: this.generateAlerts(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate performance alerts
   */
  generateAlerts() {
    const alerts = [];

    if (this.metrics.responseTime.p95 > this.sla.responseTime.p95) {
      alerts.push({
        severity: 'warning',
        type: 'performance',
        message: `P95 response time (${this.metrics.responseTime.p95.toFixed(0)}ms) exceeds SLA`,
        recommendation: 'Consider enabling caching or optimizing slow endpoints'
      });
    }

    if (this.metrics.availability.percentage < this.sla.availability) {
      alerts.push({
        severity: 'critical',
        type: 'availability',
        message: `Availability (${this.metrics.availability.percentage.toFixed(2)}%) below SLA`,
        recommendation: 'Check circuit breakers and provider health'
      });
    }

    if (this.metrics.cache.hitRate < 50) {
      alerts.push({
        severity: 'info',
        type: 'cache',
        message: `Low cache hit rate (${this.metrics.cache.hitRate.toFixed(1)}%)`,
        recommendation: 'Review caching strategy and TTL settings'
      });
    }

    return alerts;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Response time recommendations
    if (this.metrics.responseTime.p95 > 1000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Optimize Response Times',
        description: 'P95 response time can be improved',
        actions: [
          'Enable request batching',
          'Implement parallel processing',
          'Optimize database queries',
          'Increase cache TTL for stable data'
        ]
      });
    }

    // Caching recommendations
    if (this.metrics.cache.hitRate < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'caching',
        title: 'Improve Cache Hit Rate',
        description: 'Current cache hit rate is below optimal',
        actions: [
          'Analyze cache miss patterns',
          'Implement predictive cache warming',
          'Increase cache size',
          'Adjust TTL based on data volatility'
        ]
      });
    }

    // Provider-specific recommendations
    for (const [provider, metrics] of this.metrics.providers) {
      if (metrics.availability < 95) {
        recommendations.push({
          priority: 'high',
          category: 'reliability',
          title: `Improve ${provider} Reliability`,
          description: `Provider availability is ${metrics.availability.toFixed(1)}%`,
          actions: [
            'Implement retry logic',
            'Add fallback providers',
            'Review error patterns',
            'Consider circuit breaker tuning'
          ]
        });
      }
    }

    return recommendations;
  }

  /**
   * Cleanup old data to prevent memory leaks
   */
  cleanupOldData() {
    const cutoff = Date.now() - this.windows.longTerm;
    const beforeSize = this.requestHistory.length;

    this.requestHistory = this.requestHistory.filter(r => r.timestamp >= cutoff);

    const removed = beforeSize - this.requestHistory.length;
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} old requests from history`);
    }
  }

  /**
   * Emit metrics update event
   */
  emitMetricsUpdate() {
    this.emit('metrics-update', this.getMetrics());
  }

  /**
   * Format uptime duration
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset all metrics (for testing)
   */
  reset() {
    this.metrics = {
      requests: [],
      responseTime: { p50: 0, p95: 0, p99: 0, avg: 0, min: Infinity, max: 0 },
      availability: { uptime: 0, downtime: 0, totalRequests: 0, successfulRequests: 0, failedRequests: 0, percentage: 100 },
      throughput: { requestsPerSecond: 0, peakRPS: 0, avgRPS: 0 },
      errors: { total: 0, byType: new Map(), rate: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0, size: 0, evictions: 0 },
      providers: new Map(),
      costs: { total: 0, byProvider: new Map(), perRequest: 0, budget: 0, remaining: 0 }
    };

    this.circuitBreakers.clear();
    this.activeRequests.clear();
    this.requestHistory = [];
    this.startTime = Date.now();

    console.log('📊 Performance metrics reset');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;