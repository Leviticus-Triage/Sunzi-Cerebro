#!/usr/bin/env node

/**
 * Test Runner Script
 * Sunzi Cerebro Backend - Comprehensive Test Suite Runner
 *
 * Orchestrates the execution of all test suites with proper reporting,
 * environment setup, coverage analysis, and CI/CD integration.
 */

import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test configuration
const TEST_CONFIG = {
  testDir: path.join(__dirname, '../tests'),
  coverageDir: path.join(__dirname, '../coverage'),
  reportsDir: path.join(__dirname, '../test-reports'),
  suites: [
    { name: 'Authentication', file: 'auth.test.js', timeout: 30000 },
    { name: 'Database', file: 'database.test.js', timeout: 45000 },
    { name: 'MCP Server', file: 'mcp.test.js', timeout: 60000 },
    { name: 'Performance', file: 'performance.test.js', timeout: 120000 },
    { name: 'Security', file: 'security.test.js', timeout: 90000 }
  ],
  environment: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt-secret-key',
    DB_STORAGE: ':memory:', // Use in-memory SQLite for tests
    LOG_LEVEL: 'error', // Minimize logging during tests
    MCP_DATABASE_SERVER_PORT: '3001'
  }
}

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      coverage: null,
      suites: [],
      startTime: null,
      endTime: null
    }
  }

  async run() {
    console.log('🚀 Sunzi Cerebro Backend Test Suite Runner')
    console.log('==========================================')

    this.results.startTime = new Date()

    try {
      await this.setupEnvironment()
      await this.runAllSuites()
      await this.generateReports()
      await this.printSummary()

      process.exit(this.results.failed > 0 ? 1 : 0)
    } catch (error) {
      console.error('❌ Test runner failed:', error.message)
      process.exit(1)
    }
  }

  async setupEnvironment() {
    console.log('🔧 Setting up test environment...')

    // Set environment variables
    Object.entries(TEST_CONFIG.environment).forEach(([key, value]) => {
      process.env[key] = value
    })

    // Create directories
    await this.ensureDirectories()

    // Clean previous test artifacts
    await this.cleanPreviousRuns()

    console.log('✅ Test environment ready')
  }

  async ensureDirectories() {
    const dirs = [
      TEST_CONFIG.coverageDir,
      TEST_CONFIG.reportsDir
    ]

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true })
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error
        }
      }
    }
  }

  async cleanPreviousRuns() {
    try {
      // Clean coverage directory
      const coverageFiles = await fs.readdir(TEST_CONFIG.coverageDir)
      for (const file of coverageFiles) {
        await fs.rm(path.join(TEST_CONFIG.coverageDir, file), { recursive: true })
      }

      // Clean reports directory
      const reportFiles = await fs.readdir(TEST_CONFIG.reportsDir)
      for (const file of reportFiles) {
        await fs.rm(path.join(TEST_CONFIG.reportsDir, file), { recursive: true })
      }
    } catch (error) {
      // Ignore if directories don't exist
    }
  }

  async runAllSuites() {
    console.log('\n🧪 Running test suites...')

    for (const suite of TEST_CONFIG.suites) {
      await this.runSuite(suite)
    }
  }

  async runSuite(suite) {
    console.log(`\n📋 Running ${suite.name} Tests...`)

    const startTime = Date.now()

    try {
      const result = await this.executeJest(suite)
      const endTime = Date.now()
      const duration = endTime - startTime

      const suiteResult = {
        name: suite.name,
        file: suite.file,
        duration,
        passed: result.numPassedTests || 0,
        failed: result.numFailedTests || 0,
        skipped: result.numPendingTests || 0,
        total: result.numTotalTests || 0,
        success: result.success,
        coverage: result.coverageMap
      }

      this.results.suites.push(suiteResult)
      this.results.passed += suiteResult.passed
      this.results.failed += suiteResult.failed
      this.results.skipped += suiteResult.skipped
      this.results.total += suiteResult.total

      const status = suiteResult.success ? '✅' : '❌'
      console.log(`${status} ${suite.name}: ${suiteResult.passed}/${suiteResult.total} passed (${duration}ms)`)

      if (!suiteResult.success && result.failureDetails) {
        console.log(`   Failures: ${result.failureDetails}`)
      }

    } catch (error) {
      console.log(`❌ ${suite.name}: Failed to execute`)
      console.log(`   Error: ${error.message}`)

      this.results.suites.push({
        name: suite.name,
        file: suite.file,
        duration: Date.now() - startTime,
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
        success: false,
        error: error.message
      })

      this.results.failed += 1
      this.results.total += 1
    }
  }

  executeJest(suite) {
    return new Promise((resolve, reject) => {
      const jestArgs = [
        '--testPathPattern', suite.file,
        '--coverage',
        '--coverageDirectory', TEST_CONFIG.coverageDir,
        '--coverageReporters', 'json', 'lcov', 'text',
        '--json',
        '--outputFile', path.join(TEST_CONFIG.reportsDir, `${suite.name.toLowerCase()}-results.json`),
        '--testTimeout', suite.timeout.toString(),
        '--forceExit',
        '--detectOpenHandles',
        '--verbose'
      ]

      const jest = spawn('npx', ['jest', ...jestArgs], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...TEST_CONFIG.environment }
      })

      let stdout = ''
      let stderr = ''
      let jsonOutput = null

      jest.stdout.on('data', (data) => {
        const output = data.toString()
        stdout += output

        // Try to parse JSON output
        try {
          const lines = output.split('\n')
          for (const line of lines) {
            if (line.trim().startsWith('{') && line.trim().includes('numTotalTests')) {
              jsonOutput = JSON.parse(line.trim())
            }
          }
        } catch (e) {
          // Not JSON, continue
        }
      })

      jest.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      jest.on('close', (code) => {
        if (jsonOutput) {
          resolve({
            success: code === 0,
            numTotalTests: jsonOutput.numTotalTests,
            numPassedTests: jsonOutput.numPassedTests,
            numFailedTests: jsonOutput.numFailedTests,
            numPendingTests: jsonOutput.numPendingTests,
            failureDetails: jsonOutput.testResults
              ?.filter(test => test.status === 'failed')
              ?.map(test => test.message)
              ?.join('\n') || null
          })
        } else {
          // Fallback parsing from stdout
          const result = this.parseJestOutput(stdout, stderr)
          result.success = code === 0
          resolve(result)
        }
      })

      jest.on('error', (error) => {
        reject(error)
      })

      // Set timeout
      setTimeout(() => {
        jest.kill('SIGKILL')
        reject(new Error(`Test suite ${suite.name} timed out after ${suite.timeout}ms`))
      }, suite.timeout)
    })
  }

  parseJestOutput(stdout, stderr) {
    // Fallback parser for Jest output
    const result = {
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      failureDetails: null
    }

    // Parse test summary from output
    const summaryMatch = stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/)
    if (summaryMatch) {
      result.numFailedTests = parseInt(summaryMatch[1])
      result.numPassedTests = parseInt(summaryMatch[2])
      result.numTotalTests = parseInt(summaryMatch[3])
    }

    // Parse skipped tests
    const skippedMatch = stdout.match(/(\d+)\s+skipped/)
    if (skippedMatch) {
      result.numPendingTests = parseInt(skippedMatch[1])
    }

    return result
  }

  async generateReports() {
    console.log('\n📊 Generating test reports...')

    await this.generateJUnitReport()
    await this.generateHTMLReport()
    await this.generateCoverageReport()

    console.log('✅ Reports generated')
  }

  async generateJUnitReport() {
    const junit = this.createJUnitXML()
    const junitPath = path.join(TEST_CONFIG.reportsDir, 'junit.xml')
    await fs.writeFile(junitPath, junit)
  }

  createJUnitXML() {
    const duration = (this.results.endTime - this.results.startTime) / 1000

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<testsuite name="Sunzi Cerebro Backend Tests" tests="${this.results.total}" failures="${this.results.failed}" skipped="${this.results.skipped}" time="${duration}">\n`

    for (const suite of this.results.suites) {
      xml += `  <testcase classname="${suite.name}" name="${suite.file}" time="${suite.duration / 1000}">\n`

      if (!suite.success) {
        xml += `    <failure message="Test suite failed">${suite.error || 'Unknown error'}</failure>\n`
      }

      if (suite.skipped > 0) {
        xml += `    <skipped/>\n`
      }

      xml += `  </testcase>\n`
    }

    xml += `</testsuite>\n`
    return xml
  }

  async generateHTMLReport() {
    const html = this.createHTMLReport()
    const htmlPath = path.join(TEST_CONFIG.reportsDir, 'test-report.html')
    await fs.writeFile(htmlPath, html)
  }

  createHTMLReport() {
    const duration = this.results.endTime - this.results.startTime
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1)

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Sunzi Cerebro Backend Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #495057; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .suite { background: white; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .suite-header { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
        .suite-body { padding: 15px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .skipped { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Sunzi Cerebro Backend Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value ${this.results.failed === 0 ? 'success' : 'failure'}">${successRate}%</div>
            <div class="metric-label">Success Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">${this.results.passed}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${this.results.failed}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${this.results.skipped}</div>
            <div class="metric-label">Skipped</div>
        </div>
        <div class="metric">
            <div class="metric-value">${(duration / 1000).toFixed(1)}s</div>
            <div class="metric-label">Duration</div>
        </div>
    </div>

    ${this.results.suites.map(suite => `
        <div class="suite">
            <div class="suite-header">
                <h3>${suite.success ? '✅' : '❌'} ${suite.name} Test Suite</h3>
                <small>${suite.file} • ${(suite.duration / 1000).toFixed(2)}s</small>
            </div>
            <div class="suite-body">
                <p><span class="success">${suite.passed} passed</span> • <span class="failure">${suite.failed} failed</span> • <span class="skipped">${suite.skipped} skipped</span></p>
                ${suite.error ? `<p class="failure">Error: ${suite.error}</p>` : ''}
            </div>
        </div>
    `).join('')}

</body>
</html>
    `.trim()
  }

  async generateCoverageReport() {
    try {
      // Coverage report is already generated by Jest
      const coveragePath = path.join(TEST_CONFIG.coverageDir, 'lcov-report', 'index.html')

      try {
        await fs.access(coveragePath)
        console.log(`📊 Coverage report available at: ${coveragePath}`)
      } catch {
        console.log('⚠️  Coverage report not generated')
      }
    } catch (error) {
      console.log('⚠️  Could not process coverage report:', error.message)
    }
  }

  async printSummary() {
    this.results.endTime = new Date()
    const duration = this.results.endTime - this.results.startTime

    console.log('\n🎯 Test Summary')
    console.log('================')
    console.log(`Total Tests: ${this.results.total}`)
    console.log(`Passed: ${this.results.passed} ✅`)
    console.log(`Failed: ${this.results.failed} ${this.results.failed > 0 ? '❌' : ''}`)
    console.log(`Skipped: ${this.results.skipped} ${this.results.skipped > 0 ? '⏭️' : ''}`)
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`)
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`)

    console.log('\n📋 Suite Results:')
    for (const suite of this.results.suites) {
      const status = suite.success ? '✅' : '❌'
      console.log(`  ${status} ${suite.name}: ${suite.passed}/${suite.total} (${(suite.duration / 1000).toFixed(2)}s)`)
    }

    console.log(`\n📊 Reports generated in: ${TEST_CONFIG.reportsDir}`)

    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed!')
    } else {
      console.log(`\n💥 ${this.results.failed} test(s) failed`)
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner()
  runner.run()
}

export { TestRunner, TEST_CONFIG }