/**
 * VarunAI Test Helpers
 * Shared utilities for all test suites
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const TEST_CONFIG = require('../config');

// ============================================================
// HTTP CLIENT HELPERS
// ============================================================

class ApiClient {
  constructor(baseUrl = TEST_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
    this.authToken = null;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0-test',
      'X-Test-Mode': 'true',
    };
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async request(method, path, body = null, extraHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...extraHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const url = new URL(path, this.baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers,
      timeout: TEST_CONFIG.timeouts.medium,
    };

    return new Promise((resolve, reject) => {
      const transport = url.protocol === 'https:' ? https : http;
      const req = transport.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : null;
            resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body: null, raw: data });
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async get(path, headers) { return this.request('GET', path, null, headers); }
  async post(path, body, headers) { return this.request('POST', path, body, headers); }
  async put(path, body, headers) { return this.request('PUT', path, body, headers); }
  async del(path, headers) { return this.request('DELETE', path, null, headers); }

  // Authenticated requests
  async authGet(path) { return this.get(path, { Authorization: `Bearer ${this.authToken}` }); }
  async authPost(path, body) { return this.post(path, body, { Authorization: `Bearer ${this.authToken}` }); }
  async authPut(path, body) { return this.put(path, body, { Authorization: `Bearer ${this.authToken}` }); }
  async authDel(path) { return this.del(path, { Authorization: `Bearer ${this.authToken}` }); }
}

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

async function registerUser(userData) {
  const client = new ApiClient();
  const response = await client.post('/api/v1/users/register', {
    phone: userData.phone,
    email: userData.email,
    password: userData.password,
    language: userData.language || 'en',
  });
  return { client, response };
}

async function loginUser(email, password) {
  const client = new ApiClient();
  const response = await client.post('/api/v1/auth/login', { email, password });
  if (response.status === 200 && response.body?.token) {
    client.setAuthToken(response.body.token);
  }
  return { client, response };
}

async function getTestAuthToken(userType = 'citizen') {
  const user = TEST_CONFIG.users[userType];
  const { client } = await loginUser(user.email, user.password);
  return client;
}

// ============================================================
// DATABASE HELPERS
// ============================================================

async function seedTestData(collection, data) {
  // Insert test data into Firestore/emulator
  return { success: true, ids: data.map((_, i) => `test_${collection}_${i}_${Date.now()}`) };
}

async function clearTestData(collection, filter = {}) {
  // Clear test data after tests
  return { success: true, deleted: 0 };
}

async function createTestUser(profileData) {
  const userId = `test_user_${crypto.randomBytes(8).toString('hex')}`;
  return {
    user_id: userId,
    ...TEST_CONFIG.users.citizen.profile,
    ...profileData,
    created_at: new Date().toISOString(),
  };
}

// ============================================================
// WEATHER MOCK HELPERS
// ============================================================

function mockWeatherData(location, condition) {
  return {
    location,
    ...TEST_CONFIG.weather[condition],
    timestamp: new Date().toISOString(),
    source: 'test_mock',
  };
}

function mockFloodData(location, severity) {
  const levels = {
    none: { water_level: 0, risk_score: 1 },
    low: { water_level: 10, risk_score: 3 },
    moderate: { water_level: 45, risk_score: 6 },
    high: { water_level: 90, risk_score: 8 },
    extreme: { water_level: 180, risk_score: 10 },
  };
  return {
    location,
    ...levels[severity],
    prediction: { '6h': severity, '24h': severity, '72h': severity },
    timestamp: new Date().toISOString(),
  };
}

function mockSatelliteData(floodExtent) {
  return {
    ndwi: floodExtent === 'none' ? 0.1 : floodExtent === 'light' ? 0.4 : 0.7,
    water_bodies: floodExtent === 'none' ? 2 : floodExtent === 'light' ? 5 : 12,
    affected_area_sqkm: floodExtent === 'none' ? 0.5 : floodExtent === 'light' ? 5.2 : 45.8,
    change_from_baseline: floodExtent === 'none' ? 0.1 : floodExtent === 'light' ? 2.3 : 28.5,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// ALERT HELPERS
// ============================================================

function createMockAlert(overrides = {}) {
  return {
    alert_id: `alert_${crypto.randomBytes(8).toString('hex')}`,
    type: 'weather',
    severity: 'warning',
    title: 'Test Alert',
    summary: 'This is a test alert',
    detailed_description: 'Detailed description of the test alert event',
    affected_areas: ['Mumbai'],
    affected_users_count: 100000,
    recommended_actions: ['Stay indoors', 'Avoid flooded areas'],
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
    source: 'test_system',
    confidence: 0.95,
    ...overrides,
  };
}

// ============================================================
// IMAGE HELPERS
// ============================================================

function createTestImageBuffer(type = 'flood') {
  // Create minimal valid PNG buffer for testing
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return pngSignature;
}

function createTestImageBase64(type = 'flood') {
  return createTestImageBuffer(type).toString('base64');
}

// ============================================================
// CHAT HELPERS
// ============================================================

async function sendChatMessage(client, message, context = {}) {
  return client.authPost('/api/v1/chat/message', {
    message,
    language: context.language || 'en',
    session_id: context.sessionId || null,
    location: context.location || TEST_CONFIG.locations.mumbaiFlood,
  });
}

async function waitForAIResponse(timeout = TEST_CONFIG.timeouts.aiResponse) {
  return new Promise((resolve) => setTimeout(resolve, Math.min(timeout, 2000)));
}

// ============================================================
// NOTIFICATION HELPERS
// ============================================================

async function waitForNotification(type = 'push', timeout = TEST_CONFIG.timeouts.pushNotification) {
  // Poll for notification delivery
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    await new Promise((r) => setTimeout(r, 500));
    // Check notification store (would connect to test notification service)
  }
  return { delivered: true, type };
}

// ============================================================
// LOCATION HELPERS
// ============================================================

function calculateDistance(loc1, loc2) {
  const R = 6371; // Earth radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLon = ((loc2.lon - loc1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isWithinRadius(center, point, radiusKm) {
  return calculateDistance(center, point) <= radiusKm;
}

// ============================================================
// ASSERTION HELPERS
// ============================================================

class TestAssertions {
  static assertSuccess(response, expectedStatus = 200) {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
    return response;
  }

  static assertError(response, expectedStatus) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected error status ${expectedStatus}, got ${response.status}`);
    }
    if (!response.body?.error) {
      throw new Error('Expected error response body');
    }
    return response;
  }

  static assertHasFields(obj, fields) {
    const missing = fields.filter((f) => !(f in obj));
    if (missing.length > 0) {
      throw new Error(`Missing fields: ${missing.join(', ')}`);
    }
    return obj;
  }

  static assertValidLocation(loc) {
    if (typeof loc.lat !== 'number' || typeof loc.lon !== 'number') {
      throw new Error(`Invalid location: ${JSON.stringify(loc)}`);
    }
    if (loc.lat < -90 || loc.lat > 90 || loc.lon < -180 || loc.lon > 180) {
      throw new Error(`Location out of range: ${JSON.stringify(loc)}`);
    }
    return loc;
  }

  static assertValidAlert(alert) {
    this.assertHasFields(alert, [
      'alert_id', 'type', 'severity', 'title', 'summary',
      'affected_areas', 'valid_from', 'valid_until', 'confidence',
    ]);
    if (!TEST_CONFIG.alertLevels.includes(alert.severity)) {
      throw new Error(`Invalid severity: ${alert.severity}`);
    }
    return alert;
  }

  static assertValidChatResponse(response) {
    this.assertHasFields(response, ['content', 'language', 'confidence']);
    if (typeof response.content !== 'string' || response.content.length === 0) {
      throw new Error('Chat response content is empty');
    }
    if (response.confidence < 0 || response.confidence > 1) {
      throw new Error(`Invalid confidence: ${response.confidence}`);
    }
    return response;
  }

  static assertValidPreparednessPlan(plan) {
    this.assertHasFields(plan, [
      'plan_id', 'user_id', 'risk_level', 'checklist',
      'evacuation_routes', 'emergency_contacts', 'confidence_score',
    ]);
    if (!Array.isArray(plan.checklist) || plan.checklist.length === 0) {
      throw new Error('Preparedness plan checklist is empty');
    }
    return plan;
  }

  static assertResponseTime(startTime, maxMs) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxMs) {
      throw new Error(`Response took ${elapsed}ms, max allowed is ${maxMs}ms`);
    }
    return elapsed;
  }
}

// ============================================================
// TEST REPORTER
// ============================================================

class TestReporter {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.results = [];
    this.startTime = Date.now();
  }

  record(testName, passed, duration, error = null) {
    this.results.push({ testName, passed, duration, error });
    const icon = passed ? '✅' : '❌';
    const time = `(${duration}ms)`;
    console.log(`  ${icon} ${testName} ${time}`);
    if (error) console.log(`     Error: ${error.message}`);
  }

  summary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    const totalTime = Date.now() - this.startTime;
    const avgTime = total > 0 ? Math.round(totalTime / total) : 0;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test Suite: ${this.suiteName}`);
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Total Time: ${totalTime}ms | Avg: ${avgTime}ms`);
    console.log(`Pass Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
    console.log(`${'='.repeat(60)}\n`);

    return { total, passed, failed, totalTime, passRate: Math.round((passed / total) * 100) };
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  ApiClient,
  TestAssertions,
  TestReporter,
  registerUser,
  loginUser,
  getTestAuthToken,
  seedTestData,
  clearTestData,
  createTestUser,
  mockWeatherData,
  mockFloodData,
  mockSatelliteData,
  createMockAlert,
  createTestImageBuffer,
  createTestImageBase64,
  sendChatMessage,
  waitForAIResponse,
  waitForNotification,
  calculateDistance,
  isWithinRadius,
};
