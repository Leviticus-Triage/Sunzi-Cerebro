/**
 * Prometheus Metrics Middleware for Sunzi Cerebro Enterprise
 * Comprehensive application metrics collection
 */

import prometheus from 'prom-client';

// Create a Registry which registers the metrics
const register = new prometheus.register();

// Add default system metrics (CPU, memory, event loop lag, etc.)
prometheus.collectDefaultMetrics({
  register,
  prefix: 'sunzi_cerebro_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Application-specific metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'sunzi_cerebro_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});
register.registerMetric(httpRequestDuration);

const httpRequestTotal = new prometheus.Counter({
  name: 'sunzi_cerebro_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'tenant_id']
});
register.registerMetric(httpRequestTotal);

const activeConnections = new prometheus.Gauge({
  name: 'sunzi_cerebro_active_connections',
  help: 'Number of active connections',
  labelNames: ['type']
});
register.registerMetric(activeConnections);

const toolExecutionsTotal = new prometheus.Counter({
  name: 'sunzi_cerebro_tool_executions_total',
  help: 'Total number of tool executions',
  labelNames: ['tool_name', 'server', 'status', 'tenant_id', 'user_id']
});
register.registerMetric(toolExecutionsTotal);

const toolExecutionDuration = new prometheus.Histogram({
  name: 'sunzi_cerebro_tool_execution_duration_seconds',
  help: 'Duration of tool executions in seconds',
  labelNames: ['tool_name', 'server', 'tenant_id'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800]
});
register.registerMetric(toolExecutionDuration);

const activeToolExecutions = new prometheus.Gauge({
  name: 'sunzi_cerebro_active_tool_executions',
  help: 'Number of currently running tool executions',
  labelNames: ['server', 'tenant_id']
});
register.registerMetric(activeToolExecutions);

const databaseConnections = new prometheus.Gauge({
  name: 'sunzi_cerebro_database_connections',
  help: 'Number of database connections',
  labelNames: ['state', 'database']
});
register.registerMetric(databaseConnections);

const databaseQueryDuration = new prometheus.Histogram({
  name: 'sunzi_cerebro_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});
register.registerMetric(databaseQueryDuration);

const cacheOperations = new prometheus.Counter({
  name: 'sunzi_cerebro_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result']
});
register.registerMetric(cacheOperations);

const cacheHitRatio = new prometheus.Gauge({
  name: 'sunzi_cerebro_cache_hit_ratio',
  help: 'Cache hit ratio (0-1)',
  labelNames: ['cache_type']
});
register.registerMetric(cacheHitRatio);

const authenticationAttempts = new prometheus.Counter({
  name: 'sunzi_cerebro_authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['result', 'method']
});
register.registerMetric(authenticationAttempts);

const activeSessions = new prometheus.Gauge({
  name: 'sunzi_cerebro_active_sessions',
  help: 'Number of active user sessions',
  labelNames: ['tenant_id']
});
register.registerMetric(activeSessions);

const mcpServerStatus = new prometheus.Gauge({
  name: 'sunzi_cerebro_mcp_server_status',
  help: 'MCP server status (1=online, 0=offline)',
  labelNames: ['server_name', 'server_type']
});
register.registerMetric(mcpServerStatus);

const mcpToolCount = new prometheus.Gauge({
  name: 'sunzi_cerebro_mcp_tools_available',
  help: 'Number of available tools per MCP server',
  labelNames: ['server_name']
});
register.registerMetric(mcpToolCount);

const securityEvents = new prometheus.Counter({
  name: 'sunzi_cerebro_security_events_total',
  help: 'Total number of security events',
  labelNames: ['event_type', 'severity', 'tenant_id']
});
register.registerMetric(securityEvents);

const vulnerabilitiesFound = new prometheus.Counter({
  name: 'sunzi_cerebro_vulnerabilities_found_total',
  help: 'Total number of vulnerabilities found',
  labelNames: ['severity', 'tool_name', 'tenant_id']
});
register.registerMetric(vulnerabilitiesFound);

const tenantResourceUsage = new prometheus.Gauge({
  name: 'sunzi_cerebro_tenant_resource_usage',
  help: 'Resource usage per tenant',
  labelNames: ['tenant_id', 'resource_type', 'limit_type']
});
register.registerMetric(tenantResourceUsage);

// Business metrics
const monthlyActiveUsers = new prometheus.Gauge({
  name: 'sunzi_cerebro_monthly_active_users',
  help: 'Number of monthly active users',
  labelNames: ['tenant_id']
});
register.registerMetric(monthlyActiveUsers);

const revenueMetrics = new prometheus.Gauge({
  name: 'sunzi_cerebro_revenue_metrics',
  help: 'Revenue-related metrics',
  labelNames: ['tenant_id', 'subscription_tier', 'metric_type']
});
register.registerMetric(revenueMetrics);

// Middleware function to collect HTTP metrics
export const httpMetricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
      tenant_id: req.user?.tenant_id || 'unknown'
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
};

