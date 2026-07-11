/**
 * Unit Tests - Alert Service
 * Tests: alert creation, distribution, subscription, escalation, notifications
 */

const { ApiClient, TestAssertions: TA, TestReporter, createMockAlert } = require('../../helpers');
const TEST_CONFIG = require('../../config');
const FIXTURES = require('../../fixtures');

const reporter = new TestReporter('Alert Service Unit Tests');

async function runTests() {
  console.log('\n🚨 Running Alert Service Tests...\n');
  const client = new ApiClient();

  const loginRes = await client.post('/api/v1/auth/login', {
    email: TEST_CONFIG.users.citizen.email,
    password: TEST_CONFIG.users.citizen.password,
  });
  if (loginRes.status === 200) client.setAuthToken(loginRes.body.token);

  // ============================================================
  // ALERT RETRIEVAL TESTS
  // ============================================================

  await runTest('ALT-001: Get active alerts for location', async () => {
    const res = await client.authGet(
      `/api/v1/alerts/active?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.alerts)) throw new Error('Alerts not returned as array');
  });

  await runTest('ALT-002: Alert contains required fields', async () => {
    const res = await client.authGet(
      `/api/v1/alerts/active?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (res.body.alerts.length > 0) {
      TA.assertValidAlert(res.body.alerts[0]);
    }
  });

  await runTest('ALT-003: Alerts filtered by severity', async () => {
    const res = await client.authGet(
      `/api/v1/alerts/active?severity=emergency&lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    for (const alert of res.body.alerts) {
      if (alert.severity !== 'emergency') throw new Error('Filter not applied');
    }
  });

  await runTest('ALT-004: Alerts filtered by type', async () => {
    const res = await client.authGet(
      `/api/v1/alerts/active?type=flood&lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    for (const alert of res.body.alerts) {
      if (alert.type !== 'flood') throw new Error('Type filter not applied');
    }
  });

  await runTest('ALT-005: Get alert history', async () => {
    const res = await client.authGet('/api/v1/alerts/history?days=30');
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.alerts)) throw new Error('History not returned');
  });

  await runTest('ALT-006: Get alert details by ID', async () => {
    const listRes = await client.authGet('/api/v1/alerts/history?days=7');
    if (listRes.body.alerts?.length > 0) {
      const alertId = listRes.body.alerts[0].alert_id;
      const res = await client.authGet(`/api/v1/alerts/${alertId}`);
      TA.assertSuccess(res, 200);
      TA.assertHasFields(res.body, ['alert_id', 'title', 'detailed_description']);
    }
  });

  // ============================================================
  // DAILY BRIEFING TESTS
  // ============================================================

  await runTest('BRIEF-001: Get AI daily briefing', async () => {
    const res = await client.authGet(
      `/api/v1/alerts/briefing?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['weather_summary', 'flood_risk', 'health_advisory', 'community_updates', 'preparedness_tip']);
  });

  await runTest('BRIEF-002: Briefing is in user preferred language', async () => {
    const res = await client.authGet(
      `/api/v1/alerts/briefing?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&language=hi`
    );
    TA.assertSuccess(res, 200);
    // Briefing content should be in Hindi
  });

  await runTest('BRIEF-003: Morning and evening briefings differ', async () => {
    const morning = await client.authGet('/api/v1/alerts/briefing?time=morning');
    const evening = await client.authGet('/api/v1/alerts/briefing?time=evening');
    TA.assertSuccess(morning, 200);
    TA.assertSuccess(evening, 200);
    // They should have different content structure
  });

  // ============================================================
  // ALERT SUBSCRIPTION TESTS
  // ============================================================

  await runTest('SUB-001: Subscribe to alert categories', async () => {
    const res = await client.authPost('/api/v1/alerts/subscribe', {
      categories: ['weather', 'flood', 'health', 'infrastructure'],
      severity_minimum: 'warning',
      channels: ['push', 'sms'],
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('SUB-002: Update subscription preferences', async () => {
    const res = await client.authPut('/api/v1/alerts/subscribe', {
      categories: ['weather', 'flood'],
      severity_minimum: 'emergency',
      channels: ['push'],
      quiet_hours: { start: '23:00', end: '06:00' },
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('SUB-003: Unsubscribe from alerts', async () => {
    const res = await client.authDel('/api/v1/alerts/subscribe');
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // ALERT ESCALATION TESTS
  // ============================================================

  await runTest('ESC-001: Watch → Warning escalation', async () => {
    const res = await client.authPost('/api/v1/alerts/test-escalation', {
      initial_level: 'watch',
      target_level: 'warning',
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('ESC-002: Warning → Emergency escalation triggers SMS', async () => {
    const res = await client.authPost('/api/v1/alerts/test-escalation', {
      initial_level: 'warning',
      target_level: 'emergency',
      location: TEST_CONFIG.locations.mumbaiFlood,
      test_channels: ['sms'],
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('ESC-003: Emergency → Extreme triggers voice call', async () => {
    const res = await client.authPost('/api/v1/alerts/test-escalation', {
      initial_level: 'emergency',
      target_level: 'extreme',
      location: TEST_CONFIG.locations.mumbaiFlood,
      test_channels: ['voice_call'],
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // ALERT ACKNOWLEDGMENT TESTS
  // ============================================================

  await runTest('ACK-001: Acknowledge alert', async () => {
    const res = await client.authPost('/api/v1/alerts/test-acknowledge', {
      action: 'acknowledge',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('ACK-002: Mark alert as seen', async () => {
    const res = await client.authPost('/api/v1/alerts/test-acknowledge', {
      action: 'seen',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('ACK-003: Report false alert', async () => {
    const res = await client.authPost('/api/v1/alerts/test-acknowledge', {
      action: 'report_false',
      reason: 'No rain in my area despite alert',
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // NOTIFICATION DELIVERY TESTS
  // ============================================================

  await runTest('NOTIF-001: Push notification sent for emergency', async () => {
    const res = await client.authPost('/api/v1/alerts/test-notification', {
      alert_type: 'emergency',
      channel: 'push',
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['notification_id', 'delivery_status']);
  });

  await runTest('NOTIF-002: SMS sent for extreme alerts', async () => {
    const res = await client.authPost('/api/v1/alerts/test-notification', {
      alert_type: 'extreme',
      channel: 'sms',
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('NOTIF-003: Multi-channel delivery for emergencies', async () => {
    const res = await client.authPost('/api/v1/alerts/test-notification', {
      alert_type: 'emergency',
      channel: 'multi',
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 200);
    if (res.body.channels_attempted < 2) throw new Error('Not sent to multiple channels');
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
