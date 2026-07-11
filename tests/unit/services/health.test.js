/**
 * Unit Tests - Health Service
 * Tests: disease alerts, mosquito prevention, water quality, medicine reminders
 */

const { ApiClient, TestAssertions: TA, TestReporter } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('Health Service Unit Tests');

async function runTests() {
  console.log('\n🏥 Running Health Service Tests...\n');
  const client = new ApiClient();

  const loginRes = await client.post('/api/v1/auth/login', {
    email: TEST_CONFIG.users.citizen.email,
    password: TEST_CONFIG.users.citizen.password,
  });
  if (loginRes.status === 200) client.setAuthToken(loginRes.body.token);

  // Disease Outbreak Alerts
  await runTest('HLT-001: Get disease outbreak alerts for location', async () => {
    const res = await client.authGet(
      `/api/v1/health/disease-alerts?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.alerts)) throw new Error('Alerts not returned as array');
  });

  await runTest('HLT-002: Disease alert contains required fields', async () => {
    const res = await client.authGet(
      `/api/v1/health/disease-alerts?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (res.body.alerts.length > 0) {
      TA.assertHasFields(res.body.alerts[0], ['disease', 'risk_level', 'cases', 'prevention_steps']);
    }
  });

  await runTest('HLT-003: Get dengue-specific alert', async () => {
    const res = await client.authGet(
      `/api/v1/health/disease-alerts?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&disease=dengue`
    );
    TA.assertSuccess(res, 200);
  });

  // Water Quality
  await runTest('HLT-004: Get water quality status', async () => {
    const res = await client.authGet(
      `/api/v1/health/water-quality?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['status', 'contamination_type', 'safe_sources', 'purification_methods']);
  });

  await runTest('HLT-005: Water quality includes purification guidance', async () => {
    const res = await client.authGet(
      `/api/v1/health/water-quality?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!res.body.purification_methods || res.body.purification_methods.length === 0) {
      throw new Error('No purification methods');
    }
  });

  // Mosquito Prevention
  await runTest('HLT-006: Get mosquito breeding risk level', async () => {
    const res = await client.authGet(
      `/api/v1/health/mosquito-risk?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['risk_level', 'breeding_sites', 'prevention_schedule']);
  });

  await runTest('HLT-007: Mosquito risk considers waterlogging', async () => {
    const res = await client.authGet(
      `/api/v1/health/mosquito-risk?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&waterlogging=high`
    );
    TA.assertSuccess(res, 200);
    if (res.body.risk_level === 'low') throw new Error('Risk should be elevated with waterlogging');
  });

  await runTest('HLT-008: Personalized mosquito prevention for child', async () => {
    const res = await client.authGet(
      `/api/v1/health/mosquito-risk?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&age=10`
    );
    TA.assertSuccess(res, 200);
    if (res.body.prevention_schedule?.age_appropriate === false) {
      throw new Error('Prevention not age-appropriate');
    }
  });

  // Medicine Reminder
  await runTest('HLT-009: Set medicine reminder', async () => {
    const res = await client.authPost('/api/v1/health/medicine-reminder', {
      medicine_name: 'Metformin',
      dosage: '500mg',
      frequency: 'twice_daily',
      times: ['08:00', '20:00'],
      refill_check: true,
    });
    TA.assertSuccess(res, 201);
    TA.assertHasFields(res.body, ['reminder_id']);
  });

  await runTest('HLT-010: Get medicine reminders', async () => {
    const res = await client.authGet('/api/v1/health/medicine-reminder');
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.reminders)) throw new Error('Reminders not returned as array');
  });

  await runTest('HLT-011: Delete medicine reminder', async () => {
    const createRes = await client.authPost('/api/v1/health/medicine-reminder', {
      medicine_name: 'Test Medicine',
      dosage: '100mg',
      frequency: 'once_daily',
      times: ['09:00'],
    });
    if (createRes.status === 201) {
      const res = await client.authDel(`/api/v1/health/medicine-reminder/${createRes.body.reminder_id}`);
      TA.assertSuccess(res, 200);
    }
  });

  await runTest('HLT-012: Check insulin storage during power outage', async () => {
    const res = await client.authPost('/api/v1/health/medicine-storage', {
      medicine: 'insulin',
      power_outage: true,
      duration_hours: 12,
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['storage_safe', 'alternatives', 'time_limit']);
  });

  // Telemedicine
  await runTest('HLT-013: Find telemedicine service', async () => {
    const res = await client.authGet(
      `/api/v1/health/telemedicine?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
  });

  // Blood Bank
  await runTest('HLT-014: Find blood bank availability', async () => {
    const res = await client.authGet(
      `/api/v1/health/blood-bank?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&blood_type=O+`
    );
    TA.assertSuccess(res, 200);
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
