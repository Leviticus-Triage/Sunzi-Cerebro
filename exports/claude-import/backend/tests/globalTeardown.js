/**
 * Jest Global Teardown
 * Sunzi Cerebro Backend - Test Suite Global Cleanup
 */

export default async function globalTeardown() {
  console.log('🧹 Cleaning up Sunzi Cerebro Backend Test Suite...')

  // Calculate total test duration
  const testDuration = Date.now() - global.__TEST_START_TIME__
  console.log(`⏱️  Total test duration: ${(testDuration / 1000).toFixed(2)}s`)

  // Cleanup any global resources if needed
  if (global.gc) {
    global.gc()
  }

  console.log('✅ Global test teardown completed')
}