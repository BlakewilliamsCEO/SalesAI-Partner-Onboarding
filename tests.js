/**
 * SalesAI Partner Application - Test Suite
 * Run with: node tests.js
 */

// ============================================
// Mock DOM environment for Node.js
// ============================================

const mockDocument = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ innerHTML: '', classList: { add: () => {}, remove: () => {} } })
};

const mockWindow = {
  scrollTo: () => {},
  location: { reload: () => {} }
};

// Set globals before loading app.js
global.document = mockDocument;
global.window = mockWindow;
global.fetch = async () => ({ ok: false, json: async () => ({}) });

// ============================================
// Test Framework
// ============================================

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  test(name, fn) {
    try {
      fn();
      this.passed++;
      this.results.push({ name, status: 'pass' });
      console.log(`  ✓ ${name}`);
    } catch (error) {
      this.failed++;
      this.results.push({ name, status: 'fail', error: error.message });
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${error.message}`);
    }
  }

  assert(condition, message = 'Assertion failed') {
    if (!condition) throw new Error(message);
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected "${expected}", got "${actual}"`);
    }
  }

  assertArrayIncludes(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(message || `Array does not include "${item}"`);
    }
  }

  assertArrayLength(array, length, message) {
    if (array.length !== length) {
      throw new Error(message || `Expected array length ${length}, got ${array.length}`);
    }
  }

  assertTrue(condition, message) {
    if (condition !== true) {
      throw new Error(message || `Expected true, got ${condition}`);
    }
  }

  assertFalse(condition, message) {
    if (condition !== false) {
      throw new Error(message || `Expected false, got ${condition}`);
    }
  }

  summary() {
    console.log('\n' + '='.repeat(50));
    console.log(`Results: ${this.passed} passed, ${this.failed} failed, ${this.passed + this.failed} total`);
    console.log('='.repeat(50));
    return this.failed === 0;
  }
}

// ============================================
// Import/Mock Application Code
// ============================================

// Since we can't easily import ES modules, we'll define the key functions here
// These mirror the actual implementation in app.js

const CompanyAPI = {
  apiKey: null,
  baseUrl: 'https://api.thecompaniesapi.com/v2',
  enrichedData: null,
  isEnriching: false,
  enrichmentAttempted: false,

  init(key) {
    this.apiKey = key;
  },

  extractDomain(input) {
    if (!input) return null;
    if (input.includes('@')) {
      return input.split('@')[1].toLowerCase();
    }
    try {
      let url = input;
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '').toLowerCase();
    } catch (e) {
      return input.toLowerCase();
    }
  },

  normalizeCompanyData(apiData) {
    const parseEmployeeCount = (range) => {
      if (!range) return null;
      if (range === 'over-10k') return 10000;
      const match = range.match(/(\d+)-(\d+)/);
      if (match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
      return apiData.about?.totalEmployeesExact || null;
    };

    return {
      name: apiData.about?.name || null,
      nameLegal: apiData.about?.nameLegal || null,
      domain: apiData.domain?.domain || null,
      logo: apiData.assets?.logoSquare?.src || null,
      description: apiData.descriptions?.primary || apiData.descriptions?.tagline || null,
      industry: apiData.about?.industry || null,
      industries: apiData.about?.industries || [],
      businessType: apiData.about?.businessType || null,
      tags: apiData.about?.industries || [],
      employeeCount: apiData.about?.totalEmployeesExact || parseEmployeeCount(apiData.about?.totalEmployees),
      employeeRange: apiData.about?.totalEmployees || null,
      estimatedRevenue: apiData.finances?.revenue || null,
      revenueRange: apiData.finances?.revenue || null,
      headquarters: {
        city: apiData.locations?.headquarters?.city?.name || null,
        state: apiData.locations?.headquarters?.state?.name || null,
        country: apiData.locations?.headquarters?.country?.name || null,
        countryCode: apiData.locations?.headquarters?.country?.code?.toUpperCase() || null,
        address: apiData.locations?.headquarters?.address?.raw || null
      },
      technologies: apiData.technologies?.active || apiData.technologies?.details?.map(t => t.slug) || [],
      technologyCategories: apiData.technologies?.categories || [],
      linkedin: apiData.socials?.linkedin?.url || null,
      twitter: apiData.socials?.twitter?.url || null,
      facebook: apiData.socials?.facebook?.url || null,
      github: apiData.socials?.github?.url || null,
      companyType: apiData.about?.businessType || null,
      foundedYear: apiData.about?.yearFounded || null,
      stockSymbol: apiData.finances?.stockSymbol || null,
      stockExchange: apiData.finances?.stockExchange || null,
      emails: apiData.contacts?.emails || [],
      phones: apiData.contacts?.phones || [],
      naicsCodes: apiData.codes?.naics || [],
      sicCodes: apiData.codes?.sic || []
    };
  },

  getEmployeeRange(count) {
    if (!count) return null;
    if (count <= 10) return '1-10';
    if (count <= 50) return '11-50';
    if (count <= 100) return '51-100';
    if (count <= 500) return '101-500';
    return '500+';
  },

  getSuggestedVerticals() {
    if (!this.enrichedData) return [];
    const allIndustries = [
      this.enrichedData.industry,
      ...(this.enrichedData.industries || [])
    ].filter(Boolean).map(i => i.toLowerCase());

    if (allIndustries.length === 0) return [];

    const industryMap = {
      'software': 'SaaS / Software',
      'software-development': 'SaaS / Software',
      'computer-software': 'SaaS / Software',
      'technology-information-and-internet': 'SaaS / Software',
      'cloud-computing': 'SaaS / Software',
      'enterprise-software': 'SaaS / Software',
      'business-software': 'SaaS / Software',
      'saas': 'SaaS / Software',
      'financial': 'Financial Services',
      'financial-services': 'Financial Services',
      'banking': 'Financial Services',
      'insurance': 'Financial Services',
      'fintech': 'Financial Services',
      'healthcare': 'Healthcare',
      'medical': 'Healthcare',
      'hospitals': 'Healthcare',
      'pharmaceuticals': 'Healthcare',
      'health-care': 'Healthcare',
      'consulting': 'Professional Services',
      'professional-services': 'Professional Services',
      'legal': 'Professional Services',
      'legal-services': 'Professional Services',
      'accounting': 'Professional Services',
      'manufacturing': 'Manufacturing',
      'industrial': 'Manufacturing',
      'computers-and-electronics-manufacturing': 'Manufacturing',
      'retail': 'Retail / E-commerce',
      'e-commerce': 'Retail / E-commerce',
      'ecommerce': 'Retail / E-commerce',
      'shopping': 'Retail / E-commerce',
      'consumer-internet': 'Retail / E-commerce',
      'real-estate': 'Real Estate',
      'real estate': 'Real Estate',
      'property': 'Real Estate',
      'marketing': 'Marketing / Agencies',
      'advertising': 'Marketing / Agencies',
      'agency': 'Marketing / Agencies',
      'digital-marketing': 'Marketing / Agencies'
    };

    const matchedVerticals = new Set();
    for (const industry of allIndustries) {
      for (const [key, vertical] of Object.entries(industryMap)) {
        if (industry.includes(key) || key.includes(industry)) {
          matchedVerticals.add(vertical);
        }
      }
    }
    return Array.from(matchedVerticals);
  },

  getDetectedCRMs() {
    if (!this.enrichedData?.technologies || this.enrichedData.technologies.length === 0) return [];

    const crmTechMap = {
      'salesforce': 'Salesforce',
      'salesforce-commerce-cloud': 'Salesforce',
      'salesforce-marketing-cloud': 'Salesforce',
      'hubspot': 'HubSpot',
      'hubspot-crm': 'HubSpot',
      'pipedrive': 'Pipedrive',
      'microsoft-dynamics': 'Microsoft Dynamics',
      'dynamics-365': 'Microsoft Dynamics',
      'zoho': 'Zoho CRM',
      'zoho-crm': 'Zoho CRM',
      'close': 'Close',
      'close-io': 'Close'
    };

    const detected = new Set();
    const techStack = this.enrichedData.technologies.map(t =>
      (typeof t === 'string' ? t : t.slug || t.name || '').toLowerCase()
    );

    for (const tech of techStack) {
      if (crmTechMap[tech]) {
        detected.add(crmTechMap[tech]);
        continue;
      }
      for (const [keyword, crmName] of Object.entries(crmTechMap)) {
        if (tech.includes(keyword)) {
          detected.add(crmName);
        }
      }
    }
    return Array.from(detected);
  },

  getSuggestedACVRange() {
    if (!this.enrichedData?.employeeCount) return null;
    const count = this.enrichedData.employeeCount;
    if (count <= 50) return '5k-15k';
    if (count <= 200) return '15k-50k';
    if (count <= 1000) return '50k-100k';
    return '100k+';
  },

  hasEnrichedData() {
    return this.enrichedData !== null;
  }
};

