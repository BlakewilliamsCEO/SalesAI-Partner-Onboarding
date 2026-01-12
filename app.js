/**
 * SalesAI Partner Application
 * Complete 41-question application with scoring and PartnerStack field mapping
 *
 * Sections:
 * A - Partner Identity & Account Creation (Required by PartnerStack)
 * B - Partnership Model & Agreement (Required)
 * C - ICP & Market Fit (Qualification + Scoring)
 * D - Revenue Quality & Deal Economics (Scoring)
 * E - Sales Motion & GTM Capability (Scoring + Routing)
 * F - Service Delivery & Enablement Readiness (Tier Predictor)
 * G - Scale Potential & Investment Fit (Forecasting)
 * H - Alignment & Risk Signals (Internal Only)
 * I - Payout Readiness (Required for Commissions)
 */

// ============================================
// CompanyAPI Integration
// ============================================

const CompanyAPI = {
  // Configuration - API key will be set by user
  apiKey: null,
  baseUrl: 'https://api.thecompaniesapi.com/v2',

  // Enriched company data cache
  enrichedData: null,
  isEnriching: false,
  enrichmentAttempted: false,

  /**
   * Initialize the API with your key
   * Call this on page load: CompanyAPI.init('your-api-key')
   * @param {string} key - Your TheCompaniesAPI token
   */
  init(key) {
    this.apiKey = key;
    console.log('[CompanyAPI] Initialized with The Companies API');
  },

  /**
   * Extract domain from email or URL
   * @param {string} input - Email address or website URL
   * @returns {string} Domain name (e.g., "microsoft.com")
   */
  extractDomain(input) {
    if (!input) return null;

    // If it's an email, extract domain after @
    if (input.includes('@')) {
      return input.split('@')[1].toLowerCase();
    }

    // If it's a URL, extract the hostname
    try {
      let url = input;
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      const hostname = new URL(url).hostname;
      // Remove www. prefix if present
      return hostname.replace(/^www\./, '').toLowerCase();
    } catch (e) {
      // If URL parsing fails, return the input as-is
      return input.toLowerCase();
    }
  },

  /**
   * Fetch company data from The Companies API
   * Endpoint: GET /v2/companies/{domain}
   * Auth: Basic {API_TOKEN} header
   * @param {string} domain - Company domain (e.g., "microsoft.com")
   * @returns {Promise<Object>} Enriched company data
   */
  async fetchCompanyData(domain) {
    if (!this.apiKey) {
      console.log('[CompanyAPI] No API key configured - skipping enrichment');
      return null;
    }

    if (!domain) {
      console.log('[CompanyAPI] No domain provided');
      return null;
    }

    this.isEnriching = true;
    updateEnrichmentUI('loading');

    try {
      // The Companies API v2 endpoint with Basic auth
      const response = await fetch(`${this.baseUrl}/companies/${domain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API returned ${response.status}`);
      }

      const data = await response.json();
      this.enrichedData = this.normalizeCompanyData(data);
      this.enrichmentAttempted = true;
      this.isEnriching = false;

      console.log('[CompanyAPI] Company enriched:', this.enrichedData);
      updateEnrichmentUI('success');

      return this.enrichedData;
    } catch (error) {
      console.error('[CompanyAPI] Enrichment failed:', error);
      this.enrichmentAttempted = true;
      this.isEnriching = false;
      updateEnrichmentUI('error');
      return null;
    }
  },

  /**
   * Normalize The Companies API v2 response to our internal format
   * Maps their nested structure to flat fields we use in the form
   * @param {Object} apiData - Raw API response from thecompaniesapi.com
   * @returns {Object} Normalized company data
   */
  normalizeCompanyData(apiData) {
    // Extract employee count from string like "200-500" or "over-10k"
    const parseEmployeeCount = (range) => {
      if (!range) return null;
      if (range === 'over-10k') return 10000;
      const match = range.match(/(\d+)-(\d+)/);
      if (match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
      return apiData.about?.totalEmployeesExact || null;
    };

    return {
      // Basic Info (from about object)
      name: apiData.about?.name || null,
      nameLegal: apiData.about?.nameLegal || null,
      domain: apiData.domain?.domain || null,
      logo: apiData.assets?.logoSquare?.src || null,
      description: apiData.descriptions?.primary || apiData.descriptions?.tagline || null,

      // Industry & Classification (from about object)
      industry: apiData.about?.industry || null,
      industries: apiData.about?.industries || [],
      businessType: apiData.about?.businessType || null,
      tags: apiData.about?.industries || [],

      // Size & Revenue (from about and finances objects)
      employeeCount: apiData.about?.totalEmployeesExact || parseEmployeeCount(apiData.about?.totalEmployees),
      employeeRange: apiData.about?.totalEmployees || null,
      estimatedRevenue: apiData.finances?.revenue || null,
      revenueRange: apiData.finances?.revenue || null,

      // Location (from locations.headquarters object)
      headquarters: {
        city: apiData.locations?.headquarters?.city?.name || null,
        state: apiData.locations?.headquarters?.state?.name || null,
        country: apiData.locations?.headquarters?.country?.name || null,
        countryCode: apiData.locations?.headquarters?.country?.code?.toUpperCase() || null,
        address: apiData.locations?.headquarters?.address?.raw || null
      },

      // Tech Stack (from technologies object - for CRM detection)
      technologies: apiData.technologies?.active || apiData.technologies?.details?.map(t => t.slug) || [],
      technologyCategories: apiData.technologies?.categories || [],

      // Social (from socials object)
      linkedin: apiData.socials?.linkedin?.url || null,
      twitter: apiData.socials?.twitter?.url || null,
      facebook: apiData.socials?.facebook?.url || null,
      github: apiData.socials?.github?.url || null,

      // Company details
      companyType: apiData.about?.businessType || null,
      foundedYear: apiData.about?.yearFounded || null,
      stockSymbol: apiData.finances?.stockSymbol || null,
      stockExchange: apiData.finances?.stockExchange || null,

      // Contact info (from contacts object)
      emails: apiData.contacts?.emails || [],
      phones: apiData.contacts?.phones || [],

      // Codes (NAICS/SIC for industry classification)
      naicsCodes: apiData.codes?.naics || [],
      sicCodes: apiData.codes?.sic || []
    };
  },

  /**
   * Convert employee count to range for form pre-selection
   */
  getEmployeeRange(count) {
    if (!count) return null;
    if (count <= 10) return '1-10';
    if (count <= 50) return '11-50';
    if (count <= 100) return '51-100';
    if (count <= 500) return '101-500';
    return '500+';
  },

  /**
   * Get industry-matched verticals for ICP section
   * Maps The Companies API industry slugs to our form vertical options
   * @returns {string[]} Suggested verticals based on company industries
   */
  getSuggestedVerticals() {
    if (!this.enrichedData) return [];

    // Get all industries (primary + list)
    const allIndustries = [
      this.enrichedData.industry,
      ...(this.enrichedData.industries || [])
    ].filter(Boolean).map(i => i.toLowerCase());

    if (allIndustries.length === 0) return [];

    // Map The Companies API industry slugs to our form verticals
    const industryMap = {
      // SaaS / Software
      'software': 'SaaS / Software',
      'software-development': 'SaaS / Software',
      'computer-software': 'SaaS / Software',
      'technology-information-and-internet': 'SaaS / Software',
      'cloud-computing': 'SaaS / Software',
      'enterprise-software': 'SaaS / Software',
      'business-software': 'SaaS / Software',
      'saas': 'SaaS / Software',

      // Financial Services
      'financial': 'Financial Services',
      'financial-services': 'Financial Services',
      'banking': 'Financial Services',
      'insurance': 'Financial Services',
      'fintech': 'Financial Services',

      // Healthcare
      'healthcare': 'Healthcare',
      'medical': 'Healthcare',
      'hospitals': 'Healthcare',
      'pharmaceuticals': 'Healthcare',
      'health-care': 'Healthcare',

      // Professional Services
      'consulting': 'Professional Services',
      'professional-services': 'Professional Services',
      'legal': 'Professional Services',
      'legal-services': 'Professional Services',
      'accounting': 'Professional Services',

      // Manufacturing
      'manufacturing': 'Manufacturing',
      'industrial': 'Manufacturing',
      'computers-and-electronics-manufacturing': 'Manufacturing',

      // Retail / E-commerce
      'retail': 'Retail / E-commerce',
      'e-commerce': 'Retail / E-commerce',
      'ecommerce': 'Retail / E-commerce',
      'shopping': 'Retail / E-commerce',
      'consumer-internet': 'Retail / E-commerce',

      // Real Estate
      'real-estate': 'Real Estate',
      'real estate': 'Real Estate',
      'property': 'Real Estate',

      // Marketing / Agencies
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

  /**
   * Detect CRMs from tech stack
   * The Companies API returns technology slugs like "salesforce", "hubspot", etc.
   * @returns {string[]} CRMs found in company's tech stack
   */
  getDetectedCRMs() {
    if (!this.enrichedData?.technologies || this.enrichedData.technologies.length === 0) return [];

    // Map technology slugs to our CRM options
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

    // Also check technology categories for CRM indicators
    const categories = (this.enrichedData.technologyCategories || []).map(c => c.toLowerCase());

    for (const tech of techStack) {
      // Direct match
      if (crmTechMap[tech]) {
        detected.add(crmTechMap[tech]);
        continue;
      }
      // Partial match
      for (const [keyword, crmName] of Object.entries(crmTechMap)) {
        if (tech.includes(keyword)) {
          detected.add(crmName);
        }
      }
    }

    return Array.from(detected);
  },

  /**
   * Get personalized ACV suggestion based on company size
   * @returns {string} Suggested ACV range
   */
  getSuggestedACVRange() {
    if (!this.enrichedData?.employeeCount) return null;

    const count = this.enrichedData.employeeCount;
    if (count <= 50) return '5k-15k';
    if (count <= 200) return '15k-50k';
    if (count <= 1000) return '50k-100k';
    return '100k+';
  },

  /**
   * Check if company data is available
   */
  hasEnrichedData() {
    return this.enrichedData !== null;
  }
};

/**
 * Update UI to show enrichment status
 * @param {string} status - 'loading' | 'success' | 'error'
 */
function updateEnrichmentUI(status) {
  const indicator = document.getElementById('enrichment-indicator');
  if (!indicator) return;

  switch (status) {
    case 'loading':
      indicator.innerHTML = `
        <div class="enrichment-loading">
          <span class="spinner"></span>
          <span>Looking up company info...</span>
        </div>
      `;
      indicator.style.display = 'block';
      break;

    case 'success':
      const data = CompanyAPI.enrichedData;

      // Format industry for display (convert slug to readable)
      const formatIndustry = (slug) => {
        if (!slug) return null;
        return slug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      };

      // Format employee range for display
      const formatEmployees = (range) => {
        if (!range) return null;
        if (range === 'over-10k') return '10,000+';
        return range.replace(/-/g, ' - ');
      };

      indicator.innerHTML = `
        <div class="enrichment-success">
          ${data.logo ? `<img src="${data.logo}" alt="${data.name}" class="enriched-logo">` : ''}
          <div class="enriched-info">
            <strong>${data.name || 'Company found'}</strong>
            ${data.industry ? `<span class="enriched-industry">${formatIndustry(data.industry)}</span>` : ''}
            ${data.employeeRange ? `<span class="enriched-size">${formatEmployees(data.employeeRange)} employees</span>` : ''}
            ${data.headquarters?.city ? `<span class="enriched-location">${data.headquarters.city}${data.headquarters.state ? ', ' + data.headquarters.state : ''}</span>` : ''}
          </div>
          <span class="enrichment-badge">Verified</span>
        </div>
      `;
      indicator.style.display = 'block';

      // Auto-fill company name if found (prefer legal name if available)
      const companyName = data.nameLegal || data.name;
      if (companyName) {
        const companyNameInput = document.querySelector('[name="companyName"]');
        if (companyNameInput && !companyNameInput.value) {
          companyNameInput.value = companyName;
          companyNameInput.classList.add('auto-filled');
          state.data.companyName = companyName;
        }
      }

      // Auto-select country if found
      if (data.headquarters?.countryCode) {
        const countrySelect = document.querySelector('[name="country"]');
        if (countrySelect) {
          const countryCode = data.headquarters.countryCode.toUpperCase();
          if (countrySelect.querySelector(`option[value="${countryCode}"]`)) {
            countrySelect.value = countryCode;
            countrySelect.classList.add('auto-filled');
            state.data.country = countryCode;
          }
        }
      }
      break;

    case 'error':
      indicator.innerHTML = `
        <div class="enrichment-error">
          <span>Could not find company info. Please enter details manually.</span>
        </div>
      `;
      indicator.style.display = 'block';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
      break;
  }
}

/**
 * Trigger enrichment when email or website is entered
 */
function onEmailOrWebsiteChange(input) {
  const value = input.value.trim();
  if (!value) return;

  // Extract domain
  const domain = CompanyAPI.extractDomain(value);

  // Only enrich if we haven't already or if domain changed
  if (domain && !CompanyAPI.enrichmentAttempted) {
    // Debounce - wait for user to stop typing
    clearTimeout(window.enrichmentTimeout);
    window.enrichmentTimeout = setTimeout(() => {
      CompanyAPI.fetchCompanyData(domain);
    }, 800);
  }
}

/**
 * Pre-populate form fields with enriched data
 */
function applyEnrichedDataToSection(sectionId) {
  if (!CompanyAPI.hasEnrichedData()) return;

  const data = CompanyAPI.enrichedData;

  switch (sectionId) {
    case 'icp':
      // Pre-select suggested verticals
      const suggestedVerticals = CompanyAPI.getSuggestedVerticals();
      suggestedVerticals.forEach(vertical => {
        const checkbox = document.querySelector(`[name="primaryVerticals"][value="${vertical}"]`);
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          if (!state.data.primaryVerticals.includes(vertical)) {
            state.data.primaryVerticals.push(vertical);
          }
        }
      });

      // Pre-select detected CRMs
      const detectedCRMs = CompanyAPI.getDetectedCRMs();
      detectedCRMs.forEach(crm => {
        const checkbox = document.querySelector(`[name="crmStack"][value="${crm}"]`);
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          if (!state.data.crmStack.includes(crm)) {
            state.data.crmStack.push(crm);
          }
        }
      });

      // Show suggestion banner if we have recommendations
      if (suggestedVerticals.length > 0 || detectedCRMs.length > 0) {
        showEnrichmentSuggestions(sectionId, { suggestedVerticals, detectedCRMs });
      }
      break;

    case 'revenue':
      // Pre-select ACV based on company size
      const suggestedACV = CompanyAPI.getSuggestedACVRange();
      if (suggestedACV) {
        const acvSelect = document.querySelector('[name="averageACV"]');
        if (acvSelect && !acvSelect.value) {
          // Don't auto-select, but show suggestion
          showEnrichmentSuggestions(sectionId, { suggestedACV });
        }
      }
      break;
  }
}

