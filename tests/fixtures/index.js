/**
 * VarunAI Test Fixtures
 * Pre-built test data for all test suites
 */

const TEST_CONFIG = require('../config');

const FIXTURES = {
  // ============================================================
  // USER PROFILES
  // ============================================================
  profiles: {
    pregnantWomanGroundFloor: {
      name: 'Priya Sharma',
      age: 32,
      gender: 'female',
      medical_conditions: ['pregnancy_7months'],
      disabilities: [],
      home_type: 'apartment',
      floor: 1,
      family_size: 3,
      family_members: [
        { name: 'Rahul', age: 34, relationship: 'husband', medical_conditions: [] },
        { name: 'Baby', age: 0, relationship: 'child', medical_conditions: [] },
      ],
      has_vehicle: false,
      has_pet: false,
      livestock_count: 0,
      income_bracket: 'MIG',
      location: TEST_CONFIG.locations.mumbaiFlood,
      language: 'en',
      flood_risk: 'high',
    },

    diabeticSeniorMobility: {
      name: 'Ramesh Patel',
      age: 72,
      gender: 'male',
      medical_conditions: ['diabetes_type2', 'hypertension', 'knee_replacement'],
      disabilities: ['mobility'],
      home_type: 'independent_house',
      floor: 0,
      family_size: 2,
      family_members: [
        { name: 'Sunita', age: 68, relationship: 'wife', medical_conditions: ['arthritis'] },
      ],
      has_vehicle: false,
      has_pet: true,
      pet_types: ['dog'],
      livestock_count: 0,
      income_bracket: 'LIG',
      location: TEST_CONFIG.locations.pune,
      language: 'hi',
      flood_risk: 'moderate',
    },

    farmerWithLivestock: {
      name: 'Suresh Jadhav',
      age: 45,
      gender: 'male',
      medical_conditions: [],
      disabilities: [],
      home_type: 'kutchha',
      floor: 0,
      family_size: 5,
      family_members: [
        { name: 'Lata', age: 40, relationship: 'wife', medical_conditions: [] },
        { name: 'Vikram', age: 18, relationship: 'son', medical_conditions: [] },
        { name: 'Sneha', age: 14, relationship: 'daughter', medical_conditions: [] },
        { name: 'Grandma', age: 75, relationship: 'mother', medical_conditions: ['dementia'] },
      ],
      has_vehicle: true,
      vehicle_type: 'two_wheeler',
      has_pet: false,
      livestock_count: 4,
      livestock_types: ['cattle'],
      income_bracket: 'BPL',
      location: TEST_CONFIG.locations.ruralAssam,
      language: 'as',
      flood_risk: 'very_high',
    },

    touristUnfamiliarArea: {
      name: 'Sarah Johnson',
      age: 28,
      gender: 'female',
      medical_conditions: [],
      disabilities: [],
      home_type: 'rented',
      floor: 2,
      family_size: 1,
      family_members: [],
      has_vehicle: false,
      has_pet: false,
      livestock_count: 0,
      income_bracket: 'HIG',
      location: TEST_CONFIG.locations.kerala,
      language: 'en',
      flood_risk: 'moderate',
      is_tourist: true,
      home_city: 'New York',
    },

    visualDisabilityUser: {
      name: 'Amit Das',
      age: 35,
      gender: 'male',
      medical_conditions: [],
      disabilities: ['visual'],
      home_type: 'apartment',
      floor: 2,
      family_size: 3,
      family_members: [
        { name: 'Neha', age: 32, relationship: 'wife', medical_conditions: [] },
        { name: 'Arjun', age: 5, relationship: 'son', medical_conditions: [] },
      ],
      has_vehicle: false,
      has_pet: false,
      livestock_count: 0,
      income_bracket: 'MIG',
      location: TEST_CONFIG.locations.kolkata,
      language: 'bn',
      flood_risk: 'high',
    },

    childWithParent: {
      name: 'Ananya',
      age: 10,
      gender: 'female',
      medical_conditions: ['asthma'],
      disabilities: [],
      home_type: 'apartment',
      floor: 3,
      family_size: 4,
      family_members: [
        { name: 'Vijay', age: 40, relationship: 'father', medical_conditions: [] },
        { name: 'Meera', age: 38, relationship: 'mother', medical_conditions: [] },
        { name: 'Kiran', age: 14, relationship: 'sister', medical_conditions: [] },
      ],
      has_vehicle: true,
      vehicle_type: 'car',
      has_pet: true,
      pet_types: ['cat'],
      livestock_count: 0,
      income_bracket: 'HIG',
      location: TEST_CONFIG.locations.chennai,
      language: 'ta',
      flood_risk: 'high',
    },

    dialysisPatient: {
      name: 'Ganesh Kumar',
      age: 55,
      gender: 'male',
      medical_conditions: ['dialysis', 'anemia'],
      disabilities: [],
      home_type: 'apartment',
      floor: 1,
      family_size: 3,
      family_members: [
        { name: 'Kamala', age: 50, relationship: 'wife', medical_conditions: [] },
        { name: 'Priya', age: 22, relationship: 'daughter', medical_conditions: [] },
      ],
      has_vehicle: false,
      has_pet: false,
      livestock_count: 0,
      income_bracket: 'LIG',
      location: TEST_CONFIG.locations.chennai,
      language: 'ta',
      flood_risk: 'high',
    },

    pregnantWomanHighRisk: {
      name: 'Fatima Sheikh',
      age: 28,
      gender: 'female',
      medical_conditions: ['pregnancy_8months', 'gestational_diabetes'],
      disabilities: [],
      home_type: 'slum',
      floor: 0,
      family_size: 4,
      family_members: [
        { name: 'Imran', age: 30, relationship: 'husband', medical_conditions: [] },
        { name: 'Zara', age: 3, relationship: 'daughter', medical_conditions: [] },
        { name: 'Mother', age: 55, relationship: 'mother', medical_conditions: ['hypertension'] },
      ],
      has_vehicle: false,
      has_pet: false,
      livestock_count: 0,
      income_bracket: 'EWS',
      location: TEST_CONFIG.locations.mumbaiFlood,
      language: 'ur',
      flood_risk: 'very_high',
    },
  },

  // ============================================================
  // ALERT FIXTURES
  // ============================================================
  alerts: {
    lightRainWatch: {
      type: 'weather',
      severity: 'watch',
      title: 'Light Rainfall Expected',
      summary: 'Light to moderate rainfall expected in Mumbai region over next 24 hours.',
      affected_areas: ['Mumbai', 'Thane', 'Navi Mumbai'],
      recommended_actions: ['Carry umbrella', 'Check road conditions before travel'],
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      confidence: 0.92,
    },

    heavyRainWarning: {
      type: 'weather',
      severity: 'warning',
      title: 'Heavy Rainfall Warning - Mumbai',
      summary: 'IMD has issued orange warning for Mumbai. Expect 65-115mm rainfall in next 24 hours.',
      affected_areas: ['Mumbai', 'Thane', 'Palghar'],
      recommended_actions: [
        'Avoid low-lying areas',
        'Keep emergency kit ready',
        'Stay away from waterlogged areas',
        'Keep phone charged',
      ],
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      confidence: 0.88,
    },

    extremeFloodEmergency: {
      type: 'flood',
      severity: 'emergency',
      title: 'FLASH FLOOD EMERGENCY - Mumbai',
      summary: 'Flash flooding imminent in Andheri, Bandra, Kurla areas. Water levels rising rapidly.',
      affected_areas: ['Andheri East', 'Andheri West', 'Bandra', 'Kurla', 'Sion'],
      recommended_actions: [
        'EVACUATE IMMEDIATELY to higher ground',
        'Do NOT attempt to cross flooded roads',
        'Call 112 if trapped',
        'Move to upper floors if unable to evacuate',
        'Switch off electricity mains',
      ],
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 43200000).toISOString(),
      confidence: 0.95,
    },

    cycloneExtreme: {
      type: 'weather',
      severity: 'extreme',
      title: 'CYCLONE ALERT - Category 3',
      summary: 'Severe cyclonic storm making landfall. Wind speeds 120-150 km/h. Storm surge 3-5 meters expected.',
      affected_areas: ['Odisha Coast', 'Puri', 'Khurda', 'Jagatsinghpur'],
      recommended_actions: [
        'EVACUATE to designated cyclone shelters IMMEDIATELY',
        'Do NOT stay in coastal areas or temporary structures',
        'Store drinking water and medicines',
        'Keep important documents in waterproof bag',
        'Switch off gas and electricity',
        'Stay away from windows during storm',
      ],
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 172800000).toISOString(),
      confidence: 0.97,
    },

    dengueHealthAlert: {
      type: 'health',
      severity: 'warning',
      title: 'Dengue Outbreak Alert - Ward 45',
      summary: 'Spike in dengue cases detected in Ward 45, Mumbai. 23 cases reported in last week.',
      affected_areas: ['Ward 45 - Andheri East', 'Ward 46 - Jogeshwari'],
      recommended_actions: [
        'Use mosquito repellent',
        'Wear full-sleeved clothing',
        'Remove stagnant water from surroundings',
        'Consult doctor if fever > 102°F',
        'Do NOT take aspirin/ibuprofen',
      ],
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 604800000).toISOString(),
      confidence: 0.85,
    },

    waterContaminationAlert: {
      type: 'health',
      severity: 'emergency',
      title: 'WATER CONTAMINATION - Sion Area',
      summary: 'Bacterial contamination detected in municipal water supply. Do NOT drink tap water.',
      affected_areas: ['Sion', 'Wadala', 'Matunga'],
      recommended_actions: [
        'DO NOT drink tap water without boiling',
        'Use bottled or purified water only',
        'Boil water for at least 10 minutes',
        'Report illness to nearest hospital',
      ],
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 259200000).toISOString(),
      confidence: 0.91,
    },

    powerOutageAlert: {
      type: 'infrastructure',
      severity: 'warning',
      title: 'Power Outage Expected',
      summary: 'MSEDCL has announced planned outage in Bandra area for 6-8 hours due to transformer maintenance.',
      affected_areas: ['Bandra West', 'Bandra East'],
      recommended_actions: [
        'Charge all devices now',
        'Stock battery-powered lights',
        'Keep refrigerator closed during outage',
        'Store drinking water',
      ],
      valid_from: new Date(Date.now() + 3600000).toISOString(),
      valid_until: new Date(Date.now() + 32400000).toISOString(),
      confidence: 1.0,
    },

    landslideWarning: {
      type: 'infrastructure',
      severity: 'emergency',
      title: 'LANDSLIDE WARNING - Western Ghats',
      summary: 'Heavy rainfall has destabilized slopes near Lonavala-Pune highway. Landslide imminent.',
      affected_areas: ['Lonavala', 'Khandala', 'Pune-Mumbai Expressway KM 45-52'],
      recommended_actions: [
        'AVOID Pune-Mumbai Expressway',
        'Do NOT stop on highway near hillsides',
        'Use alternate route via National Highway 4',
        'Stay indoors if in hilly area',
      ],
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      confidence: 0.87,
    },
  },

  // ============================================================
  // CHAT CONVERSATIONS
  // ============================================================
  chatScenarios: {
    preparednessQuery: {
      messages: [
        { role: 'user', content: 'What should I do to prepare for monsoon?' },
        { role: 'assistant', content: 'generated_plan', language: 'en' },
      ],
      expectedFeatures: ['checklist', 'emergency_kit', 'evacuation_route'],
    },

    emergencyQuery: {
      messages: [
        { role: 'user', content: 'Water is entering my house! What should I do?' },
        { role: 'assistant', content: 'emergency_guidance', urgency: true },
      ],
      expectedFeatures: ['immediate_actions', 'safety_steps', 'emergency_contacts'],
    },

    multilingualQuery: {
      messages: [
        { role: 'user', content: 'मला भोळे आले आहेत, मी काय करावे?', language: 'mr' },
        { role: 'assistant', content: 'marathi_response', language: 'mr' },
      ],
      expectedFeatures: ['local_language_response', 'actionable_steps'],
    },

    healthQuery: {
      messages: [
        { role: 'user', content: 'I am diabetic. What medicines should I stock for monsoon?' },
        { role: 'assistant', content: 'medical_guidance', disclaimer: true },
      ],
      expectedFeatures: ['medicine_list', 'storage_tips', 'medical_disclaimer'],
    },

    imageAnalysisQuery: {
      messages: [
        { role: 'user', content: 'Is this road safe to drive through?', image: 'flooded_road.jpg' },
        { role: 'assistant', content: 'road_assessment' },
      ],
      expectedFeatures: ['safety_assessment', 'recommendation', 'confidence_score'],
    },

    livestockQuery: {
      messages: [
        { role: 'user', content: 'माझ्या गायींना पूर आली तर काय करायचं?', language: 'mr' },
        { role: 'assistant', content: 'livestock_guidance', language: 'mr' },
      ],
      expectedFeatures: ['evacuation_plan', 'feed_storage', 'veterinary_contacts'],
    },

    travelQuery: {
      messages: [
        { role: 'user', content: 'I need to travel from Mumbai to Pune today. Is it safe?' },
        { role: 'assistant', content: 'travel_advisory' },
      ],
      expectedFeatures: ['route_assessment', 'alternatives', 'safety_tips'],
    },

    fakeNewsQuery: {
      messages: [
        { role: 'user', content: 'Is it true that Mumbai will be underwater tomorrow? I saw it on WhatsApp.' },
        { role: 'assistant', content: 'fact_check', source: 'verified' },
      ],
      expectedFeatures: ['fact_check', 'official_source', 'confidence'],
    },
  },

  // ============================================================
  // REPORT FIXTURES
  // ============================================================
  reports: {
    floodReport: {
      report_type: 'flood',
      severity: 'high',
      location: TEST_CONFIG.locations.mumbaiFlood,
      description: 'Waterlogging near Andheri railway station. Knee-deep water on main road.',
      media_urls: [],
    },

    roadBlockReport: {
      report_type: 'road',
      severity: 'critical',
      location: { lat: 19.0596, lon: 72.8295 },
      description: 'Fallen tree blocking Western Express Highway near Bandra Flyover.',
      media_urls: [],
    },

    powerOutageReport: {
      report_type: 'power',
      severity: 'medium',
      location: { lat: 19.0300, lon: 72.8500 },
      description: 'Complete power outage in Dharavi area for last 4 hours.',
      media_urls: [],
    },

    healthReport: {
      report_type: 'health',
      severity: 'high',
      location: { lat: 19.0400, lon: 72.8600 },
      description: 'Multiple people complaining of fever and vomiting in our colony. Suspected water contamination.',
      media_urls: [],
    },

    buildingDamageReport: {
      report_type: 'infrastructure',
      severity: 'critical',
      location: { lat: 19.0500, lon: 72.8400 },
      description: 'Building wall has cracks and is leaning after heavy rain. Residents evacuated.',
      media_urls: [],
    },
  },

  // ============================================================
  // DAMAGE ASSESSMENT FIXTURES
  // ============================================================
  damageScenarios: {
    minorFlood: {
      description: 'Water level reached 6 inches in ground floor. Some furniture damaged.',
      property_type: 'apartment',
      estimated_severity: 'minor',
      estimated_cost_range: { min: 15000, max: 40000 },
    },

    moderateFlood: {
      description: 'Water level reached 2 feet. Flooring, lower walls, furniture, and appliances damaged.',
      property_type: 'independent_house',
      estimated_severity: 'moderate',
      estimated_cost_range: { min: 100000, max: 300000 },
    },

    severeFlood: {
      description: 'Water level reached ceiling height. Entire ground floor destroyed. Structural cracks visible.',
      property_type: 'independent_house',
      estimated_severity: 'severe',
      estimated_cost_range: { min: 500000, max: 1500000 },
    },

    collapsedStructure: {
      description: 'House collapsed due to flood and landslide. Total destruction.',
      property_type: 'kutchha',
      estimated_severity: 'destroyed',
      estimated_cost_range: { min: 300000, max: 800000 },
    },
  },

  // ============================================================
  // SHELTER FIXTURES
  // ============================================================
  shelterScenarios: {
    accessibleShelter: {
      name: 'Community Center A',
      capacity: 500,
      current_occupancy: 100,
      facilities: ['beds', 'food', 'water', 'medical', 'power_backup', 'toilets', 'baby_care'],
      accessibility: ['wheelchair', 'ramp', 'elevator'],
      pet_friendly: true,
      status: 'open',
    },

    fullShelter: {
      name: 'School B',
      capacity: 300,
      current_occupancy: 300,
      facilities: ['food', 'water'],
      accessibility: [],
      pet_friendly: false,
      status: 'full',
    },

    specialNeedsShelter: {
      name: 'Hospital Annex C',
      capacity: 200,
      current_occupancy: 50,
      facilities: ['beds', 'food', 'water', 'medical', 'power_backup', 'oxygen', 'dialysis'],
      accessibility: ['wheelchair', 'ramp', 'bed_ridden'],
      pet_friendly: false,
      status: 'open',
      special_services: ['maternity', 'dialysis', 'oxygen_therapy'],
    },
  },

  // ============================================================
  // INSURANCE FIXTURES
  // ============================================================
  insurancePolicies: {
    homeInsurance: {
      policy_number: 'HOME-TEST-001',
      policy_type: 'home',
      coverage_amount: 5000000,
      premium: 12000,
      deductible: 25000,
      covers: ['fire', 'flood', 'earthquake', 'theft'],
      exclusions: ['war', 'nuclear', ' intentional_damage'],
      valid_from: '2025-04-01',
      valid_until: '2026-03-31',
    },

    vehicleInsurance: {
      policy_number: 'VEH-TEST-001',
      policy_type: 'vehicle',
      vehicle_type: 'car',
      coverage_amount: 800000,
      premium: 8000,
      covers: ['accident', 'flood', 'theft', 'fire'],
      valid_from: '2025-06-01',
      valid_until: '2026-05-31',
    },
  },

  // ============================================================
  // GOVERNMENT SCHEME FIXTURES
  // ============================================================
  govtSchemes: {
    pmFasalBimaYojana: {
      name: 'Pradhan Mantri Fasal Bima Yojana',
      eligibility: ['farmer', 'BPL'],
      coverage: 'Crop loss due to natural calamities',
      claim_amount: 'Up to Rs 2 lakh per hectare',
      deadline: 'Within 72 hours of crop loss',
    },

    stateDisasterRelief: {
      name: 'State Disaster Response Fund',
      eligibility: ['flood_affected', 'displaced'],
      coverage: 'Immediate relief and rehabilitation',
      claim_amount: 'Rs 38,000 per family',
      deadline: 'Within 30 days',
    },
  },
};

module.exports = FIXTURES;