// Sections configuration
const sections = [
  { id: 'identity', label: 'Identity', title: 'Partner Identity', badge: 'Section A', required: true },
  { id: 'partnership', label: 'Partnership', title: 'Partnership Model', badge: 'Section B', required: true },
  { id: 'icp', label: 'ICP & Fit', title: 'ICP & Market Fit', badge: 'Section C', scoring: true },
  { id: 'revenue', label: 'Revenue', title: 'Revenue Quality', badge: 'Section D', scoring: true },
  { id: 'gtm', label: 'GTM', title: 'Sales Motion & GTM', badge: 'Section E', scoring: true },
  { id: 'service', label: 'Service', title: 'Service Delivery', badge: 'Section F', scoring: true },
  { id: 'scale', label: 'Scale', title: 'Scale Potential', badge: 'Section G', scoring: true },
  { id: 'alignment', label: 'Alignment', title: 'Alignment & Goals', badge: 'Section H', internal: true },
  { id: 'payout', label: 'Payout', title: 'Payout Setup', badge: 'Section I', required: true }
];

// Constants
const SCORE_THRESHOLD = 60;
const MAX_SCORE = 100;

// State object
const state = {
  currentSection: 0,
  score: 0,
  disqualified: false,
  disqualifyReasons: [],
  data: {
    companyName: '',
    companyWebsite: '',
    contactName: '',
    contactEmail: '',
    contactTitle: '',
    country: '',
    timezone: '',
    partnerType: '',
    agreementAccepted: false,
    primaryICP: '',
    icpMatchPercent: '',
    primaryVerticals: [],
    paidCustomerProblems: '',
    avgMonthlyCallVolume: '',
    crmStack: [],
    averageACV: '',
    avgContractLength: '',
    recurringRevenuePercent: '',
    activeCustomers: '',
    customerLifetime: '',
    existingServicesSold: '',
    primaryGTMMotion: '',
    runsSalesDemos: '',
    salesTeamSize: '',
    salesCycleLength: '',
    currentSaaSPartnerships: '',
    aiPositioningConfidence: 3,
    providesServices: '',
    maxConcurrentCustomers: '',
    hasServicePlaybooks: '',
    postSaleOwner: '',
    firstLineSupportOwnership: '',
    ninetyDayOpportunityEstimate: '',
    yearOneRevenueGoal: '',
    preferredPartnerPath: '',
    monthlyTimeCommitment: '',
    openToCoMarketing: '',
    whySalesAINow: '',
    failureConditions: '',
    payoutEntityType: '',
    taxSetupReady: ''
  }
};

// Scoring function
function calculateScore() {
  let score = 0;
  state.disqualified = false;
  state.disqualifyReasons = [];

  // Check hard disqualifiers
  if (state.data.avgMonthlyCallVolume === '0') {
    state.disqualified = true;
    state.disqualifyReasons.push('Customers do not make sales calls (SalesAI requires call volume)');
  }

  if (state.data.crmStack.includes('None / Custom') && state.data.crmStack.length === 1) {
    state.disqualified = true;
    state.disqualifyReasons.push('No CRM integration available');
  }

  if (state.data.runsSalesDemos === 'no' &&
      state.data.salesTeamSize === '0' &&
      state.data.preferredPartnerPath === 'referral-only') {
    state.disqualified = true;
    state.disqualifyReasons.push('Limited sales capability for partnership success');
  }

  // ICP Match scoring (max 20 points)
  const icpScores = { '0-25': 5, '26-50': 10, '51-75': 15, '76-100': 20 };
  score += icpScores[state.data.icpMatchPercent] || 0;

  // Call volume scoring (max 15 points)
  const callScores = { '0': 0, '1-50': 5, '51-200': 10, '201-500': 13, '500+': 15 };
  score += callScores[state.data.avgMonthlyCallVolume] || 0;

  // Revenue quality scoring (max 15 points)
  const acvScores = { '<5k': 3, '5k-15k': 6, '15k-50k': 10, '50k-100k': 13, '100k+': 15 };
  score += acvScores[state.data.averageACV] || 0;

  // Active customers scoring (max 10 points)
  const customerScores = { '1-10': 3, '11-50': 5, '51-100': 7, '101-500': 9, '500+': 10 };
  score += customerScores[state.data.activeCustomers] || 0;

  // Sales capability scoring (max 15 points)
  if (state.data.runsSalesDemos === 'yes') score += 5;
  if (state.data.runsSalesDemos === 'sometimes') score += 3;

  const teamScores = { '0': 0, '1-2': 3, '3-5': 5, '6-10': 7, '10+': 10 };
  score += teamScores[state.data.salesTeamSize] || 0;

  // Service capability scoring (max 10 points)
  if (state.data.providesServices === 'yes') score += 5;
  if (state.data.hasServicePlaybooks === 'yes') score += 3;
  if (state.data.firstLineSupportOwnership === 'yes') score += 2;

  // Scale potential scoring (max 15 points)
  const oppScores = { '0': 0, '1-3': 3, '4-10': 7, '11-25': 12, '25+': 15 };
  score += oppScores[state.data.ninetyDayOpportunityEstimate] || 0;

  state.score = Math.min(100, Math.round(score));
}

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// Run Tests
// ============================================