/**
 * Show enrichment-based suggestions to user
 */
function showEnrichmentSuggestions(sectionId, suggestions) {
  // Remove any existing suggestion banner
  const existing = document.querySelector('.enrichment-suggestions');
  if (existing) existing.remove();

  let message = '';

  if (suggestions.suggestedVerticals?.length > 0) {
    message += `Based on your company profile, we've pre-selected <strong>${suggestions.suggestedVerticals.join(', ')}</strong> as likely verticals. `;
  }

  if (suggestions.detectedCRMs?.length > 0) {
    message += `We detected <strong>${suggestions.detectedCRMs.join(', ')}</strong> in your tech stack. `;
  }

  if (suggestions.suggestedACV) {
    message += `Companies your size typically have ACVs in the <strong>${suggestions.suggestedACV}</strong> range. `;
  }

  if (!message) return;

  const banner = document.createElement('div');
  banner.className = 'enrichment-suggestions info-box';
  banner.innerHTML = `
    <div class="info-box-title">Personalized for ${CompanyAPI.enrichedData?.name || 'your company'}</div>
    <p class="info-box-text">${message}Feel free to adjust if these don't match.</p>
  `;

  // Insert after the section header
  const sectionHeader = document.querySelector('.section-header');
  if (sectionHeader) {
    sectionHeader.after(banner);
  }
}

// ============================================
// Configuration
// ============================================

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

// Scoring thresholds
const SCORE_THRESHOLD = 60; // Minimum score to show CTA
const MAX_SCORE = 100;

