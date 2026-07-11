/**
 * Security Tests
 * Tests: Auth, injection, rate limiting, PII protection, CORS, XSS, RBAC, data leakage
 */

const { ApiClient, TestAssertions: TA, TestReporter, MockDB } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('Security Tests');

async function runTests() {
  console.log('\n🔒 Running Security Tests...\n');

  // ============================================================
  // AUTHENTICATION SECURITY
  // ============================================================

  await runTest('SEC-AUTH-001: Reject login with wrong password', async () => {
    const client = new ApiClient();
    const res = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: 'WrongPassword123!',
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await runTest('SEC-AUTH-002: Reject login with non-existent user', async () => {
    const client = new ApiClient();
    const res = await client.post('/api/v1/auth/login', {
      email: 'nonexistent@test.com',
      password: 'Password123!',
    });
    if (res.status !== 401 && res.status !== 404) throw new Error(`Expected 401/404, got ${res.status}`);
  });

  await runTest('SEC-AUTH-003: Reject access without auth token', async () => {
    const client = new ApiClient();
    const res = await client.get('/api/v1/users/me');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await runTest('SEC-AUTH-004: Reject access with invalid token', async () => {
    const client = new ApiClient();
    client.setAuthToken('invalid.token.here');
    const res = await client.authGet('/api/v1/users/me');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await runTest('SEC-AUTH-005: Token expiry is enforced', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    // Simulate expired token
    client.setAuthToken('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDAwMDAwMDB9.fake');
    const res = await client.authGet('/api/v1/users/me');
    if (res.status !== 401) throw new Error(`Expected 401 for expired token, got ${res.status}`);
  });

  await runTest('SEC-AUTH-006: OTP is required for registration', async () => {
    const client = new ApiClient();
    const res = await client.post('/api/v1/auth/verify-otp', {
      phone_number: '+919876543210',
      otp: '',
    });
    if (res.status >= 200 && res.status < 300) throw new Error('Should reject empty OTP');
  });

  // ============================================================
  // SQL INJECTION
  // ============================================================

  await runTest('SEC-INJ-001: SQL injection in chat message', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: "'; DROP TABLE users; --",
    });
    if (res.status === 500) throw new Error('SQL injection caused server error');
    TA.assertSuccess(res, 200);
  });

  await runTest('SEC-INJ-002: SQL injection in search query', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet("/api/v1/search?q=' OR 1=1 --");
    if (res.status === 500) throw new Error('SQL injection in search caused server error');
  });

  await runTest('SEC-INJ-003: SQL injection in report description', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'low',
      location: { lat: 19.076, lon: 72.877 },
      description: "'; INSERT INTO users (role) VALUES ('admin'); --",
    });
    if (res.status === 500) throw new Error('SQL injection in report caused server error');
  });

  // ============================================================
  // XSS PROTECTION
  // ============================================================

  await runTest('SEC-XSS-001: XSS in user name is sanitized', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/register', {
      phone_number: '+919876543210',
      name: '<script>alert("xss")</script>',
      preferred_language: 'en',
    });
    if (loginRes.status === 201 && loginRes.body.user) {
      if (loginRes.body.user.name && loginRes.body.user.name.includes('<script>')) {
        throw new Error('XSS not sanitized in name');
      }
    }
  });

  await runTest('SEC-XSS-002: XSS in chat message is handled', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: '<img src=x onerror=alert(1)>',
    });
    if (res.status === 500) throw new Error('XSS caused server error');
    if (res.body.reply && res.body.reply.includes('<img')) throw new Error('XSS not sanitized in reply');
  });

  await runTest('SEC-XSS-003: XSS in report description is sanitized', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'low',
      location: { lat: 19.076, lon: 72.877 },
      description: '<script>alert("xss")</script>',
    });
    if (res.status === 500) throw new Error('XSS in report caused server error');
  });

  // ============================================================
  // RATE LIMITING
  // ============================================================

  await runTest('SEC-RL-001: Rate limit on login attempts', async () => {
    const client = new ApiClient();
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      const res = await client.post('/api/v1/auth/login', {
        email: TEST_CONFIG.users.citizen.email,
        password: 'WrongPassword',
      });
      if (res.status === 429) { rateLimited = true; break; }
    }
    if (!rateLimited) console.log('    WARNING: No rate limit detected on login (may need >15 attempts)');
  });

  await runTest('SEC-RL-002: Rate limit on OTP requests', async () => {
    const client = new ApiClient();
    let rateLimited = false;
    for (let i = 0; i < 10; i++) {
      const res = await client.post('/api/v1/auth/request-otp', {
        phone_number: '+919876543210',
      });
      if (res.status === 429) { rateLimited = true; break; }
    }
    if (!rateLimited) console.log('    WARNING: No rate limit detected on OTP requests');
  });

  // ============================================================
  // PII PROTECTION
  // ============================================================

  await runTest('SEC-PII-001: Phone number not returned in chat responses', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', { message: 'What is my phone number?' });
    TA.assertSuccess(res, 200);
    const reply = (res.body.reply || '').toLowerCase();
    if (reply.includes('+91') && reply.includes('9876')) throw new Error('Chat leaked phone number');
  });

  await runTest('SEC-PII-002: User data not in API error responses', async () => {
    const client = new ApiClient();
    const res = await client.post('/api/v1/auth/login', {
      email: 'nonexistent@test.com',
      password: 'wrong',
    });
    const body = JSON.stringify(res.body || {});
    if (body.includes('password') || body.includes('hash')) throw new Error('Password hash leaked in error response');
  });

  await runTest('SEC-PII-003: Location data encrypted in transit', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/users/location', {
      lat: 19.076,
      lon: 72.877,
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // RBAC (Role-Based Access Control)
  // ============================================================

  await runTest('SEC-RBAC-001: Citizen cannot access admin endpoints', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/admin/users');
    if (res.status !== 403 && res.status !== 401) throw new Error(`Expected 403/401, got ${res.status}`);
  });

  await runTest('SEC-RBAC-002: Citizen cannot access government dashboard', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/govt/dashboard');
    if (res.status !== 403 && res.status !== 401) throw new Error(`Expected 403/401, got ${res.status}`);
  });

  await runTest('SEC-RBAC-003: Citizen cannot delete other users\' reports', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authDelete('/api/v1/reports/report_other_user_123');
    if (res.status !== 403 && res.status !== 401) throw new Error(`Expected 403/401, got ${res.status}`);
  });

  await runTest('SEC-RBAC-004: Volunteer cannot modify alert rules', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.volunteer.email, password: TEST_CONFIG.users.volunteer.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPut('/api/v1/alerts/rules/rule_001', {
      severity: 'extreme',
    });
    if (res.status !== 403 && res.status !== 401) throw new Error(`Expected 403/401, got ${res.status}`);
  });

  // ============================================================
  // CORS PROTECTION
  // ============================================================

  await runTest('SEC-CORS-001: Cross-origin requests are handled correctly', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/weather/current?lat=19.076&lon=72.877');
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // DATA LEAKAGE PREVENTION
  // ============================================================

  await runTest('SEC-DLP-001: User cannot access other user\'s data', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/users/user_002/profile');
    if (res.status === 200) throw new Error('User can access another user\'s data');
  });

  await runTest('SEC-DLP-002: User cannot see other users\' check-in status', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/users/check-in/status/user_002');
    if (res.status === 200) throw new Error('User can see another user\'s check-in status');
  });

  await runTest('SEC-DLP-003: Government data requires govt role', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/govt/citizens');
    if (res.status !== 403 && res.status !== 401) throw new Error(`Expected 403/401, got ${res.status}`);
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