const runner = new TestRunner();

console.log('\n🧪 SalesAI Partner Application - Test Suite\n');
console.log('='.repeat(50));

// CompanyAPI Tests
console.log('\n📦 CompanyAPI Tests\n');

runner.test('CompanyAPI should be defined', () => {
  runner.assert(typeof CompanyAPI === 'object');
});

runner.test('init should set API key', () => {
  CompanyAPI.init('test-key');
  runner.assertEqual(CompanyAPI.apiKey, 'test-key');
});

runner.test('extractDomain from URL with www', () => {
  runner.assertEqual(CompanyAPI.extractDomain('https://www.microsoft.com'), 'microsoft.com');
});

runner.test('extractDomain from URL without www', () => {
  runner.assertEqual(CompanyAPI.extractDomain('https://hubspot.com'), 'hubspot.com');
});

runner.test('extractDomain from email', () => {
  runner.assertEqual(CompanyAPI.extractDomain('john@salesforce.com'), 'salesforce.com');
});

runner.test('extractDomain from bare domain', () => {
  runner.assertEqual(CompanyAPI.extractDomain('example.com'), 'example.com');
});

runner.test('extractDomain handles null', () => {
  runner.assertEqual(CompanyAPI.extractDomain(null), null);
});

runner.test('getEmployeeRange for 1-10', () => {
  runner.assertEqual(CompanyAPI.getEmployeeRange(5), '1-10');
});

runner.test('getEmployeeRange for 11-50', () => {
  runner.assertEqual(CompanyAPI.getEmployeeRange(25), '11-50');
});

runner.test('getEmployeeRange for 51-100', () => {
  runner.assertEqual(CompanyAPI.getEmployeeRange(75), '51-100');
});

runner.test('getEmployeeRange for 101-500', () => {
  runner.assertEqual(CompanyAPI.getEmployeeRange(300), '101-500');
});

runner.test('getEmployeeRange for 500+', () => {
  runner.assertEqual(CompanyAPI.getEmployeeRange(1000), '500+');
});

runner.test('normalizeCompanyData handles empty input', () => {
  const result = CompanyAPI.normalizeCompanyData({});
  runner.assertEqual(result.name, null);
  runner.assert(Array.isArray(result.industries));
});

runner.test('normalizeCompanyData extracts nested data', () => {
  const result = CompanyAPI.normalizeCompanyData({
    about: { name: 'Test Corp', industry: 'tech' },
    locations: { headquarters: { country: { code: 'us' } } }
  });
  runner.assertEqual(result.name, 'Test Corp');
  runner.assertEqual(result.headquarters.countryCode, 'US');
});

// Industry Matching Tests
console.log('\n🏭 Industry Matching Tests\n');

runner.test('getSuggestedVerticals for software', () => {
  CompanyAPI.enrichedData = { industry: 'software-development', industries: [] };
  runner.assertArrayIncludes(CompanyAPI.getSuggestedVerticals(), 'SaaS / Software');
});

runner.test('getSuggestedVerticals for healthcare', () => {
  CompanyAPI.enrichedData = { industry: 'healthcare', industries: [] };
  runner.assertArrayIncludes(CompanyAPI.getSuggestedVerticals(), 'Healthcare');
});

runner.test('getSuggestedVerticals for financial services', () => {
  CompanyAPI.enrichedData = { industry: 'banking', industries: ['financial-services'] };
  runner.assertArrayIncludes(CompanyAPI.getSuggestedVerticals(), 'Financial Services');
});

runner.test('getSuggestedVerticals for real estate', () => {
  CompanyAPI.enrichedData = { industry: 'real-estate', industries: [] };
  runner.assertArrayIncludes(CompanyAPI.getSuggestedVerticals(), 'Real Estate');
});

runner.test('getSuggestedVerticals returns empty for unknown', () => {
  CompanyAPI.enrichedData = { industry: 'xyz-unknown', industries: [] };
  runner.assertArrayLength(CompanyAPI.getSuggestedVerticals(), 0);
});

// CRM Detection Tests
console.log('\n🔌 CRM Detection Tests\n');

runner.test('getDetectedCRMs finds Salesforce', () => {
  CompanyAPI.enrichedData = { technologies: ['salesforce', 'react'] };
  runner.assertArrayIncludes(CompanyAPI.getDetectedCRMs(), 'Salesforce');
});

runner.test('getDetectedCRMs finds HubSpot', () => {
  CompanyAPI.enrichedData = { technologies: ['hubspot'] };
  runner.assertArrayIncludes(CompanyAPI.getDetectedCRMs(), 'HubSpot');
});

runner.test('getDetectedCRMs finds multiple CRMs', () => {
  CompanyAPI.enrichedData = { technologies: ['salesforce', 'hubspot', 'pipedrive'] };
  runner.assertArrayLength(CompanyAPI.getDetectedCRMs(), 3);
});

runner.test('getDetectedCRMs returns empty for no CRMs', () => {
  CompanyAPI.enrichedData = { technologies: ['react', 'node-js'] };
  runner.assertArrayLength(CompanyAPI.getDetectedCRMs(), 0);
});

runner.test('getDetectedCRMs handles empty technologies', () => {
  CompanyAPI.enrichedData = { technologies: [] };
  runner.assertArrayLength(CompanyAPI.getDetectedCRMs(), 0);
});

// ACV Suggestion Tests
console.log('\n💰 ACV Suggestion Tests\n');

runner.test('getSuggestedACVRange for small company (30 employees)', () => {
  CompanyAPI.enrichedData = { employeeCount: 30 };
  runner.assertEqual(CompanyAPI.getSuggestedACVRange(), '5k-15k');
});

runner.test('getSuggestedACVRange for medium company (150 employees)', () => {
  CompanyAPI.enrichedData = { employeeCount: 150 };
  runner.assertEqual(CompanyAPI.getSuggestedACVRange(), '15k-50k');
});

runner.test('getSuggestedACVRange for large company (800 employees)', () => {
  CompanyAPI.enrichedData = { employeeCount: 800 };
  runner.assertEqual(CompanyAPI.getSuggestedACVRange(), '50k-100k');
});

runner.test('getSuggestedACVRange for enterprise (5000 employees)', () => {
  CompanyAPI.enrichedData = { employeeCount: 5000 };
  runner.assertEqual(CompanyAPI.getSuggestedACVRange(), '100k+');
});

// Section Configuration Tests
console.log('\n📋 Section Configuration Tests\n');

runner.test('should have 9 sections', () => {
  runner.assertArrayLength(sections, 9);
});

