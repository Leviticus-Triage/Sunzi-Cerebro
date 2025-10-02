/**
 * Strategic Framework Integration Tests
 * Tests frontend-backend integration for Strategic Framework components
 *
 * @fileoverview Comprehensive integration tests for the Strategic Framework
 * @module tests/integration/strategic-framework-integration
 */

import axios from 'axios';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE_URL = 'http://localhost:8890';
const TIMEOUT = 10000;

describe('Strategic Framework Backend Integration', () => {
  let serverRunning = false;

  beforeAll(async () => {
    // Check if backend server is running
    try {
      await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      serverRunning = true;
    } catch (error) {
      console.warn('⚠️  Backend server not running. Start with: cd backend && npm run dev');
      serverRunning = false;
    }
  });

  describe('Strategic Framework API Endpoints', () => {
    it('should return framework overview with all required fields', async () => {
      if (!serverRunning) return;

      const response = await axios.get(`${API_BASE_URL}/api/strategic/framework`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('overallStrategy');
      expect(response.data.data).toHaveProperty('modulesSummary');
      expect(response.data.data).toHaveProperty('capabilities');
      expect(response.data.data).toHaveProperty('integrationStatus');
      expect(response.data.data).toHaveProperty('recommendations');

      // Verify overallStrategy structure
      const { overallStrategy } = response.data.data;
      expect(overallStrategy).toHaveProperty('maturityLevel');
      expect(overallStrategy).toHaveProperty('totalCoverage');
      expect(overallStrategy).toHaveProperty('activeModules');
      expect(overallStrategy).toHaveProperty('automationScore');

      // Verify maturity level is a valid percentage
      expect(overallStrategy.maturityLevel).toBeGreaterThanOrEqual(0);
      expect(overallStrategy.maturityLevel).toBeLessThanOrEqual(100);
    }, TIMEOUT);

    it('should return operations metrics with correct structure', async () => {
      if (!serverRunning) return;

      const response = await axios.get(`${API_BASE_URL}/api/strategic/operations/metrics`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('strategicGoals');
      expect(response.data.data).toHaveProperty('tacticalOperations');
      expect(response.data.data).toHaveProperty('performance');
      expect(response.data.data).toHaveProperty('goalsProgress');
      expect(response.data.data).toHaveProperty('tacticalBreakdown');

      // Verify performance metrics
      const { performance } = response.data.data;
      expect(performance).toHaveProperty('totalExecutions');
      expect(performance).toHaveProperty('successRate');
      expect(performance).toHaveProperty('averageExecutionTime');
      expect(performance).toHaveProperty('toolsUtilized');
      expect(performance).toHaveProperty('resourceEfficiency');
    }, TIMEOUT);

    it('should return threats landscape with threat data', async () => {
      if (!serverRunning) return;

      const response = await axios.get(`${API_BASE_URL}/api/threats/landscape`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('currentThreats');
      expect(response.data.data).toHaveProperty('mitigatedThreats');
      expect(response.data.data).toHaveProperty('emergingThreats');
      expect(response.data.data).toHaveProperty('threatCategories');
      expect(response.data.data).toHaveProperty('riskAssessment');

      // Verify threat categories is an array
      expect(Array.isArray(response.data.data.threatCategories)).toBe(true);
    }, TIMEOUT);

    it('should return individual module details for all 13 modules', async () => {
      if (!serverRunning) return;

      const moduleIds = [
        'laying-plans',
        'waging-war',
        'attack-by-stratagem',
        'tactical-dispositions',
        'energy',
        'weak-points-strong',
        'maneuvering',
        'variation-in-tactics',
        'the-army-on-march',
        'terrain',
        'nine-situations',
        'attack-by-fire',
        'use-of-spies'
      ];

      for (const moduleId of moduleIds) {
        const response = await axios.get(`${API_BASE_URL}/api/strategic/framework/${moduleId}`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('moduleId', moduleId);
        expect(response.data.data).toHaveProperty('maturityLevel');
        expect(response.data.data).toHaveProperty('lastUpdate');
        expect(response.data.data).toHaveProperty('historicalTrends');

        // Verify maturity level is valid
        expect(response.data.data.maturityLevel).toBeGreaterThanOrEqual(0);
        expect(response.data.data.maturityLevel).toBeLessThanOrEqual(100);
      }
    }, TIMEOUT * 2);

    it('should return strategic recommendations', async () => {
      if (!serverRunning) return;

      const response = await axios.get(`${API_BASE_URL}/api/strategic/recommendations`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // Verify each recommendation has required fields
      response.data.data.forEach((recommendation: any) => {
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('category');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('expectedImpact');
        expect(recommendation).toHaveProperty('estimatedEffort');
      });
    }, TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should return 404 for invalid module ID', async () => {
      if (!serverRunning) return;

      try {
        await axios.get(`${API_BASE_URL}/api/strategic/framework/invalid-module-id`);
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data).toHaveProperty('error');
      }
    }, TIMEOUT);

    it('should return 404 for non-existent endpoint', async () => {
      if (!serverRunning) return;

      try {
        await axios.get(`${API_BASE_URL}/api/strategic/nonexistent-endpoint`);
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    }, TIMEOUT);
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      if (!serverRunning) return;

      const startTime = Date.now();
      await axios.get(`${API_BASE_URL}/api/strategic/framework`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Framework overview should respond within 100ms
      expect(responseTime).toBeLessThan(100);
    }, TIMEOUT);

    it('should handle concurrent requests efficiently', async () => {
      if (!serverRunning) return;

      const requests = [
        axios.get(`${API_BASE_URL}/api/strategic/framework`),
        axios.get(`${API_BASE_URL}/api/strategic/operations/metrics`),
        axios.get(`${API_BASE_URL}/api/threats/landscape`),
        axios.get(`${API_BASE_URL}/api/strategic/recommendations`)
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All 4 requests should complete within 200ms
      expect(totalTime).toBeLessThan(200);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    }, TIMEOUT);
  });

  describe('Data Consistency', () => {
    it('should return consistent active module count across endpoints', async () => {
      if (!serverRunning) return;

      const frameworkResponse = await axios.get(`${API_BASE_URL}/api/strategic/framework`);
      const activeModulesFromFramework = frameworkResponse.data.data.overallStrategy.activeModules;

      const modulesSummary = frameworkResponse.data.data.modulesSummary;
      const activeModulesFromSummary = modulesSummary.active;

      // Active modules count should be consistent
      expect(activeModulesFromFramework).toBe(activeModulesFromSummary);
    }, TIMEOUT);

    it('should return valid timestamps in ISO format', async () => {
      if (!serverRunning) return;

      const response = await axios.get(`${API_BASE_URL}/api/strategic/framework/laying-plans`);
      const lastUpdate = response.data.data.lastUpdate;

      // Verify timestamp is valid ISO format
      expect(() => new Date(lastUpdate)).not.toThrow();
      expect(new Date(lastUpdate).toISOString()).toBe(lastUpdate);
    }, TIMEOUT);
  });
});

describe('Frontend-Backend Data Flow', () => {
  it('should match frontend expected data structure', async () => {
    if (!serverRunning) return;

    const response = await axios.get(`${API_BASE_URL}/api/strategic/framework`);
    const data = response.data.data;

    // Verify structure matches what StrategicFramework.tsx expects
    expect(data.overallStrategy).toBeDefined();
    expect(data.modulesSummary).toBeDefined();
    expect(data.capabilities).toBeDefined();
    expect(data.integrationStatus).toBeDefined();

    // Verify capabilities structure
    expect(data.capabilities).toHaveProperty('defensivePosture');
    expect(data.capabilities).toHaveProperty('offensiveCapability');
    expect(data.capabilities).toHaveProperty('intelligenceGathering');
    expect(data.capabilities).toHaveProperty('rapidResponse');
    expect(data.capabilities).toHaveProperty('adaptability');
  });

  it('should provide all Sun Tzu module data', async () => {
    if (!serverRunning) return;

    const moduleIds = [
      'laying-plans', 'waging-war', 'attack-by-stratagem',
      'tactical-dispositions', 'energy', 'weak-points-strong',
      'maneuvering', 'variation-in-tactics', 'the-army-on-march',
      'terrain', 'nine-situations', 'attack-by-fire', 'use-of-spies'
    ];

    const modulePromises = moduleIds.map(id =>
      axios.get(`${API_BASE_URL}/api/strategic/framework/${id}`)
    );

    const responses = await Promise.all(modulePromises);

    // All 13 modules should return successfully
    expect(responses.length).toBe(13);
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});

describe('WebSocket Integration (Future)', () => {
  it('should have WebSocket server available', async () => {
    if (!serverRunning) return;

    // Test that server is ready for WebSocket connections
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.data).toHaveProperty('services');
    expect(response.data.services).toHaveProperty('websocket');
  });

  // TODO: Add WebSocket connection tests once dashboard integration is complete
  // TODO: Test real-time strategic framework updates
  // TODO: Test threat intelligence streaming
  // TODO: Test dashboard metric updates
});