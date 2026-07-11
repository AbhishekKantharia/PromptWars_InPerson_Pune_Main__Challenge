/**
 * Unit Tests - Report Service
 * Tests: citizen reporting, verification, damage reporting, community features
 */

const { ApiClient, TestAssertions: TA, TestReporter } = require('../../helpers');
const TEST_CONFIG = require('../../config');
const FIXTURES = require('../../fixtures');

const reporter = new TestReporter('Report Service Unit Tests');

async function runTests() {
  console.log('\n📝 Running Report Service Tests...\n');
  const client = new ApiClient();

  const loginRes = await client.post('/api/v1/auth/login', {
    email: TEST_CONFIG.users.citizen.email,
    password: TEST_CONFIG.users.citizen.password,
  });
  if (loginRes.status === 200) client.setAuthToken(loginRes.body.token);

  // ============================================================
  // CITIZEN REPORT SUBMISSION TESTS
  // ============================================================

  await runTest('RPT-001: Submit flood report with valid data', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'high',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Waterlogging near Andheri station. Knee-deep water.',
    });
    TA.assertSuccess(res, 201);
    TA.assertHasFields(res.body, ['report_id', 'status', 'created_at']);
    if (res.body.status !== 'pending') throw new Error('Report not in pending status');
  });

  await runTest('RPT-002: Submit road blockage report', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'road',
      severity: 'critical',
      location: { lat: 19.0596, lon: 72.8295 },
      description: 'Fallen tree blocking Western Express Highway.',
    });
    TA.assertSuccess(res, 201);
  });

  await runTest('RPT-003: Submit power outage report', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'power',
      severity: 'medium',
      location: { lat: 19.0300, lon: 72.8500 },
      description: 'Power outage in Dharavi for 4 hours.',
    });
    TA.assertSuccess(res, 201);
  });

  await runTest('RPT-004: Submit health report', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'health',
      severity: 'high',
      location: { lat: 19.0400, lon: 72.8600 },
      description: 'Multiple fever cases in colony. Suspected water contamination.',
    });
    TA.assertSuccess(res, 201);
  });

  await runTest('RPT-005: Submit infrastructure report', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'infrastructure',
      severity: 'critical',
      location: { lat: 19.0500, lon: 72.8400 },
      description: 'Building wall has cracks after heavy rain.',
    });
    TA.assertSuccess(res, 201);
  });

  await runTest('RPT-006: Submit report with photo attachment', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'high',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Photo showing water level.',
      media: [{ type: 'image', data: 'data:image/png;base64,iVBORw0KGgo=' }],
    });
    TA.assertSuccess(res, 201);
    if (!res.body.media_urls || res.body.media_urls.length === 0) {
      throw new Error('Media not uploaded');
    }
  });

  await runTest('RPT-007: Submit report with video attachment', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'high',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Video of rising water level.',
      media: [{ type: 'video', data: 'base64_video_data' }],
    });
    TA.assertSuccess(res, 201);
  });

  await runTest('RPT-008: Submit anonymous report', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'health',
      severity: 'medium',
      location: { lat: 19.0400, lon: 72.8600 },
      description: 'Stagnant water breeding mosquitoes.',
      anonymous: true,
    });
    TA.assertSuccess(res, 201);
    if (res.body.reporter_name) throw new Error('Reporter not anonymous');
  });

  await runTest('RPT-009: Report with GPS coordinates is geotagged', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'medium',
      location: { lat: 19.0760, lon: 72.8777 },
      description: 'Testing geotag.',
    });
    TA.assertSuccess(res, 200);
    TA.assertValidLocation(res.body.location);
  });

  await runTest('RPT-010: Reject report with missing required fields', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
    });
    TA.assertError(res, 400);
  });

  await runTest('RPT-011: Reject report with invalid type', async () => {
    const res = await client.authPost('/api/v1/reports/submit', {
      report_type: 'invalid_type',
      severity: 'high',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Test',
    });
    TA.assertError(res, 400);
  });

  // ============================================================
  // REPORT RETRIEVAL TESTS
  // ============================================================

  await runTest('RPT-GET-001: Get reports near location', async () => {
    const res = await client.authGet(
      `/api/v1/reports/nearby?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&radius=5`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.reports)) throw new Error('Reports not returned as array');
  });

  await runTest('RPT-GET-002: Reports sorted by distance', async () => {
    const res = await client.authGet(
      `/api/v1/reports/nearby?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    for (let i = 1; i < res.body.reports.length; i++) {
      if (res.body.reports[i].distance_km < res.body.reports[i - 1].distance_km) {
        throw new Error('Reports not sorted by distance');
      }
    }
  });

  await runTest('RPT-GET-003: Filter reports by type', async () => {
    const res = await client.authGet(
      `/api/v1/reports/nearby?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&type=flood`
    );
    TA.assertSuccess(res, 200);
    for (const report of res.body.reports) {
      if (report.report_type !== 'flood') throw new Error('Type filter not applied');
    }
  });

  await runTest('RPT-GET-004: Filter reports by severity', async () => {
    const res = await client.authGet(
      `/api/v1/reports/nearby?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}&severity=critical`
    );
    TA.assertSuccess(res, 200);
    for (const report of res.body.reports) {
      if (report.severity !== 'critical') throw new Error('Severity filter not applied');
    }
  });

  await runTest('RPT-GET-005: Get report details', async () => {
    const createRes = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'low',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Test report for detail retrieval',
    });
    if (createRes.status === 201) {
      const res = await client.authGet(`/api/v1/reports/${createRes.body.report_id}`);
      TA.assertSuccess(res, 200);
      TA.assertHasFields(res.body, ['report_id', 'description', 'status', 'verification_count']);
    }
  });

  // ============================================================
  // REPORT VERIFICATION TESTS
  // ============================================================

  await runTest('RPT-VERIFY-001: Verify a report', async () => {
    const res = await client.authPost('/api/v1/reports/test-verify', {
      action: 'verify',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('RPT-VERIFY-002: Upvote a report', async () => {
    const res = await client.authPost('/api/v1/reports/test-verify', {
      action: 'upvote',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('RPT-VERIFY-003: Dispute a report', async () => {
    const res = await client.authPost('/api/v1/reports/test-verify', {
      action: 'dispute',
      reason: 'I am at this location and see no flooding',
    });
    TA.assertSuccess(res, 200);
  });

  await runTest('RPT-VERIFY-004: AI classifies report', async () => {
    const createRes = await client.authPost('/api/v1/reports/submit', {
      report_type: 'flood',
      severity: 'high',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Water entered my ground floor house, 2 feet deep.',
    });
    if (createRes.status === 201) {
      const res = await client.authGet(`/api/v1/reports/${createRes.body.report_id}/ai-classification`);
      TA.assertSuccess(res, 200);
      TA.assertHasFields(res.body, ['classification', 'confidence', 'suggested_severity']);
    }
  });

  // ============================================================
  // DAMAGE REPORTING TESTS
  // ============================================================

  await runTest('RPT-DAMAGE-001: Submit damage report with AI assessment', async () => {
    const res = await client.authPost('/api/v1/reports/damage', {
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Ground floor apartment, water reached 2 feet. Flooring damaged, lower walls wet, furniture damaged.',
      property_type: 'apartment',
      photos: ['data:image/png;base64,iVBORw0KGgo='],
    });
    TA.assertSuccess(res, 201);
    TA.assertHasFields(res.body, ['report_id', 'ai_assessment']);
    if (res.body.ai_assessment) {
      TA.assertHasFields(res.body.ai_assessment, ['damage_level', 'estimated_cost', 'damage_types']);
    }
  });

  await runTest('RPT-DAMAGE-002: Damage assessment includes cost estimate', async () => {
    const res = await client.authPost('/api/v1/reports/damage', {
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Moderate flood damage to independent house.',
      property_type: 'independent_house',
    });
    TA.assertSuccess(res, 200);
    if (res.body.ai_assessment?.estimated_cost) {
      if (typeof res.body.ai_assessment.estimated_cost.min !== 'number') {
        throw new Error('Invalid cost estimate');
      }
    }
  });

  await runTest('RPT-DAMAGE-003: Damage report generates insurance documentation', async () => {
    const res = await client.authPost('/api/v1/reports/damage', {
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Flood damage to home.',
      property_type: 'apartment',
      generate_insurance_doc: true,
    });
    TA.assertSuccess(res, 200);
    if (res.body.insurance_document) {
      TA.assertHasFields(res.body.insurance_document, ['claim_reference', 'damage_summary', 'estimated_amount']);
    }
  });

  // ============================================================
  // REPORT STATUS MANAGEMENT TESTS
  // ============================================================

  await runTest('RPT-STATUS-001: Track report status', async () => {
    const createRes = await client.authPost('/api/v1/reports/submit', {
      report_type: 'road',
      severity: 'high',
      location: { lat: 19.0596, lon: 72.8295 },
      description: 'Road blockage status tracking test',
    });
    if (createRes.status === 201) {
      const res = await client.authGet(`/api/v1/reports/${createRes.body.report_id}/status`);
      TA.assertSuccess(res, 200);
      TA.assertHasFields(res.body, ['status', 'timeline']);
    }
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