runner.test('first section is identity', () => {
  runner.assertEqual(sections[0].id, 'identity');
});

runner.test('last section is payout', () => {
  runner.assertEqual(sections[8].id, 'payout');
});

runner.test('ICP section has scoring flag', () => {
  const icp = sections.find(s => s.id === 'icp');
  runner.assertEqual(icp.scoring, true);
});

runner.test('alignment section is internal only', () => {
  const alignment = sections.find(s => s.id === 'alignment');
  runner.assertEqual(alignment.internal, true);
});

// Scoring Tests
console.log('\n📊 Scoring Tests\n');

runner.test('disqualifies for no call volume', () => {
  state.data.avgMonthlyCallVolume = '0';
  calculateScore();
  runner.assert(state.disqualified === true);
  runner.assert(state.disqualifyReasons.length > 0);
  state.data.avgMonthlyCallVolume = '';
  state.disqualified = false;
  state.disqualifyReasons = [];
});

runner.test('disqualifies for no CRM', () => {
  state.data.crmStack = ['None / Custom'];
  calculateScore();
  runner.assert(state.disqualified === true);
  state.data.crmStack = [];
  state.disqualified = false;
  state.disqualifyReasons = [];
});

runner.test('adds points for high ICP match', () => {
  state.data.icpMatchPercent = '76-100';
  calculateScore();
  runner.assert(state.score >= 20);
  state.data.icpMatchPercent = '';
  state.score = 0;
});

runner.test('adds points for high call volume', () => {
  state.data.avgMonthlyCallVolume = '500+';
  calculateScore();
  runner.assert(state.score >= 15);
  state.data.avgMonthlyCallVolume = '';
  state.score = 0;
});

runner.test('score is capped at 100', () => {
  state.data.icpMatchPercent = '76-100';
  state.data.avgMonthlyCallVolume = '500+';
  state.data.averageACV = '100k+';
  state.data.activeCustomers = '500+';
  state.data.runsSalesDemos = 'yes';
  state.data.salesTeamSize = '10+';
  state.data.providesServices = 'yes';
  state.data.hasServicePlaybooks = 'yes';
  state.data.firstLineSupportOwnership = 'yes';
  state.data.ninetyDayOpportunityEstimate = '25+';
  calculateScore();
  runner.assert(state.score <= 100);
});

// Validation Tests
console.log('\n✅ Validation Tests\n');

runner.test('isValidEmail accepts valid email', () => {
  runner.assert(isValidEmail('test@example.com'));
});

runner.test('isValidEmail rejects no @', () => {
  runner.assert(!isValidEmail('testexample.com'));
});

runner.test('isValidEmail rejects no domain', () => {
  runner.assert(!isValidEmail('test@'));
});

runner.test('isValidEmail rejects empty', () => {
  runner.assert(!isValidEmail(''));
});

// Constants Tests
console.log('\n⚙️ Constants Tests\n');

runner.test('SCORE_THRESHOLD is 60', () => {
  runner.assertEqual(SCORE_THRESHOLD, 60);
});

runner.test('MAX_SCORE is 100', () => {
  runner.assertEqual(MAX_SCORE, 100);
});

// ============================================
// NAVBAR DETECTION & PARTNERSHIP PROFILE TESTS
// ============================================

// Mock functions for navbar detection and partnership profile testing
const NavbarDetection = {
  // Keywords for categorization
  customerKeywords: [
    'customers', 'clients', 'case studies', 'case-studies', 'casestudies',
    'success stories', 'success-stories', 'testimonials', 'who we serve'
  ],

  partnerKeywords: [
    'partners', 'integrations', 'integration', 'technology', 'tech partners',
    'ecosystem', 'alliances', 'marketplace', 'apps', 'connect'
  ],

  roleKeywords: [
    'for sales', 'for marketing', 'for revenue', 'for revops',
    'sales teams', 'marketing teams', 'for sdrs', 'for aes'
  ],

  industryKeywords: [
    'healthcare', 'financial services', 'fintech', 'manufacturing',
    'retail', 'saas', 'software', 'real estate', 'professional services'
  ],

  useCaseKeywords: [
    'lead generation', 'lead gen', 'pipeline', 'prospecting',
    'sales engagement', 'sales automation', 'outbound', 'inbound'
  ],

  // Check if text matches keywords
  matchesKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  },

  // Categorize a nav link
  categorizeLink(text, href) {
    const categories = [];

    if (this.matchesKeywords(text, this.customerKeywords) ||
        this.matchesKeywords(href, this.customerKeywords)) {
      categories.push('customer');
    }
    if (this.matchesKeywords(text, this.partnerKeywords) ||
        this.matchesKeywords(href, this.partnerKeywords)) {
      categories.push('partner');
    }
    if (this.matchesKeywords(text, this.roleKeywords) ||
        this.matchesKeywords(href, this.roleKeywords)) {
      categories.push('role');
    }
    if (this.matchesKeywords(text, this.industryKeywords) ||
        this.matchesKeywords(href, this.industryKeywords)) {
      categories.push('industry');
    }
    if (this.matchesKeywords(text, this.useCaseKeywords) ||
        this.matchesKeywords(href, this.useCaseKeywords)) {
      categories.push('usecase');
    }

    return categories;
  }
};

// Partnership Profile normalization functions
const PartnershipProfile = {
  roleNormalizations: {
    'sales': 'Sales Teams',
    'sales teams': 'Sales Teams',
    'sales leaders': 'Sales Leaders',
    'for sales': 'Sales Teams',
    'sdrs': 'SDRs/BDRs',
    'bdrs': 'SDRs/BDRs',
    'marketing': 'Marketing Teams',
    'for marketing': 'Marketing Teams',
    'revops': 'Revenue Operations',
    'revenue operations': 'Revenue Operations',
    'customer success': 'Customer Success',
    'executives': 'Executives',
    'founders': 'Founders/CEOs',
    'agencies': 'Agencies'
  },

  industryNormalizations: {
    'saas': 'SaaS/Software',
    'software': 'SaaS/Software',
    'technology': 'SaaS/Software',
    'fintech': 'Financial Services',
    'financial services': 'Financial Services',
    'banking': 'Financial Services',
    'healthcare': 'Healthcare',
    'manufacturing': 'Manufacturing',
    'retail': 'Retail/E-commerce',
    'ecommerce': 'Retail/E-commerce',
    'professional services': 'Professional Services'
  },

  useCaseNormalizations: {
    'lead generation': 'Lead Generation',
    'lead gen': 'Lead Generation',
    'pipeline': 'Pipeline Generation',
    'pipeline generation': 'Pipeline Generation',
    'prospecting': 'Prospecting',
    'outbound': 'Outbound Sales',
    'sales engagement': 'Sales Engagement',
    'sales automation': 'Sales Automation',
    // New normalizations
    'forecasting': 'Forecasting',
    'revenue forecasting': 'Forecasting',
    'conversation intelligence': 'Conversation Intelligence',
    'call recording': 'Conversation Intelligence',
    'deals': 'Deal Management',
    'opportunity management': 'Deal Management'
  },

  normalizeRole(role) {
    const lower = role.toLowerCase().trim();
    return this.roleNormalizations[lower] || role;
  },

  normalizeIndustry(industry) {
    const lower = industry.toLowerCase().trim();
    return this.industryNormalizations[lower] || industry;
  },

  normalizeUseCase(useCase) {
    const lower = useCase.toLowerCase().trim();
    return this.useCaseNormalizations[lower] || useCase;
  }
};

