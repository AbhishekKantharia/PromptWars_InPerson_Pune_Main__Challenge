/**
 * Unit Tests - User Service
 * Tests: profile CRUD, family management, preparedness plans, preferences
 */

const { ApiClient, TestAssertions: TA, TestReporter } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('User Service Unit Tests');

async function runTests() {
  console.log('\n👤 Running User Service Tests...\n');
  const client = new ApiClient();

  // Login first
  const loginRes = await client.post('/api/v1/auth/login', {
    email: TEST_CONFIG.users.citizen.email,
    password: TEST_CONFIG.users.citizen.password,
  });
  if (loginRes.status === 200) client.setAuthToken(loginRes.body.token);

  // ============================================================
  // PROFILE TESTS
  // ============================================================

  await runTest('USR-001: Get user profile', async () => {
    const res = await client.authGet('/api/v1/users/profile');
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['user_id', 'name', 'phone', 'email', 'language', 'location']);
  });

  await runTest('USR-002: Update profile with valid data', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      name: 'Priya Sharma Updated',
      language: 'hi',
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 200);
    if (res.body.name !== 'Priya Sharma Updated') throw new Error('Name not updated');
  });

  await runTest('USR-003: Reject profile update with invalid age', async () => {
    const res = await client.authPut('/api/v1/users/profile', { age: -5 });
    TA.assertError(res, 400);
  });

  await runTest('USR-004: Update medical conditions', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      medical_conditions: ['pregnancy_7months', 'gestational_diabetes'],
    });
    TA.assertSuccess(res, 200);
    if (!res.body.medical_conditions.includes('pregnancy_7months')) {
      throw new Error('Medical condition not saved');
    }
  });

  await runTest('USR-005: Update home type and floor', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      home_type: 'apartment',
      floor: 1,
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('USR-006: Update disability information', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      disabilities: ['mobility'],
      accessibility_needs: ['wheelchair_accessible_shelter'],
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('USR-007: Update pet information', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      has_pet: true,
      pet_types: ['dog', 'cat'],
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('USR-008: Update vehicle information', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      has_vehicle: true,
      vehicle_type: 'car',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('USR-009: Update income bracket', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      income_bracket: 'MIG',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('USR-010: Update language preference', async () => {
    const res = await client.authPut('/api/v1/users/profile', {
      language: 'mr',
      preferred_script: 'Devanagari',
    });
    TA.assertSuccess(res, 200);
    if (res.body.language !== 'mr') throw new Error('Language not updated');
  });

  // ============================================================
  // FAMILY MANAGEMENT TESTS
  // ============================================================

  let familyId;

  await runTest('FAM-001: Create family group', async () => {
    const res = await client.authPost('/api/v1/users/family', {
      family_name: 'Sharma Family',
      members: [
        { name: 'Rahul', age: 34, relationship: 'husband' },
        { name: 'Ananya', age: 10, relationship: 'daughter' },
      ],
    });
    TA.assertSuccess(res, 201);
    TA.assertHasFields(res.body, ['family_id']);
    familyId = res.body.family_id;
  });

  await runTest('FAM-002: Get family details', async () => {
    const res = await client.authGet(`/api/v1/users/family/${familyId}`);
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['family_name', 'members']);
    if (res.body.members.length < 2) throw new Error('Family members not returned');
  });

  await runTest('FAM-003: Add family member', async () => {
    const res = await client.authPost(`/api/v1/users/family/${familyId}/members`, {
      name: 'Grandma',
      age: 65,
      relationship: 'mother',
      medical_conditions: ['hypertension'],
      disabilities: ['mobility'],
    });
    TA.assertSuccess(res, 201);
  });

  await runTest('FAM-004: Update family member', async () => {
    const res = await client.authPut(`/api/v1/users/family/${familyId}/members/member_001`, {
      medical_conditions: ['hypertension', 'diabetes'],
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('FAM-005: Remove family member', async () => {
    const res = await client.authDel(`/api/v1/users/family/${familyId}/members/member_002`);
    TA.assertSuccess(res, 200);
  });

  await runTest('FAM-006: Set communication plan', async () => {
    const res = await client.authPut(`/api/v1/users/family/${familyId}/communication-plan`, {
      primary_contact: { name: 'Rahul', phone: '+919876543210' },
      secondary_contact: { name: 'Neighbor', phone: '+919876543220' },
      tertiary_contact: { name: 'Local Police', phone: '100' },
      meeting_points: [
        { name: 'Local School', priority: 1 },
        { name: 'Community Hall', priority: 2 },
      ],
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('FAM-007: Set family emergency roles', async () => {
    const res = await client.authPut(`/api/v1/users/family/${familyId}/roles`, {
      evacuation_leader: 'Rahul',
      medical_responder: 'Priya',
      child_supervisor: 'Priya',
      document_guardian: 'Rahul',
      pet_handler: 'Ananya',
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // PREPAREDNESS PLAN TESTS
  // ============================================================

  await runTest('PREP-001: Generate personalized preparedness plan', async () => {
    const res = await client.authPost('/api/v1/users/preparedness-plan/generate', {
      location: TEST_CONFIG.locations.mumbaiFlood,
      force_refresh: true,
    });
    TA.assertSuccess(res, 200);
    TA.assertValidPreparednessPlan(res.body);
  });

  await runTest('PREP-002: Plan includes medical-specific items for pregnant user', async () => {
    const res = await client.authPost('/api/v1/users/preparedness-plan/generate', {
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 200);
    const medicalItems = res.body.checklist.filter(
      (item) => item.category === 'medical' || item.category === 'maternity'
    );
    if (medicalItems.length === 0) throw new Error('No medical items in plan');
  });

  await runTest('PREP-003: Plan includes evacuation route with accessibility', async () => {
    const res = await client.authGet('/api/v1/users/preparedness-plan');
    TA.assertSuccess(res, 200);
    if (!res.body.evacuation_routes || res.body.evacuation_routes.length === 0) {
      throw new Error('No evacuation routes in plan');
    }
    const accessible = res.body.evacuation_routes.find((r) => r.accessibility?.includes('wheelchair'));
    if (!accessible) throw new Error('No accessible evacuation route');
  });

  await runTest('PREP-004: Plan includes budget-appropriate items', async () => {
    const res = await client.authGet('/api/v1/users/preparedness-plan');
    TA.assertSuccess(res, 200);
    const totalCost = res.body.checklist.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    if (totalCost > 10000) throw new Error(`Plan cost too high: ${totalCost}`);
  });

  await runTest('PREP-005: Get preparedness plan checklist progress', async () => {
    const res = await client.authGet('/api/v1/users/preparedness-plan/progress');
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['completed', 'total', 'percentage']);
  });

  await runTest('PREP-006: Mark checklist item as completed', async () => {
    const res = await client.authPut('/api/v1/users/preparedness-plan/checklist/item_001', {
      completed: true,
      notes: 'Bought torch and batteries',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('PREP-007: Plan updates with changing weather', async () => {
    const res = await client.authPost('/api/v1/users/preparedness-plan/update', {
      weather_change: 'heavy_rain_imminent',
    });
    TA.assertSuccess(res, 200);
    if (res.body.risk_level === 'low') throw new Error('Risk should increase');
  });

  // ============================================================
  // PREFERENCE TESTS
  // ============================================================

  await runTest('PREF-001: Update notification preferences', async () => {
    const res = await client.authPut('/api/v1/users/preferences/notifications', {
      push_enabled: true,
      sms_enabled: true,
      whatsapp_enabled: true,
      email_enabled: false,
      alert_types: ['weather', 'flood', 'health', 'emergency'],
      quiet_hours: { start: '23:00', end: '06:00', override_for_emergency: true },
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('PREF-002: Update accessibility preferences', async () => {
    const res = await client.authPut('/api/v1/users/preferences/accessibility', {
      font_size: 'large',
      high_contrast: true,
      screen_reader: false,
      voice_first: true,
      color_blind_mode: 'deuteranopia',
      reduced_motion: true,
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('PREF-003: Update privacy settings', async () => {
    const res = await client.authPut('/api/v1/users/preferences/privacy', {
      share_location_emergency: true,
      share_location_volunteer: false,
      anonymous_reporting: true,
      data_retention: 'minimal',
    });
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // DATA DELETION TESTS
  // ============================================================

  await runTest('DATA-001: Request data export', async () => {
    const res = await client.authPost('/api/v1/users/data/export', {});
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['export_id', 'estimated_time']);
  });

  await runTest('DATA-002: Request account deletion', async () => {
    // Create temp user for deletion test
    const tempClient = new ApiClient();
    await tempClient.post('/api/v1/users/register', {
      phone: '+919876543990',
      email: 'deleteme@test.com',
      password: 'SecurePass123!',
    });
    const loginRes = await tempClient.post('/api/v1/auth/login', {
      email: 'deleteme@test.com',
      password: 'SecurePass123!',
    });
    tempClient.setAuthToken(loginRes.body.token);
    const res = await tempClient.authPost('/api/v1/users/data/delete', {
      confirmation: 'DELETE_MY_ACCOUNT',
    });
    TA.assertSuccess(res, 200);
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
