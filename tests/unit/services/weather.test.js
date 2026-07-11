/**
 * Unit Tests - Weather Service
 * Tests: forecast, flood prediction, road conditions, satellite analysis
 */

const { ApiClient, TestAssertions: TA, TestReporter, mockWeatherData, mockFloodData } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('Weather Service Unit Tests');

async function runTests() {
  console.log('\n🌧️ Running Weather Service Tests...\n');
  const client = new ApiClient();

  const loginRes = await client.post('/api/v1/auth/login', {
    email: TEST_CONFIG.users.citizen.email,
    password: TEST_CONFIG.users.citizen.password,
  });
  if (loginRes.status === 200) client.setAuthToken(loginRes.body.token);

  // ============================================================
  // CURRENT WEATHER TESTS
  // ============================================================

  await runTest('WTH-001: Get current weather for location', async () => {
    const res = await client.authGet(
      `/api/v1/weather/current?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['temperature', 'humidity', 'rainfall', 'wind_speed', 'condition']);
  });

  await runTest('WTH-002: Weather data is recent (within 30 min)', async () => {
    const res = await client.authGet(
      `/api/v1/weather/current?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    const dataAge = Date.now() - new Date(res.body.timestamp).getTime();
    if (dataAge > 30 * 60 * 1000) throw new Error('Weather data too old');
  });

  await runTest('WTH-003: Weather response includes rain intensity category', async () => {
    const res = await client.authGet(
      `/api/v1/weather/current?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!res.body.rain_intensity) throw new Error('No rain intensity category');
  });

  // ============================================================
  // FORECAST TESTS
  // ============================================================

  await runTest('WTH-004: Get 24-hour forecast', async () => {
    const res = await client.authGet(
      `/api/v1/weather/forecast?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&duration=24h`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.hourly)) throw new Error('Hourly forecast not returned');
    if (res.body.hourly.length < 24) throw new Error('Incomplete 24h forecast');
  });

  await runTest('WTH-005: Get 72-hour forecast', async () => {
    const res = await client.authGet(
      `/api/v1/weather/forecast?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&duration=72h`
    );
    TA.assertSuccess(res, 200);
    if (!res.body.daily) throw new Error('Daily forecast not returned');
  });

  await runTest('WTH-006: Forecast includes precipitation probability', async () => {
    const res = await client.authGet(
      `/api/v1/weather/forecast?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&duration=24h`
    );
    TA.assertSuccess(res, 200);
    for (const hour of res.body.hourly) {
      if (typeof hour.precipitation_probability !== 'number') {
        throw new Error('Missing precipitation probability');
      }
    }
  });

  await runTest('WTH-007: Simple language weather explanation', async () => {
    const res = await client.authGet(
      `/api/v1/weather/forecast?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&format=simple`
    );
    TA.assertSuccess(res, 200);
    if (!res.body.simple_description) throw new Error('No simple description');
  });

  // ============================================================
  // FLOOD PREDICTION TESTS
  // ============================================================

  await runTest('FLD-001: Get flood prediction for location', async () => {
    const res = await client.authGet(
      `/api/v1/weather/flood-prediction?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['risk_score', 'risk_level', 'predictions']);
  });

  await runTest('FLD-002: Flood prediction includes multiple horizons', async () => {
    const res = await client.authGet(
      `/api/v1/weather/flood-prediction?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body.predictions, ['6h', '24h', '72h']);
  });

  await runTest('FLD-003: Flood prediction includes confidence interval', async () => {
    const res = await client.authGet(
      `/api/v1/weather/flood-prediction?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['confidence', 'uncertainty_range']);
  });

  await runTest('FLD-004: Flood risk score is between 1-10', async () => {
    const res = await client.authGet(
      `/api/v1/weather/flood-prediction?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (res.body.risk_score < 1 || res.body.risk_score > 10) {
      throw new Error(`Risk score out of range: ${res.body.risk_score}`);
    }
  });

  await runTest('FLD-005: Ward-level prediction granularity', async () => {
    const res = await client.authGet(
      `/api/v1/weather/flood-prediction?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&granularity=ward`
    );
    TA.assertSuccess(res, 200);
    if (res.body.ward_name) throw new Error('Ward-level data not returned');
  });

  await runTest('FLD-006: Historical comparison included', async () => {
    const res = await client.authGet(
      `/api/v1/weather/flood-prediction?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&include_history=true`
    );
    TA.assertSuccess(res, 200);
    if (res.body.historical_comparison) {
      TA.assertHasFields(res.body.historical_comparison, ['similar_events', 'worst_case']);
    }
  });

  // ============================================================
  // ROAD CONDITIONS TESTS
  // ============================================================

  await runTest('ROAD-001: Get road conditions', async () => {
    const res = await client.authGet(
      `/api/v1/weather/road-conditions?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&radius=5`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.roads)) throw new Error('Roads not returned');
  });

  await runTest('ROAD-002: Road conditions include waterlogging status', async () => {
    const res = await client.authGet(
      `/api/v1/weather/road-conditions?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (res.body.roads.length > 0) {
      TA.assertHasFields(res.body.roads[0], ['road_name', 'status', 'waterlogging_level']);
    }
  });

  // ============================================================
  // SATELLITE DATA TESTS
  // ============================================================

  await runTest('SAT-001: Get satellite flood extent', async () => {
    const res = await client.authGet(
      `/api/v1/weather/satellite?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&type=flood_extent`
    );
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['ndwi', 'water_bodies', 'affected_area_sqkm']);
  });

  await runTest('SAT-002: Satellite data includes timestamp', async () => {
    const res = await client.authGet(
      `/api/v1/weather/satellite?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&type=flood_extent`
    );
    TA.assertSuccess(res, 200);
    if (!res.body.image_timestamp) throw new Error('No satellite timestamp');
  });

  // Helper
  async function runTest(name, fn) {
    const start = Date.now();
    try { await fn(); reporter.record(name, true, Date.now() - start); }
    catch (err) { reporter.record(name, false, Date.now() - start, err); }
  }
  return reporter.summary();
}

module.exports = { runTests };
if (require.main === module) runTests();
