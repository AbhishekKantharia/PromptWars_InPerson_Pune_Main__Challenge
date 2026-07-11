/**
 * E2E Tests - Complete User Journeys
 * Tests: onboarding, preparedness, emergency, recovery, community
 */

const { ApiClient, TestAssertions: TA, TestReporter, sendChatMessage, mockWeatherData, mockFloodData } = require('../../helpers');
const TEST_CONFIG = require('../../config');
const FIXTURES = require('../../fixtures');

const reporter = new TestReporter('E2E User Journey Tests');

async function runTests() {
  console.log('\n🌍 Running E2E User Journey Tests...\n');

  // ============================================================
  // JOURNEY 1: COMPLETE ONBOARDING TO PREPAREDNESS
  // ============================================================

  await runTest('JOURNEY-001: New user onboarding → profile → plan → checklist', async () => {
    const client = new ApiClient();

    // Step 1: Register
    const registerRes = await client.post('/api/v1/users/register', {
      phone: `+919876${Date.now().toString().slice(-6)}`,
      email: `e2e_user_${Date.now()}@test.com`,
      password: 'E2ETest123!',
      language: 'hi',
    });
    TA.assertSuccess(registerRes, 201);

    // Step 2: Login
    const loginRes = await client.post('/api/v1/auth/login', {
      email: registerRes.body.email || `e2e_user_${Date.now()}@test.com`,
      password: 'E2ETest123!',
    });
    TA.assertSuccess(loginRes, 200);
    client.setAuthToken(loginRes.body.token);

    // Step 3: Complete profile
    const profileRes = await client.authPut('/api/v1/users/profile', {
      ...FIXTURES.profiles.pregnantWomanGroundFloor,
    });
    TA.assertSuccess(profileRes, 200);

    // Step 4: Add family
    const familyRes = await client.authPost('/api/v1/users/family', {
      family_name: 'Test Family',
      members: FIXTURES.profiles.pregnantWomanGroundFloor.family_members,
    });
    TA.assertSuccess(familyRes, 201);

    // Step 5: Set communication plan
    const commRes = await client.authPut(`/api/v1/users/family/${familyRes.body.family_id}/communication-plan`, {
      primary_contact: { name: 'Rahul', phone: '+919876543210' },
      meeting_points: [{ name: 'School', priority: 1 }],
    });
    TA.assertSuccess(commRes, 200);

    // Step 6: Generate preparedness plan
    const planRes = await client.authPost('/api/v1/users/preparedness-plan/generate', {
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(planRes, 200);
    TA.assertValidPreparednessPlan(planRes.body);

    // Step 7: Verify plan is personalized
    const plan = planRes.body;
    const hasPregnancyItems = plan.checklist.some(
      (item) => item.category === 'maternity' || item.description?.toLowerCase().includes('pregnan')
    );
    if (!hasPregnancyItems) throw new Error('Plan not personalized for pregnancy');

    // Step 8: Check progress
    const progressRes = await client.authGet('/api/v1/users/preparedness-plan/progress');
    TA.assertSuccess(progressRes, 200);
    if (progressRes.body.total < 5) throw new Error('Plan has too few items');
  });

  // ============================================================
  // JOURNEY 2: EMERGENCY RESPONSE FLOW
  // ============================================================

  await runTest('JOURNEY-002: Alert received → guidance → evacuation → check-in → SOS', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Check active alerts
    const alertsRes = await client.authGet(
      `/api/v1/alerts/active?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(alertsRes, 200);

    // Step 2: Ask AI for guidance
    const chatRes = await sendChatMessage(client, 'There is a flood warning. What should I do?', {
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(chatRes, 200);
    TA.assertValidChatResponse(chatRes.body);

    // Step 3: Find evacuation route
    const routeRes = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
      mode: 'walking',
      avoid_floods: true,
    });
    TA.assertSuccess(routeRes, 200);

    // Step 4: Find nearest shelter
    const shelterRes = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&accessibility=wheelchair`
    );
    TA.assertSuccess(shelterRes, 200);

    // Step 5: Safe check-in
    const checkinRes = await client.authPost('/api/v1/users/check-in', {
      status: 'safe',
      location: TEST_CONFIG.locations.mumbaiSafe,
      message: 'Evacuating to shelter',
    });
    TA.assertSuccess(checkinRes, 200);

    // Step 6: Find nearest hospital
    const hospitalRes = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&specialty=maternity&flood_status=safe`
    );
    TA.assertSuccess(hospitalRes, 200);
  });

  // ============================================================
  // JOURNEY 3: COMMUNITY REPORTING FLOW
  // ============================================================

  await runTest('JOURNEY-003: See hazard → report → verify → track → resolve', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: See nearby reports
    const nearbyRes = await client.authGet(
      `/api/v1/reports/nearby?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(nearbyRes, 200);

    // Step 2: Submit new report
    const reportRes = await client.authPost('/api/v1/reports/submit', FIXTURES.reports.floodReport);
    TA.assertSuccess(reportRes, 201);

    // Step 3: Verify someone else's report
    if (nearbyRes.body.reports?.length > 0) {
      const verifyRes = await client.authPost('/api/v1/reports/test-verify', {
        report_id: nearbyRes.body.reports[0].report_id,
        action: 'verify',
      });
      TA.assertSuccess(verifyRes, 200);
    }

    // Step 4: Track report status
    const statusRes = await client.authGet(`/api/v1/reports/${reportRes.body.report_id}/status`);
    TA.assertSuccess(statusRes, 200);
  });

  // ============================================================
  // JOURNEY 4: DAMAGE ASSESSMENT & INSURANCE FLOW
  // ============================================================

  await runTest('JOURNEY-004: Flood recedes → photo damage → AI assess → insurance claim', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Photo damage
    const damageRes = await client.authPost('/api/v1/reports/damage', {
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Flood damage: 2 feet water, flooring ruined, furniture damaged.',
      property_type: 'apartment',
      photos: ['data:image/png;base64,iVBORw0KGgo='],
    });
    TA.assertSuccess(damageRes, 201);

    // Step 2: Get AI assessment
    if (damageRes.body.ai_assessment) {
      const assessment = damageRes.body.ai_assessment;
      if (!assessment.damage_level) throw new Error('No damage level');
      if (!assessment.estimated_cost) throw new Error('No cost estimate');
    }

    // Step 3: Estimate repair cost
    const costRes = await client.authPost('/api/v1/relief/expense-estimate', {
      damage_type: 'flood',
      property_type: 'apartment',
      damage_level: 'moderate',
    });
    TA.assertSuccess(costRes, 200);

    // Step 4: Get insurance guidance
    const insRes = await client.authGet('/api/v1/relief/insurance-assist');
    TA.assertSuccess(insRes, 200);

    // Step 5: Generate claim document
    const claimRes = await client.authPost('/api/v1/relief/insurance-assist/generate-claim', {
      damage_description: 'Moderate flood damage to apartment.',
      damage_photos: ['photo1.jpg'],
      estimated_cost: costRes.body.total_estimate,
    });
    TA.assertSuccess(claimRes, 200);

    // Step 6: Find applicable government schemes
    const schemeRes = await client.authPost('/api/v1/relief/govt-schemes', {
      disaster_type: 'flood',
      damage_type: 'property',
      income_bracket: 'MIG',
    });
    TA.assertSuccess(schemeRes, 200);
  });

  // ============================================================
  // JOURNEY 5: SENIOR CITIZEN VOICE-LED FLOW
  // ============================================================

  await runTest('JOURNEY-005: Senior citizen → voice query → simple guidance → large text', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.senior.email,
      password: TEST_CONFIG.users.senior.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Voice query
    const voiceRes = await client.authPost('/api/v1/chat/voice', {
      audio: 'base64_hindi_audio',
      language: 'hi',
    });
    TA.assertSuccess(voiceRes, 200);

    // Step 2: Simple language chat
    const chatRes = await sendChatMessage(client, 'मुझे बाढ़ से कैसे बचना है?', {
      language: 'hi',
      location: TEST_CONFIG.locations.pune,
    });
    TA.assertSuccess(chatRes, 200);

    // Step 3: Get accessibility settings
    const accessRes = await client.authGet('/api/v1/users/preferences/accessibility');
    TA.assertSuccess(accessRes, 200);
  });

  // ============================================================
  // JOURNEY 6: TOURIST IN UNFAMILIAR AREA
  // ============================================================

  await runTest('JOURNEY-006: Tourist → unfamiliar area → local language → shelter → hospital', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.tourist.email,
      password: TEST_CONFIG.users.tourist.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Ask for help in English in Kerala
    const chatRes = await sendChatMessage(client, 'I am a tourist in Kerala. There is heavy rain. What should I do?', {
      location: TEST_CONFIG.locations.kerala,
    });
    TA.assertSuccess(chatRes, 200);

    // Step 2: Find English-speaking shelter
    const shelterRes = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.kerala.lat}&lon=${TEST_CONFIG.locations.kerala.lon}`
    );
    TA.assertSuccess(shelterRes, 200);

    // Step 3: Find nearest hospital
    const hospitalRes = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.kerala.lat}&lon=${TEST_CONFIG.locations.kerala.lon}`
    );
    TA.assertSuccess(hospitalRes, 200);

    // Step 4: Get embassy contacts
    const embassyRes = await client.authGet('/api/v1/users/embassy-contacts?country=US');
    TA.assertSuccess(embassyRes, 200);
  });

  // ============================================================
  // JOURNEY 7: FARMER WITH LIVESTOCK
  // ============================================================

  await runTest('JOURNEY-007: Farmer → livestock safety → crop protection → relief claim', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.farmer.email,
      password: TEST_CONFIG.users.farmer.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Ask about livestock safety
    const chatRes = await sendChatMessage(
      client,
      'माझ्या गायींना पूर आली तर काय करायचं? माझ्याकडे ४ गाय आहेत.',
      { language: 'mr', location: TEST_CONFIG.locations.ruralAssam }
    );
    TA.assertSuccess(chatRes, 200);

    // Step 2: Get crop protection guidance
    const cropRes = await sendChatMessage(
      client,
      'What should I do to protect my rice crop from flooding?',
      { location: TEST_CONFIG.locations.ruralAssam }
    );
    TA.assertSuccess(cropRes, 200);

    // Step 3: Find animal rescue
    const rescueRes = await client.authGet(
      `/api/v1/location/animal-rescue?lat=${TEST_CONFIG.locations.ruralAssam.lat}&lon=${TEST_CONFIG.locations.ruralAssam.lon}`
    );
    TA.assertSuccess(rescueRes, 200);

    // Step 4: Apply for crop insurance
    const schemeRes = await client.authPost('/api/v1/relief/govt-schemes', {
      disaster_type: 'flood',
      damage_type: 'crop',
      income_bracket: 'BPL',
    });
    TA.assertSuccess(schemeRes, 200);
  });

  // ============================================================
  // JOURNEY 8: OFFLINE MODE JOURNEY
  // ============================================================

  await runTest('JOURNEY-008: Offline → cached data → queued report → sync when online', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Get offline data (should be cached)
    const offlineRes = await client.authGet('/api/v1/users/offline-data');
    TA.assertSuccess(offlineRes, 200);
    TA.assertHasFields(offlineRes.body, ['emergency_contacts', 'shelters', 'evacuation_routes', 'first_aid']);

    // Step 2: Queue report while offline
    const queueRes = await client.authPost('/api/v1/reports/queue', {
      report: FIXTURES.reports.floodReport,
    });
    TA.assertSuccess(queueRes, 200);

    // Step 3: Sync when back online
    const syncRes = await client.authPost('/api/v1/reports/sync-queue', {});
    TA.assertSuccess(syncRes, 200);
    if (syncRes.body.synced_count < 1) throw new Error('Reports not synced');
  });

  // ============================================================
  // JOURNEY 9: FAMILY COORDINATION DURING EMERGENCY
  // ============================================================

  await runTest('JOURNEY-009: Family emergency → location sharing → check-in → reunion', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Start location sharing
    const shareRes = await client.authPost('/api/v1/users/location-sharing', {
      enabled: true,
      share_with: ['family'],
      duration_hours: 24,
    });
    TA.assertSuccess(shareRes, 200);

    // Step 2: Get family locations
    const familyLocRes = await client.authGet('/api/v1/users/family/locations');
    TA.assertSuccess(familyLocRes, 200);

    // Step 3: Send check-in
    const checkinRes = await client.authPost('/api/v1/users/check-in', {
      status: 'safe',
      location: TEST_CONFIG.locations.mumbaiSafe,
      message: 'I am safe at the shelter.',
      notify_family: true,
    });
    TA.assertSuccess(checkinRes, 200);

    // Step 4: Get check-in status of family
    const familyCheckinRes = await client.authGet('/api/v1/users/family/check-ins');
    TA.assertSuccess(familyCheckinRes, 200);
  });

  // ============================================================
  // JOURNEY 10: MULTILINGUAL JOURNEY
  // ============================================================

  await runTest('JOURNEY-010: Complete journey in Marathi', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.farmer.email,
      password: TEST_CONFIG.users.farmer.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Step 1: Chat in Marathi
    const chatRes = await sendChatMessage(client, 'मला तयारी करायची आहे. काय करावे?', {
      language: 'mr',
      location: TEST_CONFIG.locations.ruralAssam,
    });
    TA.assertSuccess(chatRes, 200);
    if (chatRes.body.language !== 'mr') throw new Error('Response not in Marathi');

    // Step 2: Get briefing in Marathi
    const briefRes = await client.authGet('/api/v1/alerts/briefing?language=mr');
    TA.assertSuccess(briefRes, 200);

    // Step 3: Get alerts in Marathi
    const alertRes = await client.authGet(
      `/api/v1/alerts/active?lat=${TEST_CONFIG.locations.ruralAssam.lat}&lon=${TEST_CONFIG.locations.ruralAssam.lon}&language=mr`
    );
    TA.assertSuccess(alertRes, 200);
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