// ============================================
// State
// ============================================

const state = {
  currentSection: 0,
  score: 0,
  disqualified: false,
  disqualifyReasons: [],
  data: {
    // Section A - Identity (PartnerStack Standard + Custom)
    companyName: '',           // Standard: Company Name
    companyWebsite: '',        // Standard: Company Website
    contactName: '',           // Standard: Contact Name
    contactEmail: '',          // Standard: Email
    contactTitle: '',          // Custom: Job Title
    country: '',               // Standard: Country
    timezone: '',              // Custom: Time Zone

    // Section B - Partnership Model
    partnerType: '',           // Standard: Partner Type
    agreementAccepted: false,  // Standard: Partner Agreement Accepted

    // Section C - ICP & Market Fit
    primaryICP: '',            // Custom: Primary ICP Description
    icpMatchPercent: '',       // Custom: ICP Match %
    primaryVerticals: [],      // Custom: Primary Verticals
    paidCustomerProblems: '',  // Custom: Paid Customer Problems
    avgMonthlyCallVolume: '',  // Custom: Avg Monthly Call Volume
    crmStack: [],              // Custom: CRM Stack

    // Section D - Revenue Quality
    averageACV: '',            // Custom: Average ACV
    avgContractLength: '',     // Custom: Avg Contract Length (Months)
    recurringRevenuePercent: '', // Custom: Recurring Revenue %
    activeCustomers: '',       // Custom: Active Customers
    customerLifetime: '',      // Custom: Customer Lifetime (Months)
    existingServicesSold: '',  // Custom: Existing Services Sold

    // Section E - GTM Capability
    primaryGTMMotion: '',      // Custom: Primary GTM Motion
    runsSalesDemos: '',        // Custom: Runs Sales Demos (Yes/No)
    salesTeamSize: '',         // Custom: Sales Team Size
    salesCycleLength: '',      // Custom: Sales Cycle Length
    currentSaaSPartnerships: '', // Custom: Current SaaS Partnerships
    aiPositioningConfidence: 3, // Custom: AI Positioning Confidence (1-5)

    // Section F - Service Delivery
    providesServices: '',      // Custom: Provides Services (Yes/No)
    maxConcurrentCustomers: '', // Custom: Max Concurrent Customers
    hasServicePlaybooks: '',   // Custom: Has Service Playbooks (Yes/No)
    postSaleOwner: '',         // Custom: Post-Sale Owner
    firstLineSupportOwnership: '', // Custom: First-Line Support Ownership

    // Section G - Scale Potential
    ninetyDayOpportunityEstimate: '', // Custom: 90-Day SalesAI Opportunity Estimate
    yearOneRevenueGoal: '',    // Custom: Year-One SalesAI Revenue Goal
    preferredPartnerPath: '',  // Custom: Preferred Partner Path
    monthlyTimeCommitment: '', // Custom: Monthly Partner Time Commitment
    openToCoMarketing: '',     // Custom: Open to Co-Marketing (Yes/No)

    // Section H - Alignment (Internal Only)
    whySalesAINow: '',         // Internal Notes
    failureConditions: '',     // Internal Notes

    // Section I - Payout
    payoutEntityType: '',      // Custom: Payout Entity Type
    taxSetupReady: ''          // Custom: Tax Setup Ready (Yes/No)
  }
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize The Companies API for company enrichment
  CompanyAPI.init('amFnmQEqe85Pp85CSFnICEQiuTE3JF6E');

  renderNavSteps();
  renderProgressSteps();
  renderFormContent();
  updateProgress();
});

// ============================================
// Navigation Rendering
// ============================================

function renderNavSteps() {
  const container = document.getElementById('nav-steps');
  container.innerHTML = sections.map((section, index) => {
    let className = 'nav-step-item';
    if (index === state.currentSection) className += ' active';
    if (index < state.currentSection) className += ' completed';

    return `
      <div class="${className}" onclick="goToSection(${index})">
        ${section.label}
      </div>
    `;
  }).join('');
}

function renderProgressSteps() {
  const container = document.getElementById('progress-steps');
  // Only show first 5 steps in the horizontal progress for cleaner UI
  const visibleSteps = sections.slice(0, 5);

  container.innerHTML = visibleSteps.map((section, index) => {
    let className = 'step-card';
    if (index === state.currentSection) className += ' active';
    if (index < state.currentSection) className += ' completed';

    return `
      <div class="${className}" onclick="goToSection(${index})">
        <div class="step-indicator"></div>
        <div class="step-label">${section.label}</div>
      </div>
    `;
  }).join('');

  // Add "More" indicator if there are more sections
  if (state.currentSection >= 5) {
    container.innerHTML += `
      <div class="step-card ${state.currentSection >= 5 ? 'active' : ''}">
        <div class="step-indicator"></div>
        <div class="step-label">+${sections.length - 5} more</div>
      </div>
    `;
  }
}

function updateProgress() {
  const progress = ((state.currentSection + 1) / sections.length) * 100;
  document.getElementById('progress-fill').style.width = `${progress}%`;
  document.getElementById('progress-step-text').textContent =
    `Section ${state.currentSection + 1} of ${sections.length}`;

  renderNavSteps();
  renderProgressSteps();
  updateScoreDisplay();
}

function updateScoreDisplay() {
  const scorePreview = document.getElementById('score-preview');
  if (state.currentSection > 1) { // Show after first 2 sections
    scorePreview.style.display = 'block';
    document.getElementById('current-score').textContent = state.score;
    document.getElementById('score-fill').style.width = `${state.score}%`;
  }
}

function goToSection(index) {
  if (index <= state.currentSection) {
    state.currentSection = index;
    updateProgress();
    renderFormContent();
  }
}

// ============================================
// Form Rendering
// ============================================

function renderFormContent() {
  const container = document.getElementById('form-section');
  const section = sections[state.currentSection];

  switch(section.id) {
    case 'identity':
      container.innerHTML = renderIdentitySection();
      break;
    case 'partnership':
      container.innerHTML = renderPartnershipSection();
      break;
    case 'icp':
      container.innerHTML = renderICPSection();
      // Apply enriched data suggestions after render
      setTimeout(() => applyEnrichedDataToSection('icp'), 100);
      break;
    case 'revenue':
      container.innerHTML = renderRevenueSection();
      // Apply enriched data suggestions after render
      setTimeout(() => applyEnrichedDataToSection('revenue'), 100);
      break;
    case 'gtm':
      container.innerHTML = renderGTMSection();
      break;
    case 'service':
      container.innerHTML = renderServiceSection();
      break;
    case 'scale':
      container.innerHTML = renderScaleSection();
      break;
    case 'alignment':
      container.innerHTML = renderAlignmentSection();
      break;
    case 'payout':
      container.innerHTML = renderPayoutSection();
      break;
  }
}

// ============================================
// Section A - Partner Identity
// ============================================