// Better Together Insights Generator
const BetterTogetherInsights = {
  salesAiProfile: {
    targetRoles: ['Sales Teams', 'SDRs/BDRs', 'Sales Leaders', 'Revenue Operations'],
    useCases: ['Lead Generation', 'Outbound Sales', 'Sales Automation', 'Meeting Booking', 'Pipeline Generation'],
    industries: ['SaaS/Software', 'Professional Services', 'Financial Services']
  },

  findOverlappingRoles(partnerRoles) {
    return partnerRoles.filter(role => this.salesAiProfile.targetRoles.includes(role));
  },

  findIndustryOpportunities(partnerIndustries) {
    return partnerIndustries.map(industry => ({
      industry,
      priority: this.salesAiProfile.industries.includes(industry) ? 'high' : 'medium'
    }));
  },

  determinePartnershipType(profile, overlappingRoles) {
    if (profile.targetRoles.some(r => r.includes('Agencies') || r.includes('Consultants'))) {
      return 'reseller';
    } else if (overlappingRoles.length >= 2) {
      return 'co-sell';
    } else {
      return 'referral';
    }
  },

  assessGtmFit(partnerGtm) {
    if (partnerGtm === 'sales-led') return 'strong';
    if (partnerGtm === 'hybrid') return 'good';
    return 'moderate';
  }
};

// Navbar Detection Tests
console.log('\n🧭 Navbar Detection Tests\n');

runner.test('matchesKeywords finds customer keywords', () => {
  runner.assert(NavbarDetection.matchesKeywords('Our Customers', NavbarDetection.customerKeywords));
  runner.assert(NavbarDetection.matchesKeywords('Case Studies', NavbarDetection.customerKeywords));
  runner.assert(NavbarDetection.matchesKeywords('Success Stories', NavbarDetection.customerKeywords));
});

runner.test('matchesKeywords finds partner keywords', () => {
  runner.assert(NavbarDetection.matchesKeywords('Integrations', NavbarDetection.partnerKeywords));
  runner.assert(NavbarDetection.matchesKeywords('Our Partners', NavbarDetection.partnerKeywords));
  runner.assert(NavbarDetection.matchesKeywords('Marketplace', NavbarDetection.partnerKeywords));
});

runner.test('matchesKeywords finds role keywords', () => {
  runner.assert(NavbarDetection.matchesKeywords('For Sales Teams', NavbarDetection.roleKeywords));
  runner.assert(NavbarDetection.matchesKeywords('For Marketing', NavbarDetection.roleKeywords));
  runner.assert(NavbarDetection.matchesKeywords('For RevOps', NavbarDetection.roleKeywords));
});

runner.test('matchesKeywords finds industry keywords', () => {
  runner.assert(NavbarDetection.matchesKeywords('Healthcare', NavbarDetection.industryKeywords));
  runner.assert(NavbarDetection.matchesKeywords('Financial Services', NavbarDetection.industryKeywords));
  runner.assert(NavbarDetection.matchesKeywords('SaaS', NavbarDetection.industryKeywords));
});

runner.test('matchesKeywords finds use case keywords', () => {
  runner.assert(NavbarDetection.matchesKeywords('Lead Generation', NavbarDetection.useCaseKeywords));
  runner.assert(NavbarDetection.matchesKeywords('Pipeline', NavbarDetection.useCaseKeywords));
  runner.assert(NavbarDetection.matchesKeywords('Sales Automation', NavbarDetection.useCaseKeywords));
});

runner.test('matchesKeywords returns false for non-matching text', () => {
  runner.assert(!NavbarDetection.matchesKeywords('Pricing', NavbarDetection.customerKeywords));
  runner.assert(!NavbarDetection.matchesKeywords('Blog', NavbarDetection.partnerKeywords));
  runner.assert(!NavbarDetection.matchesKeywords('Contact', NavbarDetection.roleKeywords));
});

runner.test('categorizeLink identifies customer pages', () => {
  const categories = NavbarDetection.categorizeLink('Case Studies', '/case-studies');
  runner.assertArrayIncludes(categories, 'customer');
});

runner.test('categorizeLink identifies role pages', () => {
  const categories = NavbarDetection.categorizeLink('For Sales', '/for-sales');
  runner.assertArrayIncludes(categories, 'role');
});

runner.test('categorizeLink identifies industry pages', () => {
  const categories = NavbarDetection.categorizeLink('Healthcare', '/industries/healthcare');
  runner.assertArrayIncludes(categories, 'industry');
});

runner.test('categorizeLink identifies use case pages', () => {
  const categories = NavbarDetection.categorizeLink('Lead Generation', '/use-cases/lead-gen');
  runner.assertArrayIncludes(categories, 'usecase');
});

runner.test('categorizeLink can match multiple categories', () => {
  // A link could be both a partner AND have an industry
  const categories = NavbarDetection.categorizeLink('SaaS Integrations', '/integrations/saas');
  runner.assert(categories.length >= 1);
});

// URL Resolution Tests
console.log('\n🔗 URL Resolution Tests\n');

const UrlResolver = {
  resolve(href, baseUrl) {
    if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('mailto:') || href.startsWith('tel:')) {
      return null;
    }
    try {
      if (href.startsWith('http')) {
        const url = new URL(href);
        const baseDomain = new URL(baseUrl).hostname.replace('www.', '');
        // Check if same domain
        if (url.hostname.replace('www.', '') === baseDomain) {
          return href;
        }
        return null; // External link
      }
      // Relative URL
      return new URL(href, baseUrl).href;
    } catch (e) {
      return null;
    }
  }
};

runner.test('resolves relative URL to absolute', () => {
  const result = UrlResolver.resolve('/customers', 'https://example.com');
  runner.assertEqual(result, 'https://example.com/customers');
});

runner.test('resolves relative URL with path', () => {
  const result = UrlResolver.resolve('/solutions/healthcare', 'https://example.com');
  runner.assertEqual(result, 'https://example.com/solutions/healthcare');
});

runner.test('preserves absolute URL on same domain', () => {
  const result = UrlResolver.resolve('https://example.com/about', 'https://example.com');
  runner.assertEqual(result, 'https://example.com/about');
});

runner.test('preserves absolute URL with www on same domain', () => {
  const result = UrlResolver.resolve('https://www.example.com/about', 'https://example.com');
  runner.assertEqual(result, 'https://www.example.com/about');
});

