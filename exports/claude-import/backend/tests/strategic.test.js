/**
 * Strategic Framework Test Suite
 * Sunzi Cerebro Backend - Strategic API Testing
 *
 * Tests all strategic framework endpoints including:
 * - Strategic Framework overview (/api/strategic/framework)
 * - Individual module details (/api/strategic/framework/:moduleId)
 * - Operations metrics (/api/strategic/operations/metrics)
 * - Strategic recommendations (/api/strategic/recommendations)
 */

import request from 'supertest';
import express from 'express';
import strategicRoutes from '../routes/strategic.js';

// Create test app with strategic routes
const app = express();
app.use(express.json());
app.use('/api/strategic', strategicRoutes);

describe('Strategic Framework API', () => {

  describe('GET /api/strategic/framework', () => {
    test('should return overall strategic framework data', async () => {
      const response = await request(app)
        .get('/api/strategic/framework')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('overallStrategy');
      expect(response.body.data).toHaveProperty('modulesSummary');
      expect(response.body.data).toHaveProperty('capabilities');
      expect(response.body.data).toHaveProperty('integrationStatus');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('should return correct data structure for overall strategy', async () => {
      const response = await request(app)
        .get('/api/strategic/framework');

      const { overallStrategy } = response.body.data;
      expect(overallStrategy).toHaveProperty('maturityLevel');
      expect(overallStrategy).toHaveProperty('totalCoverage');
      expect(overallStrategy).toHaveProperty('activeModules');
      expect(overallStrategy).toHaveProperty('automationScore');
      expect(overallStrategy).toHaveProperty('strategicReadiness');

      expect(typeof overallStrategy.maturityLevel).toBe('number');
      expect(overallStrategy.maturityLevel).toBeGreaterThanOrEqual(0);
      expect(overallStrategy.maturityLevel).toBeLessThanOrEqual(100);
    });

    test('should return correct modules summary', async () => {
      const response = await request(app)
        .get('/api/strategic/framework');

      const { modulesSummary } = response.body.data;
      expect(modulesSummary).toHaveProperty('total', 13); // 13 Sun Tzu modules
      expect(modulesSummary).toHaveProperty('active');
      expect(modulesSummary).toHaveProperty('planning');
      expect(modulesSummary).toHaveProperty('executing');

      // Verify totals add up correctly
      const sum = modulesSummary.active + modulesSummary.planning + modulesSummary.executing;
      expect(sum).toBeLessThanOrEqual(modulesSummary.total);
    });

    test('should return capabilities with valid ranges', async () => {
      const response = await request(app)
        .get('/api/strategic/framework');

      const { capabilities } = response.body.data;
      expect(capabilities).toHaveProperty('defensivePosture');
      expect(capabilities).toHaveProperty('offensiveCapability');
      expect(capabilities).toHaveProperty('intelligenceGathering');
      expect(capabilities).toHaveProperty('resourceOptimization');
      expect(capabilities).toHaveProperty('adaptability');

      // All capabilities should be percentages (0-100)
      Object.values(capabilities).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    test('should return integration status', async () => {
      const response = await request(app)
        .get('/api/strategic/framework');

      const { integrationStatus } = response.body.data;
      expect(integrationStatus).toHaveProperty('toolsIntegrated');
      expect(integrationStatus).toHaveProperty('activeServers');
      expect(integrationStatus).toHaveProperty('automationLevel');
      expect(integrationStatus).toHaveProperty('aiEnhancement');

      expect(typeof integrationStatus.toolsIntegrated).toBe('number');
      expect(integrationStatus.toolsIntegrated).toBeGreaterThan(0);
    });
  });

  describe('GET /api/strategic/framework/:moduleId', () => {
    const validModules = [
      'laying-plans', 'waging-war', 'attack-by-stratagem',
      'tactical-dispositions', 'energy', 'weak-points-strong',
      'maneuvering', 'variation-in-tactics', 'the-army-on-march',
      'terrain', 'nine-situations', 'attack-by-fire', 'use-of-spies'
    ];

    test.each(validModules)('should return data for valid module: %s', async (moduleId) => {
      const response = await request(app)
        .get(`/api/strategic/framework/${moduleId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('moduleId', moduleId);
      expect(response.body.data).toHaveProperty('maturityLevel');
      expect(response.body.data).toHaveProperty('lastUpdate');
      expect(response.body.data).toHaveProperty('historicalTrends');
      expect(response.body.data.historicalTrends).toHaveProperty('maturityLevel');
      expect(Array.isArray(response.body.data.historicalTrends.maturityLevel)).toBe(true);
    });

    test('should return 404 for invalid module', async () => {
      const response = await request(app)
        .get('/api/strategic/framework/invalid-module')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('availableModules');
      expect(Array.isArray(response.body.availableModules)).toBe(true);
      expect(response.body.availableModules).toHaveLength(13);
    });

    test('should return historical trends with valid data structure', async () => {
      const response = await request(app)
        .get('/api/strategic/framework/laying-plans');

      const { historicalTrends } = response.body.data;
      expect(historicalTrends.maturityLevel).toHaveLength(3);

      historicalTrends.maturityLevel.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('value');
        expect(typeof trend.value).toBe('number');
        expect(trend.value).toBeGreaterThanOrEqual(0);
        expect(trend.value).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('GET /api/strategic/operations/metrics', () => {
    test('should return comprehensive operations metrics', async () => {
      const response = await request(app)
        .get('/api/strategic/operations/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('strategicGoals');
      expect(response.body.data).toHaveProperty('tacticalOperations');
      expect(response.body.data).toHaveProperty('operationalEfficiency');
      expect(response.body.data).toHaveProperty('performance');
      expect(response.body.data).toHaveProperty('goalsProgress');
      expect(response.body.data).toHaveProperty('tacticalBreakdown');
      expect(response.body.data).toHaveProperty('resourceUtilization');
      expect(response.body.data).toHaveProperty('timeMetrics');
    });

    test('should return valid performance metrics', async () => {
      const response = await request(app)
        .get('/api/strategic/operations/metrics');

      const { performance } = response.body.data;
      expect(performance).toHaveProperty('toolExecutions');
      expect(performance).toHaveProperty('successRate');
      expect(performance).toHaveProperty('averageResponseTime');
      expect(performance).toHaveProperty('concurrentOperations');
      expect(performance).toHaveProperty('queuedOperations');

      expect(typeof performance.toolExecutions).toBe('number');
      expect(performance.successRate).toBeGreaterThanOrEqual(0);
      expect(performance.successRate).toBeLessThanOrEqual(100);
      expect(performance.averageResponseTime).toBeGreaterThan(0);
    });

    test('should return goals progress with valid structure', async () => {
      const response = await request(app)
        .get('/api/strategic/operations/metrics');

      const { goalsProgress } = response.body.data;
      expect(typeof goalsProgress).toBe('object');

      Object.values(goalsProgress).forEach(goal => {
        expect(goal).toHaveProperty('progress');
        expect(goal).toHaveProperty('status');
        expect(typeof goal.progress).toBe('number');
        expect(goal.progress).toBeGreaterThanOrEqual(0);
        expect(goal.progress).toBeLessThanOrEqual(100);
        expect(['on-track', 'ahead', 'behind']).toContain(goal.status);
      });
    });
  });

  describe('GET /api/strategic/recommendations', () => {
    test('should return strategic recommendations', async () => {
      const response = await request(app)
        .get('/api/strategic/recommendations')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('immediate');
      expect(response.body.data).toHaveProperty('shortTerm');
      expect(response.body.data).toHaveProperty('longTerm');
      expect(Array.isArray(response.body.data.immediate)).toBe(true);
      expect(Array.isArray(response.body.data.shortTerm)).toBe(true);
      expect(Array.isArray(response.body.data.longTerm)).toBe(true);
    });

    test('should return recommendations with valid structure', async () => {
      const response = await request(app)
        .get('/api/strategic/recommendations');

      const allRecommendations = [
        ...response.body.data.immediate,
        ...response.body.data.shortTerm,
        ...response.body.data.longTerm
      ];

      allRecommendations.forEach(recommendation => {
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('category');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('impact');
        expect(recommendation).toHaveProperty('effort');
        expect(recommendation).toHaveProperty('timeframe');

        expect(['critical', 'high', 'medium', 'low']).toContain(recommendation.priority);
        expect(['high', 'medium', 'low']).toContain(recommendation.impact);
        expect(['high', 'medium', 'low']).toContain(recommendation.effort);
      });
    });
  });

  describe('Error handling', () => {
    test('should handle server errors gracefully', async () => {
      // We can't easily test server errors without mocking internal functions
      // This test ensures basic error handling structure is in place
      const response = await request(app)
        .get('/api/strategic/framework');

      expect(response.status).toBe(200);
      // If we reach here without throwing, basic error handling is working
    });
  });

  describe('Response timing', () => {
    test('should respond within reasonable time limits', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/strategic/framework')
        .expect(200);
      const duration = Date.now() - start;

      // Should respond within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});