function renderIdentitySection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section A · Let's Get Started</span>
      <h2 class="section-title">Tell Us About You</h2>
      <p class="section-subtitle">First, let's set up your partner account. This is the foundation for everything we'll build together.</p>
    </div>

    <div class="info-box">
      <div class="info-box-title">Your Partner Portal awaits</div>
      <p class="info-box-text">Once you're approved, you'll get instant access to your Partner Portal with deal registration, training resources, co-marketing assets, and commission tracking — all tailored to your partnership.</p>
    </div>

    <!-- Enrichment indicator - shows company info when detected -->
    <div id="enrichment-indicator" class="enrichment-indicator" style="display: none;"></div>

    <div class="form-group">
      <label class="form-label">Company Website <span class="required">*</span></label>
      <input type="url" class="form-input" name="companyWebsite"
        placeholder="https://yourcompany.com" value="${d.companyWebsite}"
        onblur="onEmailOrWebsiteChange(this)"
        onchange="onEmailOrWebsiteChange(this)">
      <p class="field-note">Enter your website to auto-fill company details</p>
    </div>

    <div class="form-group">
      <label class="form-label">Legal Company Name <span class="required">*</span></label>
      <input type="text" class="form-input" name="companyName"
        placeholder="Acme Corporation, Inc." value="${d.companyName}">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Your Full Name <span class="required">*</span></label>
        <input type="text" class="form-input" name="contactName"
          placeholder="Jane Smith" value="${d.contactName}">
        <p class="field-note">You'll be the primary contact for this partnership</p>
      </div>

      <div class="form-group">
        <label class="form-label">Your Email <span class="required">*</span></label>
        <input type="email" class="form-input" name="contactEmail"
          placeholder="jane@company.com" value="${d.contactEmail}"
          onblur="onEmailOrWebsiteChange(this)"
          onchange="onEmailOrWebsiteChange(this)">
        <p class="field-note">This will be your Partner Portal login</p>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Your Role <span class="required">*</span></label>
      <input type="text" class="form-input" name="contactTitle"
        placeholder="VP of Partnerships" value="${d.contactTitle}">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Company Country <span class="required">*</span></label>
        <select class="form-select" name="country">
          <option value="">Select country...</option>
          <option value="US" ${d.country === 'US' ? 'selected' : ''}>United States</option>
          <option value="CA" ${d.country === 'CA' ? 'selected' : ''}>Canada</option>
          <option value="UK" ${d.country === 'UK' ? 'selected' : ''}>United Kingdom</option>
          <option value="AU" ${d.country === 'AU' ? 'selected' : ''}>Australia</option>
          <option value="DE" ${d.country === 'DE' ? 'selected' : ''}>Germany</option>
          <option value="FR" ${d.country === 'FR' ? 'selected' : ''}>France</option>
          <option value="OTHER" ${d.country === 'OTHER' ? 'selected' : ''}>Other</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Your Time Zone <span class="required">*</span></label>
        <select class="form-select" name="timezone">
          <option value="">Select timezone...</option>
          <option value="PT" ${d.timezone === 'PT' ? 'selected' : ''}>Pacific Time (PT)</option>
          <option value="MT" ${d.timezone === 'MT' ? 'selected' : ''}>Mountain Time (MT)</option>
          <option value="CT" ${d.timezone === 'CT' ? 'selected' : ''}>Central Time (CT)</option>
          <option value="ET" ${d.timezone === 'ET' ? 'selected' : ''}>Eastern Time (ET)</option>
          <option value="GMT" ${d.timezone === 'GMT' ? 'selected' : ''}>GMT</option>
          <option value="CET" ${d.timezone === 'CET' ? 'selected' : ''}>Central European (CET)</option>
          <option value="AEST" ${d.timezone === 'AEST' ? 'selected' : ''}>Australian Eastern (AEST)</option>
        </select>
        <p class="field-note">Helps us schedule calls at convenient times</p>
      </div>
    </div>

    <div class="form-actions">
      <div></div>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section B - Partnership Model
// ============================================

function renderPartnershipSection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section B · Choose Your Path</span>
      <h2 class="section-title">How Would You Like to Partner?</h2>
      <p class="section-subtitle">There's no wrong answer here — we'll work with you to find the right fit, and you can always evolve your partnership over time.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Which partnership model interests you most? <span class="required">*</span></label>
      <div class="partner-type-grid">
        <div class="partner-type-card ${d.partnerType === 'referral' ? 'selected' : ''}" onclick="selectPartnerType('referral')">
          <input type="radio" name="partnerType" value="referral" ${d.partnerType === 'referral' ? 'checked' : ''}>
          <div class="partner-type-icon">🤝</div>
          <div class="partner-type-name">Referral Partner</div>
          <div class="partner-type-desc">Make introductions and earn commissions on closed deals. Great for consultants, advisors, and tech vendors with aligned customers.</div>
        </div>

        <div class="partner-type-card ${d.partnerType === 'reseller' ? 'selected' : ''}" onclick="selectPartnerType('reseller')">
          <input type="radio" name="partnerType" value="reseller" ${d.partnerType === 'reseller' ? 'checked' : ''}>
          <div class="partner-type-icon">💼</div>
          <div class="partner-type-name">Reseller</div>
          <div class="partner-type-desc">Sell and deliver SalesAI as part of your offering. Ideal for agencies, MSPs, and system integrators who want deeper involvement.</div>
        </div>

        <div class="partner-type-card ${d.partnerType === 'integrated' ? 'selected' : ''}" onclick="selectPartnerType('integrated')">
          <input type="radio" name="partnerType" value="integrated" ${d.partnerType === 'integrated' ? 'checked' : ''}>
          <div class="partner-type-icon">🔌</div>
          <div class="partner-type-name">Integration Partner</div>
          <div class="partner-type-desc">Build a technical integration with SalesAI to serve mutual customers. Perfect for SaaS platforms looking to expand their ecosystem.</div>
        </div>
      </div>
      <p class="field-note">Not sure which to choose? Pick what feels right — we can refine this together.</p>
    </div>

    <div class="agreement-box">
      <label>
        <input type="checkbox" id="agreementAccepted" ${d.agreementAccepted ? 'checked' : ''} onchange="toggleAgreement()">
        <span>I have read and agree to the <a href="#" target="_blank">SalesAI Partner Program Agreement</a>, including the commission structure and partnership guidelines. <span class="required">*</span></span>
      </label>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section C - ICP & Market Fit
// ============================================

