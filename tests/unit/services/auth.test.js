/**
 * Unit Tests - Auth Service
 * Tests: registration, login, OTP, session management, token refresh
 */

const { ApiClient, TestAssertions: TA, TestReporter } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('Auth Service Unit Tests');
const client = new ApiClient();

async function runTests() {
  console.log('\n🔐 Running Auth Service Tests...\n');

  // ============================================================
  // REGISTRATION TESTS
  // ============================================================

  await runTest('REG-001: Register new user with valid phone number', async () => {
    const res = await client.post('/api/v1/users/register', {
      phone: '+919876543999',
      email: 'newuser@test.com',
      password: 'SecurePass123!',
      language: 'en',
    });
    TA.assertSuccess(res, 201);
    TA.assertHasFields(res.body, ['user_id', 'phone', 'created_at']);
    if (res.body.phone !== '+919876543999') throw new Error('Phone number mismatch');
  });

  await runTest('REG-002: Reject registration with duplicate phone', async () => {
    const res = await client.post('/api/v1/users/register', {
      phone: TEST_CONFIG.users.citizen.phone,
      email: 'dup@test.com',
      password: 'SecurePass123!',
    });
    TA.assertError(res, 409);
  });

  await runTest('REG-003: Reject registration with invalid phone format', async () => {
    const res = await client.post('/api/v1/users/register', {
      phone: '12345',
      email: 'test@test.com',
      password: 'SecurePass123!',
    });
    TA.assertError(res, 400);
  });

  await runTest('REG-004: Reject registration with weak password', async () => {
    const res = await client.post('/api/v1/users/register', {
      phone: '+919876543998',
      email: 'weak@test.com',
      password: '123',
    });
    TA.assertError(res, 400);
  });

  await runTest('REG-005: Reject registration with invalid email', async () => {
    const res = await client.post('/api/v1/users/register', {
      phone: '+919876543997',
      email: 'not-an-email',
      password: 'SecurePass123!',
    });
    TA.assertError(res, 400);
  });

  await runTest('REG-006: Register with valid Indian phone formats', async () => {
    const formats = ['+919876543996', '+918765432995', '+917654321994'];
    for (const phone of formats) {
      const res = await client.post('/api/v1/users/register', {
        phone,
        email: `user${Date.now()}@test.com`,
        password: 'SecurePass123!',
      });
      TA.assertSuccess(res, 201);
    }
  });

  await runTest('REG-007: Register with language preference', async () => {
    const res = await client.post('/api/v1/users/register', {
      phone: '+919876543993',
      email: 'hindi@test.com',
      password: 'SecurePass123!',
      language: 'hi',
    });
    TA.assertSuccess(res, 201);
    if (res.body.language !== 'hi') throw new Error('Language preference not saved');
  });

  await runTest('REG-008: Reject registration with missing required fields', async () => {
    const res = await client.post('/api/v1/users/register', {
      phone: '+919876543992',
    });
    TA.assertError(res, 400);
  });

  // ============================================================
  // OTP VERIFICATION TESTS
  // ============================================================

  await runTest('OTP-001: Send OTP to valid phone number', async () => {
    const res = await client.post('/api/v1/auth/send-otp', {
      phone: '+919876543999',
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['otp_id', 'expires_in']);
  });

  await runTest('OTP-002: Verify correct OTP', async () => {
    const res = await client.post('/api/v1/auth/verify-otp', {
      phone: '+919876543999',
      otp: '123456', // Test OTP in staging
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['token', 'refresh_token']);
  });

  await runTest('OTP-003: Reject incorrect OTP', async () => {
    const res = await client.post('/api/v1/auth/verify-otp', {
      phone: '+919876543999',
      otp: '000000',
    });
    TA.assertError(res, 401);
  });

  await runTest('OTP-004: Reject expired OTP', async () => {
    const res = await client.post('/api/v1/auth/verify-otp', {
      phone: '+919876543999',
      otp: '123456',
      force_expired: true,
    });
    TA.assertError(res, 401);
  });

  await runTest('OTP-005: Rate limit OTP requests (max 3 per 5 min)', async () => {
    for (let i = 0; i < 4; i++) {
      await client.post('/api/v1/auth/send-otp', { phone: '+919876543991' });
    }
    const res = await client.post('/api/v1/auth/send-otp', {
      phone: '+919876543991',
    });
    TA.assertError(res, 429);
  });

  // ============================================================
  // LOGIN TESTS
  // ============================================================

  await runTest('LOGIN-001: Login with valid credentials', async () => {
    const res = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['token', 'refresh_token', 'user']);
    if (!res.body.token) throw new Error('No token returned');
  });

  await runTest('LOGIN-002: Reject login with wrong password', async () => {
    const res = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: 'WrongPassword123!',
    });
    TA.assertError(res, 401);
  });

  await runTest('LOGIN-003: Reject login with non-existent email', async () => {
    const res = await client.post('/api/v1/auth/login', {
      email: 'nonexistent@test.com',
      password: 'SecurePass123!',
    });
    TA.assertError(res, 401);
  });

  await runTest('LOGIN-004: Reject login with empty credentials', async () => {
    const res = await client.post('/api/v1/auth/login', {
      email: '',
      password: '',
    });
    TA.assertError(res, 400);
  });

  // ============================================================
  // TOKEN MANAGEMENT TESTS
  // ============================================================

  await runTest('TOKEN-001: Access protected route with valid token', async () => {
    const { body } = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(body.token);
    const res = await client.authGet('/api/v1/users/profile');
    TA.assertSuccess(res, 200);
  });

  await runTest('TOKEN-002: Reject access with expired token', async () => {
    client.setAuthToken('expired.test.token');
    const res = await client.authGet('/api/v1/users/profile');
    TA.assertError(res, 401);
  });

  await runTest('TOKEN-003: Reject access without token', async () => {
    const unauthClient = new ApiClient();
    const res = await unauthClient.get('/api/v1/users/profile');
    TA.assertError(res, 401);
  });

  await runTest('TOKEN-004: Refresh token successfully', async () => {
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    const res = await client.post('/api/v1/auth/refresh-token', {
      refresh_token: loginRes.body.refresh_token,
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['token']);
  });

  await runTest('TOKEN-005: Reject expired refresh token', async () => {
    const res = await client.post('/api/v1/auth/refresh-token', {
      refresh_token: 'expired_refresh_token',
    });
    TA.assertError(res, 401);
  });

  // ============================================================
  // SESSION MANAGEMENT TESTS
  // ============================================================

  await runTest('SESSION-001: Create session on login', async () => {
    const res = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    TA.assertHasFields(res.body, ['session_id']);
  });

  await runTest('SESSION-002: Invalidate session on logout', async () => {
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);
    const logoutRes = await client.authPost('/api/v1/auth/logout', {});
    TA.assertSuccess(logoutRes, 200);

    // Verify token is invalidated
    const profileRes = await client.authGet('/api/v1/users/profile');
    TA.assertError(profileRes, 401);
  });

  await runTest('SESSION-003: Concurrent sessions from multiple devices', async () => {
    const client1 = new ApiClient();
    const client2 = new ApiClient();
    const res1 = await client1.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    const res2 = await client2.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    // Both should succeed
    TA.assertSuccess(res1, 200);
    TA.assertSuccess(res2, 200);
  });

  // ============================================================
  // BIOMETRIC AUTH TESTS
  // ============================================================

  await runTest('BIO-001: Register biometric credential', async () => {
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/auth/biometric/register', {
      biometric_type: 'fingerprint',
      credential: 'test_credential_data',
    });
    TA.assertSuccess(res, 201);
  });

  await runTest('BIO-002: Authenticate with biometric', async () => {
    const res = await client.post('/api/v1/auth/biometric/authenticate', {
      biometric_type: 'fingerprint',
      credential: 'test_credential_data',
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['token']);
  });

  // Helper
  async function runTest(name, fn) {
    const start = Date.now();
    try {
      await fn();
      reporter.record(name, true, Date.now() - start);
    } catch (err) {
      reporter.record(name, false, Date.now() - start, err);
    }
  }

  return reporter.summary();
}

module.exports = { runTests };
if (require.main === module) runTests();
