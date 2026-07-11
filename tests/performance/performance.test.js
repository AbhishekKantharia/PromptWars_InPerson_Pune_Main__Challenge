/**
 * Performance Tests
 * Tests: API response times, concurrency, throughput, memory, latency under load
 */

const { ApiClient, TestAssertions: TA, TestReporter, MockDB } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('Performance Tests');

const PERF_LIMITS = {
  api_response_ms: 2000,
  chat_response_ms: 5000,
  alert_response_ms: 1000,
  concurrent_users: 50,
  throughput_rps: 100,
  p95_latency_ms: 3000,
  p99_latency_ms: 5000,
};

async function measureTime(fn) {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}

async function runTests() {
  console.log('\n⚡ Running Performance Tests...\n');

  // ============================================================
  // API RESPONSE TIME TESTS
  // ============================================================

  await runTest('PERF-001: Auth API response < 2000ms', async () => {
    const client = new ApiClient();
    const elapsed = await measureTime(async () => {
      const res = await client.post('/api/v1/auth/register', {
        phone_number: '+919876543210',
        name: 'Perf User',
        preferred_language: 'en',
      });
      TA.assertSuccess(res, 201);
    });
    if (elapsed > PERF_LIMITS.api_response_ms) throw new Error(`Auth API too slow: ${elapsed}ms`);
  });

  await runTest('PERF-002: Weather API response < 2000ms', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const elapsed = await measureTime(async () => {
      const res = await client.authGet('/api/v1/weather/current?lat=19.0760&lon=72.8777');
      TA.assertSuccess(res, 200);
    });
    if (elapsed > PERF_LIMITS.api_response_ms) throw new Error(`Weather API too slow: ${elapsed}ms`);
  });

  await runTest('PERF-003: Alert API response < 1000ms', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const elapsed = await measureTime(async () => {
      const res = await client.authGet('/api/v1/alerts/active?lat=19.0760&lon=72.8777');
      TA.assertSuccess(res, 200);
    });
    if (elapsed > PERF_LIMITS.alert_response_ms) throw new Error(`Alert API too slow: ${elapsed}ms`);
  });

  await runTest('PERF-004: Chat API response < 5000ms', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const elapsed = await measureTime(async () => {
      const res = await client.authPost('/api/v1/chat', { message: 'Quick test: what should I do during flood?' });
      TA.assertSuccess(res, 200);
    });
    if (elapsed > PERF_LIMITS.chat_response_ms) throw new Error(`Chat API too slow: ${elapsed}ms`);
  });

  await runTest('PERF-005: Report submission < 2000ms', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const elapsed = await measureTime(async () => {
      const res = await client.authPost('/api/v1/reports/submit', {
        report_type: 'flood',
        severity: 'medium',
        location: TEST_CONFIG.locations.mumbaiFlood,
        description: 'Performance test report',
      });
      TA.assertSuccess(res, 201);
    });
    if (elapsed > PERF_LIMITS.api_response_ms) throw new Error(`Report API too slow: ${elapsed}ms`);
  });

  await runTest('PERF-006: Location route calculation < 2000ms', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const elapsed = await measureTime(async () => {
      const res = await client.authPost('/api/v1/location/route', {
        origin: TEST_CONFIG.locations.mumbaiFlood,
        destination: TEST_CONFIG.locations.mumbaiSafe,
        mode: 'driving',
        avoid_floods: true,
      });
      TA.assertSuccess(res, 200);
    });
    if (elapsed > PERF_LIMITS.api_response_ms) throw new Error(`Route API too slow: ${elapsed}ms`);
  });

  // ============================================================
  // CONCURRENT REQUEST TESTS
  // ============================================================

  await runTest('PERF-007: Handle 10 concurrent auth requests', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const client = new ApiClient();
      promises.push(client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password }));
    }
    const results = await Promise.all(promises);
    const failures = results.filter(r => r.status >= 400);
    if (failures.length > 0) throw new Error(`${failures.length} of 10 concurrent auth requests failed`);
  });

  await runTest('PERF-008: Handle 10 concurrent chat requests', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(client.authPost('/api/v1/chat', { message: `Concurrent test message ${i}` }));
    }
    const results = await Promise.all(promises);
    const failures = results.filter(r => r.status >= 400);
    if (failures.length > 0) throw new Error(`${failures.length} of 10 concurrent chat requests failed`);
  });

  await runTest('PERF-009: Handle 50 concurrent weather requests', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);

    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(client.authGet(`/api/v1/weather/current?lat=19.0760&lon=72.8777`));
    }
    const results = await Promise.all(promises);
    const failures = results.filter(r => r.status >= 400);
    if (failures.length > 5) throw new Error(`${failures.length} of 50 concurrent weather requests failed (>5 threshold)`);
  });

  await runTest('PERF-010: Handle 50 concurrent alert requests', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);

    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(client.authGet('/api/v1/alerts/active?lat=19.0760&lon=72.8777'));
    }
    const results = await Promise.all(promises);
    const failures = results.filter(r => r.status >= 400);
    if (failures.length > 5) throw new Error(`${failures.length} of 50 concurrent alert requests failed`);
  });

  // ============================================================
  // THROUGHPUT TESTS
  // ============================================================

  await runTest('PERF-011: Throughput — 100 requests in 10 seconds', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);

    const start = Date.now();
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(client.authGet('/api/v1/weather/current?lat=19.0760&lon=72.8777'));
    }
    const results = await Promise.all(promises);
    const elapsed = Date.now() - start;
    const rps = 100 / (elapsed / 1000);
    const failures = results.filter(r => r.status >= 400);
    console.log(`    Throughput: ${rps.toFixed(1)} RPS (${failures.length} failures)`);
    if (rps < 10) throw new Error(`Throughput too low: ${rps.toFixed(1)} RPS`);
  });

  await runTest('PERF-012: Latency P95 < 3000ms', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);

    const latencies = [];
    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      await client.authGet('/api/v1/weather/current?lat=19.0760&lon=72.8777');
      latencies.push(Date.now() - start);
    }
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    console.log(`    P95 latency: ${p95}ms`);
    if (p95 > PERF_LIMITS.p95_latency_ms) throw new Error(`P95 latency ${p95}ms exceeds ${PERF_LIMITS.p95_latency_ms}ms`);
  });

  // ============================================================
  // MEMORY & RESOURCE TESTS
  // ============================================================

  await runTest('PERF-013: No memory leak in repeated API calls', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);

    const startMem = process.memoryUsage().heapUsed;
    for (let i = 0; i < 50; i++) {
      await client.authGet('/api/v1/weather/current?lat=19.0760&lon=72.8777');
    }
    const endMem = process.memoryUsage().heapUsed;
    const growth = (endMem - startMem) / 1024 / 1024;
    console.log(`    Memory growth: ${growth.toFixed(2)}MB`);
    if (growth > 50) throw new Error(`Memory growth too high: ${growth.toFixed(2)}MB`);
  });

  await runTest('PERF-014: SMS fallback sends within 5 seconds', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);

    const elapsed = await measureTime(async () => {
      const res = await client.authPost('/api/v1/alerts/send-sms', {
        phone_number: '+919876543210',
        message: 'TEST: Flood alert. Move to higher ground.',
      });
      TA.assertSuccess(res, 200);
    });
    if (elapsed > 5000) throw new Error(`SMS send too slow: ${elapsed}ms`);
  });

  async function runTest(name, fn) {
    const start = Date.now();
    try { await fn(); reporter.record(name, true, Date.now() - start); }
    catch (err) { reporter.record(name, false, Date.now() - start, err); }
  }
  return reporter.summary();
}

module.exports = { runTests };
if (require.main === module) runTests();
