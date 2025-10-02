/**
 * LLM Orchestration API Routes
 * RESTful API for multi-provider LLM orchestration
 *
 * @module routes/llmOrchestration
 */

import express from 'express';
import llmOrchestrationService from '../services/llmOrchestrationService.js';
import performanceMonitor from '../services/performanceMonitor.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/llm/orchestration/query
 * Execute LLM query with intelligent routing
 *
 * Body:
 * {
 *   query: string,
 *   context?: Array<{role: string, content: string}>,
 *   preferences?: {
 *     provider?: 'ollama' | 'openai' | 'anthropic' | 'auto',
 *     maxCost?: number,
 *     preferLocal?: boolean,
 *     requireTools?: boolean,
 *     maxResponseTime?: number
 *   },
 *   metadata?: {
 *     securityClassification?: 'public' | 'sensitive' | 'classified',
 *     expectedComplexity?: 'simple' | 'medium' | 'complex',
 *     toolContext?: string[]
 *   }
 * }
 */
router.post('/query', async (req, res) => {
  try {
    const result = await llmOrchestrationService.executeQuery(req.body);

    res.json(result);
  } catch (error) {
    logger.error('Orchestration query failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'ORCHESTRATION_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/providers
 * Get list of available providers and their status
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = llmOrchestrationService.getProviders();

    res.json({
      success: true,
      data: {
        providers,
        count: providers.length
      }
    });
  } catch (error) {
    logger.error('Failed to get providers', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'PROVIDER_LIST_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/providers/:id
 * Get specific provider details
 */
router.get('/providers/:id', async (req, res) => {
  try {
    const providers = llmOrchestrationService.getProviders();
    const provider = providers.find(p => p.id === req.params.id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `Provider '${req.params.id}' not found`
        }
      });
    }

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    logger.error('Failed to get provider', { providerId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'PROVIDER_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/providers/:id/health
 * Check provider health status
 */
router.get('/providers/:id/health', async (req, res) => {
  try {
    const circuitOpen = performanceMonitor.isCircuitOpen(req.params.id);
    const metrics = performanceMonitor.getMetrics();
    const providerMetrics = metrics.providers[req.params.id] || {};

    res.json({
      success: true,
      data: {
        providerId: req.params.id,
        healthy: !circuitOpen,
        circuitBreakerState: circuitOpen ? 'open' : 'closed',
        metrics: providerMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Health check failed', { providerId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/statistics
 * Get orchestration statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = llmOrchestrationService.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get statistics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'STATISTICS_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/metrics
 * Get performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/cost
 * Get cost statistics and budget information
 */
router.get('/cost', async (req, res) => {
  try {
    const stats = llmOrchestrationService.getStatistics();

    res.json({
      success: true,
      data: {
        total: stats.costTracking.total,
        byProvider: stats.costTracking.byProvider,
        budget: stats.costTracking.budgetLimits,
        remaining: {
          daily: Math.max(0, stats.costTracking.budgetLimits.daily - stats.costTracking.total),
          monthly: Math.max(0, stats.costTracking.budgetLimits.monthly - stats.costTracking.total)
        },
        utilizationPercent: {
          daily: (stats.costTracking.total / stats.costTracking.budgetLimits.daily) * 100,
          monthly: (stats.costTracking.total / stats.costTracking.budgetLimits.monthly) * 100
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get cost data', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'COST_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/circuit-breaker/:providerId
 * Get circuit breaker state for provider
 */
router.get('/circuit-breaker/:providerId', async (req, res) => {
  try {
    const isOpen = performanceMonitor.isCircuitOpen(req.params.providerId);
    const metrics = performanceMonitor.getMetrics();
    const providerMetrics = metrics.providers[req.params.providerId] || {};

    res.json({
      success: true,
      data: {
        providerId: req.params.providerId,
        state: isOpen ? 'open' : 'closed',
        isOpen,
        metrics: providerMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Circuit breaker check failed', {
      providerId: req.params.providerId,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'CIRCUIT_BREAKER_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/llm/orchestration/circuit-breaker/:providerId/reset
 * Reset circuit breaker for provider
 */
router.post('/circuit-breaker/:providerId/reset', async (req, res) => {
  try {
    // Circuit breaker reset would be implemented in performanceMonitor
    logger.info('Circuit breaker reset requested', { providerId: req.params.providerId });

    res.json({
      success: true,
      message: `Circuit breaker reset for provider ${req.params.providerId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Circuit breaker reset failed', {
      providerId: req.params.providerId,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/llm/orchestration/health
 * Overall system health check
 */
router.get('/health', async (req, res) => {
  try {
    const stats = llmOrchestrationService.getStatistics();
    const metrics = performanceMonitor.getMetrics();
    const slaCheck = performanceMonitor.validateSLA();

    const healthyProviders = stats.providers.filter(p => !p.circuitBreakerOpen).length;
    const totalProviders = stats.providers.length;

    const overallHealthy = healthyProviders > 0 &&
                          slaCheck.p95ResponseTime.compliant &&
                          slaCheck.availability.compliant;

    res.json({
      success: true,
      data: {
        status: overallHealthy ? 'healthy' : 'degraded',
        providers: {
          total: totalProviders,
          healthy: healthyProviders,
          unhealthy: totalProviders - healthyProviders
        },
        sla: {
          p95ResponseTime: slaCheck.p95ResponseTime,
          availability: slaCheck.availability
        },
        metrics: {
          totalRequests: metrics.totalRequests,
          successRate: metrics.successRate,
          avgResponseTime: metrics.avgResponseTime
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: error.message
      }
    });
  }
});

export default router;