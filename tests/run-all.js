/**
 * Master Test Runner
 * Runs all test suites and produces aggregate report
 */

const path = require('path');
const fs = require('fs');

const SUITES = [
  { name: 'Auth Service Unit Tests', path: './unit/services/auth.test.js' },
  { name: 'User Service Unit Tests', path: './unit/services/user.test.js' },
  { name: 'Chat Service Unit Tests', path: './unit/services/chat.test.js' },
  { name: 'Alert Service Unit Tests', path: './unit/services/alert.test.js' },
  { name: 'Location Service Unit Tests', path: './unit/services/location.test.js' },
  { name: 'Report Service Unit Tests', path: './unit/services/report.test.js' },
  { name: 'Health Service Unit Tests', path: './unit/services/health.test.js' },
  { name: 'Weather Service Unit Tests', path: './unit/services/weather.test.js' },
  { name: 'Relief Service Unit Tests', path: './unit/services/relief.test.js' },
  { name: 'AI Model Tests', path: './ai/ai-model.test.js' },
  { name: 'Performance Tests', path: './performance/performance.test.js' },
  { name: 'Security Tests', path: './security/security.test.js' },
  { name: 'Accessibility Tests', path: './accessibility/accessibility.test.js' },
  { name: 'Disaster Scenario Tests', path: './e2e/disaster_scenarios/disaster-scenarios.test.js' },
  { name: 'Complete User Journey Tests', path: './e2e/journeys/complete-user-journey.test.js' },
];

async function runAllSuites() {
  const startTime = Date.now();
  const allResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     VarunAI — Complete Test Suite Runner            ║');
  console.log('║     100+ Features | 15 Suites | 300+ Tests         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\nStarting ${SUITES.length} test suites...\n`);

  for (const suite of SUITES) {
    const suitePath = path.join(__dirname, suite.path);
    if (!fs.existsSync(suitePath)) {
      console.log(`⏭️  SKIP: ${suite.name} (file not found: ${suite.path})`);
      totalSkipped++;
      continue;
    }

    try {
      console.log(`\n━━━ Running: ${suite.name} ━━━`);
      const suiteModule = require(suitePath);
      if (typeof suiteModule.runTests === 'function') {
        const result = await suiteModule.runTests();
        if (result) {
          allResults.push({ suite: suite.name, ...result });
          totalPassed += result.passed;
          totalFailed += result.failed;
        }
      } else {
        console.log(`  ⚠️  No runTests() export found`);
        totalSkipped++;
      }
    } catch (err) {
      console.log(`  ❌ Suite error: ${err.message}`);
      totalFailed++;
      allResults.push({ suite: suite.name, passed: 0, failed: 1, errors: [err.message] });
    }
  }

  const totalTime = Date.now() - startTime;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║              AGGREGATE TEST REPORT                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Suite Results:');
  console.log('  ─────────────────────────────────────────────────');
  for (const r of allResults) {
    const icon = r.failed > 0 ? '❌' : '✅';
    console.log(`  ${icon} ${r.suite}: ${r.passed} passed, ${r.failed} failed`);
  }
  console.log('');
  console.log('  ─────────────────────────────────────────────────');
  console.log(`  Total Passed:  ${totalPassed}`);
  console.log(`  Total Failed:  ${totalFailed}`);
  console.log(`  Total Skipped: ${totalSkipped}`);
  console.log(`  Total Time:    ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`  Pass Rate:     ${totalPassed + totalFailed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0}%`);
  console.log('');

  if (totalFailed > 0) {
    console.log('  Failed Tests:');
    console.log('  ─────────────────────────────────────────────────');
    for (const r of allResults) {
      if (r.errors) {
        for (const err of r.errors) {
          console.log(`  ❌ [${r.suite}] ${err}`);
        }
      }
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  VarunAI Test Suite Complete — ${totalPassed + totalFailed} tests in ${(totalTime / 1000).toFixed(1)}s`);
  console.log('══════════════════════════════════════════════════════');

  // Write report to file
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    suites: allResults,
    totals: { passed: totalPassed, failed: totalFailed, skipped: totalSkipped, timeMs: totalTime },
  }, null, 2));

  console.log(`\nReport written to: ${reportPath}`);

  process.exit(totalFailed > 0 ? 1 : 0);
}

if (require.main === module) {
  runAllSuites().catch(err => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
}

module.exports = { runAllSuites };
