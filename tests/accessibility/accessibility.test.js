/**
 * Accessibility Tests
 * Tests: Screen reader compatibility, color contrast, keyboard nav, RTL, ARIA, zoom, voice
 */

const { ApiClient, TestAssertions: TA, TestReporter, MockDB } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('Accessibility Tests');

async function runTests() {
  console.log('\n♿ Running Accessibility Tests...\n');

  // ============================================================
  // SCREEN COMPATIBILITY (API RESPONSES)
  // ============================================================

  await runTest('A11Y-001: Chat response supports plain text mode', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'How to prepare for flood?',
      response_format: 'plain_text',
    });
    TA.assertSuccess(res, 200);
    if (res.body.reply && res.body.reply.includes('<')) {
      throw new Error('Plain text response contains HTML tags');
    }
  });

  await runTest('A11Y-002: Chat response supports structured format for screen readers', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'How to prepare for flood?',
      response_format: 'structured',
    });
    TA.assertSuccess(res, 200);
    TA.assertHasField(res.body, 'reply');
  });

  await runTest('A11Y-003: Alert text is descriptive (not just icon)', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/alerts/active?lat=19.076&lon=72.877');
    TA.assertSuccess(res, 200);
    if (res.body.alerts) {
      for (const alert of res.body.alerts) {
        if (!alert.title || alert.title.length < 5) throw new Error(`Alert missing descriptive title: ${JSON.stringify(alert)}`);
        if (!alert.description || alert.description.length < 10) throw new Error(`Alert missing descriptive text: ${JSON.stringify(alert)}`);
      }
    }
  });

  // ============================================================
  // KEYBOARD NAVIGATION (API-FRIENDLY TESTS)
  // ============================================================

  await runTest('A11Y-004: API supports keyboard-triggered SOS', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/sos/activate', {
      emergency_type: 'medical',
      method: 'keyboard_shortcut',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('A11Y-005: API supports voice SOS activation', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/sos/activate', {
      emergency_type: 'flood',
      method: 'voice',
      voice_command: 'help me',
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // MULTILINGUAL & RTL
  // ============================================================

  await runTest('A11Y-006: Chat supports Hindi responses', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'बाढ़ की तैयारी कैसे करें?',
      preferred_language: 'hi',
    });
    TA.assertSuccess(res, 200);
    TA.assertNotEmpty(res.body.reply);
  });

  await runTest('A11Y-007: Chat supports Bengali responses', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'বন্যার প্রস্তুতি কীভাবে করব?',
      preferred_language: 'bn',
    });
    TA.assertSuccess(res, 200);
    TA.assertNotEmpty(res.body.reply);
  });

  await runTest('A11Y-008: Chat supports Marathi responses', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'पावसाळ्यात काय तयार करावे?',
      preferred_language: 'mr',
    });
    TA.assertSuccess(res, 200);
    TA.assertNotEmpty(res.body.reply);
  });

  await runTest('A11Y-009: Chat supports Tamil responses', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'வெள்ளத்திற்கு எப்படி தயாரிப்பது?',
      preferred_language: 'ta',
    });
    TA.assertSuccess(res, 200);
    TA.assertNotEmpty(res.body.reply);
  });

  // ============================================================
  // VOICE INTERFACE
  // ============================================================

  await runTest('A11Y-010: Voice input API accepts audio transcript', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat/voice', {
      transcript: 'What should I do during flood?',
      language: 'en',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('A11Y-011: Voice input supports Hindi transcript', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat/voice', {
      transcript: 'बाढ़ में क्या करना चाहिए',
      language: 'hi',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('A11Y-012: Voice output available for all chat responses', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'How to prepare for flood?',
      include_audio: true,
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // COLOR & VISUAL ACCESSIBILITY
  // ============================================================

  await runTest('A11Y-013: API provides accessibility metadata for alerts', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/alerts/active?lat=19.076&lon=72.877');
    TA.assertSuccess(res, 200);
    if (res.body.alerts) {
      for (const alert of res.body.alerts) {
        if (!alert.severity_level) throw new Error('Alert missing severity_level metadata');
        if (!alert.severity_label) throw new Error('Alert missing text severity_label');
      }
    }
  });

  await runTest('A11Y-014: High contrast mode flag accepted in preferences', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPut('/api/v1/users/preferences', {
      high_contrast_mode: true,
      large_text: true,
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('A11Y-015: Large text mode flag accepted in preferences', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPut('/api/v1/users/preferences', {
      large_text: true,
      font_size: 'large',
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // REDUCED MOTION
  // ============================================================

  await runTest('A11Y-016: Reduced motion preference accepted', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPut('/api/v1/users/preferences', {
      reduce_motion: true,
      animations_disabled: true,
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // OFFLINE & LOW BANDWIDTH
  // ============================================================

  await runTest('A11Y-017: SMS fallback works without internet', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/alerts/send-sms', {
      phone_number: '+919876543210',
      message: 'Test SMS fallback',
      channel: 'sms',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('A11Y-018: USSD menu accessible without smartphone', async () => {
    const client = new ApiClient();
    const res = await client.post('/api/v1/ussd/menu', {
      phone_number: '+919876543210',
      menu_id: 'main',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('A11Y-019: API responses include compressed option', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.citizen.email, password: TEST_CONFIG.users.citizen.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authGet('/api/v1/weather/current?lat=19.076&lon=72.877&compressed=true');
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // ELDERLY-FRIENDLY
  // ============================================================

  await runTest('A11Y-020: Simple language mode for elderly users', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', { email: TEST_CONFIG.users.senior.email, password: TEST_CONFIG.users.senior.password });
    client.setAuthToken(loginRes.body.token);
    const res = await client.authPost('/api/v1/chat', {
      message: 'What should I do?',
      language_level: 'simple',
    });
    TA.assertSuccess(res, 200);
    const reply = (res.body.reply || '').toLowerCase();
    const complexWords = ['meteorological', 'precipitation', 'infrastructure', 'evacuation'];
    const hasComplex = complexWords.some(w => reply.includes(w));
    if (hasComplex) throw new Error('Response contains complex words in simple mode');
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
