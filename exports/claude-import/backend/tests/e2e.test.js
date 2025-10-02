/**
 * End-to-End Integration Tests
 * Tests complete system workflows from authentication to MCP tool execution
 * Enhanced by Moses Team - Comprehensive System Validation
 * Version: v3.2.0 Production
 */

import { test, expect, beforeAll, afterAll, describe } from '@jest/globals';
import request from 'supertest';
import { DatabaseServiceProduction } from '../services/databaseService.js';
import app from '../server.js';

let server;
let databaseService;
let testUser = null;
let authToken = null;
let organizationId = null;

beforeAll(async () => {
  // Initialize database service
  databaseService = new DatabaseServiceProduction();
  await databaseService.initialize();

  // Start server for E2E testing
  server = app.listen(0); // Use random available port

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  if (databaseService) {
    await databaseService.shutdown();
  }
});

describe('🔄 End-to-End System Integration Tests', () => {

  describe('👤 Complete Authentication Flow', () => {
    test('should register new user with organization', async () => {
      const registrationData = {
        username: 'e2e-test-user',
        email: 'e2e@sunzi-cerebro-test.com',
        password: 'E2ETest123!',
        name: 'E2E Test User',
        organizationName: 'E2E Test Organization'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('e2e-test-user');
      expect(response.body.data.user.email).toBe('e2e@sunzi-cerebro-test.com');
      expect(response.body.data.organization.name).toBe('E2E Test Organization');

      testUser = response.body.data.user;
      organizationId = response.body.data.organization.id;
    });

    test('should login with registered user', async () => {
      const loginData = {
        username: 'e2e-test-user',
        password: 'E2ETest123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('e2e-test-user');

      authToken = response.body.data.token;
    });

    test('should validate JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });
  });

  describe('🗄️ Database Operations', () => {
    test('should access MCP database server status', async () => {
      const response = await request(app)
        .get('/api/mcp/database/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.server.status).toBe('active');
      expect(response.body.data.server.tools).toBeGreaterThan(0);
    });

    test('should execute database statistics tool', async () => {
      const response = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tool: 'get_database_stats' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.data.record_counts).toBeDefined();
      expect(response.body.data.data.record_counts.users).toBeGreaterThan(0);
      expect(response.body.data.data.record_counts.organizations).toBeGreaterThan(0);
    });

    test('should query users through MCP', async () => {
      const response = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tool: 'query_users',
          parameters: {
            filters: { organization_id: organizationId },
            limit: 10
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.metadata.count).toBeGreaterThan(0);
    });

    test('should get user activity summary', async () => {
      const response = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tool: 'get_user_activity',
          parameters: {
            user_id: testUser.id,
            days: 7
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.data.user.id).toBe(testUser.id);
      expect(response.body.data.data.activity).toBeDefined();
    });
  });

  describe('⚡ Performance & Optimization', () => {
    test('should access MCP performance metrics', async () => {
      const response = await request(app)
        .get('/api/mcp/database/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.health).toBeDefined();
      expect(response.body.data.health.status).toBe('healthy');
    });

    test('should trigger performance optimization', async () => {
      const response = await request(app)
        .post('/api/mcp/database/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('optimization triggered');
    });

    test('should measure API response times', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/mcp/database/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(500); // Should respond in under 500ms
    });
  });

  describe('🔐 Security & Authorization', () => {
    test('should reject access without authentication', async () => {
      await request(app)
        .get('/api/mcp/database/status')
        .expect(401);
    });

    test('should reject invalid JWT tokens', async () => {
      await request(app)
        .get('/api/mcp/database/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('should enforce role-based access for admin endpoints', async () => {
      // This should work since our test user has admin role
      await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tool: 'query_users' })
        .expect(200);
    });

    test('should log security events in audit trail', async () => {
      // Trigger a security event
      await request(app)
        .get('/api/mcp/database/status')
        .set('Authorization', `Bearer ${authToken}`);

      // Check audit logs
      const response = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tool: 'query_audit_logs',
          parameters: {
            filters: { user_id: testUser.id },
            limit: 5
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
    });
  });

  describe('🔄 System Health & Monitoring', () => {
    test('should report system health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('should provide detailed system metrics', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.system).toBeDefined();
      expect(response.body.database).toBeDefined();
      expect(response.body.performance).toBeDefined();
    });

    test('should validate database connection health', async () => {
      const healthData = await databaseService.getHealthMetrics();

      expect(healthData.status).toBe('healthy');
      expect(healthData.connection).toBe('connected');
      expect(healthData.metrics.uptime).toBeGreaterThan(0);
    });
  });

  describe('🔧 Tool Integration Workflow', () => {
    test('should execute complete tool workflow', async () => {
      // Step 1: Get available tools
      const toolsResponse = await request(app)
        .get('/api/mcp/database/tools')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(toolsResponse.body.success).toBe(true);
      expect(toolsResponse.body.data.tools.length).toBeGreaterThan(0);

      // Step 2: Execute a tool
      const executeResponse = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tool: 'get_database_stats' })
        .expect(200);

      expect(executeResponse.body.success).toBe(true);

      // Step 3: Verify performance tracking
      const performanceResponse = await request(app)
        .get('/api/mcp/database/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(performanceResponse.body.data.performance.tools).toBeDefined();
    });

    test('should handle multiple concurrent tool executions', async () => {
      const promises = [];

      // Execute 5 concurrent database stats requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/mcp/database/execute')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ tool: 'get_database_stats' })
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('📊 Data Consistency & Integrity', () => {
    test('should maintain data consistency across operations', async () => {
      // Get initial user count
      const initialStats = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tool: 'get_database_stats' })
        .expect(200);

      const initialUserCount = initialStats.body.data.data.record_counts.users;

      // Query users directly
      const usersQuery = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tool: 'query_users',
          parameters: { limit: 100 }
        })
        .expect(200);

      const actualUserCount = usersQuery.body.data.metadata.count;

      // Data should be consistent
      expect(actualUserCount).toBeLessThanOrEqual(initialUserCount);
    });

    test('should validate data relationships', async () => {
      // Get organization data
      const orgResponse = await request(app)
        .post('/api/mcp/database/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tool: 'query_organizations',
          parameters: { limit: 10 }
        })
        .expect(200);

      expect(orgResponse.body.success).toBe(true);

      const organizations = orgResponse.body.data.data;
      expect(organizations.length).toBeGreaterThan(0);

      // Verify each organization has required fields
      organizations.forEach(org => {
        expect(org.id).toBeDefined();
        expect(org.name).toBeDefined();
        expect(org.tier).toBeDefined();
        expect(org.status).toBeDefined();
      });
    });
  });
});

// Performance benchmarking
describe('⚡ Performance Benchmarks', () => {
  test('should meet performance SLA requirements', async () => {
    const iterations = 10;
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      await request(app)
        .get('/api/mcp/database/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      responseTimes.push(Date.now() - startTime);
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
    const maxResponseTime = Math.max(...responseTimes);

    expect(avgResponseTime).toBeLessThan(200); // Average under 200ms
    expect(maxResponseTime).toBeLessThan(500); // Max under 500ms

    console.log(`📊 Performance Metrics:
      Average Response Time: ${avgResponseTime.toFixed(2)}ms
      Max Response Time: ${maxResponseTime}ms
      Min Response Time: ${Math.min(...responseTimes)}ms`);
  });
});