runner.test('rejects external domain URLs', () => {
  const result = UrlResolver.resolve('https://other.com/page', 'https://example.com');
  runner.assertEqual(result, null);
});

runner.test('rejects hash-only links', () => {
  const result = UrlResolver.resolve('#section', 'https://example.com');
  runner.assertEqual(result, null);
});

runner.test('rejects javascript: links', () => {
  const result = UrlResolver.resolve('javascript:void(0)', 'https://example.com');
  runner.assertEqual(result, null);
});

runner.test('rejects mailto: links', () => {
  const result = UrlResolver.resolve('mailto:test@example.com', 'https://example.com');
  runner.assertEqual(result, null);
});

runner.test('rejects tel: links', () => {
  const result = UrlResolver.resolve('tel:+1234567890', 'https://example.com');
  runner.assertEqual(result, null);
});

runner.test('handles null href', () => {
  const result = UrlResolver.resolve(null, 'https://example.com');
  runner.assertEqual(result, null);
});

runner.test('handles empty string href', () => {
  const result = UrlResolver.resolve('', 'https://example.com');
  runner.assertEqual(result, null);
});

// Fallback URL Tests
console.log('\n🔄 Fallback URL Tests\n');

const FallbackUrls = {
  getCustomerFallbacks(baseUrl) {
    return [
      `${baseUrl}/customers`,
      `${baseUrl}/clients`,
      `${baseUrl}/case-studies`,
      `${baseUrl}/success-stories`,
      `${baseUrl}/testimonials`,
      `${baseUrl}/portfolio`,
      `${baseUrl}/work`
    ];
  },

  getPartnerFallbacks(baseUrl) {
    return [
      `${baseUrl}/partners`,
      `${baseUrl}/integrations`,
      `${baseUrl}/technology`,
      `${baseUrl}/ecosystem`,
      `${baseUrl}/marketplace`,
      `${baseUrl}/apps`,
      `${baseUrl}/solutions`
    ];
  },

  getAboutFallbacks(baseUrl) {
    return [
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/company`,
      `${baseUrl}/team`
    ];
  }
};

runner.test('customer fallbacks include /customers', () => {
  const fallbacks = FallbackUrls.getCustomerFallbacks('https://example.com');
  runner.assertArrayIncludes(fallbacks, 'https://example.com/customers');
});

runner.test('customer fallbacks include /case-studies', () => {
  const fallbacks = FallbackUrls.getCustomerFallbacks('https://example.com');
  runner.assertArrayIncludes(fallbacks, 'https://example.com/case-studies');
});

runner.test('customer fallbacks include /testimonials', () => {
  const fallbacks = FallbackUrls.getCustomerFallbacks('https://example.com');
  runner.assertArrayIncludes(fallbacks, 'https://example.com/testimonials');
});

runner.test('partner fallbacks include /integrations', () => {
  const fallbacks = FallbackUrls.getPartnerFallbacks('https://example.com');
  runner.assertArrayIncludes(fallbacks, 'https://example.com/integrations');
});

runner.test('partner fallbacks include /marketplace', () => {
  const fallbacks = FallbackUrls.getPartnerFallbacks('https://example.com');
  runner.assertArrayIncludes(fallbacks, 'https://example.com/marketplace');
});

runner.test('about fallbacks include /about', () => {
  const fallbacks = FallbackUrls.getAboutFallbacks('https://example.com');
  runner.assertArrayIncludes(fallbacks, 'https://example.com/about');
});

runner.test('about fallbacks include /company', () => {
  const fallbacks = FallbackUrls.getAboutFallbacks('https://example.com');
  runner.assertArrayIncludes(fallbacks, 'https://example.com/company');
});

runner.test('fallbacks have correct count', () => {
  runner.assertArrayLength(FallbackUrls.getCustomerFallbacks('https://x.com'), 7);
  runner.assertArrayLength(FallbackUrls.getPartnerFallbacks('https://x.com'), 7);
  runner.assertArrayLength(FallbackUrls.getAboutFallbacks('https://x.com'), 4);
});

// Edge Case Tests
console.log('\n⚠️ Edge Case Tests\n');

runner.test('categorizeLink handles empty text', () => {
  const categories = NavbarDetection.categorizeLink('', '/customers');
  runner.assert(Array.isArray(categories));
});

runner.test('categorizeLink handles empty href', () => {
  const categories = NavbarDetection.categorizeLink('Customers', '');
  runner.assert(Array.isArray(categories));
});

runner.test('matchesKeywords is case insensitive', () => {
  runner.assert(NavbarDetection.matchesKeywords('CUSTOMERS', NavbarDetection.customerKeywords));
  runner.assert(NavbarDetection.matchesKeywords('CuStOmErS', NavbarDetection.customerKeywords));
});

runner.test('matchesKeywords handles hyphenated keywords', () => {
  runner.assert(NavbarDetection.matchesKeywords('Case Studies', NavbarDetection.customerKeywords));
  runner.assert(NavbarDetection.matchesKeywords('case-studies', NavbarDetection.customerKeywords));
});

runner.test('normalization handles leading/trailing whitespace', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('  sales  '), 'Sales Teams');
  runner.assertEqual(PartnershipProfile.normalizeIndustry('  saas  '), 'SaaS/Software');
});

runner.test('normalization handles mixed case', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('SALES'), 'Sales Teams');
  runner.assertEqual(PartnershipProfile.normalizeRole('SaLeS'), 'Sales Teams');
});

runner.test('BetterTogetherInsights handles empty profile', () => {
  const profile = { targetRoles: [], targetIndustries: [], useCases: [] };
  const overlaps = BetterTogetherInsights.findOverlappingRoles(profile.targetRoles);
  runner.assertArrayLength(overlaps, 0);
});

runner.test('BetterTogetherInsights handles null gtm', () => {
  const fit = BetterTogetherInsights.assessGtmFit(null);
  runner.assertEqual(fit, 'moderate');
});

runner.test('BetterTogetherInsights handles undefined gtm', () => {
  const fit = BetterTogetherInsights.assessGtmFit(undefined);
  runner.assertEqual(fit, 'moderate');
});

// GTM Motion Detection Tests
console.log('\n🚀 GTM Motion Detection Tests\n');

const GtmDetector = {
  detectFromContent(text) {
    const lower = text.toLowerCase();

    const plgSignals = ['start free', 'free trial', 'sign up free', 'no credit card', 'free plan'];
    const salesSignals = ['request a demo', 'request demo', 'book a demo', 'talk to sales', 'contact sales', 'get a quote'];

    const hasPlg = plgSignals.some(s => lower.includes(s));
    const hasSales = salesSignals.some(s => lower.includes(s));

    // Check for both FIRST before checking individually
    if (hasPlg && hasSales) return 'hybrid';
    if (hasPlg) return 'plg';
    if (hasSales) return 'sales-led';
    return null;
  }
};

runner.test('detects PLG from "start free"', () => {
  runner.assertEqual(GtmDetector.detectFromContent('Start free today'), 'plg');
});

runner.test('detects PLG from "free trial"', () => {
  runner.assertEqual(GtmDetector.detectFromContent('Get your free trial'), 'plg');
});

runner.test('detects sales-led from "request demo"', () => {
  runner.assertEqual(GtmDetector.detectFromContent('Request a demo'), 'sales-led');
});

runner.test('detects sales-led from "book a demo"', () => {
  runner.assertEqual(GtmDetector.detectFromContent('Book a demo today'), 'sales-led');
});

runner.test('detects hybrid when both signals present', () => {
  runner.assertEqual(GtmDetector.detectFromContent('Start free or request a demo'), 'hybrid');
});

runner.test('returns null when no signals', () => {
  runner.assertEqual(GtmDetector.detectFromContent('Welcome to our website'), null);
});

// Company Size Detection Tests
console.log('\n🏢 Company Size Detection Tests\n');

const SizeDetector = {
  detectFromContent(text) {
    const lower = text.toLowerCase();

    if (lower.includes('enterprise') || lower.includes('fortune 500') || lower.includes('large organizations')) {
      return 'enterprise';
    }
    if (lower.includes('mid-market') || lower.includes('growing companies') || lower.includes('scaling')) {
      return 'mid-market';
    }
    if (lower.includes('small business') || lower.includes('smb') || lower.includes('startups')) {
      return 'smb';
    }
    return null;
  }
};

runner.test('detects enterprise from "enterprise"', () => {
  runner.assertEqual(SizeDetector.detectFromContent('Enterprise solutions'), 'enterprise');
});

runner.test('detects enterprise from "Fortune 500"', () => {
  runner.assertEqual(SizeDetector.detectFromContent('Trusted by Fortune 500'), 'enterprise');
});

runner.test('detects mid-market from "mid-market"', () => {
  runner.assertEqual(SizeDetector.detectFromContent('Built for mid-market'), 'mid-market');
});

runner.test('detects mid-market from "growing companies"', () => {
  runner.assertEqual(SizeDetector.detectFromContent('For growing companies'), 'mid-market');
});

runner.test('detects SMB from "small business"', () => {
  runner.assertEqual(SizeDetector.detectFromContent('Small business pricing'), 'smb');
});

runner.test('detects SMB from "startups"', () => {
  runner.assertEqual(SizeDetector.detectFromContent('Perfect for startups'), 'smb');
});

runner.test('returns null when no size signals', () => {
  runner.assertEqual(SizeDetector.detectFromContent('Welcome to our platform'), null);
});

// Role Normalization Tests
console.log('\n👥 Role Normalization Tests\n');

runner.test('normalizes "sales" to "Sales Teams"', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('sales'), 'Sales Teams');
});

runner.test('normalizes "for sales" to "Sales Teams"', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('for sales'), 'Sales Teams');
});

runner.test('normalizes "sdrs" to "SDRs/BDRs"', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('sdrs'), 'SDRs/BDRs');
});

runner.test('normalizes "bdrs" to "SDRs/BDRs"', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('bdrs'), 'SDRs/BDRs');
});

runner.test('normalizes "revops" to "Revenue Operations"', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('revops'), 'Revenue Operations');
});

runner.test('normalizes "for marketing" to "Marketing Teams"', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('for marketing'), 'Marketing Teams');
});

runner.test('preserves unknown roles', () => {
  runner.assertEqual(PartnershipProfile.normalizeRole('Unknown Role'), 'Unknown Role');
});

// Industry Normalization Tests
console.log('\n🏢 Industry Normalization Tests\n');

runner.test('normalizes "saas" to "SaaS/Software"', () => {
  runner.assertEqual(PartnershipProfile.normalizeIndustry('saas'), 'SaaS/Software');
});

runner.test('normalizes "software" to "SaaS/Software"', () => {
  runner.assertEqual(PartnershipProfile.normalizeIndustry('software'), 'SaaS/Software');
});

runner.test('normalizes "fintech" to "Financial Services"', () => {
  runner.assertEqual(PartnershipProfile.normalizeIndustry('fintech'), 'Financial Services');
});

runner.test('normalizes "healthcare" to "Healthcare"', () => {
  runner.assertEqual(PartnershipProfile.normalizeIndustry('healthcare'), 'Healthcare');
});

runner.test('normalizes "ecommerce" to "Retail/E-commerce"', () => {
  runner.assertEqual(PartnershipProfile.normalizeIndustry('ecommerce'), 'Retail/E-commerce');
});

runner.test('preserves unknown industries', () => {
  runner.assertEqual(PartnershipProfile.normalizeIndustry('Aerospace'), 'Aerospace');
});

// Use Case Normalization Tests
console.log('\n🎯 Use Case Normalization Tests\n');

runner.test('normalizes "lead gen" to "Lead Generation"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('lead gen'), 'Lead Generation');
});

runner.test('normalizes "lead generation" to "Lead Generation"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('lead generation'), 'Lead Generation');
});

runner.test('normalizes "outbound" to "Outbound Sales"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('outbound'), 'Outbound Sales');
});

runner.test('normalizes "sales engagement" to "Sales Engagement"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('sales engagement'), 'Sales Engagement');
});

runner.test('normalizes "forecasting" to "Forecasting"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('forecasting'), 'Forecasting');
});

runner.test('normalizes "revenue forecasting" to "Forecasting"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('revenue forecasting'), 'Forecasting');
});

runner.test('normalizes "conversation intelligence" to "Conversation Intelligence"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('conversation intelligence'), 'Conversation Intelligence');
});

runner.test('normalizes "deals" to "Deal Management"', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('deals'), 'Deal Management');
});

runner.test('preserves unknown use cases', () => {
  runner.assertEqual(PartnershipProfile.normalizeUseCase('Custom Workflow'), 'Custom Workflow');
});

// Better Together Insights Tests
console.log('\n🤝 Better Together Insights Tests\n');

runner.test('findOverlappingRoles finds Sales Teams', () => {
  const overlaps = BetterTogetherInsights.findOverlappingRoles(['Sales Teams', 'HR Teams']);
  runner.assertArrayIncludes(overlaps, 'Sales Teams');
  runner.assertArrayLength(overlaps, 1);
});

runner.test('findOverlappingRoles finds multiple overlaps', () => {
  const overlaps = BetterTogetherInsights.findOverlappingRoles(['Sales Teams', 'SDRs/BDRs', 'Sales Leaders']);
  runner.assertArrayLength(overlaps, 3);
});

runner.test('findOverlappingRoles returns empty for no overlap', () => {
  const overlaps = BetterTogetherInsights.findOverlappingRoles(['HR Teams', 'Legal Teams']);
  runner.assertArrayLength(overlaps, 0);
});

runner.test('findIndustryOpportunities marks SaaS as high priority', () => {
  const opportunities = BetterTogetherInsights.findIndustryOpportunities(['SaaS/Software']);
  runner.assertEqual(opportunities[0].priority, 'high');
});

runner.test('findIndustryOpportunities marks unknown industries as medium priority', () => {
  const opportunities = BetterTogetherInsights.findIndustryOpportunities(['Aerospace']);
  runner.assertEqual(opportunities[0].priority, 'medium');
});

runner.test('determinePartnershipType returns reseller for agencies', () => {
  const profile = { targetRoles: ['Agencies', 'Consultants'] };
  const type = BetterTogetherInsights.determinePartnershipType(profile, []);
  runner.assertEqual(type, 'reseller');
});

runner.test('determinePartnershipType returns co-sell for 2+ overlapping roles', () => {
  const profile = { targetRoles: ['Sales Teams', 'SDRs/BDRs'] };
  const overlaps = ['Sales Teams', 'SDRs/BDRs'];
  const type = BetterTogetherInsights.determinePartnershipType(profile, overlaps);
  runner.assertEqual(type, 'co-sell');
});

runner.test('determinePartnershipType returns referral as default', () => {
  const profile = { targetRoles: ['HR Teams'] };
  const type = BetterTogetherInsights.determinePartnershipType(profile, []);
  runner.assertEqual(type, 'referral');
});

runner.test('assessGtmFit returns strong for sales-led', () => {
  runner.assertEqual(BetterTogetherInsights.assessGtmFit('sales-led'), 'strong');
});

runner.test('assessGtmFit returns good for hybrid', () => {
  runner.assertEqual(BetterTogetherInsights.assessGtmFit('hybrid'), 'good');
});

runner.test('assessGtmFit returns moderate for plg', () => {
  runner.assertEqual(BetterTogetherInsights.assessGtmFit('plg'), 'moderate');
});

// ============================================
// JS Loading Shell Detection Tests
// ============================================

console.log('\n🔍 JS Loading Shell Detection Tests\n');

/**
 * Detect if HTML is just a JavaScript loading shell (SPA skeleton)
 */
const JsShellDetector = {
  isJsLoadingShell(html) {
    const lowerHtml = html.toLowerCase();

    const spaIndicators = [
      '<div id="root"></div>',
      '<div id="app"></div>',
      '<div id="__next">',
      '<div id="__nuxt">',
      'we need to enable javascript',
      'please enable javascript',
      'javascript is required',
      'this app requires javascript',
      'loading...</div>',
    ];

    const hasSpaIndicator = spaIndicators.some(indicator =>
      lowerHtml.includes(indicator.toLowerCase())
    );

    // Check if body is suspiciously empty
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<link[^>]*>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (bodyContent.length < 200) {
        return true;
      }
    }

    return hasSpaIndicator;
  }
};

runner.test('detects React root div as JS shell', () => {
  const html = '<html><body><div id="root"></div><script src="app.js"></script></body></html>';
  runner.assertTrue(JsShellDetector.isJsLoadingShell(html));
});

runner.test('detects Vue app div as JS shell', () => {
  const html = '<html><body><div id="app"></div></body></html>';
  runner.assertTrue(JsShellDetector.isJsLoadingShell(html));
});

runner.test('detects Next.js div as JS shell', () => {
  const html = '<html><body><div id="__next"></div></body></html>';
  runner.assertTrue(JsShellDetector.isJsLoadingShell(html));
});

runner.test('detects Nuxt.js div as JS shell', () => {
  const html = '<html><body><div id="__nuxt"></div></body></html>';
  runner.assertTrue(JsShellDetector.isJsLoadingShell(html));
});

runner.test('detects "please enable javascript" message', () => {
  const html = '<html><body><noscript>Please enable JavaScript to use this app</noscript></body></html>';
  runner.assertTrue(JsShellDetector.isJsLoadingShell(html));
});

runner.test('detects empty body as JS shell', () => {
  const html = '<html><body><script>window.app = {}</script></body></html>';
  runner.assertTrue(JsShellDetector.isJsLoadingShell(html));
});

runner.test('recognizes full HTML content as NOT a JS shell', () => {
  const html = `<html><body>
    <header><nav><a href="/">Home</a><a href="/products">Products</a></nav></header>
    <main>
      <h1>Welcome to Our Site</h1>
      <p>This is a real website with actual content that was server-side rendered.</p>
      <p>There are many paragraphs of text here to ensure we pass the minimum threshold.</p>
      <p>More content to make this clearly not a JS loading shell.</p>
    </main>
    <footer>Copyright 2024</footer>
  </body></html>`;
  runner.assertFalse(JsShellDetector.isJsLoadingShell(html));
});

runner.test('recognizes content with scripts as NOT a JS shell', () => {
  const html = `<html><body>
    <nav><a href="/">Home</a><a href="/about">About</a></nav>
    <h1>Real Content</h1>
    <p>This page has real content plus some JavaScript enhancements.</p>
    <p>Plenty of text here to show this is server-side rendered.</p>
    <script>console.log('enhancement');</script>
  </body></html>`;
  runner.assertFalse(JsShellDetector.isJsLoadingShell(html));
});

// ============================================
// Smart Fetch Configuration Tests
// ============================================

console.log('\n🌐 Smart Fetch Configuration Tests\n');

const jsHeavyDomains = [
  'outreach.io',
  'salesforce.com',
  'drift.com',
  'intercom.com',
  'zendesk.com',
  'hubspot.com',
  'marketo.com',
  'eloqua.com',
  'pardot.com',
];

const SmartFetchConfig = {
  needsJsRendering(url) {
    const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase();
    return jsHeavyDomains.some(d => domain.includes(d));
  }
};

runner.test('identifies outreach.io as needing JS rendering', () => {
  runner.assertTrue(SmartFetchConfig.needsJsRendering('https://www.outreach.io'));
});

runner.test('identifies salesforce.com as needing JS rendering', () => {
  runner.assertTrue(SmartFetchConfig.needsJsRendering('https://www.salesforce.com'));
});

runner.test('identifies drift.com as needing JS rendering', () => {
  runner.assertTrue(SmartFetchConfig.needsJsRendering('https://drift.com/platform'));
});

runner.test('identifies gong.io as NOT needing JS rendering', () => {
  runner.assertFalse(SmartFetchConfig.needsJsRendering('https://www.gong.io'));
});

runner.test('identifies salesloft.com as NOT needing JS rendering', () => {
  runner.assertFalse(SmartFetchConfig.needsJsRendering('https://www.salesloft.com'));
});

runner.test('handles subdomain URLs correctly', () => {
  runner.assertTrue(SmartFetchConfig.needsJsRendering('https://app.outreach.io/dashboard'));
});

runner.test('handles path URLs correctly', () => {
  runner.assertTrue(SmartFetchConfig.needsJsRendering('https://www.salesforce.com/products/sales-cloud'));
});

// Print summary
const success = runner.summary();
process.exit(success ? 0 : 1);
