/**
 * Load Testing Suite
 * Comprehensive load testing for performance validation
 *
 * Test Scenarios:
 * - Concurrent users (100, 500, 1000)
 * - Sustained load tests
 * - Spike tests
 * - Stress tests
 * - Endurance tests
 *
 * Metrics:
 * - Response time (P50, P95, P99)
 * - Throughput (RPS)
 * - Error rate
 * - Resource utilization
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

class LoadTester {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:8890',
      timeout: config.timeout || 30000,
      ...config
    };

    this.results = {
      requests: [],
      summary: null,
      errors: [],
      startTime: null,
      endTime: null
    };

    this.activeRequests = 0;
    this.maxConcurrent = 0;
  }

  /**
   * Run load test scenario
   */
  async runScenario(scenario) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 Starting Load Test: ${scenario.name}`);
    console.log(`   Target: ${scenario.concurrent} concurrent users`);
    console.log(`   Duration: ${scenario.duration}s`);
    console.log(`   Ramp-up: ${scenario.rampUp}s`);
    console.log(`${'='.repeat(80)}\n`);

    this.results = {
      requests: [],
      summary: null,
      errors: [],
      startTime: Date.now(),
      endTime: null
    };

    this.activeRequests = 0;
    this.maxConcurrent = 0;

    const { concurrent, duration, rampUp, endpoint, method, data } = scenario;

    // Calculate request rate during ramp-up
    const rampUpRequests = Math.floor(concurrent / (rampUp || 1));
    const rampUpInterval = (rampUp * 1000) / rampUpRequests;

    // Ramp-up phase
    console.log(`📈 Ramp-up phase: ${rampUp}s`);
    for (let i = 0; i < concurrent; i++) {
      this.startRequest(endpoint, method, data);

      if (i % rampUpRequests === 0 && i > 0) {
        await this.sleep(rampUpInterval);
      }
    }

    // Sustained load phase
    console.log(`⚡ Sustained load phase: ${duration}s`);
    const sustainedDuration = (duration - rampUp) * 1000;
    const startSustained = Date.now();

    while (Date.now() - startSustained < sustainedDuration) {
      // Maintain concurrent load
      if (this.activeRequests < concurrent) {
        this.startRequest(endpoint, method, data);
      }
      await this.sleep(100); // Check every 100ms
    }

    // Wait for remaining requests to complete
    console.log(`⏳ Waiting for requests to complete...`);
    while (this.activeRequests > 0) {
      await this.sleep(500);
    }

    this.results.endTime = Date.now();

    // Calculate and display results
    this.analyzResults();

    return this.results;
  }

  /**
   * Start a single request
   */
  async startRequest(endpoint, method = 'GET', data = null) {
    this.activeRequests++;
    this.maxConcurrent = Math.max(this.maxConcurrent, this.activeRequests);

    const requestId = Date.now() + Math.random();
    const startTime = performance.now();

    try {
      const config = {
        method,
        url: `${this.config.baseURL}${endpoint}`,
        timeout: this.config.timeout,
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.results.requests.push({
        id: requestId,
        endpoint,
        method,
        duration,
        statusCode: response.status,
        success: response.status >= 200 && response.status < 300,
        timestamp: Date.now()
      });

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.results.requests.push({
        id: requestId,
        endpoint,
        method,
        duration,
        statusCode: error.response?.status || 0,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });

      this.results.errors.push({
        endpoint,
        error: error.message,
        statusCode: error.response?.status || 0,
        timestamp: Date.now()
      });

    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Analyze test results
   */
  analyzeResults() {
    const { requests, startTime, endTime } = this.results;

    if (requests.length === 0) {
      console.log('❌ No requests completed');
      return;
    }

    // Calculate response time statistics
    const durations = requests.map(r => r.duration).sort((a, b) => a - b);
    const successfulRequests = requests.filter(r => r.success);
    const failedRequests = requests.filter(r => !r.success);

    const totalDuration = (endTime - startTime) / 1000; // seconds

    this.results.summary = {
      totalRequests: requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: (successfulRequests.length / requests.length) * 100,
      duration: totalDuration,
      throughput: requests.length / totalDuration,
      maxConcurrent: this.maxConcurrent,
      responseTime: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        p50: this.calculatePercentile(durations, 50),
        p95: this.calculatePercentile(durations, 95),
        p99: this.calculatePercentile(durations, 99)
      },
      errorRate: (failedRequests.length / requests.length) * 100,
      statusCodes: this.groupBy(requests, 'statusCode')
    };

    this.printResults();
  }

  /**
   * Print test results
   */
  printResults() {
    const { summary } = this.results;

    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 LOAD TEST RESULTS');
    console.log(`${'='.repeat(80)}\n`);

    console.log('📈 Request Statistics:');
    console.log(`   Total Requests:      ${summary.totalRequests}`);
    console.log(`   Successful:          ${summary.successfulRequests} (${summary.successRate.toFixed(2)}%)`);
    console.log(`   Failed:              ${summary.failedRequests} (${summary.errorRate.toFixed(2)}%)`);
    console.log(`   Max Concurrent:      ${summary.maxConcurrent}`);

    console.log(`\n⚡ Throughput:`);
    console.log(`   Requests/sec:        ${summary.throughput.toFixed(2)} RPS`);
    console.log(`   Duration:            ${summary.duration.toFixed(2)}s`);

    console.log(`\n⏱️  Response Time:`);
    console.log(`   Min:                 ${summary.responseTime.min.toFixed(2)}ms`);
    console.log(`   Avg:                 ${summary.responseTime.avg.toFixed(2)}ms`);
    console.log(`   Max:                 ${summary.responseTime.max.toFixed(2)}ms`);
    console.log(`   P50:                 ${summary.responseTime.p50.toFixed(2)}ms`);
    console.log(`   P95:                 ${summary.responseTime.p95.toFixed(2)}ms ${this.getSLAIndicator(summary.responseTime.p95)}`);
    console.log(`   P99:                 ${summary.responseTime.p99.toFixed(2)}ms`);

    console.log(`\n📊 Status Codes:`);
    Object.entries(summary.statusCodes).forEach(([code, count]) => {
      console.log(`   ${code}: ${count}`);
    });

    // SLA Validation
    console.log(`\n✅ SLA Validation:`);
    const p95Met = summary.responseTime.p95 < 2000;
    const availabilityMet = summary.successRate > 99.9;
    const errorRateMet = summary.errorRate < 0.1;

    console.log(`   P95 < 2000ms:        ${p95Met ? '✅ PASS' : '❌ FAIL'} (${summary.responseTime.p95.toFixed(2)}ms)`);
    console.log(`   Availability > 99.9%: ${availabilityMet ? '✅ PASS' : '❌ FAIL'} (${summary.successRate.toFixed(2)}%)`);
    console.log(`   Error Rate < 0.1%:   ${errorRateMet ? '✅ PASS' : '❌ FAIL'} (${summary.errorRate.toFixed(2)}%)`);

    const allSLAsMet = p95Met && availabilityMet && errorRateMet;
    console.log(`\n${allSLAsMet ? '✅ ALL SLAs MET' : '❌ SLA VIOLATIONS DETECTED'}`);

    // Errors summary
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length} total):`);
      const errorsByType = this.groupBy(this.results.errors, 'error');
      Object.entries(errorsByType).slice(0, 5).forEach(([error, count]) => {
        console.log(`   ${error}: ${count}`);
      });
    }

    console.log(`\n${'='.repeat(80)}\n`);
  }

  /**
   * Get SLA indicator emoji
   */
  getSLAIndicator(value) {
    if (value < 500) return '🟢 Excellent';
    if (value < 1000) return '🟡 Good';
    if (value < 2000) return '🟠 Acceptable';
    return '🔴 SLA Violation';
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Group array by property
   */
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export results to JSON
   */
  exportResults(filename = 'load-test-results.json') {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📁 Results exported to ${filename}`);
  }
}

// Predefined test scenarios
const testScenarios = {
  smoke: {
    name: 'Smoke Test',
    concurrent: 10,
    duration: 30,
    rampUp: 5,
    endpoint: '/api/health',
    method: 'GET'
  },

  light: {
    name: 'Light Load Test',
    concurrent: 100,
    duration: 60,
    rampUp: 10,
    endpoint: '/api/mcp/tools',
    method: 'GET'
  },

  moderate: {
    name: 'Moderate Load Test',
    concurrent: 500,
    duration: 120,
    rampUp: 20,
    endpoint: '/api/mcp/tools',
    method: 'GET'
  },

  heavy: {
    name: 'Heavy Load Test',
    concurrent: 1000,
    duration: 180,
    rampUp: 30,
    endpoint: '/api/mcp/tools',
    method: 'GET'
  },

  spike: {
    name: 'Spike Test',
    concurrent: 500,
    duration: 60,
    rampUp: 5, // Rapid ramp-up
    endpoint: '/api/mcp/tools',
    method: 'GET'
  },

  stress: {
    name: 'Stress Test',
    concurrent: 2000,
    duration: 300,
    rampUp: 60,
    endpoint: '/api/mcp/tools',
    method: 'GET'
  },

  endurance: {
    name: 'Endurance Test',
    concurrent: 200,
    duration: 3600, // 1 hour
    rampUp: 60,
    endpoint: '/api/mcp/tools',
    method: 'GET'
  }
};

// Main execution
async function main() {
  const tester = new LoadTester({
    baseURL: process.env.API_BASE_URL || 'http://localhost:8890'
  });

  // Get test scenario from command line
  const scenarioName = process.argv[2] || 'smoke';
  const scenario = testScenarios[scenarioName];

  if (!scenario) {
    console.error(`❌ Unknown scenario: ${scenarioName}`);
    console.log('\nAvailable scenarios:');
    Object.keys(testScenarios).forEach(name => {
      console.log(`   - ${name}`);
    });
    process.exit(1);
  }

  try {
    const results = await tester.runScenario(scenario);

    // Export results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    tester.exportResults(`load-test-${scenarioName}-${timestamp}.json`);

    // Exit with appropriate code
    const slasMet = results.summary.responseTime.p95 < 2000 &&
                    results.summary.successRate > 99.9 &&
                    results.summary.errorRate < 0.1;

    process.exit(slasMet ? 0 : 1);

  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

// Export for use as module
export { LoadTester, testScenarios };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}