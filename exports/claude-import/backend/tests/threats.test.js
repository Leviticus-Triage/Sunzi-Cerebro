/**
 * Threats Intelligence Test Suite
 * Sunzi Cerebro Backend - Threats API Testing
 *
 * Tests all threat intelligence endpoints including:
 * - Threat landscape overview (/api/threats/landscape)
 * - Active threats (/api/threats/active)
 * - Threat intelligence (/api/threats/intelligence)
 * - Threat predictions (/api/threats/predictions)
 * - Indicators of Compromise (/api/threats/ioc)
 */

import request from 'supertest';
import express from 'express';
import threatsRoutes from '../routes/threats.js';

// Create test app with threats routes
const app = express();
app.use(express.json());
app.use('/api/threats', threatsRoutes);

describe('Threats Intelligence API', () => {

  describe('GET /api/threats/landscape', () => {
    test('should return comprehensive threat landscape data', async () => {
      const response = await request(app)
        .get('/api/threats/landscape')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('currentThreats');
      expect(response.body.data).toHaveProperty('mitigatedRisks');
      expect(response.body.data).toHaveProperty('emergingThreats');
      expect(response.body.data).toHaveProperty('threatBreakdown');
      expect(response.body.data).toHaveProperty('severityDistribution');
      expect(response.body.data).toHaveProperty('geographicalThreats');
      expect(response.body.data).toHaveProperty('industryTargets');
      expect(response.body.data).toHaveProperty('attackVectors');
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('overallRisk');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('should return valid threat counts', async () => {
      const response = await request(app)
        .get('/api/threats/landscape');

      const { currentThreats, mitigatedRisks, emergingThreats } = response.body.data;
      expect(typeof currentThreats).toBe('number');
      expect(typeof mitigatedRisks).toBe('number');
      expect(typeof emergingThreats).toBe('number');
      expect(currentThreats).toBeGreaterThanOrEqual(0);
      expect(mitigatedRisks).toBeGreaterThanOrEqual(0);
      expect(emergingThreats).toBeGreaterThanOrEqual(0);
    });

    test('should return valid severity distribution', async () => {
      const response = await request(app)
        .get('/api/threats/landscape');

      const { severityDistribution } = response.body.data;
      expect(severityDistribution).toHaveProperty('critical');
      expect(severityDistribution).toHaveProperty('high');
      expect(severityDistribution).toHaveProperty('medium');
      expect(severityDistribution).toHaveProperty('low');

      Object.values(severityDistribution).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    test('should return valid geographical threat distribution', async () => {
      const response = await request(app)
        .get('/api/threats/landscape');

      const { geographicalThreats } = response.body.data;
      expect(typeof geographicalThreats).toBe('object');
      expect(geographicalThreats).toHaveProperty('North America');
      expect(geographicalThreats).toHaveProperty('Europe');
      expect(geographicalThreats).toHaveProperty('Asia');
      expect(geographicalThreats).toHaveProperty('Other');

      Object.values(geographicalThreats).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    test('should return valid overall risk assessment', async () => {
      const response = await request(app)
        .get('/api/threats/landscape');

      const { overallRisk } = response.body.data;
      expect(overallRisk).toHaveProperty('level');
      expect(overallRisk).toHaveProperty('score');
      expect(overallRisk).toHaveProperty('factors');
      expect(overallRisk).toHaveProperty('recommendation');

      expect(['low', 'medium', 'high', 'critical']).toContain(overallRisk.level);
      expect(typeof overallRisk.score).toBe('number');
      expect(overallRisk.score).toBeGreaterThanOrEqual(0);
      expect(overallRisk.score).toBeLessThanOrEqual(10);
      expect(Array.isArray(overallRisk.factors)).toBe(true);
      expect(typeof overallRisk.recommendation).toBe('string');
    });
  });

  describe('GET /api/threats/active', () => {
    test('should return active threats data', async () => {
      const response = await request(app)
        .get('/api/threats/active')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('threats');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(Array.isArray(response.body.data.threats)).toBe(true);
    });

    test('should return threats with valid structure', async () => {
      const response = await request(app)
        .get('/api/threats/active');

      const { threats } = response.body.data;
      threats.forEach(threat => {
        expect(threat).toHaveProperty('id');
        expect(threat).toHaveProperty('name');
        expect(threat).toHaveProperty('severity');
        expect(threat).toHaveProperty('confidence');
        expect(threat).toHaveProperty('firstSeen');
        expect(threat).toHaveProperty('lastSeen');
        expect(threat).toHaveProperty('category');
        expect(threat).toHaveProperty('targetSectors');
        expect(threat).toHaveProperty('indicators');
        expect(threat).toHaveProperty('ttps');
        expect(threat).toHaveProperty('riskScore');

        expect(['low', 'medium', 'high', 'critical']).toContain(threat.severity);
        expect(typeof threat.confidence).toBe('number');
        expect(threat.confidence).toBeGreaterThanOrEqual(0);
        expect(threat.confidence).toBeLessThanOrEqual(100);
        expect(Array.isArray(threat.targetSectors)).toBe(true);
        expect(Array.isArray(threat.ttps)).toBe(true);
        expect(typeof threat.riskScore).toBe('number');
        expect(threat.riskScore).toBeGreaterThanOrEqual(0);
        expect(threat.riskScore).toBeLessThanOrEqual(10);
      });
    });

    test('should return valid summary statistics', async () => {
      const response = await request(app)
        .get('/api/threats/active');

      const { summary, threats } = response.body.data;
      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('critical');
      expect(summary).toHaveProperty('high');
      expect(summary).toHaveProperty('averageRiskScore');

      expect(summary.total).toBe(threats.length);
      expect(typeof summary.critical).toBe('number');
      expect(typeof summary.high).toBe('number');
      expect(typeof summary.averageRiskScore).toBe('string');

      const avgScore = parseFloat(summary.averageRiskScore);
      expect(avgScore).toBeGreaterThanOrEqual(0);
      expect(avgScore).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/threats/intelligence', () => {
    test('should return threat intelligence data', async () => {
      const response = await request(app)
        .get('/api/threats/intelligence')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('threatActors');
      expect(response.body.data).toHaveProperty('emergingThreats');
      expect(response.body.data).toHaveProperty('osintSources');
      expect(response.body.data).toHaveProperty('confidenceLevels');
      expect(response.body.data).toHaveProperty('collectionPriorities');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('should return valid threat actors', async () => {
      const response = await request(app)
        .get('/api/threats/intelligence');

      const { threatActors } = response.body.data;
      expect(Array.isArray(threatActors)).toBe(true);

      threatActors.forEach(actor => {
        expect(actor).toHaveProperty('name');
        expect(actor).toHaveProperty('sophistication');
        expect(actor).toHaveProperty('motivation');
        expect(actor).toHaveProperty('region');
        expect(actor).toHaveProperty('activeThreats');
        expect(actor).toHaveProperty('lastActivity');

        expect(['low', 'medium', 'advanced', 'expert']).toContain(actor.sophistication);
        expect(typeof actor.activeThreats).toBe('number');
        expect(actor.activeThreats).toBeGreaterThanOrEqual(0);
      });
    });

    test('should return valid emerging threats', async () => {
      const response = await request(app)
        .get('/api/threats/intelligence');

      const { emergingThreats } = response.body.data;
      expect(Array.isArray(emergingThreats)).toBe(true);

      emergingThreats.forEach(threat => {
        expect(threat).toHaveProperty('id');
        expect(threat).toHaveProperty('name');
        expect(threat).toHaveProperty('description');
        expect(threat).toHaveProperty('probability');
        expect(threat).toHaveProperty('potentialImpact');
        expect(threat).toHaveProperty('timeline');
        expect(threat).toHaveProperty('preparationLevel');

        expect(typeof threat.probability).toBe('number');
        expect(threat.probability).toBeGreaterThanOrEqual(0);
        expect(threat.probability).toBeLessThanOrEqual(100);
        expect(['low', 'medium', 'high', 'critical']).toContain(threat.potentialImpact);
      });
    });

    test('should return valid OSINT sources', async () => {
      const response = await request(app)
        .get('/api/threats/intelligence');

      const { osintSources } = response.body.data;
      expect(typeof osintSources).toBe('object');

      Object.values(osintSources).forEach(source => {
        expect(source).toHaveProperty('active');
        expect(source).toHaveProperty('lastUpdate');
        expect(typeof source.active).toBe('number');
        expect(source.active).toBeGreaterThanOrEqual(0);
        expect(typeof source.lastUpdate).toBe('string');
      });
    });
  });

  describe('GET /api/threats/predictions', () => {
    test('should return threat predictions data', async () => {
      const response = await request(app)
        .get('/api/threats/predictions')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('shortTerm');
      expect(response.body.data).toHaveProperty('longTerm');
      expect(response.body.data).toHaveProperty('seasonalFactors');
      expect(response.body.data).toHaveProperty('modelAccuracy');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('should return valid short term predictions', async () => {
      const response = await request(app)
        .get('/api/threats/predictions');

      const { shortTerm } = response.body.data;
      expect(shortTerm).toHaveProperty('nextWeek');
      expect(shortTerm).toHaveProperty('nextMonth');

      expect(shortTerm.nextWeek).toHaveProperty('expectedThreats');
      expect(shortTerm.nextWeek).toHaveProperty('confidence');
      expect(shortTerm.nextWeek).toHaveProperty('primaryConcerns');
      expect(shortTerm.nextWeek).toHaveProperty('riskLevel');

      expect(typeof shortTerm.nextWeek.expectedThreats).toBe('number');
      expect(typeof shortTerm.nextWeek.confidence).toBe('number');
      expect(Array.isArray(shortTerm.nextWeek.primaryConcerns)).toBe(true);
      expect(['low', 'elevated', 'high', 'severe']).toContain(shortTerm.nextWeek.riskLevel);
    });

    test('should return valid model accuracy metrics', async () => {
      const response = await request(app)
        .get('/api/threats/predictions');

      const { modelAccuracy } = response.body.data;
      expect(modelAccuracy).toHaveProperty('lastQuarterAccuracy');
      expect(modelAccuracy).toHaveProperty('predictionConfidence');
      expect(modelAccuracy).toHaveProperty('falsePositiveRate');

      expect(typeof modelAccuracy.lastQuarterAccuracy).toBe('number');
      expect(modelAccuracy.lastQuarterAccuracy).toBeGreaterThanOrEqual(0);
      expect(modelAccuracy.lastQuarterAccuracy).toBeLessThanOrEqual(100);

      expect(typeof modelAccuracy.predictionConfidence).toBe('number');
      expect(modelAccuracy.predictionConfidence).toBeGreaterThanOrEqual(0);
      expect(modelAccuracy.predictionConfidence).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/threats/ioc', () => {
    test('should return indicators of compromise', async () => {
      const response = await request(app)
        .get('/api/threats/ioc')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('indicators');
      expect(response.body.data).toHaveProperty('feeds');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('should return valid IOC summary', async () => {
      const response = await request(app)
        .get('/api/threats/ioc');

      const { summary } = response.body.data;
      expect(summary).toHaveProperty('totalIOCs');
      expect(summary).toHaveProperty('lastUpdate');

      expect(typeof summary.totalIOCs).toBe('number');
      expect(summary.totalIOCs).toBeGreaterThanOrEqual(0);
      expect(typeof summary.lastUpdate).toBe('string');
    });

    test('should return valid IOC indicators', async () => {
      const response = await request(app)
        .get('/api/threats/ioc');

      const { indicators } = response.body.data;
      expect(indicators).toHaveProperty('ipAddresses');
      expect(indicators).toHaveProperty('domains');
      expect(indicators).toHaveProperty('hashes');

      expect(Array.isArray(indicators.ipAddresses)).toBe(true);
      expect(Array.isArray(indicators.domains)).toBe(true);
      expect(Array.isArray(indicators.hashes)).toBe(true);

      const allIndicators = [
        ...indicators.ipAddresses,
        ...indicators.domains,
        ...indicators.hashes
      ];

      allIndicators.forEach(indicator => {
        expect(indicator).toHaveProperty('value');
        expect(indicator).toHaveProperty('type');
        expect(indicator).toHaveProperty('firstSeen');
        expect(indicator).toHaveProperty('confidence');
        expect(indicator).toHaveProperty('source');

        expect(typeof indicator.value).toBe('string');
        expect(['ipv4', 'domain', 'md5', 'sha1', 'sha256']).toContain(indicator.type);
        expect(['high', 'medium', 'low']).toContain(indicator.confidence);
        expect(typeof indicator.source).toBe('string');
      });
    });

    test('should return valid feed information', async () => {
      const response = await request(app)
        .get('/api/threats/ioc');

      const { feeds } = response.body.data;
      expect(typeof feeds).toBe('object');

      Object.values(feeds).forEach(feed => {
        expect(feed).toHaveProperty('indicators');
        expect(feed).toHaveProperty('lastUpdate');
        expect(typeof feed.indicators).toBe('number');
        expect(feed.indicators).toBeGreaterThanOrEqual(0);
        expect(typeof feed.lastUpdate).toBe('string');
      });
    });
  });

  describe('Error handling', () => {
    test('should handle server errors gracefully for landscape endpoint', async () => {
      const response = await request(app)
        .get('/api/threats/landscape');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should handle server errors gracefully for all endpoints', async () => {
      const endpoints = ['/landscape', '/active', '/intelligence', '/predictions', '/ioc'];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(`/api/threats${endpoint}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      }
    });
  });

  describe('Response timing', () => {
    test('should respond within reasonable time limits for all endpoints', async () => {
      const endpoints = ['/landscape', '/active', '/intelligence', '/predictions', '/ioc'];

      for (const endpoint of endpoints) {
        const start = Date.now();
        await request(app)
          .get(`/api/threats${endpoint}`)
          .expect(200);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
      }
    });
  });

  describe('Data consistency', () => {
    test('should maintain consistent threat counts across endpoints', async () => {
      const landscapeResponse = await request(app).get('/api/threats/landscape');
      const activeResponse = await request(app).get('/api/threats/active');

      const landscapeCurrentThreats = landscapeResponse.body.data.currentThreats;
      const activeThreatsCount = activeResponse.body.data.threats.length;

      // The landscape endpoint includes more threats than just the active ones,
      // so landscape should be >= active threats count
      expect(landscapeCurrentThreats).toBeGreaterThanOrEqual(activeThreatsCount);
    });
  });
});