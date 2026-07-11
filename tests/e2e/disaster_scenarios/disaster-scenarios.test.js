/**
 * E2E Tests - Disaster Scenarios
 * Tests: flood, cyclone, landslide, disease outbreak, infrastructure failure
 */

const { ApiClient, TestAssertions: TA, TestReporter, sendChatMessage, mockWeatherData, mockFloodData } = require('../../helpers');
const TEST_CONFIG = require('../../config');
const FIXTURES = require('../../fixtures');

const reporter = new TestReporter('Disaster Scenario Tests');

async function runTests() {
  console.log('\n🌊 Running Disaster Scenario Tests...\n');

  // ============================================================
  // SCENARIO 1: MUMBAI FLASH FLOOD
  // ============================================================

  await runTest('SCENARIO-FLOOD-001: Mumbai flash flood — complete response cycle', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Phase 1: Detection
    const weatherRes = await client.authGet(
      `/api/v1/weather/current?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(weatherRes, 200);

    const floodRes = await client.authGet(
      `/api/v1/weather/flood-prediction?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(floodRes, 200);

    // Phase 2: Alert
    const alertRes = await client.authGet(
      `/api/v1/alerts/active?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&severity=emergency`
    );
    TA.assertSuccess(alertRes, 200);

    // Phase 3: Guidance
    const chatRes = await sendChatMessage(
      client,
      'Emergency flood in Mumbai. Water entering homes. What should I do?',
      { location: TEST_CONFIG.locations.mumbaiFlood }
    );
    TA.assertSuccess(chatRes, 200);
    if (!chatRes.body.urgency_flag) throw new Error('Urgency not flagged');

    // Phase 4: Evacuation
    const routeRes = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
      mode: 'walking',
      avoid_floods: true,
    });
    TA.assertSuccess(routeRes, 200);

    // Phase 5: Shelter
    const shelterRes = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(shelterRes, 200);

    // Phase 6: Check-in
    const checkinRes = await client.authPost('/api/v1/users/check-in', {
      status: 'safe',
      location: TEST_CONFIG.locations.mumbaiSafe,
    });
    TA.assertSuccess(checkinRes, 200);
  });

  // ============================================================
  // SCENARIO 2: CYCLONE IN ODISHA
  // ============================================================

  await runTest('SCENARIO-CYC-001: Cyclone in Odisha — early warning to evacuation', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Early warning
    const alertRes = await client.authGet(
      `/api/v1/alerts/active?lat=${TEST_CONFIG.locations.coastalOdisha.lat}&lon=${TEST_CONFIG.locations.coastalOdisha.lon}&severity=extreme`
    );
    TA.assertSuccess(alertRes, 200);

    // Cyclone-specific guidance
    const chatRes = await sendChatMessage(
      client,
      'Cyclone approaching. I live near the coast. Should I evacuate?',
      { location: TEST_CONFIG.locations.coastalOdisha }
    );
    TA.assertSuccess(chatRes, 200);

    // Find cyclone shelter
    const shelterRes = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.coastalOdisha.lat}&lon=${TEST_CONFIG.locations.coastalOdisha.lon}&type=cyclone_shelter`
    );
    TA.assertSuccess(shelterRes, 200);

    // Safe evacuation route
    const routeRes = await client.authPost('/api/v1/location/route', {
      origin: { lat: 19.8, lon: 85.8 },
      destination: { lat: 20.3, lon: 85.8 },
      mode: 'driving',
      avoid_coast: true,
    });
    TA.assertSuccess(routeRes, 200);
  });

  // ============================================================
  // SCENARIO 3: LANDSLIDE IN UTTARAKHAND
  // ============================================================

  await runTest('SCENARIO-LAND-001: Landslide in hilly terrain — warning to shelter', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Get terrain-specific guidance
    const chatRes = await sendChatMessage(
      client,
      'Heavy rain in hilly area. Worried about landslide. Should I evacuate?',
      { location: TEST_CONFIG.locations.mountainUttarakhand }
    );
    TA.assertSuccess(chatRes, 200);

    // Road conditions
    const roadRes = await client.authGet(
      `/api/v1/weather/road-conditions?lat=${TEST_CONFIG.locations.mountainUttarakhand.lat}&lon=${TEST_CONFIG.locations.mountainUttarakhand.lon}`
    );
    TA.assertSuccess(roadRes, 200);

    // Safe zone routing
    const routeRes = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mountainUttarakhand,
      destination: { lat: 30.1, lon: 79.1 },
      mode: 'driving',
      avoid_hillsides: true,
    });
    TA.assertSuccess(routeRes, 200);
  });

  // ============================================================
  // SCENARIO 4: DENGUE OUTBREAK
  // ============================================================

  await runTest('SCENARIO-DENGUE-001: Dengue outbreak — detection to prevention', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Disease alert
    const diseaseRes = await client.authGet(
      `/api/v1/health/disease-alerts?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&disease=dengue`
    );
    TA.assertSuccess(diseaseRes, 200);

    // Mosquito prevention
    const mosquitoRes = await client.authGet(
      `/api/v1/health/mosquito-risk?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(mosquitoRes, 200);

    // Get prevention guidance
    const chatRes = await sendChatMessage(
      client,
      'Dengue alert in my area. How to protect my family?',
      { location: TEST_CONFIG.locations.mumbaiFlood }
    );
    TA.assertSuccess(chatRes, 200);

    // Report breeding ground
    const reportRes = await client.authPost('/api/v1/reports/submit', {
      report_type: 'health',
      severity: 'medium',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Stagnant water near construction site. Possible mosquito breeding.',
    });
    TA.assertSuccess(reportRes, 201);
  });

  // ============================================================
  // SCENARIO 5: WATER CONTAMINATION
  // ============================================================

  await runTest('SCENARIO-WATER-001: Water contamination — detection to safe water', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Water quality check
    const waterRes = await client.authGet(
      `/api/v1/health/water-quality?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(waterRes, 200);

    // Get purification guidance
    const chatRes = await sendChatMessage(
      client,
      'Water looks dirty. Is it safe to drink? What purification should I use?',
      { location: TEST_CONFIG.locations.mumbaiFlood }
    );
    TA.assertSuccess(chatRes, 200);

    // Find safe water source
    const waterSourceRes = await client.authGet(
      `/api/v1/location/water-sources?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&safe_only=true`
    );
    TA.assertSuccess(waterSourceRes, 200);
  });

  // ============================================================
  // SCENARIO 6: HOSPITAL EMERGENCY
  // ============================================================

  await runTest('SCENARIO-HOSP-001: Pregnant woman during flood needs hospital', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Find maternity hospital that's safe
    const hospitalRes = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&specialty=maternity&flood_status=safe&power_backup=true`
    );
    TA.assertSuccess(hospitalRes, 200);

    // Get route to hospital avoiding floods
    if (hospitalRes.body.hospitals?.length > 0) {
      const hospital = hospitalRes.body.hospitals[0];
      const routeRes = await client.authPost('/api/v1/location/route', {
        origin: TEST_CONFIG.locations.mumbaiFlood,
        destination: hospital.location,
        mode: 'driving',
        avoid_floods: true,
      });
      TA.assertSuccess(routeRes, 200);
    }

    // SOS if needed
    const sosRes = await client.authPost('/api/v1/sos/activate', {
      emergency_type: 'medical',
      description: 'Pregnant woman in labor during flood. Need hospital immediately.',
      urgency: 'immediate',
    });
    TA.assertSuccess(sosRes, 200);
  });

  // ============================================================
  // SCENARIO 7: DIALYSIS PATIENT DURING POWER OUTAGE
  // ============================================================

  await runTest('SCENARIO-DIALYSIS-001: Dialysis patient needs power and medical help', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Find hospital with dialysis and power backup
    const hospitalRes = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.chennai.lat}&lon=${TEST_CONFIG.locations.chennai.lon}&specialty=dialysis&power_backup=true&flood_status=safe`
    );
    TA.assertSuccess(hospitalRes, 200);

    // Get medicine guidance during power outage
    const chatRes = await sendChatMessage(
      client,
      'I am on dialysis. Power is out. What should I do?',
      { location: TEST_CONFIG.locations.chennai }
    );
    TA.assertSuccess(chatRes, 200);
  });

  // ============================================================
  // SCENARIO 8: MULTI-HAZARD EVENT
  // ============================================================

  await runTest('SCENARIO-MULTI-001: Combined flood + power outage + disease risk', async () => {
    const client = new ApiClient();
    const loginRes = await client.post('/api/v1/auth/login', {
      email: TEST_CONFIG.users.citizen.email,
      password: TEST_CONFIG.users.citizen.password,
    });
    client.setAuthToken(loginRes.body.token);

    // Get comprehensive situation assessment
    const chatRes = await sendChatMessage(
      client,
      'Flood in my area, power is out for 12 hours, and I am worried about diseases. Give me complete guidance.',
      { location: TEST_CONFIG.locations.mumbaiFlood }
    );
    TA.assertSuccess(chatRes, 200);

    // Check all alert types
    const alertRes = await client.authGet(
      `/api/v1/alerts/active?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(alertRes, 200);

    // Get charging station
    const chargeRes = await client.authGet(
      `/api/v1/location/charging?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(chargeRes, 200);

    // Get water quality
    const waterRes = await client.authGet(
      `/api/v1/health/water-quality?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(waterRes, 200);

    // Report all issues
    const reportRes = await client.authPost('/api/v1/reports/submit', {
      report_type: 'infrastructure',
      severity: 'critical',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Multiple issues: flooding, power outage, suspected water contamination.',
    });
    TA.assertSuccess(reportRes, 201);
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
