/**
 * Unit Tests - Location Service
 * Tests: nearby places, routing, shelter finder, hospital finder, evacuation
 */

const { ApiClient, TestAssertions: TA, TestReporter, calculateDistance, isWithinRadius } = require('../../helpers');
const TEST_CONFIG = require('../../config');

const reporter = new TestReporter('Location Service Unit Tests');

async function runTests() {
  console.log('\n📍 Running Location Service Tests...\n');
  const client = new ApiClient();

  const loginRes = await client.post('/api/v1/auth/login', {
    email: TEST_CONFIG.users.citizen.email,
    password: TEST_CONFIG.users.citizen.password,
  });
  if (loginRes.status === 200) client.setAuthToken(loginRes.body.token);

  // ============================================================
  // SHELTER FINDER TESTS
  // ============================================================

  await runTest('LOC-001: Find nearby shelters', async () => {
    const res = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&radius=10`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.shelters)) throw new Error('Shelters not returned as array');
    if (res.body.shelters.length === 0) throw new Error('No shelters found');
  });

  await runTest('LOC-002: Shelter results sorted by distance', async () => {
    const res = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    for (let i = 1; i < res.body.shelters.length; i++) {
      if (res.body.shelters[i].distance_km < res.body.shelters[i - 1].distance_km) {
        throw new Error('Results not sorted by distance');
      }
    }
  });

  await runTest('LOC-003: Shelter includes capacity info', async () => {
    const res = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    const shelter = res.body.shelters[0];
    TA.assertHasFields(shelter, ['shelter_id', 'name', 'capacity', 'current_occupancy', 'status']);
  });

  await runTest('LOC-004: Filter wheelchair accessible shelters', async () => {
    const res = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&accessibility=wheelchair`
    );
    TA.assertSuccess(res, 200);
    for (const shelter of res.body.shelters) {
      if (!shelter.accessibility?.includes('wheelchair')) {
        throw new Error('Non-accessible shelter in filtered results');
      }
    }
  });

  await runTest('LOC-005: Filter pet-friendly shelters', async () => {
    const res = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&pet_friendly=true`
    );
    TA.assertSuccess(res, 200);
    for (const shelter of res.body.shelters) {
      if (!shelter.pet_friendly) throw new Error('Non-pet-friendly shelter in results');
    }
  });

  await runTest('LOC-006: Exclude full shelters', async () => {
    const res = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&include_full=false`
    );
    TA.assertSuccess(res, 200);
    for (const shelter of res.body.shelters) {
      if (shelter.current_occupancy >= shelter.capacity) {
        throw new Error('Full shelter in results');
      }
    }
  });

  await runTest('LOC-007: Get shelter details', async () => {
    const listRes = await client.authGet(
      `/api/v1/location/shelters?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    if (listRes.body.shelters?.length > 0) {
      const shelterId = listRes.body.shelters[0].shelter_id;
      const res = await client.authGet(`/api/v1/location/shelters/${shelterId}`);
      TA.assertSuccess(res, 200);
      TA.assertHasFields(res.body, ['name', 'location', 'facilities', 'accessibility', 'contact']);
    }
  });

  // ============================================================
  // HOSPITAL FINDER TESTS
  // ============================================================

  await runTest('LOC-HOSP-001: Find nearby hospitals', async () => {
    const res = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.hospitals)) throw new Error('Hospitals not returned');
  });

  await runTest('LOC-HOSP-002: Filter by specialty', async () => {
    const res = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&specialty=maternity`
    );
    TA.assertSuccess(res, 200);
    for (const hospital of res.body.hospitals) {
      if (!hospital.specialties?.includes('maternity')) {
        throw new Error('Hospital without maternity specialty');
      }
    }
  });

  await runTest('LOC-HOSP-003: Hospital includes bed availability', async () => {
    const res = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (res.body.hospitals.length > 0) {
      TA.assertHasFields(res.body.hospitals[0], ['beds_available', 'power_backup', 'flood_status']);
    }
  });

  await runTest('LOC-HOSP-004: Filter hospitals with power backup', async () => {
    const res = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&power_backup=true`
    );
    TA.assertSuccess(res, 200);
    for (const hospital of res.body.hospitals) {
      if (!hospital.power_backup) throw new Error('Hospital without power backup');
    }
  });

  await runTest('LOC-HOSP-005: Filter safe hospitals during flood', async () => {
    const res = await client.authGet(
      `/api/v1/location/hospitals?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&flood_status=safe`
    );
    TA.assertSuccess(res, 200);
    for (const hospital of res.body.hospitals) {
      if (hospital.flood_status !== 'safe') throw new Error('Unsafe hospital in results');
    }
  });

  // ============================================================
  // PHARMACY FINDER TESTS
  // ============================================================

  await runTest('LOC-PHARM-001: Find nearby pharmacies', async () => {
    const res = await client.authGet(
      `/api/v1/location/pharmacies?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
  });

  await runTest('LOC-PHARM-002: Check medicine availability', async () => {
    const res = await client.authGet(
      `/api/v1/location/pharmacies?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&medicine=paracetamol`
    );
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // POLICE STATION FINDER TESTS
  // ============================================================

  await runTest('LOC-POLICE-001: Find nearby police stations', async () => {
    const res = await client.authGet(
      `/api/v1/location/police?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.stations)) throw new Error('Stations not returned');
  });

  // ============================================================
  // FOOD DISTRIBUTION CENTER TESTS
  // ============================================================

  await runTest('LOC-FOOD-001: Find food distribution centers', async () => {
    const res = await client.authGet(
      `/api/v1/location/food?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
  });

  await runTest('LOC-FOOD-002: Filter centers with baby food', async () => {
    const res = await client.authGet(
      `/api/v1/location/food?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&type=baby_food`
    );
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // CHARGING STATION FINDER TESTS
  // ============================================================

  await runTest('LOC-CHARGE-001: Find charging stations', async () => {
    const res = await client.authGet(
      `/api/v1/location/charging?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
  });

  // ============================================================
  // ROUTING TESTS
  // ============================================================

  await runTest('LOC-ROUTE-001: Get evacuation route to shelter', async () => {
    const res = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
      mode: 'walking',
      avoid_floods: true,
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['distance_km', 'estimated_time_min', 'directions', 'waypoints']);
  });

  await runTest('LOC-ROUTE-002: Route avoids flooded areas', async () => {
    const res = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
      mode: 'driving',
      avoid_floods: true,
    });
    TA.assertSuccess(res, 200);
    if (res.body.flood_zones_crossed > 0) throw new Error('Route crosses flooded areas');
  });

  await runTest('LOC-ROUTE-003: Multiple route options', async () => {
    const res = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
      alternatives: true,
    });
    TA.assertSuccess(res, 200);
    if (!res.body.alternatives || res.body.alternatives.length < 2) {
      throw new Error('No alternative routes');
    }
  });

  await runTest('LOC-ROUTE-004: Walking route for mobility-limited user', async () => {
    const res = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
      mode: 'walking',
      accessibility: 'wheelchair',
    });
    TA.assertSuccess(res, 200);
    if (res.body.stairs_on_route) throw new Error('Route includes stairs for wheelchair user');
  });

  await runTest('LOC-ROUTE-005: Real-time traffic considered', async () => {
    const res = await client.authPost('/api/v1/location/route', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
      mode: 'driving',
      consider_traffic: true,
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['distance_km', 'estimated_time_min', 'traffic_status']);
  });

  // ============================================================
  // GEOCODING TESTS
  // ============================================================

  await runTest('LOC-GEO-001: Geocode address to coordinates', async () => {
    const res = await client.authGet('/api/v1/location/geocode?address=Bandra+Station+Mumbai');
    TA.assertSuccess(res, 200);
    TA.assertValidLocation(res.body.location);
  });

  await runTest('LOC-GEO-002: Reverse geocode coordinates to address', async () => {
    const res = await client.authGet(
      `/api/v1/location/reverse-geocode?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!res.body.address) throw new Error('Address not returned');
  });

  // ============================================================
  // DISTANCE CALCULATION TESTS
  // ============================================================

  await runTest('LOC-DIST-001: Calculate distance between two points', async () => {
    const res = await client.authPost('/api/v1/location/distance', {
      origin: TEST_CONFIG.locations.mumbaiFlood,
      destination: TEST_CONFIG.locations.mumbaiSafe,
    });
    TA.assertSuccess(res, 200);
    if (typeof res.body.distance_km !== 'number') throw new Error('Distance not returned');
    if (res.body.distance_km < 0) throw new Error('Negative distance');
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