// Utility functions for metrics collection
export const metricsCollector = {
  // Tool execution metrics
  recordToolExecution(toolName, server, status, tenantId, userId, duration) {
    const labels = { tool_name: toolName, server, status, tenant_id: tenantId, user_id: userId };
    toolExecutionsTotal.inc(labels);

    if (duration && status === 'completed') {
      toolExecutionDuration.observe({ tool_name: toolName, server, tenant_id: tenantId }, duration / 1000);
    }
  },

  updateActiveToolExecutions(server, tenantId, count) {
    activeToolExecutions.set({ server, tenant_id: tenantId }, count);
  },

  // Database metrics
  recordDatabaseQuery(operation, table, duration) {
    databaseQueryDuration.observe({ operation, table }, duration / 1000);
  },

  updateDatabaseConnections(state, database, count) {
    databaseConnections.set({ state, database }, count);
  },

  // Cache metrics
  recordCacheOperation(operation, result) {
    cacheOperations.inc({ operation, result });
  },

  updateCacheHitRatio(cacheType, ratio) {
    cacheHitRatio.set({ cache_type: cacheType }, ratio);
  },

  // Authentication metrics
  recordAuthenticationAttempt(result, method = 'password') {
    authenticationAttempts.inc({ result, method });
  },

  updateActiveSessions(tenantId, count) {
    activeSessions.set({ tenant_id: tenantId }, count);
  },

  // MCP server metrics
  updateMcpServerStatus(serverName, serverType, isOnline) {
    mcpServerStatus.set({ server_name: serverName, server_type: serverType }, isOnline ? 1 : 0);
  },

  updateMcpToolCount(serverName, count) {
    mcpToolCount.set({ server_name: serverName }, count);
  },

  // Security metrics
  recordSecurityEvent(eventType, severity, tenantId) {
    securityEvents.inc({ event_type: eventType, severity, tenant_id: tenantId });
  },

  recordVulnerability(severity, toolName, tenantId) {
    vulnerabilitiesFound.inc({ severity, tool_name: toolName, tenant_id: tenantId });
  },

  // Tenant resource metrics
  updateTenantResourceUsage(tenantId, resourceType, limitType, value) {
    tenantResourceUsage.set({ tenant_id: tenantId, resource_type: resourceType, limit_type: limitType }, value);
  },

  // Business metrics
  updateMonthlyActiveUsers(tenantId, count) {
    monthlyActiveUsers.set({ tenant_id: tenantId }, count);
  },

  updateRevenueMetric(tenantId, subscriptionTier, metricType, value) {
    revenueMetrics.set({ tenant_id: tenantId, subscription_tier: subscriptionTier, metric_type: metricType }, value);
  },

  // Connection tracking
  incrementActiveConnections(type) {
    activeConnections.inc({ type });
  },

  decrementActiveConnections(type) {
    activeConnections.dec({ type });
  }
};

// Background metrics collection
export const startMetricsCollection = () => {
  // Collect metrics every 30 seconds
  setInterval(async () => {
    try {
      // Update active connections from various sources
      // This would integrate with your actual connection tracking

      // Update database connection metrics
      // This would integrate with your database pool

      // Update MCP server status
      // This would check the actual MCP server status

      // Update cache hit ratios
      // This would calculate from your cache statistics

    } catch (error) {
      console.error('Error collecting background metrics:', error);
    }
  }, 30000);
};

// Metrics endpoint handler
export const metricsHandler = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
};

// Export the register for use in other modules
export { register };

export default {
  httpMetricsMiddleware,
  metricsCollector,
  metricsHandler,
  startMetricsCollection,
  register
};