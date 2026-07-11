/**
 * Unit Tests - Relief Service
 * Tests: relief distribution, insurance claims, government schemes, donations
 */

const { ApiClient, TestAssertions: TA, TestReporter } = require('../../helpers');
const TEST_CONFIG = require('../../config');
const FIXTURES = require('../../fixtures');

const reporter = new TestReporter('Relief Service Unit Tests');

async function runTests() {
  console.log('\n🤝 Running Relief Service Tests...\n');
  const client = new ApiClient();

  const loginRes = await client.post('/api/v1/auth/login', {
    email: TEST_CONFIG.users.citizen.email,
    password: TEST_CONFIG.users.citizen.password,
  });
  if (loginRes.status === 200) client.setAuthToken(loginRes.body.token);

  // ============================================================
  // RELIEF DISTRIBUTION TESTS
  // ============================================================

  await runTest('REL-001: Find relief distribution centers', async () => {
    const res = await client.authGet(
      `/api/v1/relief/distribution-centers?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.centers)) throw new Error('Centers not returned');
  });

  await runTest('REL-002: Relief center includes availability info', async () => {
    const res = await client.authGet(
      `/api/v1/relief/distribution-centers?lat=${TEST_CONFIG.locations.mumbaiFlood.lat}&lon=${TEST_CONFIG.locations.mumbaiFlood.lon}`
    );
    TA.assertSuccess(res, 200);
    if (res.body.centers.length > 0) {
      TA.assertHasFields(res.body.centers[0], ['name', 'available', 'items', 'hours']);
    }
  });

  await runTest('REL-003: Track relief distribution status', async () => {
    const res = await client.authGet('/api/v1/relief/status');
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['total_distributed', 'pending', 'inventory']);
  });

  await runTest('REL-004: Claim relief assistance', async () => {
    const res = await client.authPost('/api/v1/relief/claim', {
      type: 'food_ration',
      family_size: 3,
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 201);
    TA.assertHasFields(res.body, ['claim_id', 'status']);
  });

  // ============================================================
  // INSURANCE CLAIM TESTS
  // ============================================================

  await runTest('INS-001: Get insurance claim guidance', async () => {
    const res = await client.authGet('/api/v1/relief/insurance-assist');
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['steps', 'documents_needed', 'timeline']);
  });

  await runTest('INS-002: Estimate insurance claim amount', async () => {
    const res = await client.authPost('/api/v1/relief/insurance-assist/estimate', {
      damage_type: 'flood',
      property_type: 'apartment',
      damage_level: 'moderate',
      photos: ['data:image/png;base64,iVBORw0KGgo='],
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['estimated_amount', 'coverage_analysis', 'deductible']);
  });

  await runTest('INS-003: Generate insurance claim documents', async () => {
    const res = await client.authPost('/api/v1/relief/insurance-assist/generate-claim', {
      damage_description: 'Flood damage to ground floor apartment.',
      damage_photos: ['photo1.jpg', 'photo2.jpg'],
      estimated_cost: 150000,
    });
    TA.assertSuccess(res, 200);
    if (res.body.claim_document) {
      TA.assertHasFields(res.body.claim_document, ['claim_form', 'damage_report', 'photos_summary']);
    }
  });

  await runTest('INS-004: Track claim status', async () => {
    const res = await client.authGet('/api/v1/relief/insurance-assist/claims');
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.claims)) throw new Error('Claims not returned');
  });

  // ============================================================
  // GOVERNMENT SCHEME TESTS
  // ============================================================

  await runTest('GOV-001: Get applicable government schemes', async () => {
    const res = await client.authPost('/api/v1/relief/govt-schemes', {
      disaster_type: 'flood',
      damage_type: 'property',
      income_bracket: 'MIG',
    });
    TA.assertSuccess(res, 200);
    if (!Array.isArray(res.body.schemes)) throw new Error('Schemes not returned');
  });

  await runTest('GOV-002: Scheme includes eligibility criteria', async () => {
    const res = await client.authPost('/api/v1/relief/govt-schemes', {
      disaster_type: 'flood',
      income_bracket: 'BPL',
    });
    TA.assertSuccess(res, 200);
    if (res.body.schemes.length > 0) {
      TA.assertHasFields(res.body.schemes[0], ['name', 'eligibility', 'amount', 'deadline', 'application_url']);
    }
  });

  await runTest('GOV-003: Get scheme application assistance', async () => {
    const res = await client.authGet('/api/v1/relief/govt-schemes/pm-fasal-bima/apply');
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['form_fields', 'documents_needed', 'step_by_step']);
  });

  // ============================================================
  // DONATION VERIFICATION TESTS
  // ============================================================

  await runTest('DON-001: Verify NGO registration', async () => {
    const res = await client.authGet('/api/v1/relief/donations/verify-ngo?ngo_name=Indian+Red+Cross');
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['verified', 'registration_number', 'rating']);
  });

  await runTest('DON-002: Check donation transparency', async () => {
    const res = await client.authGet('/api/v1/relief/donations/transparency?ngo_id=ngo_001');
    TA.assertSuccess(res, 200);
    if (res.body.financial_data) {
      TA.assertHasFields(res.body.financial_data, ['received', 'spent', 'overhead_ratio']);
    }
  });

  await runTest('DON-003: Detect donation scam', async () => {
    const res = await client.authPost('/api/v1/relief/donations/check-scam', {
      donation_link: 'https://suspicious-site.com/donate',
      ngo_name: 'Fake Relief Org',
    });
    TA.assertSuccess(res, 200);
    if (res.body.risk_level === 'safe') throw new Error('Scam not detected');
  });

  // ============================================================
  // EXPENSE ESTIMATION TESTS
  // ============================================================

  await runTest('EXP-001: Estimate repair costs', async () => {
    const res = await client.authPost('/api/v1/relief/expense-estimate', {
      damage_type: 'flood',
      property_type: 'apartment',
      damage_level: 'moderate',
      location: TEST_CONFIG.locations.mumbaiFlood,
    });
    TA.assertSuccess(res, 200);
    TA.assertHasFields(res.body, ['total_estimate', 'breakdown', 'material_costs', 'labor_costs']);
  });

  await runTest('EXP-002: Estimate includes government relief offset', async () => {
    const res = await client.authPost('/api/v1/relief/expense-estimate', {
      damage_type: 'flood',
      property_type: 'apartment',
      damage_level: 'moderate',
      include_govt_relief: true,
    });
    TA.assertSuccess(res, 200);
    if (res.body.government_relief_offset) {
      TA.assertHasFields(res.body.government_relief_offset, ['scheme', 'amount']);
    }
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