function renderICPSection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section C · Finding the Fit</span>
      <h2 class="section-title">Your Customers & Market</h2>
      <p class="section-subtitle">Understanding your customer base helps us provide the right resources, training, and support for your partnership.</p>
    </div>

    <div class="info-box">
      <div class="info-box-title">We're looking for alignment, not perfection</div>
      <p class="info-box-text">SalesAI works best for B2B sales teams making regular calls. Even if there's partial overlap with your customer base, there may still be a strong partnership opportunity.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Describe your ideal customer <span class="required">*</span></label>
      <textarea class="form-textarea" name="primaryICP"
        placeholder="e.g., Mid-market B2B SaaS companies with 50-500 employees, $5M-$50M ARR, typically in tech, fintech, or healthcare verticals...">${d.primaryICP}</textarea>
      <p class="field-note">Industry, company size, revenue range — help us see where SalesAI fits</p>
    </div>

    <div class="form-group">
      <label class="form-label">What percentage of your customers might benefit from SalesAI? <span class="required">*</span></label>
      <select class="form-select" name="icpMatchPercent">
        <option value="">Select percentage...</option>
        <option value="0-25" ${d.icpMatchPercent === '0-25' ? 'selected' : ''}>0-25% — A niche fit</option>
        <option value="26-50" ${d.icpMatchPercent === '26-50' ? 'selected' : ''}>26-50% — Some good opportunities</option>
        <option value="51-75" ${d.icpMatchPercent === '51-75' ? 'selected' : ''}>51-75% — Strong alignment</option>
        <option value="76-100" ${d.icpMatchPercent === '76-100' ? 'selected' : ''}>76-100% — Nearly perfect fit</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Which industries do you primarily serve? <span class="required">*</span></label>
      <div class="checkbox-group">
        ${['SaaS / Software', 'Financial Services', 'Healthcare', 'Professional Services', 'Manufacturing', 'Retail / E-commerce', 'Real Estate', 'Marketing / Agencies', 'Other'].map(v => `
          <label class="checkbox-label">
            <input type="checkbox" name="primaryVerticals" value="${v}" ${d.primaryVerticals.includes(v) ? 'checked' : ''}>
            ${v}
          </label>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">What problems do your customers pay you to solve? <span class="required">*</span></label>
      <textarea class="form-textarea" name="paidCustomerProblems"
        placeholder="e.g., Lead generation, sales enablement, CRM implementation, revenue operations...">${d.paidCustomerProblems}</textarea>
      <p class="field-note">This helps us understand how SalesAI might complement your services</p>
    </div>

    <div class="form-group">
      <label class="form-label">How many sales/customer calls does your average customer make per month? <span class="required">*</span></label>
      <select class="form-select" name="avgMonthlyCallVolume">
        <option value="">Select call volume...</option>
        <option value="0" ${d.avgMonthlyCallVolume === '0' ? 'selected' : ''}>None / Don't know</option>
        <option value="1-50" ${d.avgMonthlyCallVolume === '1-50' ? 'selected' : ''}>1-50 calls/month</option>
        <option value="51-200" ${d.avgMonthlyCallVolume === '51-200' ? 'selected' : ''}>51-200 calls/month</option>
        <option value="201-500" ${d.avgMonthlyCallVolume === '201-500' ? 'selected' : ''}>201-500 calls/month</option>
        <option value="500+" ${d.avgMonthlyCallVolume === '500+' ? 'selected' : ''}>500+ calls/month</option>
      </select>
      <p class="field-note">SalesAI delivers the most value for teams making regular sales or customer calls</p>
    </div>

    <div class="form-group">
      <label class="form-label">What CRMs do your customers typically use? <span class="required">*</span></label>
      <div class="checkbox-group">
        ${['Salesforce', 'HubSpot', 'Pipedrive', 'Microsoft Dynamics', 'Zoho CRM', 'Close', 'None / Custom', 'Other'].map(crm => `
          <label class="checkbox-label">
            <input type="checkbox" name="crmStack" value="${crm}" ${d.crmStack.includes(crm) ? 'checked' : ''}>
            ${crm}
          </label>
        `).join('')}
      </div>
      <p class="field-note">SalesAI integrates with most major CRMs</p>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section D - Revenue Quality
// ============================================

function renderRevenueSection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section D · Your Business</span>
      <h2 class="section-title">Your Business Model</h2>
      <p class="section-subtitle">This helps us understand how SalesAI can add value to your existing customer relationships.</p>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">What's your typical deal size? <span class="required">*</span></label>
        <select class="form-select" name="averageACV">
          <option value="">Select deal size...</option>
          <option value="<5k" ${d.averageACV === '<5k' ? 'selected' : ''}>Under $5,000</option>
          <option value="5k-15k" ${d.averageACV === '5k-15k' ? 'selected' : ''}>$5,000 - $15,000</option>
          <option value="15k-50k" ${d.averageACV === '15k-50k' ? 'selected' : ''}>$15,000 - $50,000</option>
          <option value="50k-100k" ${d.averageACV === '50k-100k' ? 'selected' : ''}>$50,000 - $100,000</option>
          <option value="100k+" ${d.averageACV === '100k+' ? 'selected' : ''}>$100,000+</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Typical engagement length? <span class="required">*</span></label>
        <select class="form-select" name="avgContractLength">
          <option value="">Select length...</option>
          <option value="monthly" ${d.avgContractLength === 'monthly' ? 'selected' : ''}>Month-to-month</option>
          <option value="6-months" ${d.avgContractLength === '6-months' ? 'selected' : ''}>6 months</option>
          <option value="annual" ${d.avgContractLength === 'annual' ? 'selected' : ''}>Annual</option>
          <option value="multi-year" ${d.avgContractLength === 'multi-year' ? 'selected' : ''}>Multi-year</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">What's your revenue mix? <span class="required">*</span></label>
      <select class="form-select" name="recurringRevenuePercent">
        <option value="">Select mix...</option>
        <option value="0-25" ${d.recurringRevenuePercent === '0-25' ? 'selected' : ''}>Mostly project-based (0-25% recurring)</option>
        <option value="26-50" ${d.recurringRevenuePercent === '26-50' ? 'selected' : ''}>Balanced mix (26-50% recurring)</option>
        <option value="51-75" ${d.recurringRevenuePercent === '51-75' ? 'selected' : ''}>Mostly recurring (51-75%)</option>
        <option value="76-100" ${d.recurringRevenuePercent === '76-100' ? 'selected' : ''}>Subscription-focused (76-100% recurring)</option>
      </select>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">How many active customers do you work with? <span class="required">*</span></label>
        <select class="form-select" name="activeCustomers">
          <option value="">Select range...</option>
          <option value="1-10" ${d.activeCustomers === '1-10' ? 'selected' : ''}>1-10</option>
          <option value="11-50" ${d.activeCustomers === '11-50' ? 'selected' : ''}>11-50</option>
          <option value="51-100" ${d.activeCustomers === '51-100' ? 'selected' : ''}>51-100</option>
          <option value="101-500" ${d.activeCustomers === '101-500' ? 'selected' : ''}>101-500</option>
          <option value="500+" ${d.activeCustomers === '500+' ? 'selected' : ''}>500+</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">How long do customers typically stay with you? <span class="required">*</span></label>
        <select class="form-select" name="customerLifetime">
          <option value="">Select duration...</option>
          <option value="<6mo" ${d.customerLifetime === '<6mo' ? 'selected' : ''}>Less than 6 months</option>
          <option value="6-12mo" ${d.customerLifetime === '6-12mo' ? 'selected' : ''}>6-12 months</option>
          <option value="1-2yr" ${d.customerLifetime === '1-2yr' ? 'selected' : ''}>1-2 years</option>
          <option value="2-5yr" ${d.customerLifetime === '2-5yr' ? 'selected' : ''}>2-5 years</option>
          <option value="5yr+" ${d.customerLifetime === '5yr+' ? 'selected' : ''}>5+ years</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">What services do you currently offer?</label>
      <textarea class="form-textarea" name="existingServicesSold"
        placeholder="e.g., CRM implementation ($15k), ongoing managed services ($2k/mo), training packages...">${d.existingServicesSold}</textarea>
      <p class="field-note">SalesAI can complement your existing service offerings</p>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section E - GTM Capability
// ============================================

function renderGTMSection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section E · How You Sell</span>
      <h2 class="section-title">Your Sales Approach</h2>
      <p class="section-subtitle">We'll use this to tailor our training, co-selling support, and sales enablement resources.</p>
    </div>

    <div class="form-group">
      <label class="form-label">How do you typically find new customers? <span class="required">*</span></label>
      <select class="form-select" name="primaryGTMMotion">
        <option value="">Select your main approach...</option>
        <option value="inbound" ${d.primaryGTMMotion === 'inbound' ? 'selected' : ''}>Inbound (content, SEO, referrals)</option>
        <option value="outbound" ${d.primaryGTMMotion === 'outbound' ? 'selected' : ''}>Outbound (prospecting, outreach)</option>
        <option value="partnerships" ${d.primaryGTMMotion === 'partnerships' ? 'selected' : ''}>Partnerships & channel</option>
        <option value="events" ${d.primaryGTMMotion === 'events' ? 'selected' : ''}>Events & community</option>
        <option value="mixed" ${d.primaryGTMMotion === 'mixed' ? 'selected' : ''}>A mix of approaches</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Do you run product demos for prospects? <span class="required">*</span></label>
      <div class="radio-cards">
        <div class="radio-card ${d.runsSalesDemos === 'yes' ? 'selected' : ''}" onclick="selectRadio('runsSalesDemos', 'yes')">
          <input type="radio" name="runsSalesDemos" value="yes" ${d.runsSalesDemos === 'yes' ? 'checked' : ''}>
          <div class="radio-card-label">Yes, regularly</div>
        </div>
        <div class="radio-card ${d.runsSalesDemos === 'no' ? 'selected' : ''}" onclick="selectRadio('runsSalesDemos', 'no')">
          <input type="radio" name="runsSalesDemos" value="no" ${d.runsSalesDemos === 'no' ? 'checked' : ''}>
          <div class="radio-card-label">Not typically</div>
        </div>
        <div class="radio-card ${d.runsSalesDemos === 'sometimes' ? 'selected' : ''}" onclick="selectRadio('runsSalesDemos', 'sometimes')">
          <input type="radio" name="runsSalesDemos" value="sometimes" ${d.runsSalesDemos === 'sometimes' ? 'checked' : ''}>
          <div class="radio-card-label">Sometimes</div>
        </div>
      </div>
      <p class="field-note">We provide demo training and can co-sell with you on deals</p>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">How big is your sales team? <span class="required">*</span></label>
        <select class="form-select" name="salesTeamSize">
          <option value="">Select size...</option>
          <option value="0" ${d.salesTeamSize === '0' ? 'selected' : ''}>Founder-led sales</option>
          <option value="1-2" ${d.salesTeamSize === '1-2' ? 'selected' : ''}>1-2 people</option>
          <option value="3-5" ${d.salesTeamSize === '3-5' ? 'selected' : ''}>3-5 people</option>
          <option value="6-10" ${d.salesTeamSize === '6-10' ? 'selected' : ''}>6-10 people</option>
          <option value="10+" ${d.salesTeamSize === '10+' ? 'selected' : ''}>10+ people</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">How long is your typical sales cycle? <span class="required">*</span></label>
        <select class="form-select" name="salesCycleLength">
          <option value="">Select length...</option>
          <option value="<1mo" ${d.salesCycleLength === '<1mo' ? 'selected' : ''}>Under a month</option>
          <option value="1-3mo" ${d.salesCycleLength === '1-3mo' ? 'selected' : ''}>1-3 months</option>
          <option value="3-6mo" ${d.salesCycleLength === '3-6mo' ? 'selected' : ''}>3-6 months</option>
          <option value="6mo+" ${d.salesCycleLength === '6mo+' ? 'selected' : ''}>6+ months</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Are you currently partnered with other SaaS companies?</label>
      <textarea class="form-textarea" name="currentSaaSPartnerships"
        placeholder="e.g., HubSpot Solutions Partner, Salesforce AppExchange, AWS Partner...">${d.currentSaaSPartnerships}</textarea>
      <p class="field-note">This helps us understand your partnership experience</p>
    </div>

    <div class="form-group">
      <label class="form-label">How comfortable are you positioning AI solutions? <span class="required">*</span></label>
      <div class="range-container">
        <div class="range-value">${d.aiPositioningConfidence}</div>
        <input type="range" class="range-input" name="aiPositioningConfidence"
          min="1" max="5" value="${d.aiPositioningConfidence}"
          oninput="updateRangeValue(this, 'aiPositioningConfidence')">
        <div class="range-labels">
          <span>1 - Still learning</span>
          <span>5 - Very confident</span>
        </div>
      </div>
      <p class="field-note">Don't worry — we have extensive AI sales training to get you up to speed</p>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section F - Service Delivery
// ============================================

function renderServiceSection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section F · Delivery Capabilities</span>
      <h2 class="section-title">How You Serve Customers</h2>
      <p class="section-subtitle">Understanding your delivery model helps us match you with the right partnership tier and support resources.</p>
    </div>

    <div class="info-box">
      <div class="info-box-title">Every model works</div>
      <p class="info-box-text">Whether you're a referral partner who introduces opportunities or a full-service partner who handles implementation, we have a path that fits.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Do you provide onboarding or implementation services? <span class="required">*</span></label>
      <div class="radio-cards">
        <div class="radio-card ${d.providesServices === 'yes' ? 'selected' : ''}" onclick="selectRadio('providesServices', 'yes')">
          <input type="radio" name="providesServices" value="yes" ${d.providesServices === 'yes' ? 'checked' : ''}>
          <div class="radio-card-label">Yes, we do</div>
        </div>
        <div class="radio-card ${d.providesServices === 'no' ? 'selected' : ''}" onclick="selectRadio('providesServices', 'no')">
          <input type="radio" name="providesServices" value="no" ${d.providesServices === 'no' ? 'checked' : ''}>
          <div class="radio-card-label">Not currently</div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">How many customers can you onboard at once?</label>
      <select class="form-select" name="maxConcurrentCustomers">
        <option value="">Select capacity...</option>
        <option value="1-2" ${d.maxConcurrentCustomers === '1-2' ? 'selected' : ''}>1-2 at a time</option>
        <option value="3-5" ${d.maxConcurrentCustomers === '3-5' ? 'selected' : ''}>3-5 at a time</option>
        <option value="6-10" ${d.maxConcurrentCustomers === '6-10' ? 'selected' : ''}>6-10 at a time</option>
        <option value="10+" ${d.maxConcurrentCustomers === '10+' ? 'selected' : ''}>10+ at a time</option>
        <option value="na" ${d.maxConcurrentCustomers === 'na' ? 'selected' : ''}>N/A — we focus on referrals</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Do you have documented processes or playbooks?</label>
      <div class="radio-cards">
        <div class="radio-card ${d.hasServicePlaybooks === 'yes' ? 'selected' : ''}" onclick="selectRadio('hasServicePlaybooks', 'yes')">
          <input type="radio" name="hasServicePlaybooks" value="yes" ${d.hasServicePlaybooks === 'yes' ? 'checked' : ''}>
          <div class="radio-card-label">Yes, fully documented</div>
        </div>
        <div class="radio-card ${d.hasServicePlaybooks === 'no' ? 'selected' : ''}" onclick="selectRadio('hasServicePlaybooks', 'no')">
          <input type="radio" name="hasServicePlaybooks" value="no" ${d.hasServicePlaybooks === 'no' ? 'checked' : ''}>
          <div class="radio-card-label">Not yet</div>
        </div>
        <div class="radio-card ${d.hasServicePlaybooks === 'partial' ? 'selected' : ''}" onclick="selectRadio('hasServicePlaybooks', 'partial')">
          <input type="radio" name="hasServicePlaybooks" value="partial" ${d.hasServicePlaybooks === 'partial' ? 'checked' : ''}>
          <div class="radio-card-label">Some areas</div>
        </div>
      </div>
      <p class="field-note">We provide playbook templates you can customize</p>
    </div>

    <div class="form-group">
      <label class="form-label">Who typically owns customer success post-sale?</label>
      <select class="form-select" name="postSaleOwner">
        <option value="">Select owner...</option>
        <option value="us" ${d.postSaleOwner === 'us' ? 'selected' : ''}>We own it fully</option>
        <option value="vendor" ${d.postSaleOwner === 'vendor' ? 'selected' : ''}>The vendor handles it</option>
        <option value="shared" ${d.postSaleOwner === 'shared' ? 'selected' : ''}>We share responsibility</option>
        <option value="varies" ${d.postSaleOwner === 'varies' ? 'selected' : ''}>Depends on the engagement</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Would you be interested in handling first-line support for SalesAI?</label>
      <div class="radio-cards">
        <div class="radio-card ${d.firstLineSupportOwnership === 'yes' ? 'selected' : ''}" onclick="selectRadio('firstLineSupportOwnership', 'yes')">
          <input type="radio" name="firstLineSupportOwnership" value="yes" ${d.firstLineSupportOwnership === 'yes' ? 'checked' : ''}>
          <div class="radio-card-label">Yes, interested</div>
        </div>
        <div class="radio-card ${d.firstLineSupportOwnership === 'no' ? 'selected' : ''}" onclick="selectRadio('firstLineSupportOwnership', 'no')">
          <input type="radio" name="firstLineSupportOwnership" value="no" ${d.firstLineSupportOwnership === 'no' ? 'checked' : ''}>
          <div class="radio-card-label">No, prefer referral</div>
        </div>
        <div class="radio-card ${d.firstLineSupportOwnership === 'maybe' ? 'selected' : ''}" onclick="selectRadio('firstLineSupportOwnership', 'maybe')">
          <input type="radio" name="firstLineSupportOwnership" value="maybe" ${d.firstLineSupportOwnership === 'maybe' ? 'checked' : ''}>
          <div class="radio-card-label">Open to discussing</div>
        </div>
      </div>
      <p class="field-note">This opens up white-label and deeper partnership opportunities</p>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section G - Scale Potential
// ============================================

function renderScaleSection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section G · Your Goals</span>
      <h2 class="section-title">What Success Looks Like</h2>
      <p class="section-subtitle">Share your ambitions so we can set you up with the right resources to hit your goals.</p>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">How many opportunities do you think you could generate in 90 days? <span class="required">*</span></label>
        <select class="form-select" name="ninetyDayOpportunityEstimate">
          <option value="">Select your best guess...</option>
          <option value="0" ${d.ninetyDayOpportunityEstimate === '0' ? 'selected' : ''}>Still figuring it out</option>
          <option value="1-3" ${d.ninetyDayOpportunityEstimate === '1-3' ? 'selected' : ''}>1-3 opportunities</option>
          <option value="4-10" ${d.ninetyDayOpportunityEstimate === '4-10' ? 'selected' : ''}>4-10 opportunities</option>
          <option value="11-25" ${d.ninetyDayOpportunityEstimate === '11-25' ? 'selected' : ''}>11-25 opportunities</option>
          <option value="25+" ${d.ninetyDayOpportunityEstimate === '25+' ? 'selected' : ''}>25+ opportunities</option>
        </select>
        <p class="field-note">No pressure — this helps us plan our co-selling support</p>
      </div>

      <div class="form-group">
        <label class="form-label">What's your revenue goal for year one? <span class="required">*</span></label>
        <select class="form-select" name="yearOneRevenueGoal">
          <option value="">Select target...</option>
          <option value="<25k" ${d.yearOneRevenueGoal === '<25k' ? 'selected' : ''}>Under $25K</option>
          <option value="25-50k" ${d.yearOneRevenueGoal === '25-50k' ? 'selected' : ''}>$25K - $50K</option>
          <option value="50-100k" ${d.yearOneRevenueGoal === '50-100k' ? 'selected' : ''}>$50K - $100K</option>
          <option value="100-250k" ${d.yearOneRevenueGoal === '100-250k' ? 'selected' : ''}>$100K - $250K</option>
          <option value="250k+" ${d.yearOneRevenueGoal === '250k+' ? 'selected' : ''}>$250K+</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">How would you like to work with us? <span class="required">*</span></label>
      <select class="form-select" name="preferredPartnerPath">
        <option value="">Select approach...</option>
        <option value="referral-only" ${d.preferredPartnerPath === 'referral-only' ? 'selected' : ''}>Referrals — make intros, earn commissions</option>
        <option value="co-sell" ${d.preferredPartnerPath === 'co-sell' ? 'selected' : ''}>Co-sell — work deals together with SalesAI</option>
        <option value="resell" ${d.preferredPartnerPath === 'resell' ? 'selected' : ''}>Resell — own the full sales process</option>
        <option value="white-label" ${d.preferredPartnerPath === 'white-label' ? 'selected' : ''}>White-label — rebrand and deliver as yours</option>
      </select>
      <p class="field-note">This can evolve as you grow with us</p>
    </div>

    <div class="form-group">
      <label class="form-label">Realistically, how much time can you dedicate monthly? <span class="required">*</span></label>
      <select class="form-select" name="monthlyTimeCommitment">
        <option value="">Select commitment...</option>
        <option value="<5" ${d.monthlyTimeCommitment === '<5' ? 'selected' : ''}>A few hours here and there</option>
        <option value="5-10" ${d.monthlyTimeCommitment === '5-10' ? 'selected' : ''}>5-10 hours/month</option>
        <option value="10-20" ${d.monthlyTimeCommitment === '10-20' ? 'selected' : ''}>10-20 hours/month</option>
        <option value="20+" ${d.monthlyTimeCommitment === '20+' ? 'selected' : ''}>20+ hours — this is a priority</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Would you be interested in co-marketing with us? <span class="required">*</span></label>
      <div class="radio-cards">
        <div class="radio-card ${d.openToCoMarketing === 'yes' ? 'selected' : ''}" onclick="selectRadio('openToCoMarketing', 'yes')">
          <input type="radio" name="openToCoMarketing" value="yes" ${d.openToCoMarketing === 'yes' ? 'checked' : ''}>
          <div class="radio-card-label">Yes, excited about it</div>
        </div>
        <div class="radio-card ${d.openToCoMarketing === 'no' ? 'selected' : ''}" onclick="selectRadio('openToCoMarketing', 'no')">
          <input type="radio" name="openToCoMarketing" value="no" ${d.openToCoMarketing === 'no' ? 'checked' : ''}>
          <div class="radio-card-label">Not right now</div>
        </div>
        <div class="radio-card ${d.openToCoMarketing === 'maybe' ? 'selected' : ''}" onclick="selectRadio('openToCoMarketing', 'maybe')">
          <input type="radio" name="openToCoMarketing" value="maybe" ${d.openToCoMarketing === 'maybe' ? 'checked' : ''}>
          <div class="radio-card-label">Tell me more</div>
        </div>
      </div>
      <p class="field-note">Webinars, case studies, joint content — we'd love to amplify your brand</p>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section H - Alignment (Internal Only)
// ============================================

function renderAlignmentSection() {
  const d = state.data;
  return `
    <div class="section-header">
      <span class="section-badge">Section H · Let's Be Real</span>
      <h2 class="section-title">Setting Ourselves Up for Success</h2>
      <p class="section-subtitle">Honest answers here help us understand what you need and how we can best support you.</p>
    </div>

    <div class="info-box">
      <div class="info-box-title">This stays between us</div>
      <p class="info-box-text">Your Partner Manager will use these answers to personalize your onboarding and proactively address any challenges. The more honest you are, the better we can support you.</p>
    </div>

    <div class="form-group">
      <label class="form-label">What drew you to SalesAI? <span class="required">*</span></label>
      <textarea class="form-textarea" name="whySalesAINow"
        placeholder="What made you interested in partnering with us? Is there a specific customer need, market opportunity, or business goal driving this?">${d.whySalesAINow}</textarea>
      <p class="field-note">Understanding your "why" helps us tailor your experience</p>
    </div>

    <div class="form-group">
      <label class="form-label">What challenges might get in the way? <span class="required">*</span></label>
      <textarea class="form-textarea" name="failureConditions"
        placeholder="Are there any constraints we should know about? Resource limitations, competing priorities, past partnership experiences that didn't work out?">${d.failureConditions}</textarea>
      <p class="field-note">We'd rather know upfront so we can plan around it together</p>
    </div>

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <button class="btn btn-primary" onclick="nextSection()">Continue →</button>
    </div>
  `;
}

// ============================================
// Section I - Payout Readiness
// ============================================

function renderPayoutSection() {
  const d = state.data;

  // Calculate final score
  calculateScore();

  const qualified = state.score >= SCORE_THRESHOLD && !state.disqualified;

  return `
    <div class="section-header">
      <span class="section-badge">Section I · Almost There</span>
      <h2 class="section-title">Ready to Earn</h2>
      <p class="section-subtitle">One last step — let's make sure you can get paid when you start closing deals.</p>
    </div>

    <div class="form-group">
      <label class="form-label">How should we pay you? <span class="required">*</span></label>
      <select class="form-select" name="payoutEntityType">
        <option value="">Select entity type...</option>
        <option value="individual" ${d.payoutEntityType === 'individual' ? 'selected' : ''}>Individual / Sole Proprietor</option>
        <option value="llc" ${d.payoutEntityType === 'llc' ? 'selected' : ''}>LLC</option>
        <option value="corporation" ${d.payoutEntityType === 'corporation' ? 'selected' : ''}>Corporation</option>
        <option value="partnership" ${d.payoutEntityType === 'partnership' ? 'selected' : ''}>Partnership</option>
      </select>
      <p class="field-note">You can update this later in your Partner Portal</p>
    </div>

    <div class="form-group">
      <label class="form-label">Are you ready to complete tax documentation? <span class="required">*</span></label>
      <div class="radio-cards">
        <div class="radio-card ${d.taxSetupReady === 'yes' ? 'selected' : ''}" onclick="selectRadio('taxSetupReady', 'yes')">
          <input type="radio" name="taxSetupReady" value="yes" ${d.taxSetupReady === 'yes' ? 'checked' : ''}>
          <div class="radio-card-label">Yes, ready now</div>
        </div>
        <div class="radio-card ${d.taxSetupReady === 'soon' ? 'selected' : ''}" onclick="selectRadio('taxSetupReady', 'soon')">
          <input type="radio" name="taxSetupReady" value="soon" ${d.taxSetupReady === 'soon' ? 'checked' : ''}>
          <div class="radio-card-label">Within 30 days</div>
        </div>
        <div class="radio-card ${d.taxSetupReady === 'later' ? 'selected' : ''}" onclick="selectRadio('taxSetupReady', 'later')">
          <input type="radio" name="taxSetupReady" value="later" ${d.taxSetupReady === 'later' ? 'checked' : ''}>
          <div class="radio-card-label">I'll do it later</div>
        </div>
      </div>
      <p class="field-note">W-9 for US partners, W-8BEN for international — required before your first payout</p>
    </div>

    ${qualified ? `
      <div class="cta-box">
        <h3 class="cta-title">Welcome to the SalesAI Partner Family</h3>
        <p class="cta-subtitle">You're about to join a community of partners who are transforming how businesses sell. Let's make this official.</p>

        <div class="agreement-box" style="margin-bottom: 20px; text-align: left;">
          <label>
            <input type="checkbox" id="finalAgreement">
            <span>I confirm everything looks good and I'm ready to start my partnership journey.</span>
          </label>
        </div>

        <button class="btn-cta" onclick="submitApplication()">Launch My Partnership →</button>
      </div>
    ` : `
      <div class="not-qualified-box">
        <h3 class="not-qualified-title">Let's Find the Right Fit</h3>
        <p class="not-qualified-text">
          Thanks for your interest in partnering with SalesAI! Based on your responses, we'd like to have a quick conversation to explore the best partnership path for you.
          ${state.disqualified ? `<br><br>We noticed some areas where we might need to get creative to make this work.` : ''}
          <br><br>Our Partner Team will reach out within 2-3 business days to discuss options.
        </p>
        <button class="btn btn-primary" onclick="submitForReview()" style="margin-top: 16px;">Submit & Start the Conversation</button>
      </div>
    `}

    <div class="form-actions">
      <button class="btn btn-ghost" onclick="prevSection()">← Back</button>
      <div></div>
    </div>
  `;
}

// ============================================
// Scoring Logic
// ============================================

function calculateScore() {
  let score = 0;
  state.disqualified = false;
  state.disqualifyReasons = [];

  // Check hard disqualifiers first

  // Disqualifier: No call volume
  if (state.data.avgMonthlyCallVolume === '0') {
    state.disqualified = true;
    state.disqualifyReasons.push('Customers do not make sales calls (SalesAI requires call volume)');
  }

  // Disqualifier: No CRM
  if (state.data.crmStack.includes('None / Custom') && state.data.crmStack.length === 1) {
    state.disqualified = true;
    state.disqualifyReasons.push('No CRM integration available');
  }

  // Disqualifier: No demos + no sales team + referral only
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

  // Normalize to 100
  state.score = Math.min(100, Math.round(score));
}

// ============================================
// Navigation & Data Management
// ============================================

function nextSection() {
  if (validateCurrentSection()) {
    saveCurrentSectionData();
    if (state.currentSection < sections.length - 1) {
      state.currentSection++;
      updateProgress();
      renderFormContent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function prevSection() {
  if (state.currentSection > 0) {
    saveCurrentSectionData();
    state.currentSection--;
    updateProgress();
    renderFormContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function validateCurrentSection() {
  const section = sections[state.currentSection];

  // Add validation logic per section
  switch(section.id) {
    case 'identity':
      if (!getValue('companyName') || !getValue('companyWebsite') ||
          !getValue('contactName') || !getValue('contactEmail') ||
          !getValue('country') || !getValue('timezone')) {
        alert('Please fill in all required fields');
        return false;
      }
      if (!isValidEmail(getValue('contactEmail'))) {
        alert('Please enter a valid email address');
        return false;
      }
      return true;

    case 'partnership':
      if (!state.data.partnerType) {
        alert('Please select a partnership type');
        return false;
      }
      if (!state.data.agreementAccepted) {
        alert('Please accept the Partner Agreement to continue');
        return false;
      }
      return true;

    case 'icp':
      if (!getValue('primaryICP') || !getValue('icpMatchPercent') ||
          !getValue('avgMonthlyCallVolume') || getCheckedValues('primaryVerticals').length === 0 ||
          getCheckedValues('crmStack').length === 0) {
        alert('Please fill in all required fields');
        return false;
      }
      return true;

    default:
      return true;
  }
}

function saveCurrentSectionData() {
  const section = sections[state.currentSection];

  switch(section.id) {
    case 'identity':
      state.data.companyName = getValue('companyName');
      state.data.companyWebsite = getValue('companyWebsite');
      state.data.contactName = getValue('contactName');
      state.data.contactEmail = getValue('contactEmail');
      state.data.contactTitle = getValue('contactTitle');
      state.data.country = getValue('country');
      state.data.timezone = getValue('timezone');
      break;

    case 'icp':
      state.data.primaryICP = getValue('primaryICP');
      state.data.icpMatchPercent = getValue('icpMatchPercent');
      state.data.primaryVerticals = getCheckedValues('primaryVerticals');
      state.data.paidCustomerProblems = getValue('paidCustomerProblems');
      state.data.avgMonthlyCallVolume = getValue('avgMonthlyCallVolume');
      state.data.crmStack = getCheckedValues('crmStack');
      break;

    case 'revenue':
      state.data.averageACV = getValue('averageACV');
      state.data.avgContractLength = getValue('avgContractLength');
      state.data.recurringRevenuePercent = getValue('recurringRevenuePercent');
      state.data.activeCustomers = getValue('activeCustomers');
      state.data.customerLifetime = getValue('customerLifetime');
      state.data.existingServicesSold = getValue('existingServicesSold');
      break;

    case 'gtm':
      state.data.primaryGTMMotion = getValue('primaryGTMMotion');
      state.data.salesCycleLength = getValue('salesCycleLength');
      state.data.currentSaaSPartnerships = getValue('currentSaaSPartnerships');
      break;

    case 'service':
      state.data.maxConcurrentCustomers = getValue('maxConcurrentCustomers');
      state.data.postSaleOwner = getValue('postSaleOwner');
      break;

    case 'scale':
      state.data.ninetyDayOpportunityEstimate = getValue('ninetyDayOpportunityEstimate');
      state.data.yearOneRevenueGoal = getValue('yearOneRevenueGoal');
      state.data.preferredPartnerPath = getValue('preferredPartnerPath');
      state.data.monthlyTimeCommitment = getValue('monthlyTimeCommitment');
      break;

    case 'alignment':
      state.data.whySalesAINow = getValue('whySalesAINow');
      state.data.failureConditions = getValue('failureConditions');
      break;

    case 'payout':
      state.data.payoutEntityType = getValue('payoutEntityType');
      break;
  }
}

// ============================================
// Helper Functions
// ============================================

function getValue(name) {
  const el = document.querySelector(`[name="${name}"]`);
  return el ? el.value : '';
}

function getCheckedValues(name) {
  const checkboxes = document.querySelectorAll(`[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function selectPartnerType(type) {
  state.data.partnerType = type;
  document.querySelectorAll('.partner-type-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');
}

function selectRadio(name, value) {
  state.data[name] = value;
  const container = event.currentTarget.parentElement;
  container.querySelectorAll('.radio-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');
}

function toggleAgreement() {
  state.data.agreementAccepted = document.getElementById('agreementAccepted').checked;
}

function updateRangeValue(input, name) {
  state.data[name] = parseInt(input.value);
  input.parentElement.querySelector('.range-value').textContent = input.value;
}

// ============================================
// Submission
// ============================================

function submitApplication() {
  const finalAgreement = document.getElementById('finalAgreement');
  if (!finalAgreement?.checked) {
    alert('Please confirm your information is accurate');
    return;
  }

  saveCurrentSectionData();
  showSuccessModal();
}

function submitForReview() {
  saveCurrentSectionData();
  showReviewModal();
}

function showSuccessModal() {
  const d = state.data;
  document.getElementById('success-content').innerHTML = `
    <div class="success-icon">🎉</div>
    <h3 class="success-title">You're In! Welcome to SalesAI</h3>
    <p class="success-text">
      <strong>${d.companyName}</strong> is now an official SalesAI Partner.
      Check your email at <strong>${d.contactEmail}</strong> to access your Partner Portal.
    </p>
    <div class="success-next-steps">
      <h4>Here's what happens next:</h4>
      <ul>
        <li>Your dedicated Partner Manager will reach out within 24 hours to schedule your kickoff call</li>
        <li>Access your Partner Portal to explore training, resources, and deal registration</li>
        <li>Complete your tax documentation to activate payouts</li>
        <li>Join our partner Slack community to connect with other partners</li>
      </ul>
    </div>
    <p class="success-text" style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
      We're excited to have you on board. Let's build something great together.
    </p>
  `;
  document.getElementById('success-modal').classList.add('active');
}

function showReviewModal() {
  const d = state.data;
  document.getElementById('disqualified-content').innerHTML = `
    <div class="disqualified-icon">👋</div>
    <h3 class="disqualified-title">Thanks for Applying, ${d.contactName.split(' ')[0] || 'Partner'}!</h3>
    <p class="disqualified-text">
      We've received your application for <strong>${d.companyName}</strong> and we're excited to learn more about you.
      <br><br>
      One of our Partner Team members will be in touch within 2-3 business days to discuss how we can work together.
    </p>
    <div class="disqualified-options">
      <h4>In the meantime:</h4>
      <ul>
        <li>Check out how our partners are succeeding at salesai.com/partners</li>
        <li>Explore the SalesAI platform with a demo</li>
        <li>Follow us on LinkedIn for the latest partner opportunities</li>
      </ul>
    </div>
  `;
  document.getElementById('disqualified-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('success-modal').classList.remove('active');
  window.location.reload();
}

function closeDisqualifiedModal() {
  document.getElementById('disqualified-modal').classList.remove('active');
}
