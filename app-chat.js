// SalesAI Partner Application - Chat Version
// Conversational flow with rich inline components

// ============================================
// CONFIGURATION & DATA
// ============================================

// API Keys - Set these in config.js (gitignored) or replace with your own
// Load from config.js if available, otherwise use placeholders
const COMPANIES_API_KEY = window.CONFIG?.COMPANIES_API_KEY || 'YOUR_COMPANIES_API_KEY';
const ANTHROPIC_API_KEY = window.CONFIG?.ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY';

// ScrapingBee API Configuration
// Used for JS-heavy websites that don't render properly with static fetching
const SCRAPINGBEE_CONFIG = {
  apiKey: window.CONFIG?.SCRAPINGBEE_API_KEY || 'YOUR_SCRAPINGBEE_API_KEY',
  baseUrl: 'https://app.scrapingbee.com/api/v1',
  // Cost: 5 credits per request with JS rendering (render_js=true is default)
  // Budget: 1000 free credits - use judiciously!
  // Static fetch is tried first; ScrapingBee only used as fallback for JS-heavy sites
  enabled: !!(window.CONFIG?.SCRAPINGBEE_API_KEY)
};

// PartnerStack API Configuration
// Replace with your actual PartnerStack API credentials
const PARTNERSTACK_CONFIG = {
  apiKey: 'YOUR_PARTNERSTACK_API_KEY', // Bearer token from Partner dashboard > Settings > API
  publicKey: 'YOUR_PUBLIC_KEY', // For Basic Auth (public_key:secret_key)
  secretKey: 'YOUR_SECRET_KEY',
  baseUrl: 'https://api.partnerstack.com/api/v2',
  defaultGroupKey: 'salesai-partners', // Default partner group
  // Tier to group mapping - route partners to different groups based on assessment
  tierGroups: {
    'PRO': 'salesai-pro-partners',
    'ADVANCED': 'salesai-advanced-partners',
    'STANDARD': 'salesai-standard-partners',
    'EMERGING': 'salesai-emerging-partners'
  }
};

// Location code mapping for PartnerStack country field
const LOCATION_TO_COUNTRY = {
  'us': 'US',
  'ca': 'CA',
  'uk': 'GB',
  'eu': 'EU', // Note: PartnerStack may need specific country codes
  'apac': 'APAC',
  'latam': 'LATAM',
  'other': null
};

// AI Sales Competitors to detect - indicates partner is already aligned with AI sales value props
const AI_SALES_COMPETITORS = [
  // Direct AI SDR/Sales Automation Competitors
  { name: '11x', patterns: ['11x', '11x.ai', 'eleven x', 'elevenx'], category: 'AI SDR' },
  { name: 'Artisan', patterns: ['artisan', 'artisan.co', 'artisan ai'], category: 'AI SDR' },
  { name: 'Regie.ai', patterns: ['regie', 'regie.ai'], category: 'AI SDR' },
  { name: 'Amplemarket', patterns: ['amplemarket'], category: 'AI SDR' },
  { name: 'Relevance AI', patterns: ['relevance ai', 'relevance.ai'], category: 'AI SDR' },
  { name: 'Clay', patterns: ['clay.com', 'clay.run', 'useclay'], category: 'AI SDR' },
  { name: 'Lavender', patterns: ['lavender', 'lavender.ai'], category: 'AI Sales' },
  { name: 'Instantly', patterns: ['instantly', 'instantly.ai'], category: 'AI Outreach' },
  { name: 'Smartlead', patterns: ['smartlead', 'smartlead.ai'], category: 'AI Outreach' },

  // Conversation Intelligence
  { name: 'Gong', patterns: ['gong.io', 'gong '], category: 'Conversation Intelligence' },
  { name: 'Chorus', patterns: ['chorus.ai', 'chorus '], category: 'Conversation Intelligence' },
  { name: 'Clari', patterns: ['clari.com', 'clari '], category: 'Revenue Intelligence' },
  { name: 'Wingman', patterns: ['wingman', 'trywingman'], category: 'Conversation Intelligence' },

  // Sales Engagement
  { name: 'Outreach', patterns: ['outreach.io', 'outreach '], category: 'Sales Engagement' },
  { name: 'Salesloft', patterns: ['salesloft'], category: 'Sales Engagement' },
  { name: 'Apollo', patterns: ['apollo.io', 'apollo '], category: 'Sales Engagement' },
  { name: 'ZoomInfo', patterns: ['zoominfo'], category: 'Sales Intelligence' },
  { name: 'Cognism', patterns: ['cognism'], category: 'Sales Intelligence' },
  { name: 'Lusha', patterns: ['lusha'], category: 'Sales Intelligence' },
  { name: 'Seamless.AI', patterns: ['seamless.ai', 'seamlessai'], category: 'Sales Intelligence' },

  // AI Meeting/Demo Tools
  { name: 'Warmly', patterns: ['warmly.ai', 'warmly '], category: 'AI Meetings' },
  { name: 'Drift', patterns: ['drift.com', 'drift '], category: 'Conversational Sales' },
  { name: 'Qualified', patterns: ['qualified.com', 'qualified '], category: 'Conversational Sales' },

  // CRM AI Features
  { name: 'HubSpot AI', patterns: ['hubspot ai', 'hubspot artificial intelligence'], category: 'CRM AI' },
  { name: 'Salesforce Einstein', patterns: ['einstein', 'salesforce ai'], category: 'CRM AI' }
];

// SalesAi Company Profile - Used for "Better Together" positioning
const SALESAI_PROFILE = {
  name: 'SalesAi',
  tagline: 'Win the Moment with Voice AI',
  description: 'AI Voice Agents that answer calls in seconds for sales and support teams',

  // Core use cases we solve
  useCases: [
    {
      id: 'speed-to-lead',
      name: 'Speed to Lead',
      problem: 'Leads go cold because you can\'t respond fast enough',
      solution: 'AI answers within seconds, qualifies, and books meetings before competitors',
      metrics: ['< 5 second response time', '24/7 coverage', '3x more meetings booked']
    },
    {
      id: 'inbound-response',
      name: 'Inbound Call Handling',
      problem: 'Missing calls means missing revenue',
      solution: 'Every inbound call answered by human-sounding AI that routes to the right rep',
      metrics: ['100% answer rate', 'Instant qualification', 'Smart routing']
    },
    {
      id: 'tier1-support',
      name: 'Tier 1 Support Automation',
      problem: 'Support teams are stretched thin with repetitive questions',
      solution: 'AI handles routine support, onboarding, and check-ins with empathy',
      metrics: ['80% deflection rate', 'Faster resolution', 'Happier customers']
    },
    {
      id: 'pipeline-revival',
      name: 'Pipeline Revival',
      problem: 'CRM full of dormant leads nobody has time to call',
      solution: 'AI re-engages cold opportunities with personalized voice outreach',
      metrics: ['Revive dead pipeline', 'No added headcount', 'Personalized at scale']
    },
    {
      id: 'outbound-calling',
      name: 'Outbound at Scale',
      problem: 'SDRs can\'t make enough calls to hit pipeline targets',
      solution: 'AI makes outbound calls, qualifies prospects, and books meetings',
      metrics: ['10x call volume', 'Consistent messaging', 'Reps focus on closing']
    }
  ],

  // Value propositions
  valueProps: [
    { icon: '⚡', title: 'Instant Response', desc: 'Answer every call in seconds, 24/7' },
    { icon: '📈', title: 'Scale Without Headcount', desc: 'Automate without growing payroll' },
    { icon: '🤖', title: 'Human-Like AI', desc: 'Natural conversations, not robotic scripts' },
    { icon: '🔌', title: 'Easy Integration', desc: 'Works with HubSpot, Salesforce, Zapier' },
    { icon: '🚀', title: 'Fast Onboarding', desc: 'Live in hours, not weeks' }
  ],

  // Target customers
  targetCustomers: {
    segments: ['SaaS', 'Professional Services'],
    teams: ['Sales Teams', 'Support Teams', 'Revenue Teams', 'Customer Success'],
    companySize: ['Mid-Market', 'Enterprise']
  },

  // Integrations
  integrations: ['HubSpot', 'Salesforce', 'Zapier', 'Calendly', 'Slack'],

  // How we complement different partner types
  partnerComplementMap: {
    'Conversation Intelligence': {
      partners: ['Gong', 'Chorus', 'Clari'],
      theirValue: 'Analyze conversations and coach reps',
      ourValue: 'Get more conversations to analyze',
      customerJourney: [
        { stage: 'Lead Response', owner: 'SalesAi', action: 'Instant qualification and meeting booking' },
        { stage: 'Discovery Call', owner: 'Partner', action: 'Record and analyze the call' },
        { stage: 'Follow-up', owner: 'SalesAi', action: 'Automated next-step scheduling' },
        { stage: 'Deal Review', owner: 'Partner', action: 'Coaching insights and forecasting' }
      ],
      betterTogether: 'SalesAi fills the pipeline → Partner extracts insights'
    },
    'Sales Engagement': {
      partners: ['Outreach', 'Salesloft', 'Apollo'],
      theirValue: 'Orchestrate multi-channel sequences',
      ourValue: 'Add voice channel with instant response',
      customerJourney: [
        { stage: 'Sequence Start', owner: 'Partner', action: 'Email cadence begins' },
        { stage: 'Hot Lead', owner: 'SalesAi', action: 'Instant call when lead engages' },
        { stage: 'Meeting Set', owner: 'SalesAi', action: 'Books directly on calendar' },
        { stage: 'Nurture', owner: 'Partner', action: 'Continue multi-touch sequence' }
      ],
      betterTogether: 'Partner orchestrates → SalesAi adds voice at the right moment'
    },
    'CRM Platform': {
      partners: ['HubSpot', 'Salesforce', 'Pipedrive'],
      theirValue: 'System of record for customer data',
      ourValue: 'AI-powered actions triggered from CRM events',
      customerJourney: [
        { stage: 'New Lead', owner: 'Partner', action: 'Lead created in CRM' },
        { stage: 'Instant Response', owner: 'SalesAi', action: 'AI calls within 5 seconds' },
        { stage: 'Data Sync', owner: 'Both', action: 'Call notes and outcome logged' },
        { stage: 'Pipeline', owner: 'Partner', action: 'Deal progresses through stages' }
      ],
      betterTogether: 'Partner stores the data → SalesAi acts on it instantly'
    },
    'Conversational Sales': {
      partners: ['Drift', 'Qualified', 'Intercom'],
      theirValue: 'Website chat and visitor intelligence',
      ourValue: 'Outbound voice outreach at scale',
      customerJourney: [
        { stage: 'Website Visit', owner: 'Partner', action: 'Chat engagement, visitor ID' },
        { stage: 'Outbound', owner: 'SalesAi', action: 'Voice follow-up on cold leads' },
        { stage: 'Inbound Call', owner: 'SalesAi', action: 'Handle phone inquiries' },
        { stage: 'Handoff', owner: 'Partner', action: 'Continue conversation in chat' }
      ],
      betterTogether: 'Partner owns inbound chat → SalesAi owns voice channel'
    }
  }
};

// Conversation sections mapping to original form sections
const SECTIONS = [
  { id: 'welcome', label: 'Welcome', letter: 'A' },
  { id: 'company', label: 'Your Company', letter: 'B' },
  { id: 'icp', label: 'Ideal Customer', letter: 'C' },
  { id: 'sales', label: 'Sales Motion', letter: 'D' },
  { id: 'revenue', label: 'Revenue', letter: 'E' },
  { id: 'partnership', label: 'Partnership', letter: 'F' },
  { id: 'services', label: 'Services', letter: 'G' },
  { id: 'growth', label: 'Growth', letter: 'H' },
  { id: 'ready', label: 'Account Setup', letter: 'I' },
  { id: 'sandbox', label: 'Sandbox', letter: 'J' },
  { id: 'extension', label: 'Extension', letter: 'K' },
  { id: 'schedule', label: 'Schedule', letter: 'L' }
];

// ICP Builder Options
const ICP_OPTIONS = {
  revenue: [
    { value: 'pre-revenue', label: 'Pre-Revenue', desc: 'Startups not yet generating revenue' },
    { value: '0-1m', label: '$0 - $1M', desc: 'Early stage businesses' },
    { value: '1-5m', label: '$1M - $5M', desc: 'Growing SMBs' },
    { value: '5-10m', label: '$5M - $10M', desc: 'Established SMBs' },
    { value: '10-25m', label: '$10M - $25M', desc: 'Mid-market' },
    { value: '25-50m', label: '$25M - $50M', desc: 'Upper mid-market' },
    { value: '50-100m', label: '$50M - $100M', desc: 'Lower enterprise' },
    { value: '100m+', label: '$100M+', desc: 'Enterprise' }
  ],
  headcount: [
    { value: '1-10', label: '1-10', desc: 'Micro businesses' },
    { value: '11-50', label: '11-50', desc: 'Small businesses' },
    { value: '51-200', label: '51-200', desc: 'Growing companies' },
    { value: '201-500', label: '201-500', desc: 'Mid-size companies' },
    { value: '501-1000', label: '501-1,000', desc: 'Large companies' },
    { value: '1001-5000', label: '1,001-5,000', desc: 'Enterprise' },
    { value: '5000+', label: '5,000+', desc: 'Large enterprise' }
  ],
  verticals: [
    'SaaS / Software', 'Professional Services', 'Financial Services', 'Healthcare',
    'Manufacturing', 'Retail / E-commerce', 'Real Estate', 'Construction',
    'Logistics / Transportation', 'Education', 'Non-Profit', 'Legal Services',
    'Marketing / Advertising', 'Technology / IT', 'Energy / Utilities', 'Hospitality',
    'Insurance', 'Telecommunications', 'Automotive', 'Media / Entertainment'
  ],
  traits: [
    'Using outdated CRM', 'No dedicated sales team', 'Rapid growth phase',
    'Recently funded', 'Sales team of 5+', 'Multiple sales channels',
    'Complex sales cycle', 'High ticket deals', 'Subscription model',
    'Enterprise sales motion', 'SMB-focused', 'International presence',
    'Remote/hybrid team', 'Tech-savvy leadership', 'Digital transformation focus'
  ],
  regions: [
    'North America', 'United States', 'Canada', 'United Kingdom', 'Europe',
    'APAC', 'Australia', 'LATAM', 'Middle East', 'Global'
  ]
};

// ============================================
// STATE MANAGEMENT
// ============================================

let state = {
  currentSection: 0,
  currentQuestion: 0,
  formData: {},
  score: 0,
  enrichedCompany: null,
  customerCompanies: [], // Discovered customer companies from website
  customerEnrichments: [], // Enriched customer data
  competitorSignals: [], // AI sales competitors they work with (PRO partner indicator)
  partnerFitSignals: {}, // Partner fit signals from website analysis
  partnerReadinessScore: 0, // 0-100 score based on signals
  smartPrefill: null, // AI-generated pre-fill data
  conversationHistory: [],
  awaitingResponse: false,
  inputMode: 'text' // 'text', 'component', 'disabled'
};

// ============================================
// DOM ELEMENTS (initialized in init())
// ============================================

let chatMessages, chatMessagesInner, chatInput, chatSendBtn, navSteps, progressText, scorePreview, currentScoreEl, scoreFillEl;

// ============================================
// CONVERSATION FLOW
// ============================================

const conversationFlow = [
  // SECTION A: Welcome
  {
    section: 0,
    type: 'message',
    content: `Hey there! I'm so excited you're exploring a partnership with SalesAI.

I'm here to learn about you and your business so we can design the perfect partnership experience. This conversation will help us understand how we can best support your growth.

Let's start with the basics — what's your name?`,
    inputType: 'text',
    field: 'fullName',
    placeholder: 'Enter your name',
    onSubmit: (value) => {
      // Parse full name into first and last name
      const parts = value.trim().split(/\s+/);
      if (parts.length >= 2) {
        state.formData.firstName = parts[0];
        state.formData.lastName = parts.slice(1).join(' ');
      } else {
        state.formData.firstName = parts[0];
        // lastName will be asked in next step
      }
    }
  },
  {
    section: 0,
    type: 'message',
    content: (data) => `Great to meet you, ${data.firstName}! And your last name?`,
    inputType: 'text',
    field: 'lastName',
    placeholder: 'Enter your last name',
    skipIf: (data) => !!data.lastName  // Skip if we already parsed a last name
  },
  {
    section: 0,
    type: 'message',
    content: `What's the best email to reach you?`,
    inputType: 'text',
    field: 'email',
    placeholder: 'Enter your email address',
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Please enter a valid email address';
    },
    onSubmit: async (value) => {
      // Extract domain from email and check if it's a business domain
      const domain = value.split('@')[1]?.toLowerCase();
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'live.com', 'msn.com'];

      if (domain && !personalDomains.includes(domain)) {
        // Store the extracted domain for confirmation
        state.formData.extractedDomain = domain;
      }
    }
  },
  // Confirm domain extracted from email
  {
    section: 0,
    type: 'message',
    content: (data) => `Is **${data.extractedDomain}** your company's primary website?`,
    inputType: 'select',
    field: 'domainConfirmed',
    options: [
      { value: 'yes', label: `Yes, that's correct` },
      { value: 'no', label: 'No, let me enter it' }
    ],
    skipIf: (data) => !data.extractedDomain,  // Only show if we extracted a domain
    onSubmit: async (value) => {
      if (value === 'yes') {
        state.formData.companyWebsite = state.formData.extractedDomain;
        state.formData.emailDomainExtracted = true;
        // Trigger enrichment
        await enrichCompanyData(state.formData.extractedDomain);
      }
      // If 'no', they'll be asked for company info in the normal flow
    }
  },
  {
    section: 0,
    type: 'message',
    content: `And a phone number where we can reach you if needed?`,
    inputType: 'text',
    field: 'phone',
    placeholder: 'Enter your phone number'
  },

  // SECTION B: Company Info
  // This message shows when we already extracted company from email
  {
    section: 1,
    type: 'message',
    content: (data) => {
      const companyName = state.enrichedCompanyData?.name || data.companyWebsite;
      return `Perfect, ${data.firstName}! I see you're with **${companyName}** — I've already pulled up some information about your company.

What's your role there?`;
    },
    inputType: 'select',
    field: 'role',
    options: [
      { value: 'founder-ceo', label: 'Founder / CEO' },
      { value: 'sales-leader', label: 'Sales Leader' },
      { value: 'marketing-leader', label: 'Marketing Leader' },
      { value: 'partnerships-bd', label: 'Partnerships / BD' },
      { value: 'consultant', label: 'Consultant / Agency' },
      { value: 'other', label: 'Other' }
    ],
    skipIf: (data) => !data.emailDomainExtracted  // Only show when we extracted from email
  },
  {
    section: 1,
    type: 'message',
    content: (data) => `Perfect, ${data.firstName}! Now let's talk about your company.

What's the name of your company?`,
    inputType: 'text',
    field: 'companyName',
    placeholder: 'Enter your company name',
    skipIf: (data) => !!data.emailDomainExtracted  // Skip if we extracted from email
  },
  {
    section: 1,
    type: 'message',
    content: `What's your company website? I'll look it up to learn more about what you do.`,
    inputType: 'text',
    field: 'companyWebsite',
    placeholder: 'e.g., yourcompany.com',
    skipIf: (data) => !!data.emailDomainExtracted,  // Skip if we extracted from email
    onSubmit: async (value) => {
      // Trigger company enrichment
      await enrichCompanyData(value);
    }
  },
  {
    section: 1,
    type: 'enrichment',
    content: `Let me look that up...`,
    skipIf: (data) => !!data.emailDomainExtracted  // Skip if we already enriched from email
  },
  {
    section: 1,
    type: 'message',
    content: `What's your role at the company?`,
    inputType: 'select',
    field: 'role',
    options: [
      { value: 'founder-ceo', label: 'Founder / CEO' },
      { value: 'sales-leader', label: 'Sales Leader' },
      { value: 'partner-manager', label: 'Partner / Channel Manager' },
      { value: 'consultant', label: 'Consultant / Advisor' },
      { value: 'bdr-ae', label: 'BDR / AE' },
      { value: 'other', label: 'Other' }
    ],
    skipIf: (data) => !!data.emailDomainExtracted  // Skip if already asked in email-extracted flow
  },
  {
    section: 1,
    type: 'message',
    content: `Where are you based?`,
    inputType: 'select',
    field: 'location',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'eu', label: 'Europe' },
      { value: 'apac', label: 'Asia-Pacific' },
      { value: 'latam', label: 'Latin America' },
      { value: 'other', label: 'Other' }
    ]
  },

  // SECTION C: ICP
  {
    section: 2,
    type: 'message',
    content: `Now here's where it gets interesting. Let's build a picture of your ideal customer.

I want to understand exactly who you serve best — this helps us identify where we can add the most value together.

Let's start with company size. What's the typical **annual revenue** of your ideal customers?`,
    inputType: 'icp-range',
    field: 'icpRevenue',
    options: ICP_OPTIONS.revenue,
    multiSelect: true
  },
  {
    section: 2,
    type: 'message',
    content: `And how about **team size**? How many employees do your ideal customers typically have?`,
    inputType: 'icp-range',
    field: 'icpHeadcount',
    options: ICP_OPTIONS.headcount,
    multiSelect: true
  },
  {
    section: 2,
    type: 'message',
    content: `What **industries or verticals** do you focus on? Select all that apply.`,
    inputType: 'icp-chips',
    field: 'icpVerticals',
    options: ICP_OPTIONS.verticals,
    multiSelect: true
  },
  {
    section: 2,
    type: 'message',
    content: `Are there any specific **traits or characteristics** that make a company a great fit for you?`,
    inputType: 'icp-chips',
    field: 'icpTraits',
    options: ICP_OPTIONS.traits,
    multiSelect: true
  },
  {
    section: 2,
    type: 'message',
    content: `What **geographic regions** do you primarily serve?`,
    inputType: 'icp-chips',
    field: 'icpRegions',
    options: ICP_OPTIONS.regions,
    multiSelect: true
  },

  // SECTION D: Sales Motion
  {
    section: 3,
    type: 'message',
    content: `Great ICP profile! Now let's talk about how you sell.

What's your primary **sales motion**?`,
    inputType: 'radio',
    field: 'salesMotion',
    options: [
      { value: 'direct', label: 'Direct Sales', desc: 'Our team sells directly to customers' },
      { value: 'channel', label: 'Channel / Partner Sales', desc: 'We sell through partners' },
      { value: 'hybrid', label: 'Hybrid', desc: 'Mix of direct and channel' },
      { value: 'self-serve', label: 'Self-Serve', desc: 'Customers buy on their own' }
    ]
  },
  {
    section: 3,
    type: 'message',
    content: `How long is your typical **sales cycle**?`,
    inputType: 'radio',
    field: 'salesCycle',
    options: [
      { value: 'under-30', label: 'Under 30 days', desc: 'Quick, transactional deals' },
      { value: '30-90', label: '30-90 days', desc: 'Standard B2B cycle' },
      { value: '90-180', label: '90-180 days', desc: 'Longer consideration' },
      { value: '180+', label: '180+ days', desc: 'Enterprise sales cycle' }
    ]
  },
  {
    section: 3,
    type: 'message',
    content: `What's your average **deal size**?`,
    inputType: 'radio',
    field: 'avgDealSize',
    options: [
      { value: 'under-5k', label: 'Under $5K', desc: 'SMB / transactional' },
      { value: '5-25k', label: '$5K - $25K', desc: 'Mid-market' },
      { value: '25-100k', label: '$25K - $100K', desc: 'Upper mid-market' },
      { value: '100k+', label: '$100K+', desc: 'Enterprise' }
    ]
  },
  {
    section: 3,
    type: 'message',
    content: `What tools are in your current **sales tech stack**?`,
    inputType: 'checkbox',
    field: 'techStack',
    options: [
      'Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Monday Sales CRM',
      'Outreach', 'Salesloft', 'Apollo', 'ZoomInfo', 'Gong',
      'Clari', 'Chorus', 'LinkedIn Sales Navigator', 'Other'
    ]
  },

  // SECTION E: Revenue
  {
    section: 4,
    type: 'message',
    content: `Let's talk about your business trajectory.

What's your company's current **annual revenue**?`,
    inputType: 'radio',
    field: 'companyRevenue',
    options: [
      { value: 'pre-revenue', label: 'Pre-Revenue', desc: 'Still building' },
      { value: '0-500k', label: '$0 - $500K', desc: 'Early stage' },
      { value: '500k-1m', label: '$500K - $1M', desc: 'Finding traction' },
      { value: '1-5m', label: '$1M - $5M', desc: 'Growing fast' },
      { value: '5-10m', label: '$5M - $10M', desc: 'Scaling' },
      { value: '10m+', label: '$10M+', desc: 'Established' }
    ]
  },
  {
    section: 4,
    type: 'message',
    content: `What does your **revenue model** look like?`,
    inputType: 'radio',
    field: 'revenueModel',
    options: [
      { value: 'recurring', label: 'Recurring / Subscription', desc: 'Monthly or annual contracts' },
      { value: 'project', label: 'Project-Based', desc: 'One-time engagements' },
      { value: 'retainer', label: 'Retainer', desc: 'Ongoing relationship' },
      { value: 'hybrid', label: 'Hybrid', desc: 'Mix of models' }
    ]
  },
  {
    section: 4,
    type: 'message',
    content: `What percentage of your revenue is **recurring**?`,
    inputType: 'radio',
    field: 'recurringPct',
    options: [
      { value: '0-25', label: '0-25%' },
      { value: '26-50', label: '26-50%' },
      { value: '51-75', label: '51-75%' },
      { value: '76-100', label: '76-100%' }
    ]
  },

  // SECTION F: Partnership
  {
    section: 5,
    type: 'message',
    content: `Now let's explore how we'd work together.

What type of **partnership** are you most interested in?`,
    inputType: 'checkbox',
    field: 'partnershipType',
    options: [
      'Referral Partner — Send leads, earn commission',
      'Reseller — Sell SalesAI as part of your offering',
      'Implementation Partner — Help customers get started',
      'Technology Partner — Integrate with SalesAI',
      'Strategic Partner — Deep go-to-market alignment'
    ]
  },
  {
    section: 5,
    type: 'message',
    content: `How do you currently **generate leads** for partners you work with?`,
    inputType: 'checkbox',
    field: 'leadGenMethods',
    options: [
      'Existing client base', 'Content marketing', 'Events & webinars',
      'Outbound prospecting', 'Paid advertising', 'Referral network',
      'Social selling', 'SEO / organic', 'Partner marketplaces'
    ]
  },
  {
    section: 5,
    type: 'message',
    content: `How many **qualified leads** could you potentially send per month?`,
    inputType: 'radio',
    field: 'leadsPerMonth',
    options: [
      { value: '1-5', label: '1-5 leads', desc: 'Getting started' },
      { value: '6-10', label: '6-10 leads', desc: 'Building momentum' },
      { value: '11-25', label: '11-25 leads', desc: 'Strong pipeline' },
      { value: '25+', label: '25+ leads', desc: 'High volume' }
    ]
  },

  // SECTION G: Services
  {
    section: 6,
    type: 'message',
    content: `Do you offer any **services** that complement sales technology?`,
    inputType: 'checkbox',
    field: 'services',
    options: [
      'CRM Implementation', 'Sales Training & Coaching', 'Sales Process Design',
      'Sales Operations', 'RevOps Consulting', 'Marketing Automation',
      'Data & Analytics', 'Custom Integrations', 'Managed Services'
    ]
  },
  {
    section: 6,
    type: 'message',
    content: `Do you have **certifications** in any sales platforms?`,
    inputType: 'checkbox',
    field: 'certifications',
    options: [
      'Salesforce', 'HubSpot', 'Microsoft Dynamics', 'Pipedrive',
      'Zoho', 'Monday.com', 'Other CRM platforms', 'No certifications yet'
    ]
  },

  // SECTION H: Growth
  {
    section: 7,
    type: 'message',
    content: `What are your **growth goals** for the next 12 months?`,
    inputType: 'checkbox',
    field: 'growthGoals',
    options: [
      'Increase revenue', 'Expand client base', 'Add new service offerings',
      'Enter new markets', 'Build recurring revenue', 'Grow the team',
      'Improve margins', 'Establish thought leadership'
    ]
  },
  {
    section: 7,
    type: 'message',
    content: `What would make this partnership **successful** for you?`,
    inputType: 'text',
    field: 'successCriteria',
    placeholder: 'Tell us what success looks like for you...',
    multiline: true
  },
  {
    section: 7,
    type: 'message',
    content: `How did you **hear about** SalesAI's partner program?`,
    inputType: 'select',
    field: 'referralSource',
    options: [
      { value: 'search', label: 'Search / Google' },
      { value: 'social', label: 'Social Media' },
      { value: 'referral', label: 'Referral from someone' },
      { value: 'event', label: 'Event / Conference' },
      { value: 'content', label: 'Blog / Content' },
      { value: 'existing-customer', label: 'Already a SalesAI customer' },
      { value: 'other', label: 'Other' }
    ]
  },

  // SECTION I: Ready
  {
    section: 8,
    type: 'message',
    content: (data) => `${data.firstName}, you've painted a great picture of your business!

Based on everything you've shared, I can already see some exciting opportunities for us to work together.

Here's how you compare to our ideal partner profile:`,
    inputType: 'summary'
  },
  {
    section: 8,
    type: 'message',
    content: (data) => `Great news! Based on your profile, you're a strong fit for our partner program.

I've gathered all the information needed to create your partner account. Here's what I'll send to PartnerStack — you can **click any field to edit** before we proceed:`,
    inputType: 'partnerstack-preview'
  },
  {
    section: 8,
    type: 'partnerstack-signup',
    content: `Everything look good? Click below to create your partner account with one click — no additional forms to fill out!`
  },

  // SECTION J: Sandbox Access
  {
    section: 9,
    type: 'message',
    content: (data) => `🎉 **Your partner account is live, ${data.firstName}!**

Now let's get you set up to start winning deals together. First up — your own **SalesAI Sandbox**.`,
    inputType: 'sandbox-notification'
  },

  // SECTION K: Chrome Extension Introduction
  {
    section: 10,
    type: 'message',
    content: (data) => `Next, let me introduce you to the tool that's going to be a game-changer for you and your team — the **U4IA Chrome Extension**.

This is how we help you (and anyone at ${data.companyName || 'your company'}) identify warm opportunities hiding in your everyday conversations:`,
    inputType: 'extension-intro'
  },

  // SECTION L: Calendar Scheduling
  {
    section: 11,
    type: 'message',
    content: (data) => `One last thing, ${data.firstName} — let's get some time on the calendar to walk through everything together and finalize your onboarding.

Pick a time that works for you:`,
    inputType: 'calendar-embed'
  },

  // Final wrap-up
  {
    section: 11,
    type: 'final',
    content: (data) => `That's it! Once you've booked your onboarding call, you're all set.

In the meantime:
• **Check your email** for sandbox access instructions
• **Install the Chrome extension** to start surfacing opportunities
• **Explore PartnerStack** to see your partner dashboard

Welcome to the SalesAI partner family! 🚀`
  }
];

// ============================================
// INITIALIZATION
// ============================================

// ============================================
// CINEMATIC REVEAL - PX INTRO ANIMATION
// ============================================

const PX_COLORS = {
  green: '#4ADE80',
  greenDark: '#22c55e',
  cyan: '#06b6d4'
};

function initCinematicReveal() {
  const isMobile = window.innerWidth < 768;
  let phase = 0;

  // Create ambient particles
  createAmbientParticles(isMobile);

  // Animation sequence timings
  const timings = [
    500,   // 0->1: start particles
    2000,  // 1->2: logo appears
    800,   // 2->3: PX pops
    600,   // 3->4: line draws
    800,   // 4->5: Partner Experience
    600,   // 5->6: Welcome text
    1000   // 6->7: everything settles
  ];

  function advancePhase() {
    phase++;
    updatePhase(phase, isMobile);
    if (phase < timings.length) {
      setTimeout(advancePhase, timings[phase]);
    }
  }

  setTimeout(advancePhase, timings[0]);

  // Set up CTA button handler
  document.getElementById('px-cta').addEventListener('click', transitionToApp);
}

function createAmbientParticles(isMobile) {
  const container = document.getElementById('px-ambient-particles');
  const staticCount = isMobile ? 30 : 50;
  const floatingCount = isMobile ? 12 : 20;

  // Static particles
  for (let i = 0; i < staticCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'px-particle px-particle-ambient';
    const size = 1 + Math.random() * 2;
    const opacity = 0.2 + Math.random() * 0.4;
    particle.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      opacity: ${opacity};
      box-shadow: 0 0 ${size * 3}px ${PX_COLORS.cyan};
    `;
    container.appendChild(particle);
  }

  // Floating particles
  for (let i = 0; i < floatingCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'px-particle px-particle-ambient px-particle-floating';
    const size = 1 + Math.random() * 2;
    particle.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      box-shadow: 0 0 ${size * 2}px ${PX_COLORS.cyan};
      --duration: ${15 + Math.random() * 20}s;
      --delay: ${Math.random() * 10}s;
    `;
    container.appendChild(particle);
  }
}

function createConvergingParticles(isMobile) {
  const container = document.getElementById('px-converge-particles');
  container.innerHTML = '';

  const count = isMobile ? 40 : 60;
  const distance = isMobile ? 200 : 300;
  const colors = [PX_COLORS.green, PX_COLORS.cyan, PX_COLORS.greenDark];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = distance + Math.random() * (isMobile ? 100 : 200);
    const startX = Math.cos(angle) * dist;
    const startY = Math.sin(angle) * dist;
    const size = isMobile ? (1.5 + Math.random() * 2.5) : (2 + Math.random() * 4);
    const color = colors[Math.floor(Math.random() * 3)];
    const delay = Math.random() * 0.5;
    const duration = 1.5 + Math.random() * 0.5;

    const particle = document.createElement('div');
    particle.className = 'px-particle px-particle-converge';
    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${size * 2}px ${color};
      --start-x: ${startX}px;
      --start-y: ${startY}px;
      --delay: ${delay}s;
      --duration: ${duration}s;
    `;
    container.appendChild(particle);
  }
}

function createOrbitingParticles(isMobile) {
  const container = document.getElementById('px-orbits');
  container.innerHTML = '';
  container.style.display = 'block';

  const rings = isMobile ? [
    { count: 6, radius: 80, duration: 8, reverse: false },
    { count: 8, radius: 110, duration: 12, reverse: true }
  ] : [
    { count: 8, radius: 100, duration: 8, reverse: false },
    { count: 12, radius: 140, duration: 12, reverse: true },
    { count: 6, radius: 180, duration: 15, reverse: false }
  ];

  rings.forEach((ring, ri) => {
    const ringEl = document.createElement('div');
    ringEl.className = 'px-orbit-ring';

    for (let i = 0; i < ring.count; i++) {
      const particle = document.createElement('div');
      particle.className = `px-orbit-particle${ring.reverse ? ' reverse' : ''}`;
      particle.style.cssText = `
        --duration: ${ring.duration}s;
        animation-delay: ${(i / ring.count) * ring.duration}s;
      `;

      const dot = document.createElement('div');
      dot.className = 'px-orbit-dot';
      dot.style.setProperty('--radius', `${ring.radius}px`);

      particle.appendChild(dot);
      ringEl.appendChild(particle);
    }

    container.appendChild(ringEl);
  });
}

function updatePhase(phase, isMobile) {
  // Phase 1: Converging particles start
  if (phase === 1) {
    createConvergingParticles(isMobile);
  }

  // Phase 2: Logo appears, flash, burst, orb activates
  if (phase === 2) {
    document.getElementById('px-orb').classList.add('active');
    document.getElementById('px-flash').style.display = 'block';
    document.getElementById('px-burst').style.display = 'block';
    document.getElementById('px-rings').style.display = 'block';
    document.getElementById('px-logo').classList.add('visible');
  }

  // Phase 3: Letters pop
  if (phase === 3) {
    document.getElementById('px-letter-p').classList.add('visible');
    document.getElementById('px-letter-x').classList.add('visible');
  }

  // Phase 4: Line draws
  if (phase === 4) {
    document.getElementById('px-line').classList.add('visible');
  }

  // Phase 5: Headline appears
  if (phase === 5) {
    document.getElementById('px-headline-text').classList.add('visible');
  }

  // Phase 6: Welcome text appears
  if (phase === 6) {
    document.getElementById('px-welcome').classList.add('visible');
  }

  // Phase 7: Orbiting particles, tagline, and CTA appear
  if (phase === 7) {
    createOrbitingParticles(isMobile);
    document.getElementById('px-tagline').classList.add('visible');
    document.getElementById('px-cta').classList.add('visible');
  }
}

function transitionToApp() {
  const reveal = document.getElementById('px-reveal');
  const appLayout = document.getElementById('app-layout');

  // Fade out reveal
  reveal.classList.add('fade-out');

  // After fade completes, hide reveal and show app
  setTimeout(() => {
    reveal.classList.add('hidden');
    appLayout.style.display = '';

    // Initialize the main app
    init();
  }, 500);
}

// ============================================
// MAIN APP INITIALIZATION
// ============================================

function init() {
  // Initialize DOM elements
  chatMessages = document.getElementById('chat-messages');
  chatMessagesInner = document.getElementById('chat-messages-inner');
  chatInput = document.getElementById('chat-input');
  chatSendBtn = document.getElementById('chat-send-btn');
  navSteps = document.getElementById('nav-steps');
  progressText = document.getElementById('chat-progress');
  scorePreview = document.getElementById('score-preview');
  currentScoreEl = document.getElementById('current-score');
  scoreFillEl = document.getElementById('score-fill');

  renderNavSteps();
  startConversation();
  setupInputHandlers();
}

function renderNavSteps() {
  navSteps.innerHTML = SECTIONS.map((section, i) => `
    <div class="nav-step ${i === 0 ? 'active' : ''}" data-section="${i}">
      <div class="nav-step-number"><span>${section.letter}</span></div>
      <div class="nav-step-label">${section.label}</div>
    </div>
  `).join('');
}

function setupInputHandlers() {
  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    chatSendBtn.disabled = !chatInput.value.trim();
  });

  // Send on Enter
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.value.trim()) {
        handleTextSubmit();
      }
    }
  });

  chatSendBtn.addEventListener('click', handleTextSubmit);
}

// ============================================
// CONVERSATION ENGINE
// ============================================

let currentFlowIndex = 0;

function startConversation() {
  processNextStep();
}

async function processNextStep() {
  if (currentFlowIndex >= conversationFlow.length) return;

  const step = conversationFlow[currentFlowIndex];

  // Check if this step should be skipped
  if (step.skipIf && step.skipIf(state.formData)) {
    currentFlowIndex++;
    processNextStep();
    return;
  }

  // Update section
  if (step.section !== state.currentSection) {
    state.currentSection = step.section;
    updateNavigation();
  }

  // Process based on type
  if (step.type === 'message') {
    const content = typeof step.content === 'function' ? step.content(state.formData) : step.content;
    await addAssistantMessage(content, step);
  } else if (step.type === 'enrichment') {
    // Enrichment is handled after company website submission
    currentFlowIndex++;
    processNextStep();
    return;
  } else if (step.type === 'partnerstack-signup') {
    // Show message and add the one-click signup button
    await addAssistantMessage(step.content, step);
    addPartnerStackSignupButton();
  } else if (step.type === 'final') {
    const content = typeof step.content === 'function' ? step.content(state.formData) : step.content;
    await addAssistantMessage(content, step);
    addFinalWrapUp();
  }
}

async function addAssistantMessage(content, step) {
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';

  // Create content container with text element for typewriter
  const textDiv = document.createElement('div');
  textDiv.className = 'message-text';

  messageDiv.innerHTML = `<div class="message-content"></div>`;
  messageDiv.querySelector('.message-content').appendChild(textDiv);

  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();

  // Typewriter effect
  await typewriterEffect(textDiv, content);

  // Add component after typewriter completes
  if (step && step.inputType) {
    const componentHTML = renderInputComponent(step);
    if (componentHTML) {
      const componentContainer = document.createElement('div');
      componentContainer.innerHTML = componentHTML;
      messageDiv.querySelector('.message-content').appendChild(componentContainer.firstElementChild);
    }
  }

  scrollToBottom();

  // Setup component handlers if any
  if (step && step.inputType && step.inputType !== 'text') {
    setupComponentHandlers(messageDiv, step);
  } else if (step && step.inputType === 'text') {
    chatInput.placeholder = step.placeholder || 'Type your response...';
    chatInput.focus();
  }
}

// Typewriter effect - character by character with variable speed
async function typewriterEffect(element, text) {
  const formattedText = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const paragraphs = formattedText.split('\n\n');

  for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
    const p = document.createElement('p');
    element.appendChild(p);

    const paragraphText = paragraphs[pIndex];
    let i = 0;
    let inTag = false;
    let tagBuffer = '';

    // Add cursor
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    p.appendChild(cursor);

    while (i < paragraphText.length) {
      const char = paragraphText[i];

      // Handle HTML tags
      if (char === '<') {
        inTag = true;
        tagBuffer = '<';
        i++;
        continue;
      }

      if (inTag) {
        tagBuffer += char;
        if (char === '>') {
          inTag = false;
          // Insert the tag before cursor
          cursor.insertAdjacentHTML('beforebegin', tagBuffer);
          tagBuffer = '';
        }
        i++;
        continue;
      }

      // Insert character before cursor
      cursor.insertAdjacentText('beforebegin', char);

      // Variable speed - faster for common chars, slight pause on punctuation
      let charDelay = 12 + Math.random() * 8;
      if (char === '.' || char === '!' || char === '?') {
        charDelay = 80 + Math.random() * 40;
      } else if (char === ',') {
        charDelay = 40 + Math.random() * 20;
      } else if (char === ' ') {
        charDelay = 5 + Math.random() * 10;
      }

      await delay(charDelay);
      scrollToBottom();
      i++;
    }

    // Remove cursor from this paragraph
    cursor.remove();

    // Small pause between paragraphs
    if (pIndex < paragraphs.length - 1) {
      await delay(100);
    }
  }
}

function renderInputComponent(step) {
  // Get intelligence for this field if available
  const intelligence = getFieldIntelligence(step.field);
  const intelligenceHtml = intelligence ? renderIntelligenceCard(intelligence) : '';

  switch (step.inputType) {
    case 'text':
      return `
        ${intelligenceHtml}
        <div class="action-hint">
          <span class="action-hint-icon">⌨️</span>
          <span class="action-hint-text">Type your answer below and press</span>
          <span class="action-hint-key">Enter</span>
        </div>
      `;

    case 'select':
      return `
        ${intelligenceHtml}
        <div class="chat-component">
          <div class="chat-component-body">
            <div class="action-hint">
              <span class="action-hint-icon">👆</span>
              <span class="action-hint-text">Click an option to select and continue</span>
            </div>
            <div class="chat-radio-cards" data-field="${step.field}">
              ${step.options.map(opt => `
                <div class="chat-radio-card" data-value="${opt.value}">
                  <div class="chat-radio"></div>
                  <div class="chat-radio-content">
                    <div class="chat-radio-title">${opt.label}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

    case 'radio':
      return `
        ${intelligenceHtml}
        <div class="chat-component">
          <div class="chat-component-body">
            <div class="action-hint">
              <span class="action-hint-icon">👆</span>
              <span class="action-hint-text">Click an option to select and continue</span>
            </div>
            <div class="chat-radio-cards" data-field="${step.field}">
              ${step.options.map(opt => `
                <div class="chat-radio-card" data-value="${opt.value}">
                  <div class="chat-radio"></div>
                  <div class="chat-radio-content">
                    <div class="chat-radio-title">${opt.label}</div>
                    ${opt.desc ? `<div class="chat-radio-desc">${opt.desc}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

    case 'checkbox':
      return `
        ${intelligenceHtml}
        <div class="chat-component">
          <div class="chat-component-body">
            <div class="action-hint">
              <span class="action-hint-icon">☑️</span>
              <span class="action-hint-text">Select all that apply, then click <strong>Continue</strong></span>
            </div>
            <div class="chat-checkbox-cards" data-field="${step.field}">
              ${step.options.map(opt => `
                <div class="chat-checkbox-card" data-value="${opt}">
                  <div class="chat-checkbox"></div>
                  <div class="chat-checkbox-text">${opt}</div>
                </div>
              `).join('')}
            </div>
            <button class="chat-continue-btn" disabled>Continue →</button>
          </div>
        </div>
      `;

    case 'icp-range':
      return `
        ${intelligenceHtml}
        <div class="chat-component">
          <div class="chat-component-body">
            <div class="action-hint">
              <span class="action-hint-icon">📊</span>
              <span class="action-hint-text">Select a range (you can select multiple), then click <strong>Continue</strong></span>
            </div>
            <div class="icp-range" data-field="${step.field}">
              ${step.options.map(opt => `
                <div class="icp-range-option" data-value="${opt.value}">
                  <div class="icp-range-label">${opt.label}</div>
                  <div class="icp-range-desc">${opt.desc}</div>
                </div>
              `).join('')}
            </div>
            <button class="chat-continue-btn" disabled>Continue →</button>
          </div>
        </div>
      `;

    case 'icp-chips':
      return `
        ${intelligenceHtml}
        <div class="chat-component">
          <div class="chat-component-body">
            <div class="action-hint">
              <span class="action-hint-icon">🏷️</span>
              <span class="action-hint-text">Select all that apply, then click <strong>Continue</strong></span>
            </div>
            <div class="icp-chips" data-field="${step.field}">
              ${step.options.map(opt => `
                <div class="icp-chip" data-value="${opt}">${opt}</div>
              `).join('')}
            </div>
            <button class="chat-continue-btn" disabled>Continue →</button>
          </div>
        </div>
      `;

    case 'summary':
      return renderSummary();

    case 'partnerstack-preview':
      return renderPartnerStackPreview();

    case 'sandbox-notification':
      return renderSandboxNotification();

    case 'extension-intro':
      return renderExtensionIntro();

    case 'calendar-embed':
      return renderCalendarEmbed();

    default:
      return '';
  }
}

function setupComponentHandlers(messageDiv, step) {
  // Special handling for partnerstack-preview
  if (step.inputType === 'partnerstack-preview') {
    setupPartnerStackPreviewHandlers(messageDiv);
    return;
  }

  // Handle continue buttons for sandbox, extension, and calendar components
  if (step.inputType === 'sandbox-notification' || step.inputType === 'extension-intro' || step.inputType === 'calendar-embed') {
    const continueBtn = messageDiv.querySelector('.chat-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        continueBtn.disabled = true;
        continueBtn.textContent = 'Continuing...';
        currentFlowIndex++;
        processNextStep();
      });
    }
    return;
  }

  const container = messageDiv.querySelector('[data-field]');
  if (!container) return;

  const field = container.dataset.field;
  const continueBtn = messageDiv.querySelector('.chat-continue-btn');
  const prefillValue = getPrefillValue(field);

  if (step.inputType === 'radio' || step.inputType === 'select') {
    // Apply prefill for radio/select
    if (prefillValue) {
      const prefillCard = container.querySelector(`[data-value="${prefillValue}"]`);
      if (prefillCard) {
        prefillCard.classList.add('selected', 'prefilled');
        state.formData[field] = prefillValue;
        // Add prefill indicator
        addPrefillBadge(prefillCard);
      }
    }

    container.querySelectorAll('.chat-radio-card').forEach(card => {
      card.addEventListener('click', async () => {
        container.querySelectorAll('.chat-radio-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const value = card.dataset.value;
        const label = card.querySelector('.chat-radio-title').textContent;
        state.formData[field] = value;

        // Call onSubmit handler if present
        if (step.onSubmit) {
          await step.onSubmit(value);
        }

        // Auto-advance for radio
        await delay(300);
        addUserMessage(label);
        currentFlowIndex++;
        processNextStep();
      });
    });
  } else if (step.inputType === 'checkbox') {
    const selected = new Set();

    // Apply prefill for checkbox
    if (prefillValue && Array.isArray(prefillValue)) {
      prefillValue.forEach(val => {
        const card = container.querySelector(`[data-value="${val}"]`);
        if (card) {
          card.classList.add('selected', 'prefilled');
          selected.add(val);
          addPrefillBadge(card);
        }
      });
      state.formData[field] = Array.from(selected);
      if (continueBtn) continueBtn.disabled = selected.size === 0;
    }

    container.querySelectorAll('.chat-checkbox-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        card.classList.remove('prefilled'); // Remove prefill styling on manual click
        const badge = card.querySelector('.prefill-badge');
        if (badge) badge.remove();

        const value = card.dataset.value;

        if (selected.has(value)) {
          selected.delete(value);
        } else {
          selected.add(value);
        }

        state.formData[field] = Array.from(selected);
        continueBtn.disabled = selected.size === 0;
      });
    });

    continueBtn.addEventListener('click', async () => {
      // Call onSubmit handler if present
      if (step.onSubmit) {
        await step.onSubmit(Array.from(selected));
      }
      addUserMessage(`Selected: ${Array.from(selected).join(', ')}`);
      currentFlowIndex++;
      processNextStep();
    });
  } else if (step.inputType === 'icp-range' || step.inputType === 'icp-chips') {
    const selected = new Set();
    const items = container.querySelectorAll('.icp-range-option, .icp-chip');

    // Apply prefill for ICP components
    if (prefillValue && Array.isArray(prefillValue)) {
      prefillValue.forEach(val => {
        const item = container.querySelector(`[data-value="${val}"]`);
        if (item) {
          item.classList.add('selected', 'prefilled');
          selected.add(val);
        }
      });
      state.formData[field] = Array.from(selected);
      if (continueBtn) continueBtn.disabled = selected.size === 0;

      // Show prefill count indicator
      if (selected.size > 0) {
        showPrefillCount(container, selected.size);
      }
    }

    items.forEach(item => {
      item.addEventListener('click', () => {
        item.classList.remove('prefilled'); // Remove prefill styling

        if (step.multiSelect) {
          item.classList.toggle('selected');
          const value = item.dataset.value;

          if (selected.has(value)) {
            selected.delete(value);
          } else {
            selected.add(value);
          }
        } else {
          items.forEach(i => {
            i.classList.remove('selected', 'prefilled');
          });
          item.classList.add('selected');
          selected.clear();
          selected.add(item.dataset.value);
        }

        state.formData[field] = Array.from(selected);
        continueBtn.disabled = selected.size === 0;

        // Update prefill count
        const countEl = container.parentElement.querySelector('.prefill-count');
        if (countEl) countEl.remove();
      });
    });

    continueBtn.addEventListener('click', () => {
      const labels = Array.from(selected).map(v => {
        const el = container.querySelector(`[data-value="${v}"]`);
        return el.querySelector('.icp-range-label')?.textContent || v;
      });
      addUserMessage(`Selected: ${labels.join(', ')}`);
      currentFlowIndex++;
      processNextStep();
    });
  }
}

// Add a small badge to prefilled items
function addPrefillBadge(element) {
  if (element.querySelector('.prefill-badge')) return;
  const badge = document.createElement('span');
  badge.className = 'prefill-badge';
  badge.innerHTML = '✨ Suggested';
  element.appendChild(badge);
}

// Show count of prefilled items
function showPrefillCount(container, count) {
  const indicator = document.createElement('div');
  indicator.className = 'prefill-count';
  indicator.innerHTML = `<span class="prefill-icon">✨</span> ${count} suggestions pre-selected based on your company profile`;
  container.parentElement.insertBefore(indicator, container);
}

// Setup handlers for editable PartnerStack preview fields
function setupPartnerStackPreviewHandlers(messageDiv) {
  const fields = messageDiv.querySelectorAll('.ps-preview-field');

  fields.forEach(field => {
    const valueDiv = field.querySelector('.ps-preview-value');
    const fieldKey = field.dataset.fieldKey;
    const fieldType = field.dataset.fieldType;

    valueDiv.addEventListener('click', () => {
      // Skip if already editing
      if (valueDiv.classList.contains('editing')) return;

      const currentValue = valueDiv.querySelector('.ps-value-text').textContent;
      const isArray = fieldType === 'tags';

      // Create input based on field type
      let inputHtml;
      if (isArray) {
        inputHtml = `
          <input type="text" class="ps-preview-input"
                 value="${currentValue === '—' ? '' : currentValue}"
                 placeholder="Enter values separated by commas">
          <span class="ps-save-indicator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Saved
          </span>
        `;
      } else {
        inputHtml = `
          <input type="${fieldType}" class="ps-preview-input"
                 value="${currentValue === '—' ? '' : currentValue}"
                 placeholder="Enter ${field.querySelector('.ps-preview-label').textContent.toLowerCase()}">
          <span class="ps-save-indicator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Saved
          </span>
        `;
      }

      // Replace content with input
      valueDiv.classList.add('editing');
      valueDiv.innerHTML = inputHtml;

      const input = valueDiv.querySelector('.ps-preview-input');
      const saveIndicator = valueDiv.querySelector('.ps-save-indicator');
      input.focus();
      input.select();

      // Handle input changes (auto-save with debounce)
      let saveTimeout;
      input.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveFieldValue(fieldKey, input.value, isArray, saveIndicator);
        }, 500);
      });

      // Handle blur (save and exit edit mode)
      input.addEventListener('blur', () => {
        clearTimeout(saveTimeout);
        saveFieldValue(fieldKey, input.value, isArray, saveIndicator);

        // Wait a moment for save indicator, then restore display mode
        setTimeout(() => {
          const displayValue = input.value || '—';
          valueDiv.classList.remove('editing');
          valueDiv.innerHTML = `
            <span class="ps-value-text">${displayValue}</span>
            <svg class="ps-edit-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          `;
        }, 800);
      });

      // Handle Enter key (save and exit)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        } else if (e.key === 'Escape') {
          // Cancel edit
          const originalValue = decodeURIComponent(valueDiv.dataset.original || '—');
          valueDiv.classList.remove('editing');
          valueDiv.innerHTML = `
            <span class="ps-value-text">${originalValue}</span>
            <svg class="ps-edit-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          `;
        }
      });
    });
  });
}

// Save a field value to state.formData
function saveFieldValue(fieldKey, value, isArray, saveIndicator) {
  if (isArray) {
    // Split by comma and clean up
    const values = value.split(',').map(v => v.trim()).filter(v => v);
    state.formData[fieldKey] = values;
  } else {
    state.formData[fieldKey] = value || null;
  }

  // Show save indicator
  if (saveIndicator) {
    saveIndicator.classList.add('visible');
    setTimeout(() => {
      saveIndicator.classList.remove('visible');
    }, 1500);
  }

  console.log(`Auto-saved ${fieldKey}:`, state.formData[fieldKey]);
}

async function handleTextSubmit() {
  const value = chatInput.value.trim();
  if (!value) return;

  const step = conversationFlow[currentFlowIndex];

  // Validate if needed
  if (step.validate) {
    const error = step.validate(value);
    if (error) {
      showInputError(error);
      return;
    }
  }

  // Save to form data
  state.formData[step.field] = value;

  // Add user message
  addUserMessage(value);

  // Clear input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatSendBtn.disabled = true;

  // Check for onSubmit handler
  if (step.onSubmit) {
    await step.onSubmit(value);
  }

  // Move to next step
  currentFlowIndex++;
  processNextStep();
}

function addUserMessage(content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-user';
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">${escapeHtml(content)}</div>
    </div>
  `;
  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();
}

function addTypingIndicator() {
  const id = 'typing-' + Date.now();
  const indicator = document.createElement('div');
  indicator.className = 'message message-assistant';
  indicator.id = id;
  indicator.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  chatMessagesInner.appendChild(indicator);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) indicator.remove();
}

// ============================================
// COMPANY ENRICHMENT
// ============================================

// Enrichment Action List - shows real-time progress during data gathering
class EnrichmentActionList {
  constructor(container) {
    this.container = container;
    this.actions = [];
    this.render();
  }

  render() {
    this.listEl = document.createElement('div');
    this.listEl.className = 'enrichment-action-list';
    this.container.appendChild(this.listEl);
  }

  addAction(id, text, status = 'pending') {
    const action = { id, text, status, subActions: [] };
    this.actions.push(action);
    this.renderAction(action);
    return action;
  }

  renderAction(action) {
    const actionEl = document.createElement('div');
    actionEl.className = `enrichment-action enrichment-action-${action.status}`;
    actionEl.id = `action-${action.id}`;
    actionEl.innerHTML = `
      <span class="action-icon">${this.getIcon(action.status)}</span>
      <span class="action-text">${action.text}</span>
      <div class="action-sub-list"></div>
    `;
    this.listEl.appendChild(actionEl);
    scrollToBottom();
  }

  getIcon(status) {
    switch (status) {
      case 'pending': return '<span class="action-spinner"></span>';
      case 'in_progress': return '<span class="action-spinner"></span>';
      case 'complete': return '✓';
      case 'found': return '✓';
      case 'error': return '✗';
      case 'skipped': return '○';
      default: return '•';
    }
  }

  updateAction(id, status, newText = null) {
    const actionEl = document.getElementById(`action-${id}`);
    if (actionEl) {
      const action = this.actions.find(a => a.id === id);
      if (action) action.status = status;

      actionEl.className = `enrichment-action enrichment-action-${status}`;
      actionEl.querySelector('.action-icon').innerHTML = this.getIcon(status);
      if (newText) {
        actionEl.querySelector('.action-text').textContent = newText;
      }
    }
  }

  addSubAction(parentId, text) {
    const actionEl = document.getElementById(`action-${parentId}`);
    if (actionEl) {
      const subList = actionEl.querySelector('.action-sub-list');
      const subEl = document.createElement('div');
      subEl.className = 'enrichment-sub-action';
      subEl.innerHTML = `<span class="sub-action-arrow">↳</span> ${text}`;
      subList.appendChild(subEl);
      scrollToBottom();
    }
  }

  complete() {
    // Mark all remaining pending actions as complete or skipped
    this.actions.forEach(action => {
      if (action.status === 'pending' || action.status === 'in_progress') {
        this.updateAction(action.id, 'complete');
      }
    });
  }
}

// Global reference to current action list
let currentActionList = null;

// Legacy functions for backwards compatibility
let loadingMessageInterval = null;
let loadingMessageIndex = 0;

function startLoadingMessageRotation() {
  // No longer used - kept for backwards compatibility
}

function stopLoadingMessageRotation() {
  if (loadingMessageInterval) {
    clearInterval(loadingMessageInterval);
    loadingMessageInterval = null;
  }
}

async function enrichCompanyData(website) {
  const typingId = addTypingIndicator();

  // Add action list container
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message message-assistant';
  loadingDiv.id = 'enrichment-loading';
  loadingDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">Let me research <strong>${website}</strong>...</div>
      <div class="enrichment-actions-container"></div>
    </div>
  `;

  await delay(300);
  removeTypingIndicator(typingId);
  chatMessagesInner.appendChild(loadingDiv);
  scrollToBottom();

  // Initialize action list
  const actionsContainer = loadingDiv.querySelector('.enrichment-actions-container');
  currentActionList = new EnrichmentActionList(actionsContainer);

  // Add initial actions
  currentActionList.addAction('company-api', 'Fetching company data...', 'in_progress');
  currentActionList.addAction('nav-scan', 'Scanning website structure...', 'pending');
  currentActionList.addAction('customers', 'Discovering customers...', 'pending');
  currentActionList.addAction('partners', 'Analyzing partner ecosystem...', 'pending');
  currentActionList.addAction('profile', 'Building partnership profile...', 'pending');
  currentActionList.addAction('claude-enhance', 'Creating Better Together story...', 'pending');

  const domain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  // Run company enrichment, customer scraping, competitor detection, and partnership profiling in PARALLEL
  const [companyResult, customerResult, competitorResult, partnershipResult] = await Promise.allSettled([
    // Company enrichment
    (async () => {
      try {
        console.log('🔍 Calling Companies API for domain:', domain);

        const targetUrl = `https://api.thecompaniesapi.com/v2/companies/${domain}?token=${COMPANIES_API_KEY}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          if (currentActionList) {
            const dataPoints = Object.keys(data).length + (data.about ? Object.keys(data.about).length : 0);
            currentActionList.updateAction('company-api', 'complete', `Found ${dataPoints} data points from API`);
          }
          return data;
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Companies API failed:', error.message);
        if (currentActionList) {
          currentActionList.updateAction('company-api', 'error', 'API unavailable, using AI fallback...');
        }
        return { fallbackToClaude: true, website };
      }
    })(),

    // Customer logo scraping (parallel) - with action list updates
    (async () => {
      if (currentActionList) currentActionList.updateAction('customers', 'in_progress');
      const result = await scrapeCustomerLogos(website);
      if (currentActionList) {
        if (result && result.length > 0) {
          currentActionList.updateAction('customers', 'complete', `Found ${result.length} customers`);
        } else {
          currentActionList.updateAction('customers', 'complete', 'No customer logos found');
        }
      }
      return result;
    })(),

    // Competitor & partner fit detection (parallel)
    (async () => {
      if (currentActionList) currentActionList.updateAction('partners', 'in_progress');
      const result = await detectCompetitorsAndFitSignals(website);
      if (currentActionList) {
        if (result && (result.competitors?.length > 0 || result.readinessScore > 0)) {
          currentActionList.updateAction('partners', 'complete', `Partner readiness: ${result.readinessScore}%`);
        } else {
          currentActionList.updateAction('partners', 'complete', 'Partner ecosystem analyzed');
        }
      }
      return result;
    })(),

    // Partnership profile scraping (parallel) - with deep nav-based scraping
    (async () => {
      if (currentActionList) {
        currentActionList.updateAction('nav-scan', 'in_progress');
        currentActionList.updateAction('profile', 'in_progress');
      }
      const result = await scrapePartnershipProfileDeep(website);
      if (currentActionList) {
        currentActionList.updateAction('nav-scan', 'complete', `Scanned ${result?.pagesScraped?.length || 0} pages`);
        currentActionList.updateAction('profile', 'complete', 'Partnership profile built');
      }
      return result;
    })()
  ]);

  // Handle company enrichment result
  let companyData = null;
  if (companyResult.status === 'fulfilled') {
    if (companyResult.value.fallbackToClaude) {
      // Use Claude fallback
      stopLoadingMessageRotation(); document.getElementById('enrichment-loading')?.remove();
      await enrichWithClaude(website);
      return; // enrichWithClaude handles everything including smart prefill
    } else {
      companyData = companyResult.value;
      state.enrichedCompany = companyData;

      // Log full API response for debugging
      console.log('📊 FULL Companies API Response:', JSON.stringify(companyData, null, 2));
      console.log('📊 API Response Keys:', Object.keys(companyData));

      // Remove loading message
      stopLoadingMessageRotation(); document.getElementById('enrichment-loading')?.remove();

      // Add enrichment card
      await addEnrichmentCard(companyData);
    }
  } else {
    // Company enrichment failed entirely
    stopLoadingMessageRotation(); document.getElementById('enrichment-loading')?.remove();
    await enrichWithClaude(website);
    return;
  }

  // Handle competitor/partner fit detection result
  // Data is stored but NOT displayed to user (used internally for Better Together stories)
  if (competitorResult.status === 'fulfilled' && competitorResult.value) {
    const { competitors, fitSignals, readinessScore } = competitorResult.value;
    // Store data for internal use
    state.competitorSignals = competitors;
    state.partnerFitSignals = fitSignals;
    state.partnerReadinessScore = readinessScore;
    console.log('Partner fit data stored:', { competitors: competitors.length, signals: Object.keys(fitSignals).length, score: readinessScore });
  }

  // Handle customer discovery result
  // Data is stored but NOT displayed to user (used internally for Better Together stories)
  if (customerResult.status === 'fulfilled' && customerResult.value.length > 0) {
    const customers = customerResult.value;

    // Enrich customer companies
    const enrichments = await enrichCustomerCompanies(customers);

    // Store for internal use
    state.customerCompanies = customers;
    state.customerEnrichments = enrichments;
    console.log('Customer data stored:', { count: customers.length, enriched: enrichments.length });

    // Generate smart prefill with both company and customer data
    await generateSmartPrefillWithCustomers(companyData, enrichments);
  }

  // Handle partnership profile result ("Better Together" insights)
  // Use Claude to enhance ALL gathered data for high-quality insights
  const scrapedProfile = partnershipResult.status === 'fulfilled' ? partnershipResult.value : null;
  const customers = customerResult.status === 'fulfilled' ? customerResult.value : [];
  const competitors = competitorResult.status === 'fulfilled' ? competitorResult.value : null;

  // Enhance data with Claude AI
  const enhancedData = await enhanceDataWithClaude(companyData, scrapedProfile, customers, competitors);

  if (enhancedData) {
    // Store enhanced data for later use
    state.enhancedPartnerData = enhancedData;

    // Check if we have the new JVP Stories format
    if (enhancedData.jvpStories && enhancedData.jvpStories.length > 0) {
      // New JVP Story format - extract profile data from stories
      const primaryStory = enhancedData.jvpStories[0];

      const enhancedProfile = {
        targetRoles: [...new Set(enhancedData.jvpStories.map(s => s.persona?.title).filter(Boolean))],
        targetIndustries: [...new Set(enhancedData.jvpStories.map(s => s.persona?.vertical).filter(Boolean))],
        useCases: enhancedData.jvpStories.map(s => s.useCase),
        services: scrapedProfile?.services || [],
        customers: scrapedProfile?.customers || [],
        gtmMotion: scrapedProfile?.gtmMotion,
        companySize: primaryStory.persona?.companySize || scrapedProfile?.companySize,
        language: scrapedProfile?.language || {},
        pagesScraped: scrapedProfile?.pagesScraped || []
      };

      // Build insights from partner summary
      const enhancedInsights = {
        partnershipType: enhancedData.partnerSummary?.recommendedPartnershipType || 'referral',
        gtmFit: enhancedData.partnerSummary?.gtmAlignment || 'moderate',
        primaryValueDriver: enhancedData.partnerSummary?.primaryValueDriver || '',
        enablementPriority: enhancedData.partnerSummary?.enablementPriority || ''
      };

      // Display the new JVP Story card
      await delay(500);
      displayEnhancedPartnershipCard(enhancedProfile, enhancedInsights, enhancedData);

    } else {
      // Legacy format fallback - build from old structure
      const enhancedProfile = {
        targetRoles: enhancedData.enhancedProfile?.targetRoles || scrapedProfile?.targetRoles || [],
        targetIndustries: enhancedData.enhancedProfile?.targetIndustries || scrapedProfile?.targetIndustries || [],
        useCases: enhancedData.enhancedProfile?.problemsSolved || scrapedProfile?.useCases || [],
        services: enhancedData.enhancedProfile?.services || scrapedProfile?.services || [],
        customers: enhancedData.enhancedProfile?.customers || scrapedProfile?.customers || [],
        gtmMotion: enhancedData.enhancedProfile?.gtmMotion || scrapedProfile?.gtmMotion,
        companySize: enhancedData.enhancedProfile?.companySize || scrapedProfile?.companySize,
        language: scrapedProfile?.language || {},
        pagesScraped: scrapedProfile?.pagesScraped || []
      };

      const enhancedInsights = {
        partnershipType: enhancedData.betterTogether?.partnershipType || 'referral',
        whyPartner: enhancedData.betterTogether?.whyPartner || '',
        jointValueProp: enhancedData.betterTogether?.jointValueProp || '',
        complementaryCapabilities: (enhancedData.betterTogether?.complementaryCapabilities || []).map(cap => ({
          useCase: cap.theirCapability,
          insight: cap.salesAiAdds,
          type: 'complement'
        })),
        sharedICP: enhancedData.betterTogether?.sharedICP || '',
        gtmFit: enhancedData.betterTogether?.gtmFit || 'moderate',
        gtmFitReason: enhancedData.betterTogether?.gtmFitReason || '',
        overlappingRoles: enhancedProfile.targetRoles,
        industryOpportunities: enhancedProfile.targetIndustries.map(ind => ({ industry: ind, priority: 'high' })),
        salesAiUseCases: [],
        dataQuality: enhancedData.confidence?.dataQuality || 'medium'
      };

      // Display legacy partnership card (will fall back to simple display)
      await delay(500);
      displayEnhancedPartnershipCard(enhancedProfile, enhancedInsights, enhancedData);
    }
  } else if (scrapedProfile) {
    // Fallback to basic profile if Claude enhancement failed - STILL use new card
    const hasData = scrapedProfile.targetRoles?.length > 0 ||
                    scrapedProfile.targetIndustries?.length > 0 ||
                    scrapedProfile.useCases?.length > 0;

    if (hasData) {
      // Build profile object matching expected format
      const fallbackProfile = {
        targetRoles: scrapedProfile.targetRoles || [],
        targetIndustries: scrapedProfile.targetIndustries || [],
        useCases: scrapedProfile.useCases || [],
        services: scrapedProfile.services || [],
        customers: scrapedProfile.customers || [],
        companySize: scrapedProfile.companySize,
        language: scrapedProfile.language || {},
        pagesScraped: scrapedProfile.pagesScraped || []
      };
      const fallbackInsights = {
        partnershipType: 'referral',
        gtmFit: 'moderate'
      };
      await delay(500);
      // Use new card with fallback stories - never show old UI
      displayEnhancedPartnershipCard(fallbackProfile, fallbackInsights, {});
    }
  }
}

// Claude API fallback for company enrichment
async function enrichWithClaude(website) {
  const domain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const companyName = state.formData.companyName || domain;

  // Update loading message
  const loadingEl = document.getElementById('enrichment-loading');
  if (loadingEl) {
    loadingEl.querySelector('.enrichment-loading-text').textContent = 'Researching your company with AI...';
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `I need information about the company "${companyName}" with website "${domain}". Please provide a JSON response with any information you know about this company. Use this exact format:
{
  "name": "Company Name",
  "domain": "${domain}",
  "description": "Brief description of what the company does",
  "industry": "Primary industry",
  "employeesRange": "Estimated employee count range (e.g., '11-50', '51-200')",
  "founded": "Year founded if known, or null",
  "headquarters": "City, State/Country if known",
  "type": "Company type (e.g., 'Private', 'Public', 'Startup')",
  "tags": ["relevant", "industry", "tags"],
  "aiGenerated": true
}

Only include fields you have reasonable confidence about. Return ONLY the JSON object, no other text.`
        }]
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.content[0].text;

      // Parse the JSON response
      try {
        const companyData = JSON.parse(content);
        companyData.aiGenerated = true;
        state.enrichedCompany = companyData;

        // Remove loading message
        stopLoadingMessageRotation(); document.getElementById('enrichment-loading')?.remove();

        // Add AI enrichment card
        await addAIEnrichmentCard(companyData);
      } catch (parseError) {
        throw new Error('Could not parse AI response');
      }
    } else {
      throw new Error('Claude API request failed');
    }
  } catch (error) {
    console.error('Claude fallback failed:', error);
    stopLoadingMessageRotation(); document.getElementById('enrichment-loading')?.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'message message-assistant';
    errorDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">I couldn't find detailed info for that domain, but no worries — we can still continue! I'll learn more about your company from you directly.</div>
      </div>
    `;
    chatMessagesInner.appendChild(errorDiv);
    scrollToBottom();
  }
}

// ============================================
// CLAUDE-ENHANCED JVP STORY GENERATOR
// Takes all gathered data and produces Better Together stories
// ============================================

// SalesAI Use Case Taxonomy for validation
const SALESAI_USE_CASES = {
  perfect: [
    'Speed-to-Lead',
    'Demo/Meeting Booking',
    'CRM Lead Reactivation',
    'No-Show Rescheduling',
    'Customer & Tech Support',
    'Renewal/Retention',
    'Upsell/Cross-Sell'
  ],
  ok: [
    'Lead Qualification',
    'B2B Cold Outbound',
    'Front Desk/Receptionist'
  ],
  doNotAssign: [
    'Full sales-cycle replacement',
    'Team/headcount replacement',
    'Billing/collections',
    'Lead generation',
    'Residential cold calling',
    'Advanced technical support'
  ]
};

async function enhanceDataWithClaude(companyData, scrapedProfile, customerData, competitorData) {
  if (currentActionList) {
    currentActionList.addAction('claude-enhance', 'Generating Better Together stories...', 'in_progress');
  }

  const companyName = companyData?.name || state.formData.companyName || state.formData.companyWebsite;
  const domain = state.formData.companyWebsite || companyData?.domain;

  // Build comprehensive context from all gathered data
  const dataContext = {
    company: {
      name: companyName,
      domain: domain,
      description: companyData?.about?.description || companyData?.description || '',
      industry: companyData?.about?.primaryIndustry || companyData?.industry || '',
      employees: companyData?.about?.employeesRange || companyData?.employeesRange || '',
      tags: companyData?.about?.tags || companyData?.tags || []
    },
    scraped: {
      industries: scrapedProfile?.targetIndustries || [],
      services: scrapedProfile?.services || [],
      roles: scrapedProfile?.targetRoles || [],
      useCases: scrapedProfile?.useCases || [],
      customers: scrapedProfile?.customers || [],
      language: scrapedProfile?.language || {},
      pagesScraped: scrapedProfile?.pagesScraped?.length || 0
    },
    customers: customerData || [],
    competitors: competitorData?.competitors || [],
    partnerSignals: competitorData?.fitSignals || {}
  };

  // Build the comprehensive JVP Story Generator prompt
  const jvpPrompt = buildJVPStoryPrompt(dataContext, companyName);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: jvpPrompt
        }]
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.content[0].text;

      try {
        // Clean the response - sometimes Claude adds markdown code blocks
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.slice(7);
        }
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.slice(3);
        }
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.slice(0, -3);
        }

        const enhanced = JSON.parse(cleanContent.trim());

        // DEBUG: Log exactly what Claude returned
        console.log('=== CLAUDE JVP RESPONSE ===');
        console.log('Has jvpStories:', !!enhanced.jvpStories);
        console.log('jvpStories count:', enhanced.jvpStories?.length || 0);
        console.log('Full response:', JSON.stringify(enhanced, null, 2));
        console.log('=== END CLAUDE RESPONSE ===');

        if (currentActionList) {
          currentActionList.updateAction('claude-enhance', 'complete', `Generated ${enhanced.jvpStories?.length || 0} use case stories`);
          if (enhanced.partnerSummary?.gtmAlignment) {
            currentActionList.addSubAction('claude-enhance', `GTM Alignment: ${enhanced.partnerSummary.gtmAlignment}`);
          }
        }

        return enhanced;

      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError, content);
        if (currentActionList) {
          currentActionList.updateAction('claude-enhance', 'error', 'AI parsing failed');
        }
        return null;
      }
    } else {
      throw new Error(`Claude API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Claude JVP generation failed:', error);
    if (currentActionList) {
      currentActionList.updateAction('claude-enhance', 'error', 'AI analysis failed');
    }
    return null;
  }
}

// Build the comprehensive JVP Story Generator prompt - EXACT framework from partner requirements
function buildJVPStoryPrompt(dataContext, companyName) {
  return `You are analyzing a potential partner company for SalesAI, an AI-powered voice agent platform for sales and customer support. Your task is to generate complete "Better Together" joint value proposition stories that partners can use in co-selling motions.

## CONTEXT: What SalesAI Does

SalesAI deploys AI voice agents that handle repetitive, time-sensitive sales and support touchpoints. Key capabilities:
- Always-on engagement (every lead answered in seconds, 24/7)
- Unlimited scale (1,800 calls per minute capacity)
- Human-like conversations that adapt to context
- Seamless handoffs to human reps
- Native CRM integration (HubSpot, Salesforce, GHL primary)

## SALESAI USE CASE TAXONOMY

You must ONLY assign use cases from this official taxonomy:

### PERFECT FIT (prioritize these)
| Use Case | Trigger Event | SalesAI Action | Outcome |
|----------|---------------|----------------|---------|
| Speed-to-Lead | New form fill, demo request, inbound inquiry | Instant outbound call within 60 seconds | Qualification + booking while lead is hot |
| Demo/Meeting Booking | Qualified lead needs appointment | AI schedules directly to rep calendar | Meetings booked 24/7, no back-and-forth |
| CRM Lead Reactivation | Stale MQLs (2-6 months old), closed-lost, no-shows | Multi-touch call sequences | Pipeline recovery from dormant database |
| No-Show Rescheduling | Prospect misses scheduled meeting | Immediate outreach to rebook | Recovered meetings, reduced pipeline leak |
| Customer & Tech Support | Inbound support calls, ticket overflow | AI handles Tier 1, routes complex issues | Reduced wait times, scaled support |
| Renewal/Retention | Contract coming due, churn signals | Proactive outreach to existing customers | Improved retention, reduced churn |
| Upsell/Cross-Sell | Expansion signals in customer base | AI identifies and engages opportunities | Increased ARPU from existing accounts |

### OK FIT (use when Perfect fit isn't available)
| Use Case | When to Use |
|----------|-------------|
| Lead Qualification | High-volume inbound that needs scoring before rep engagement |
| B2B Cold Outbound | Only when partner has proven cold call system/lists |
| Front Desk/Receptionist | Service businesses needing call handling |

### DO NOT ASSIGN
- Full sales-cycle replacement
- Team/headcount replacement positioning
- Billing/collections
- Lead generation (creating net-new leads)
- Residential cold calling
- Advanced technical support

## SALESAI ICP CRITERIA

### Industry Fit
- PERFECT: Professional Services, Business Services, SaaS/Tech, Home Services, Marketing/Advertising
- OK: Heavy-call industries (Real Estate, Mortgage, Medical, Legal, Recruiting, Fund Raising)
- AVOID: <200 calls/month businesses

### Lead Source Fit
- PERFECT: Paid Ads, SEO/Website, <6mo CRM leads, Current customers, Event registrants, Trade shows, Inbound calls
- OK: Co-op leads, Older CRM leads
- AVOID: Purchased/scraped lists, General cold data

### Tech Stack Fit
- PERFECT: HubSpot, Salesforce, Go High Level
- OK: Zoho, Pipedrive, Close (API-enabled)
- AVOID: Closed systems, No CRM

---

## PARTNER DATA INPUT

Company: ${JSON.stringify(dataContext.company, null, 2)}

Scraped Profile:
- Industries: ${dataContext.scraped.industries.join(', ') || 'None detected'}
- Services: ${dataContext.scraped.services.join(', ') || 'None detected'}
- Target Roles: ${dataContext.scraped.roles.join(', ') || 'None detected'}
- Use Cases: ${dataContext.scraped.useCases.join(', ') || 'None detected'}
- Customers: ${dataContext.scraped.customers.slice(0, 10).join(', ') || 'None detected'}
- Tagline: ${dataContext.scraped.language?.tagline || 'Not found'}
- Hero Statements: ${dataContext.scraped.language?.heroStatements?.slice(0, 3).join(' | ') || 'None'}
- Pages Analyzed: ${dataContext.scraped.pagesScraped}

Known Customers: ${dataContext.customers.slice(0, 8).map(c => c.name || c).join(', ') || 'None found'}

Tech Partners Detected: ${dataContext.competitors.join(', ') || 'None'}
Partner Signals: ${JSON.stringify(dataContext.partnerSignals)}

---

## YOUR TASK

Given the partner data above, generate a structured analysis with exactly 3 Better Together stories.

### Step 1: Persona Selection

From the partner's target roles, industries, and customer evidence, identify the TOP 3 buyer personas that:
1. The partner demonstrably serves (evidence from customers, case studies, services)
2. Overlap with SalesAI's ICP verticals
3. Have clear pain points that map to SalesAI use cases

Rank personas by:
- Partner expertise evidence (weight: 40%)
- SalesAI ICP alignment (weight: 35%)
- Revenue potential for joint deals (weight: 25%)

### Step 2: Use Case Matching

For each selected persona, assign exactly ONE SalesAI use case:
1. Map the partner's services to potential SalesAI use cases
2. Identify which lead sources/triggers the partner influences
3. Select the HIGHEST-FIT use case from "Perfect" tier first
4. Only fall back to "OK" tier if no Perfect fit exists

### Step 3: Better Together Story Generation

For each persona + use case combination, generate a complete narrative following this EXACT JSON structure:

{
  "jvpStories": [
    {
      "rank": 1,
      "useCase": "EXACT use case name from taxonomy",
      "useCaseTier": "perfect|ok",

      "persona": {
        "title": "Specific job title",
        "vertical": "Industry vertical",
        "seniority": "C-Level|VP|Director|Manager",
        "companySize": "SMB|Mid-Market|Enterprise",
        "commonTech": ["CRMs and tools they likely use"],
        "organizationalGoals": ["2-3 business objectives they own"]
      },

      "currentState": {
        "useCase": "What is our joint customer trying to do?",
        "problemBlocker": "...but [problem/progress blocker]",
        "currentWay": "How are they doing it today with only ${companyName}?",
        "problems": ["What problems do they face when they do it?"],
        "limitation": "So what... because [how is a single solution limiting]?"
      },

      "empathyMap": {
        "say": ["What they explicitly ask for - direct quotes"],
        "think": ["What they're really thinking - internal monologue"],
        "feel": ["Emotional states - frustrated, anxious, overwhelmed"],
        "do": ["Observable behaviors and workarounds"]
      },

      "futureState": {
        "betterTogetherCapability": "What capability does ${companyName} + SalesAI enable?",
        "partnerContribution": "What ${companyName} brings to the solution",
        "salesAiContribution": "What SalesAI adds that they couldn't do alone",
        "connectedFeatures": "How the products technically integrate/complement",
        "benefits": ["Specific, quantifiable outcomes"],
        "doNothingRisk": "What happens if they just do nothing?"
      },

      "jointValueProp": "${companyName} + SalesAI = [Specific outcome statement]",

      "proofPoints": {
        "partnerEvidence": "Customer names, case studies, or capabilities that prove partner expertise",
        "salesAiEvidence": "Relevant SalesAI metrics (e.g., 'SalesAI reactivation campaigns generate $535K+ closed revenue')",
        "sharedCustomerProfile": "Description of ideal joint customer"
      },

      "confidence": {
        "personaFit": "high|medium|low",
        "useCaseFit": "high|medium|low",
        "dataQuality": "high|medium|low",
        "reasoning": "Why this persona + use case combination"
      }
    }
  ],

  "partnerSummary": {
    "recommendedPartnershipType": "referral|channel|integrated",
    "partnershipTypeReason": "Why this type fits their GTM",
    "gtmAlignment": "strong|moderate|developing",
    "primaryValueDriver": "What makes this partnership valuable",
    "enablementPriority": "What the partner needs to succeed"
  }
}

## QUALITY RULES

1. **Specificity over generality**: Use the partner's actual language, customer names, and services—not generic statements
2. **Evidence-based personas**: Only select personas you can prove from the data (customers, case studies, stated verticals)
3. **Realistic empathy maps**: The "Say/Think/Feel/Do" should reflect real buyer psychology, not marketing speak
4. **Quantified benefits**: Include specific metrics where possible (response time, conversion rates, hours saved)
5. **Honest confidence scoring**: If data is sparse, say so—don't fabricate certainty
6. **Do Nothing Risk must create urgency**: Make the cost of inaction concrete and painful

## CONSTRAINTS

- Generate EXACTLY 3 JVP stories (not more, not less)
- Each story must use a DIFFERENT SalesAI use case (no duplicates)
- Personas must be distinct (different titles, not just different industries for same role)
- If partner data doesn't support 3 high-confidence stories, generate what you can and mark others as "low confidence"
- Never assign use cases from the "DO NOT ASSIGN" list

Return ONLY valid JSON, no other text.`;
}

// Add AI-generated enrichment card (with AI badge)
async function addAIEnrichmentCard(data) {
  const typingId = addTypingIndicator();
  await delay(600);
  removeTypingIndicator(typingId);

  const name = data.name || state.formData.companyName;
  const domain = data.domain || state.formData.companyWebsite;
  const industry = data.industry || '';
  const employees = data.employeesRange || 'Unknown';
  const founded = data.founded || '';
  const description = data.description || '';
  const tags = data.tags || [];
  const headquarters = data.headquarters || '';
  const companyType = data.type || '';

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';

  let enrichmentSections = '';

  if (description) {
    enrichmentSections += `
      <div class="enrichment-section">
        <div class="enrichment-section-title">About</div>
        <div class="enrichment-description">${description}</div>
      </div>
    `;
  }

  if (headquarters) {
    enrichmentSections += `
      <div class="enrichment-section">
        <div class="enrichment-section-title">Headquarters</div>
        <div class="enrichment-details">
          <div class="enrichment-detail"><span class="enrichment-detail-icon">📍</span>${headquarters}</div>
        </div>
      </div>
    `;
  }

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">I researched your company and here's what I found:</div>
      <div class="enrichment-card enrichment-card-ai">
        <div class="enrichment-header">
          <div class="enrichment-logo">${name.charAt(0)}</div>
          <div class="enrichment-title">
            <div class="enrichment-name">${name}</div>
            <div class="enrichment-domain">${domain}${industry ? ` · ${industry}` : ''}${companyType ? ` · ${companyType}` : ''}</div>
          </div>
          <div class="enrichment-badge ai-badge">AI Research</div>
        </div>
        <div class="enrichment-stats">
          <div class="enrichment-stat">
            <div class="enrichment-stat-value">${employees}</div>
            <div class="enrichment-stat-label">Est. Employees</div>
          </div>
          <div class="enrichment-stat">
            <div class="enrichment-stat-value">${founded || 'N/A'}</div>
            <div class="enrichment-stat-label">Founded</div>
          </div>
        </div>
        ${tags.length > 0 ? `
          <div class="enrichment-tags">
            ${tags.slice(0, 6).map(tag => `<span class="enrichment-tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        ${enrichmentSections}
        <div class="enrichment-ai-note">
          <span class="ai-note-icon">✨</span>
          <span>This information was researched by AI and may need verification.</span>
        </div>
      </div>
    </div>
  `;

  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();

  // Generate smart pre-fill suggestions using Claude (for AI-researched data too)
  await generateSmartPrefill(data);

  await delay(1000);
}

// ============================================
// HELPER: FORMAT SLUG-STYLE STRINGS
// ============================================
// Converts "cloud-computing" to "Cloud Computing"
function formatSlug(slug) {
  if (!slug || typeof slug !== 'string') return slug || '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================
// COMPANIES API DATA NORMALIZER
// ============================================
// Transforms the nested API response from thecompaniesapi.com into a flat, usable structure.
// The API returns complex nested objects like:
//   - assets.logoSquare.src (not just assets.logoSquare)
//   - locations.headquarters.city.name (not just city)
//   - socials.linkedin.url (not just socials.linkedin)
// This normalizer handles all these patterns and produces consistent, display-ready values.

function normalizeCompanyData(raw) {
  // Helper to safely access nested properties
  const get = (obj, path, defaultVal = null) => {
    if (!obj) return defaultVal;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined || result === null) return defaultVal;
    }
    return result;
  };

  // Helper to extract URL from social object (handles {url: "...", id: "..."} pattern)
  const getSocialUrl = (socialObj) => {
    if (!socialObj) return '';
    if (typeof socialObj === 'string') return socialObj;
    return socialObj.url || socialObj.salesNavigatorUrl || '';
  };

  // Helper to extract name from location object (handles {name: "...", code: "..."} pattern)
  const getLocationPart = (locObj) => {
    if (!locObj) return '';
    if (typeof locObj === 'string') return locObj;
    return locObj.name || locObj.address || '';
  };

  // Helper to extract address string
  const getAddress = (locObj) => {
    if (!locObj) return '';
    const addrObj = locObj.address;
    if (!addrObj) return '';
    if (typeof addrObj === 'string') return addrObj;
    return addrObj.raw || addrObj.formatted || addrObj.street || '';
  };

  // ============================================
  // EXTRACT & NORMALIZE ALL FIELDS
  // ============================================

  // LOGO - handle nested asset object with src property
  const logoSquare = get(raw, 'assets.logoSquare');
  const logoFallback = get(raw, 'assets.logo');
  const logo = (logoSquare?.src) || (logoFallback?.src) || logoSquare || logoFallback || raw.logo || '';

  // BASIC INFO
  const name = get(raw, 'about.name') || raw.name || '';
  const nameLegal = get(raw, 'about.nameLegal') || '';
  const domainObj = get(raw, 'domain');
  const domain = (typeof domainObj === 'object') ? domainObj.domain : (domainObj || '');
  const industry = get(raw, 'about.industry') || raw.industry || '';
  const industries = get(raw, 'about.industries', []) || raw.industries || raw.tags || [];
  const businessType = get(raw, 'about.businessType') || raw.businessType || '';
  const languages = get(raw, 'about.languages', []) || [];

  // EMPLOYEES
  const employees = get(raw, 'about.totalEmployees') || raw.employeesRange || raw.employees || '';
  const employeesExact = get(raw, 'about.totalEmployeesExact') || raw.totalEmployeesExact || null;
  const employeeGrowth = get(raw, 'about.employeeGrowth') || raw.employeeGrowth || '';

  // FINANCES
  const revenue = get(raw, 'finances.revenue') || get(raw, 'finances.revenueRange') || raw.revenueRange || raw.annualRevenue || '';
  const revenueExact = get(raw, 'finances.revenueExact') || null;
  const funding = get(raw, 'finances.totalFunding') || get(raw, 'finances.funding') || raw.totalFunding || '';
  const fundingRounds = get(raw, 'finances.fundingRounds', []) || raw.fundingRounds || [];
  const lastFundingDate = get(raw, 'finances.lastFundingDate') || '';
  const lastFundingType = get(raw, 'finances.lastFundingType') || get(raw, 'finances.lastRoundType') || '';
  const investors = get(raw, 'finances.investors', []) || [];
  const stockSymbol = get(raw, 'finances.stockSymbol') || get(raw, 'about.stockSymbol') || raw.stockSymbol || raw.ticker || '';
  const stockExchange = get(raw, 'finances.stockExchange') || '';

  // FOUNDED
  const founded = get(raw, 'about.yearFounded') || raw.foundedYear || raw.yearFounded || '';
  const companyType = get(raw, 'about.type') || raw.type || raw.companyType || '';

  // DESCRIPTIONS
  const description = get(raw, 'descriptions.primary') || get(raw, 'descriptions.short') || raw.description || '';
  const tagline = get(raw, 'descriptions.tagline') || get(raw, 'descriptions.website') || '';

  // LOCATION - handle nested objects with .name property
  const hq = get(raw, 'locations.headquarters', {});
  const hqCity = getLocationPart(hq.city);
  const hqState = getLocationPart(hq.state);
  const hqCountry = getLocationPart(hq.country);
  const hqCountryCode = (typeof hq.country === 'object') ? (hq.country?.code || '') : '';
  const hqContinent = getLocationPart(hq.continent);
  const address = getAddress(hq);
  const postalCode = hq.postalCode || '';
  const timezone = hq.timezone || '';

  // Build location string
  const locationParts = [hqCity, hqState, hqCountry].filter(Boolean);
  const location = locationParts.join(', ');

  // CONTACT
  const phone = get(raw, 'contact.phone') || raw.phone || '';
  const email = get(raw, 'contact.email') || raw.email || '';

  // SOCIAL PROFILES - handle nested objects with .url property
  const linkedin = getSocialUrl(get(raw, 'socials.linkedin')) || getSocialUrl(get(raw, 'links.linkedin')) || raw.linkedin || raw.linkedinUrl || '';
  const twitter = getSocialUrl(get(raw, 'socials.twitter')) || getSocialUrl(get(raw, 'links.twitter')) || raw.twitter || raw.twitterUrl || '';
  const facebook = getSocialUrl(get(raw, 'socials.facebook')) || getSocialUrl(get(raw, 'links.facebook')) || raw.facebook || raw.facebookUrl || '';
  const instagram = getSocialUrl(get(raw, 'socials.instagram')) || getSocialUrl(get(raw, 'links.instagram')) || raw.instagram || '';
  const youtube = getSocialUrl(get(raw, 'socials.youtube')) || getSocialUrl(get(raw, 'links.youtube')) || raw.youtube || '';
  const crunchbase = getSocialUrl(get(raw, 'socials.crunchbase')) || getSocialUrl(get(raw, 'links.crunchbase')) || '';
  const github = getSocialUrl(get(raw, 'socials.github')) || getSocialUrl(get(raw, 'links.github')) || '';
  const wellfound = getSocialUrl(get(raw, 'socials.wellfound')) || getSocialUrl(get(raw, 'socials.angellist')) || '';

  // ANALYTICS
  const monthlyVisitors = get(raw, 'analytics.monthlyVisitors') || raw.monthlyVisitors || '';
  const monthlyVisitorsExact = get(raw, 'analytics.monthlyVisitorsExact') || null;
  const alexaRank = get(raw, 'analytics.alexaRank') || get(raw, 'analytics.globalRank') || raw.alexaRank || null;
  const pageviews = get(raw, 'analytics.pageviews') || '';
  const bounceRate = get(raw, 'analytics.bounceRate') || '';
  const timeOnSite = get(raw, 'analytics.timeOnSite') || '';

  // TECHNOLOGIES - may be in apps object with nested structure
  const appsRaw = get(raw, 'apps', {});
  let technologies = get(raw, 'technologies', []) || raw.technologies || [];
  if (typeof appsRaw === 'object' && !Array.isArray(appsRaw) && Object.keys(appsRaw).length > 0) {
    // Extract app names from the apps object structure
    const appNames = Object.keys(appsRaw);
    if (technologies.length === 0) technologies = appNames;
  }
  const techCategories = get(raw, 'technologyCategories', []) || [];

  // INDUSTRY CODES
  const naicsRaw = get(raw, 'codes.naics', []);
  const naicsCode = Array.isArray(naicsRaw) ? naicsRaw.join(', ') : naicsRaw;
  const naicsDescription = get(raw, 'codes.naicsDescription') || '';
  const sicRaw = get(raw, 'codes.sic', []);
  const sicCode = Array.isArray(sicRaw) ? sicRaw.join(', ') : sicRaw;
  const sicDescription = get(raw, 'codes.sicDescription') || '';

  // PEOPLE
  const ceo = get(raw, 'people.ceo') || raw.ceo || '';
  const founders = get(raw, 'people.founders', []) || raw.founders || [];
  const keyPeople = get(raw, 'people.key', []) || [];
  const employeesList = get(raw, 'employees', []) || [];

  // KEYWORDS & SPECIALTIES
  const keywords = get(raw, 'keywords', []) || raw.keywords || [];
  const specialties = get(raw, 'specialties', []) || raw.specialties || [];
  const services = get(raw, 'services', []) || [];

  // CORPORATE STRUCTURE - handle objects with .name and .domain
  const acquisitionsRaw = get(raw, 'companies.acquisitions', []) || [];
  const acquisitions = acquisitionsRaw.map(a => ({
    name: a.name || a,
    domain: a.domain || '',
    description: a.description || a.descriptionShort || ''
  }));

  const subsidiariesRaw = get(raw, 'companies.subsidiaries', []) || [];
  const subsidiaries = subsidiariesRaw.map(s => ({
    name: s.name || s,
    domain: s.domain || '',
    description: s.description || s.descriptionShort || ''
  }));

  const parentRaw = get(raw, 'companies.parent');
  const parentCompany = parentRaw ? (typeof parentRaw === 'object' ? parentRaw.name : parentRaw) : '';

  // ADDITIONAL DATA
  const jobOpenings = get(raw, 'jobs.openPositions') || get(raw, 'jobs.count') || '';
  const news = get(raw, 'news', []) || [];
  const awards = get(raw, 'awards', []) || [];
  const certifications = get(raw, 'certifications', []) || [];

  // EMAIL PATTERNS
  const emailPatterns = get(raw, 'secondaries.emailPatterns', []) || [];

  // DOMAIN INFO
  const domainInfo = {
    registrar: get(raw, 'domain.registrar') || '',
    state: get(raw, 'domain.state') || '',
    tld: get(raw, 'domain.tld') || ''
  };

  // META/SCORE
  const metaScore = get(raw, 'meta.score') || null;

  // ============================================
  // COUNT DATA POINTS FOR "WOW" FACTOR
  // ============================================
  let dataPointsCount = 0;
  const countIfExists = (val) => {
    if (val === null || val === undefined || val === '') return false;
    if (Array.isArray(val)) {
      if (val.length > 0) {
        dataPointsCount += Math.min(val.length, 10); // Count array items up to 10
        return true;
      }
      return false;
    }
    if (typeof val === 'object') return false; // Don't count empty objects
    dataPointsCount++;
    return true;
  };

  // Core info
  countIfExists(name);
  countIfExists(nameLegal);
  countIfExists(domain);
  countIfExists(logo);
  countIfExists(industry);
  countIfExists(businessType);
  countIfExists(companyType);
  countIfExists(tagline);
  countIfExists(description);

  // Size & Financials
  countIfExists(employees);
  countIfExists(employeesExact);
  countIfExists(employeeGrowth);
  countIfExists(revenue);
  countIfExists(revenueExact);
  countIfExists(funding);
  countIfExists(stockSymbol);
  countIfExists(stockExchange);

  // History
  countIfExists(founded);

  // Location
  countIfExists(location);
  countIfExists(address);
  countIfExists(timezone);

  // Contact
  countIfExists(phone);
  countIfExists(email);

  // Socials
  countIfExists(linkedin);
  countIfExists(twitter);
  countIfExists(facebook);
  countIfExists(instagram);
  countIfExists(youtube);
  countIfExists(github);
  countIfExists(crunchbase);
  countIfExists(wellfound);

  // Analytics
  countIfExists(monthlyVisitors);
  countIfExists(alexaRank);

  // Codes
  countIfExists(naicsCode);
  countIfExists(sicCode);

  // Arrays (each item adds to count, up to 10 per array)
  countIfExists(industries);
  countIfExists(technologies);
  countIfExists(investors);
  countIfExists(acquisitions);
  countIfExists(subsidiaries);
  countIfExists(founders);
  countIfExists(emailPatterns);

  // ============================================
  // RETURN NORMALIZED OBJECT
  // ============================================
  return {
    // Basic
    logo, name, nameLegal, domain, industry, industries, businessType, languages,
    // Employees
    employees, employeesExact, employeeGrowth,
    // Finances
    revenue, revenueExact, funding, fundingRounds, lastFundingDate, lastFundingType, investors, stockSymbol, stockExchange,
    // Founded
    founded, companyType,
    // Descriptions
    description, tagline,
    // Location
    location, hqCity, hqState, hqCountry, hqCountryCode, hqContinent, address, postalCode, timezone,
    // Contact
    phone, email,
    // Socials
    linkedin, twitter, facebook, instagram, youtube, crunchbase, github, wellfound,
    // Analytics
    monthlyVisitors, monthlyVisitorsExact, alexaRank, pageviews, bounceRate, timeOnSite,
    // Tech
    technologies, techCategories,
    // Codes
    naicsCode, naicsDescription, sicCode, sicDescription,
    // People
    ceo, founders, keyPeople, employeesList,
    // Keywords
    keywords, specialties, services,
    // Corporate
    acquisitions, subsidiaries, parentCompany,
    // Additional
    jobOpenings, news, awards, certifications, emailPatterns, domainInfo, metaScore,
    // Stats
    dataPointsCount
  };
}

async function addEnrichmentCard(data) {
  const typingId = addTypingIndicator();
  await delay(600);
  removeTypingIndicator(typingId);

  // ============================================
  // COMPANIES API NORMALIZER
  // Transforms the nested API response into a flat, usable structure
  // Handles all known nested patterns from thecompaniesapi.com
  // ============================================
  const normalized = normalizeCompanyData(data);

  // Destructure for easy access
  const {
    logo, name, nameLegal, domain, industry, industries, businessType,
    employees, employeesExact, employeeGrowth,
    revenue, revenueExact, funding, fundingRounds, lastFundingDate, lastFundingType, investors,
    founded, companyType, stockSymbol, stockExchange,
    description, tagline,
    location, address, postalCode, timezone,
    phone, email,
    linkedin, twitter, facebook, instagram, youtube, crunchbase, github, wellfound,
    monthlyVisitors, monthlyVisitorsExact, alexaRank, pageviews, bounceRate, timeOnSite,
    technologies, techCategories,
    naicsCode, naicsDescription, sicCode, sicDescription,
    ceo, founders, keyPeople, employeesList,
    keywords, specialties, services,
    acquisitions, subsidiaries, parentCompany,
    jobOpenings, news, awards, certifications, emailPatterns,
    dataPointsCount
  } = normalized;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';

  // Build the impressive enrichment card
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">Found it! Here's what I learned about your company:</div>
      <div class="enrichment-card enrichment-card-full enrichment-card-wow">
        <!-- Header with logo and data points badge -->
        <div class="enrichment-header-wow">
          <div class="enrichment-logo-wow">
            ${logo ? `<img src="${logo}" alt="${name}" onerror="this.parentElement.innerHTML='<span class=\\'logo-letter\\'>${name.charAt(0)}</span>'">` : `<span class="logo-letter">${name.charAt(0)}</span>`}
          </div>
          <div class="enrichment-title-wow">
            <div class="enrichment-name-wow">${name}</div>
            <div class="enrichment-meta-wow">
              <span class="enrichment-domain-wow">${domain}</span>
              ${industry ? `<span class="enrichment-separator">·</span><span class="enrichment-industry-wow">${formatSlug(industry)}</span>` : ''}
              ${businessType ? `<span class="enrichment-separator">·</span><span class="enrichment-type-wow">${formatSlug(businessType)}</span>` : ''}
            </div>
          </div>
          <div class="enrichment-datapoints-badge">
            <span class="datapoints-count">${dataPointsCount}</span>
            <span class="datapoints-label">data points</span>
          </div>
        </div>

        <!-- Key Metrics Grid -->
        <div class="enrichment-metrics-grid">
          ${(employees || employeesExact) ? `
          <div class="enrichment-metric">
            <div class="metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">${employeesExact ? (typeof employeesExact === 'number' ? employeesExact.toLocaleString() : employeesExact) : employees}</div>
              <div class="metric-label">${employeesExact ? 'Employees (Exact)' : 'Employees'}</div>
            </div>
          </div>
          ` : ''}
          ${revenue ? `
          <div class="enrichment-metric">
            <div class="metric-icon revenue-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">${revenue}</div>
              <div class="metric-label">Annual Revenue</div>
            </div>
          </div>
          ` : ''}
          ${founded ? `
          <div class="enrichment-metric">
            <div class="metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">${founded}</div>
              <div class="metric-label">Founded</div>
            </div>
          </div>
          ` : ''}
          ${funding ? `
          <div class="enrichment-metric">
            <div class="metric-icon funding-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">${typeof funding === 'number' ? '$' + (funding / 1000000).toFixed(1) + 'M' : funding}</div>
              <div class="metric-label">Total Funding${fundingRounds.length ? ` (${fundingRounds.length} rounds)` : ''}</div>
            </div>
          </div>
          ` : ''}
          ${monthlyVisitors ? `
          <div class="enrichment-metric">
            <div class="metric-icon traffic-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">${typeof monthlyVisitors === 'number' ? (monthlyVisitors / 1000).toFixed(0) + 'K' : monthlyVisitors}</div>
              <div class="metric-label">Monthly Visitors</div>
            </div>
          </div>
          ` : ''}
          ${alexaRank ? `
          <div class="enrichment-metric">
            <div class="metric-icon rank-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">#${alexaRank.toLocaleString()}</div>
              <div class="metric-label">Global Rank</div>
            </div>
          </div>
          ` : ''}
          ${stockSymbol ? `
          <div class="enrichment-metric">
            <div class="metric-icon stock-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">${stockSymbol}</div>
              <div class="metric-label">Stock Symbol</div>
            </div>
          </div>
          ` : ''}
          ${stockExchange ? `
          <div class="enrichment-metric">
            <div class="metric-icon stock-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">${stockExchange}</div>
              <div class="metric-label">Stock Exchange</div>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Description -->
        ${description ? `
        <div class="enrichment-section-wow description-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>About</span>
          </div>
          <div class="section-content description-content">${description}</div>
        </div>
        ` : ''}

        <!-- Industry Tags -->
        ${industries.length > 0 ? `
        <div class="enrichment-section-wow tags-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            <span>Industries & Categories</span>
            <span class="section-count">${industries.length} industries</span>
          </div>
          <div class="section-content">
            <div class="tag-cloud">
              ${industries.slice(0, 15).map(tag => `<span class="enrichment-tag-wow industry-tag">${formatSlug(tag)}</span>`).join('')}
              ${industries.length > 15 ? `<span class="enrichment-tag-wow more-tag">+${industries.length - 15} more</span>` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Technologies (the wow moment for tech companies) -->
        ${technologies.length > 0 ? `
        <div class="enrichment-section-wow tech-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            <span>Tech Stack</span>
            <span class="section-count">${technologies.length} technologies</span>
          </div>
          <div class="section-content">
            <div class="tag-cloud tech-cloud">
              ${technologies.slice(0, 20).map(tech => `<span class="enrichment-tag-wow tech-tag">${tech}</span>`).join('')}
              ${technologies.length > 20 ? `<span class="enrichment-tag-wow more-tag">+${technologies.length - 20} more</span>` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Location & Contact -->
        ${(location || phone || email || address) ? `
        <div class="enrichment-section-wow contact-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Location & Contact</span>
          </div>
          <div class="section-content contact-grid">
            ${location ? `
            <div class="contact-item">
              <span class="contact-icon">📍</span>
              <span class="contact-text">${location}</span>
            </div>
            ` : ''}
            ${address ? `
            <div class="contact-item">
              <span class="contact-icon">🏢</span>
              <span class="contact-text">${address}</span>
            </div>
            ` : ''}
            ${phone ? `
            <div class="contact-item">
              <span class="contact-icon">📞</span>
              <span class="contact-text">${phone}</span>
            </div>
            ` : ''}
            ${email ? `
            <div class="contact-item">
              <span class="contact-icon">✉️</span>
              <span class="contact-text">${email}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Social Profiles -->
        ${(linkedin || twitter || facebook || instagram || youtube || github || crunchbase || wellfound) ? `
        <div class="enrichment-section-wow social-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
            </svg>
            <span>Social Profiles</span>
          </div>
          <div class="section-content social-links">
            ${linkedin ? `<a href="${linkedin}" target="_blank" class="social-link linkedin-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>LinkedIn</a>` : ''}
            ${twitter ? `<a href="${twitter}" target="_blank" class="social-link twitter-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>X/Twitter</a>` : ''}
            ${facebook ? `<a href="${facebook}" target="_blank" class="social-link facebook-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</a>` : ''}
            ${instagram ? `<a href="${instagram}" target="_blank" class="social-link instagram-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>Instagram</a>` : ''}
            ${youtube ? `<a href="${youtube}" target="_blank" class="social-link youtube-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>YouTube</a>` : ''}
            ${github ? `<a href="${github}" target="_blank" class="social-link github-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>GitHub</a>` : ''}
            ${crunchbase ? `<a href="${crunchbase}" target="_blank" class="social-link crunchbase-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 0H2.4A2.41 2.41 0 000 2.4v19.2A2.41 2.41 0 002.4 24h19.2a2.41 2.41 0 002.4-2.4V2.4A2.41 2.41 0 0021.6 0zM7.045 14.465A2.11 2.11 0 014.93 12.35a2.11 2.11 0 012.115-2.115 2.11 2.11 0 012.115 2.115 2.11 2.11 0 01-2.115 2.115zm5.21 3.452c-1.09 0-2.07-.385-2.845-1.025l.895-1.38a3.05 3.05 0 001.95.715c.66 0 1.05-.275 1.05-.7 0-.44-.5-.605-1.32-.825-1.16-.31-2.51-.735-2.51-2.24 0-1.335 1.115-2.25 2.695-2.25.95 0 1.805.295 2.5.79l-.79 1.38a2.87 2.87 0 00-1.7-.545c-.55 0-.905.22-.905.605 0 .44.5.55 1.32.77 1.21.33 2.51.77 2.51 2.295 0 1.39-1.115 2.41-2.85 2.41zm6.36-3.452a2.11 2.11 0 01-2.115-2.115 2.11 2.11 0 012.115-2.115 2.11 2.11 0 012.115 2.115 2.11 2.11 0 01-2.115 2.115z"/></svg>Crunchbase</a>` : ''}
            ${wellfound ? `<a href="${wellfound}" target="_blank" class="social-link wellfound-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.947 18.235h-1.99v-5.09H7.59v-1.775h1.473v-.615c0-1.052.264-1.872.793-2.461.528-.588 1.264-.883 2.207-.883.506 0 .943.044 1.311.132v1.647c-.221-.059-.501-.088-.84-.088-.368 0-.648.114-.84.342-.192.228-.288.572-.288 1.032v.894h1.848v1.775h-1.848v5.09zm6.174 0h-1.99v-3.015c0-.647-.097-1.116-.29-1.407-.192-.29-.501-.435-.925-.435-.412 0-.732.159-.961.478-.23.319-.344.771-.344 1.358v3.02h-1.99v-6.865h1.99v.934c.264-.368.58-.641.947-.821.367-.18.788-.27 1.263-.27.662 0 1.186.202 1.571.607.386.404.579 1.018.579 1.842v4.573h.15z"/></svg>Wellfound</a>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Investors (huge for VC-backed companies) -->
        ${investors.length > 0 ? `
        <div class="enrichment-section-wow investors-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 18V6"/>
            </svg>
            <span>Investors</span>
            <span class="section-count">${investors.length} investors</span>
          </div>
          <div class="section-content">
            <div class="tag-cloud investor-cloud">
              ${investors.slice(0, 10).map(inv => `<span class="enrichment-tag-wow investor-tag">${typeof inv === 'object' ? inv.name : inv}</span>`).join('')}
              ${investors.length > 10 ? `<span class="enrichment-tag-wow more-tag">+${investors.length - 10} more</span>` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Acquisitions & Subsidiaries -->
        ${(acquisitions.length > 0 || subsidiaries.length > 0 || parentCompany) ? `
        <div class="enrichment-section-wow corporate-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
            </svg>
            <span>Corporate Structure</span>
          </div>
          <div class="section-content">
            ${parentCompany ? `<div class="corporate-item"><span class="corporate-label">Parent Company:</span> <span class="corporate-value">${typeof parentCompany === 'object' ? parentCompany.name : parentCompany}</span></div>` : ''}
            ${subsidiaries.length > 0 ? `<div class="corporate-item"><span class="corporate-label">Subsidiaries:</span> <span class="corporate-value">${subsidiaries.slice(0, 5).map(s => typeof s === 'object' ? s.name : s).join(', ')}${subsidiaries.length > 5 ? ` +${subsidiaries.length - 5} more` : ''}</span></div>` : ''}
            ${acquisitions.length > 0 ? `<div class="corporate-item"><span class="corporate-label">Acquisitions:</span> <span class="corporate-value">${acquisitions.slice(0, 5).map(a => typeof a === 'object' ? a.name : a).join(', ')}${acquisitions.length > 5 ? ` +${acquisitions.length - 5} more` : ''}</span></div>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Job Openings -->
        ${jobOpenings ? `
        <div class="enrichment-section-wow jobs-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            <span>Hiring Activity</span>
          </div>
          <div class="section-content">
            <div class="hiring-badge">
              <span class="hiring-count">${typeof jobOpenings === 'number' ? jobOpenings : jobOpenings}</span>
              <span class="hiring-label">Open Positions</span>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Leadership -->
        ${(ceo || founders.length > 0) ? `
        <div class="enrichment-section-wow leadership-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Leadership</span>
          </div>
          <div class="section-content">
            ${ceo ? `<div class="leader-item"><span class="leader-role">CEO:</span> <span class="leader-name">${ceo}</span></div>` : ''}
            ${founders.length > 0 ? `<div class="leader-item"><span class="leader-role">Founder${founders.length > 1 ? 's' : ''}:</span> <span class="leader-name">${founders.join(', ')}</span></div>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Keywords & Specialties -->
        ${(keywords.length > 0 || specialties.length > 0) ? `
        <div class="enrichment-section-wow keywords-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <span>Keywords & Specialties</span>
          </div>
          <div class="section-content">
            <div class="tag-cloud keyword-cloud">
              ${[...keywords, ...specialties].slice(0, 15).map(kw => `<span class="enrichment-tag-wow keyword-tag">${kw}</span>`).join('')}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Email Patterns (valuable for sales outreach) -->
        ${emailPatterns.length > 0 ? `
        <div class="enrichment-section-wow email-patterns-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Email Patterns</span>
            <span class="section-count">Top ${Math.min(emailPatterns.length, 3)} patterns</span>
          </div>
          <div class="section-content">
            <div class="email-patterns-list">
              ${emailPatterns.slice(0, 3).map(ep => `
                <div class="email-pattern-item">
                  <span class="pattern-format">${ep.pattern.replace(/\[F\]/g, 'first').replace(/\[L\]/g, 'last').replace(/\[F1\]/g, 'f').replace(/\[L1\]/g, 'l').replace(/\[M1\]/g, 'm')}@domain.com</span>
                  <span class="pattern-usage">${ep.usagePercentage.toFixed(1)}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Industry Codes (for B2B nerds) -->
        ${(naicsCode || sicCode) ? `
        <div class="enrichment-section-wow codes-section">
          <div class="section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span>Industry Codes</span>
          </div>
          <div class="section-content codes-grid">
            ${naicsCode ? `<div class="code-item"><span class="code-label">NAICS:</span> <span class="code-value">${naicsCode}</span></div>` : ''}
            ${sicCode ? `<div class="code-item"><span class="code-label">SIC:</span> <span class="code-value">${sicCode}</span></div>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Source Badge -->
        <div class="enrichment-footer-wow">
          <div class="enrichment-source">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Verified via The Companies API</span>
          </div>
          <div class="enrichment-timestamp">Just now</div>
        </div>
      </div>
    </div>
  `;

  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();

  // Note: Smart prefill is now generated after customer discovery in enrichCompanyData
  // Only generate basic prefill if no customers were found
  if (!state.customerCompanies || state.customerCompanies.length === 0) {
    await generateSmartPrefill(data);
  }

  // Brief pause before continuing
  await delay(1000);
}

// ============================================
// NAVBAR DETECTION FOR SMART PAGE DISCOVERY
// ============================================

/**
 * Parses the navigation menu to find actual page URLs for customers, partners, etc.
 * This is more robust than guessing at hardcoded URL paths.
 */
function detectNavbarLinks(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const discovered = {
    customerPages: [],
    partnerPages: [],
    aboutPages: [],
    resourcePages: [],
    // NEW: Solutions/positioning pages for "better together" story
    solutionsByRole: [],      // "For Sales", "For Marketing", etc.
    solutionsByIndustry: [],  // "Healthcare", "Financial Services", etc.
    useCasePages: [],         // "Lead Generation", "Pipeline Management", etc.
    productPages: []          // "Products", "Features", "Platform"
  };

  // Keywords to look for in navigation links
  const customerKeywords = [
    'customers', 'clients', 'case studies', 'case-studies', 'casestudies',
    'success stories', 'success-stories', 'successstories', 'testimonials',
    'who we serve', 'our customers', 'our clients', 'customer stories',
    'client stories', 'results', 'portfolio', 'work'
  ];

  const partnerKeywords = [
    'partners', 'integrations', 'integration', 'technology', 'tech partners',
    'ecosystem', 'alliances', 'marketplace', 'apps', 'connect', 'plugins',
    'extensions', 'add-ons', 'addons', 'platform'
  ];

  const aboutKeywords = [
    'about', 'about us', 'about-us', 'company', 'team', 'leadership',
    'who we are', 'our story', 'our mission'
  ];

  const resourceKeywords = [
    'resources', 'blog', 'insights', 'learn', 'knowledge', 'library',
    'guides', 'whitepapers', 'ebooks', 'webinars'
  ];

  // NEW: Role-based solution keywords (who they sell to)
  const roleKeywords = [
    // Direct role targeting
    'for sales', 'for marketing', 'for revenue', 'for revops', 'for ops',
    'for executives', 'for cro', 'for cmo', 'for ceo', 'for founders',
    'for sales leaders', 'for sales teams', 'for sdrs', 'for bdrs',
    'for account executives', 'for aes', 'for customer success',
    'for agencies', 'for consultants', 'for partners',
    // Team-based
    'sales teams', 'marketing teams', 'revenue teams', 'go-to-market',
    'gtm teams', 'growth teams', 'demand teams',
    // Seniority levels (from Gong pattern: /solutions/revenue-leadership)
    'leadership', 'leaders', 'vp of sales', 'head of sales', 'director',
    'sales leader', 'revenue leader', 'marketing leader',
    // Role-specific URLs
    'by role', 'by team', 'who it\'s for', 'who uses',
    // AI agents (from Gong: ai-agents-for-revenue-teams)
    'for revenue teams', 'revenue team'
  ];

  // NEW: Industry keywords (verticals they serve)
  const industryKeywords = [
    // Core industries
    'healthcare', 'financial services', 'fintech', 'banking', 'insurance',
    'technology', 'saas', 'software', 'manufacturing', 'retail', 'ecommerce',
    'e-commerce', 'real estate', 'professional services', 'legal', 'accounting',
    'education', 'edtech', 'government', 'nonprofit', 'media', 'entertainment',
    'telecommunications', 'telecom', 'energy', 'utilities', 'logistics',
    'transportation', 'hospitality', 'travel', 'construction', 'automotive',
    'life sciences', 'pharma', 'biotech',
    // Tech sub-verticals (from Gong: /solutions/tech)
    'tech', 'high-tech', 'b2b saas', 'b2b tech', 'enterprise software',
    // Industry page patterns
    'by industry', 'industries', 'verticals', 'sectors', '/industries/',
    '/solutions/tech', '/solutions/healthcare', '/solutions/financial'
  ];

  // NEW: Use case keywords (what problems they solve)
  const useCaseKeywords = [
    // Lead/pipeline focused
    'lead generation', 'lead gen', 'demand generation', 'demand gen',
    'pipeline', 'pipeline management', 'pipeline generation',
    'prospecting', 'outbound', 'inbound', 'cold calling', 'cold email',
    // Sales process
    'sales engagement', 'sales automation', 'sales enablement',
    'deal management', 'opportunity management', 'account management',
    'customer acquisition', 'customer retention', 'upsell', 'cross-sell',
    'meeting booking', 'scheduling', 'qualification', 'discovery',
    'demos', 'proposals', 'contracts', 'closing', 'negotiation',
    // Revenue intelligence (from Gong)
    'revenue operations', 'revenue intelligence', 'forecasting',
    'conversation intelligence', 'call recording', 'call analytics',
    'revenue forecasting', 'deal intelligence', 'sales intelligence',
    // Generic patterns
    'use cases', 'solutions', 'capabilities', 'what we do', 'how it works',
    '/use-case/', '/use-cases/', '/solutions/'
  ];

  // NEW: Product/feature keywords
  const productKeywords = [
    'products', 'product', 'features', 'platform', 'capabilities',
    'how it works', 'what we do', 'our solution', 'the platform',
    'pricing', 'plans', 'packages',
    // Specific product patterns (from Gong/Salesloft)
    'product overview', 'platform overview', 'our products',
    '/platform/', '/product/', '/features/'
  ];

  // Look for links in navigation elements
  const navSelectors = [
    'nav a',
    'header a',
    '[role="navigation"] a',
    '.nav a', '.navbar a', '.navigation a',
    '.menu a', '.main-menu a', '.primary-menu a',
    '.header-menu a', '.site-menu a',
    '[class*="nav-"] a', '[class*="menu-"] a'
  ];

  const allNavLinks = new Set();

  navSelectors.forEach(selector => {
    try {
      doc.querySelectorAll(selector).forEach(link => {
        const href = link.getAttribute('href');
        const text = (link.textContent || '').trim().toLowerCase();

        if (href && text && text.length < 50) {
          allNavLinks.add({ href, text, element: link });
        }
      });
    } catch (e) {
      // Selector might be invalid, skip it
    }
  });

  // Also check dropdown menus which might not be in nav
  doc.querySelectorAll('[class*="dropdown"] a, [class*="submenu"] a, [class*="mega-menu"] a').forEach(link => {
    const href = link.getAttribute('href');
    const text = (link.textContent || '').trim().toLowerCase();
    if (href && text && text.length < 50) {
      allNavLinks.add({ href, text, element: link });
    }
  });

  // Helper to resolve relative URLs
  const resolveUrl = (href) => {
    if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return null;
    }
    try {
      if (href.startsWith('http')) {
        // Check if it's same domain
        const url = new URL(href);
        const baseDomain = new URL(baseUrl).hostname.replace('www.', '');
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
  };

  // Helper to check if text/href matches any keyword
  const matchesKeywords = (text, href, keywords) => {
    const lowerText = text.toLowerCase();
    const lowerHref = href.toLowerCase();
    return keywords.some(kw => {
      const kwLower = kw.toLowerCase();
      const kwSlug = kwLower.replace(/\s+/g, '-');
      return lowerText.includes(kwLower) || lowerHref.includes(kwSlug);
    });
  };

  // Categorize discovered links
  allNavLinks.forEach(({ href, text }) => {
    const resolvedUrl = resolveUrl(href);
    if (!resolvedUrl) return;

    // Check against keyword lists (a link can match multiple categories)
    if (matchesKeywords(text, href, customerKeywords)) {
      discovered.customerPages.push({ url: resolvedUrl, text, source: 'navbar' });
    }

    if (matchesKeywords(text, href, partnerKeywords)) {
      discovered.partnerPages.push({ url: resolvedUrl, text, source: 'navbar' });
    }

    if (matchesKeywords(text, href, aboutKeywords)) {
      discovered.aboutPages.push({ url: resolvedUrl, text, source: 'navbar' });
    }

    if (matchesKeywords(text, href, resourceKeywords)) {
      discovered.resourcePages.push({ url: resolvedUrl, text, source: 'navbar' });
    }

    // NEW: Solutions by role
    if (matchesKeywords(text, href, roleKeywords)) {
      discovered.solutionsByRole.push({ url: resolvedUrl, text, source: 'navbar' });
    }

    // NEW: Solutions by industry
    if (matchesKeywords(text, href, industryKeywords)) {
      discovered.solutionsByIndustry.push({ url: resolvedUrl, text, source: 'navbar' });
    }

    // NEW: Use case pages
    if (matchesKeywords(text, href, useCaseKeywords)) {
      discovered.useCasePages.push({ url: resolvedUrl, text, source: 'navbar' });
    }

    // NEW: Product pages
    if (matchesKeywords(text, href, productKeywords)) {
      discovered.productPages.push({ url: resolvedUrl, text, source: 'navbar' });
    }
  });

  // Deduplicate by URL
  const dedupe = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  };

  discovered.customerPages = dedupe(discovered.customerPages);
  discovered.partnerPages = dedupe(discovered.partnerPages);
  discovered.aboutPages = dedupe(discovered.aboutPages);
  discovered.resourcePages = dedupe(discovered.resourcePages);
  discovered.solutionsByRole = dedupe(discovered.solutionsByRole);
  discovered.solutionsByIndustry = dedupe(discovered.solutionsByIndustry);
  discovered.useCasePages = dedupe(discovered.useCasePages);
  discovered.productPages = dedupe(discovered.productPages);

  console.log('Navbar detection results:', {
    customerPages: discovered.customerPages.length,
    partnerPages: discovered.partnerPages.length,
    aboutPages: discovered.aboutPages.length,
    resourcePages: discovered.resourcePages.length,
    solutionsByRole: discovered.solutionsByRole.length,
    solutionsByIndustry: discovered.solutionsByIndustry.length,
    useCasePages: discovered.useCasePages.length,
    productPages: discovered.productPages.length
  });

  return discovered;
}

/**
 * Get fallback URLs when navbar detection doesn't find anything
 */
function getFallbackUrls(baseUrl, category) {
  const fallbacks = {
    customer: [
      `${baseUrl}/customers`,
      `${baseUrl}/clients`,
      `${baseUrl}/case-studies`,
      `${baseUrl}/success-stories`,
      `${baseUrl}/testimonials`,
      `${baseUrl}/portfolio`,
      `${baseUrl}/work`
    ],
    partner: [
      `${baseUrl}/partners`,
      `${baseUrl}/integrations`,
      `${baseUrl}/technology`,
      `${baseUrl}/ecosystem`,
      `${baseUrl}/marketplace`,
      `${baseUrl}/apps`,
      `${baseUrl}/solutions`
    ],
    about: [
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/company`,
      `${baseUrl}/team`
    ]
  };

  return (fallbacks[category] || []).map(url => ({ url, text: '', source: 'fallback' }));
}

// ============================================
// PARTNER LANGUAGE EXTRACTION
// ============================================

/**
 * Extracts the partner's exact language from their website.
 * This is CRITICAL for telling our unified story in THEIR voice.
 *
 * We look for:
 * - Taglines and hero statements (H1s, hero sections)
 * - Pain point language ("Stop losing...", "Tired of...", "Never miss...")
 * - Outcome language ("Increase X", "Reduce Y", "Achieve Z")
 * - Action verbs they use ("Analyze", "Automate", "Accelerate")
 * - Customer quotes and testimonials
 * - Repeated key phrases
 */
function extractPartnerLanguage(html, profile) {
  if (!html) return;

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Clean text helper
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  };

  // 1. EXTRACT TAGLINE - Usually the first/main H1
  const h1Elements = doc.querySelectorAll('h1');
  if (h1Elements.length > 0) {
    const mainH1 = cleanText(h1Elements[0].textContent);
    if (mainH1 && mainH1.length > 5 && mainH1.length < 150) {
      profile.language.tagline = mainH1;
    }
  }

  // 2. EXTRACT HERO STATEMENTS - Big text in hero sections
  const heroSelectors = [
    '.hero h1', '.hero h2', '.hero p',
    '[class*="hero"] h1', '[class*="hero"] h2', '[class*="hero"] p',
    'header h1', 'header h2',
    '.banner h1', '.banner h2',
    '[class*="banner"] h1', '[class*="banner"] h2',
    '.headline', '[class*="headline"]',
    '.tagline', '[class*="tagline"]',
    '.subheadline', '[class*="subhead"]',
    'h1', 'h2' // Fallback to all H1s and H2s
  ];

  const seenStatements = new Set();
  heroSelectors.forEach(selector => {
    try {
      doc.querySelectorAll(selector).forEach(el => {
        const text = cleanText(el.textContent);
        // Good hero statements are punchy (10-150 chars) and unique
        if (text && text.length >= 10 && text.length <= 150 && !seenStatements.has(text.toLowerCase())) {
          seenStatements.add(text.toLowerCase());
          // Skip navigation/menu text
          const lowerText = text.toLowerCase();
          if (!lowerText.includes('menu') && !lowerText.includes('navigation') &&
              !lowerText.includes('cookie') && !lowerText.includes('privacy')) {
            profile.language.heroStatements.push(text);
          }
        }
      });
    } catch (e) {}
  });

  // Limit to top 10 most prominent
  profile.language.heroStatements = profile.language.heroStatements.slice(0, 10);

  // 3. EXTRACT PAIN POINTS - Language about problems they solve
  const painPointPatterns = [
    /stop\s+(losing|wasting|missing|struggling|worrying)/gi,
    /tired\s+of\s+\w+/gi,
    /never\s+(miss|lose|waste|worry)/gi,
    /don['']t\s+(lose|miss|waste)/gi,
    /eliminate\s+\w+/gi,
    /end\s+(the\s+)?\w+/gi,
    /no\s+more\s+\w+/gi,
    /say\s+goodbye\s+to/gi,
    /finally\s+\w+/gi,
    /struggling\s+(with|to)/gi,
    /challenges?\s+(with|of)/gi,
    /problem\s+(with|of)/gi,
    /pain\s+of/gi,
    /frustrated\s+(by|with)/gi,
    /losing\s+\w+/gi,
    /wasting\s+\w+/gi,
    /missing\s+\w+/gi
  ];

  const bodyText = cleanText(doc.body?.textContent || '');
  const sentences = bodyText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

  const seenPainPoints = new Set();
  painPointPatterns.forEach(pattern => {
    sentences.forEach(sentence => {
      if (pattern.test(sentence) && sentence.length < 200 && !seenPainPoints.has(sentence.toLowerCase())) {
        seenPainPoints.add(sentence.toLowerCase());
        profile.language.painPoints.push(sentence);
      }
    });
  });

  // Also look for common pain point sections
  const painSectionKeywords = ['challenges', 'problems', 'pain points', 'without', 'before'];
  doc.querySelectorAll('h2, h3, h4').forEach(heading => {
    const headingText = cleanText(heading.textContent).toLowerCase();
    if (painSectionKeywords.some(kw => headingText.includes(kw))) {
      const nextEl = heading.nextElementSibling;
      if (nextEl) {
        const text = cleanText(nextEl.textContent);
        if (text.length > 20 && text.length < 300 && !seenPainPoints.has(text.toLowerCase())) {
          seenPainPoints.add(text.toLowerCase());
          profile.language.painPoints.push(text);
        }
      }
    }
  });

  profile.language.painPoints = profile.language.painPoints.slice(0, 8);

  // 4. EXTRACT OUTCOME LANGUAGE - Benefits and results
  const outcomePatterns = [
    /increase\s+\w+/gi,
    /improve\s+\w+/gi,
    /boost\s+\w+/gi,
    /grow\s+\w+/gi,
    /accelerate\s+\w+/gi,
    /reduce\s+\w+/gi,
    /decrease\s+\w+/gi,
    /cut\s+\w+/gi,
    /save\s+\w+/gi,
    /achieve\s+\w+/gi,
    /unlock\s+\w+/gi,
    /maximize\s+\w+/gi,
    /optimize\s+\w+/gi,
    /drive\s+\w+/gi,
    /deliver\s+\w+/gi,
    /\d+%\s+(more|less|faster|better|increase|decrease)/gi,
    /\d+x\s+(more|faster|better)/gi,
    /(more|better|faster|higher|lower)\s+\w+/gi
  ];

  const seenOutcomes = new Set();
  outcomePatterns.forEach(pattern => {
    sentences.forEach(sentence => {
      if (pattern.test(sentence) && sentence.length < 200 && !seenOutcomes.has(sentence.toLowerCase())) {
        seenOutcomes.add(sentence.toLowerCase());
        profile.language.outcomes.push(sentence);
      }
    });
  });

  // Look for "benefits" or "results" sections
  const benefitKeywords = ['benefits', 'results', 'outcomes', 'impact', 'value', 'why'];
  doc.querySelectorAll('h2, h3, h4').forEach(heading => {
    const headingText = cleanText(heading.textContent).toLowerCase();
    if (benefitKeywords.some(kw => headingText.includes(kw))) {
      // Get list items or paragraphs after this heading
      let sibling = heading.nextElementSibling;
      let count = 0;
      while (sibling && count < 5) {
        const text = cleanText(sibling.textContent);
        if (text.length > 15 && text.length < 200 && !seenOutcomes.has(text.toLowerCase())) {
          seenOutcomes.add(text.toLowerCase());
          profile.language.outcomes.push(text);
        }
        sibling = sibling.nextElementSibling;
        count++;
      }
    }
  });

  profile.language.outcomes = profile.language.outcomes.slice(0, 10);

  // 5. EXTRACT ACTION VERBS - Their key verbs
  const actionVerbsToFind = [
    'accelerate', 'achieve', 'activate', 'amplify', 'analyze', 'automate',
    'boost', 'build', 'capture', 'centralize', 'close', 'connect', 'convert',
    'create', 'deliver', 'discover', 'drive', 'empower', 'enable', 'engage',
    'enhance', 'execute', 'forecast', 'generate', 'grow', 'identify', 'improve',
    'increase', 'integrate', 'leverage', 'maximize', 'measure', 'monitor',
    'optimize', 'orchestrate', 'personalize', 'predict', 'prioritize', 'qualify',
    'reach', 'scale', 'score', 'segment', 'simplify', 'streamline', 'surface',
    'target', 'track', 'transform', 'unify', 'unlock', 'win'
  ];

  const bodyTextLower = bodyText.toLowerCase();
  const foundVerbs = actionVerbsToFind.filter(verb => {
    // Count occurrences - they use it multiple times = important to their messaging
    const regex = new RegExp(`\\b${verb}`, 'gi');
    const matches = bodyTextLower.match(regex);
    return matches && matches.length >= 2; // Used at least twice
  });

  profile.language.actionVerbs = foundVerbs.slice(0, 10);

  // 6. EXTRACT CUSTOMER QUOTES - Testimonials
  const quoteSelectors = [
    'blockquote', '[class*="testimonial"]', '[class*="quote"]',
    '[class*="review"]', '.customer-quote', '.client-quote',
    '[class*="case-study"] p', '[class*="success-story"] p'
  ];

  const seenQuotes = new Set();
  quoteSelectors.forEach(selector => {
    try {
      doc.querySelectorAll(selector).forEach(el => {
        let text = cleanText(el.textContent);
        // Good quotes are medium length and often start with quotes
        if (text && text.length >= 30 && text.length <= 500) {
          // Clean up attribution if present
          text = text.replace(/[-–—]\s*[A-Z][a-z]+.*$/, '').trim();
          if (!seenQuotes.has(text.toLowerCase())) {
            seenQuotes.add(text.toLowerCase());
            profile.language.customerQuotes.push(text);
          }
        }
      });
    } catch (e) {}
  });

  profile.language.customerQuotes = profile.language.customerQuotes.slice(0, 5);

  // 7. EXTRACT KEY PHRASES - Repeated distinctive phrases
  // Find 3-5 word phrases that appear multiple times
  const words = bodyText.split(/\s+/).filter(w => w.length > 2);
  const phrases = {};

  for (let i = 0; i < words.length - 3; i++) {
    const phrase = words.slice(i, i + 3).join(' ').toLowerCase();
    // Skip common/generic phrases
    if (phrase.includes('cookie') || phrase.includes('privacy') ||
        phrase.includes('terms') || phrase.includes('click here') ||
        phrase.includes('learn more') || phrase.includes('read more')) {
      continue;
    }
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }

  // Get phrases that appear 3+ times (indicates key messaging)
  const keyPhrases = Object.entries(phrases)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase, _]) => phrase);

  profile.language.keyPhrases = keyPhrases;

  console.log('Extracted partner language:', {
    tagline: profile.language.tagline,
    heroCount: profile.language.heroStatements.length,
    painPointCount: profile.language.painPoints.length,
    outcomeCount: profile.language.outcomes.length,
    verbCount: profile.language.actionVerbs.length,
    quoteCount: profile.language.customerQuotes.length,
    phraseCount: profile.language.keyPhrases.length
  });
}

// ============================================
// PARTNERSHIP PROFILE SCRAPING ("BETTER TOGETHER")
// ============================================

/**
 * Scrapes solutions/role/industry/use case pages to build a partnership profile.
 * This data helps us understand:
 * - WHO they sell to (roles, industries)
 * - WHAT problems they solve (use cases)
 * - HOW they talk about it (their language)
 * - WHERE SalesAI would complement them
 *
 * CRITICAL: We capture their EXACT LANGUAGE so we can tell our story in their voice.
 */
async function scrapePartnershipProfile(website, navbarLinks = null) {
  const domain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const baseUrl = `https://${domain}`;

  console.log('Scraping partnership profile for:', baseUrl);

  // Store the homepage HTML for language extraction
  let homepageHtml = null;

  // If navbarLinks not provided, fetch homepage and detect them
  if (!navbarLinks) {
    try {
      // Use smart fetch with JS rendering fallback for better navbar detection
      const homeResult = await smartFetchWebpage(baseUrl);
      if (homeResult.success) {
        console.log(`Homepage fetched via ${homeResult.source} for navbar detection`);
        homepageHtml = homeResult.html;
        navbarLinks = detectNavbarLinks(homeResult.html, baseUrl);
      } else {
        navbarLinks = { solutionsByRole: [], solutionsByIndustry: [], useCasePages: [], productPages: [] };
      }
    } catch (e) {
      console.log('Failed to fetch homepage for navbar detection:', e);
      navbarLinks = { solutionsByRole: [], solutionsByIndustry: [], useCasePages: [], productPages: [] };
    }
  }

  const profile = {
    // WHO they serve
    targetRoles: [],        // e.g., ["Sales Leaders", "RevOps", "SDRs"]
    targetIndustries: [],   // e.g., ["SaaS", "Financial Services", "Healthcare"]

    // WHAT they do
    useCases: [],           // e.g., ["Lead Generation", "Pipeline Management"]
    productCapabilities: [],// What their product does

    // THEIR LANGUAGE - this is critical for storytelling
    language: {
      tagline: null,        // Their main headline/tagline
      heroStatements: [],   // Big bold statements from hero sections
      painPoints: [],       // Problems they say they solve ("Stop losing...", "Tired of...")
      outcomes: [],         // Benefits/results ("Increase X", "Reduce Y", "Achieve Z")
      actionVerbs: [],      // Their key verbs ("Analyze", "Automate", "Accelerate")
      customerQuotes: [],   // Testimonial snippets if found
      keyPhrases: []        // Distinctive phrases they use repeatedly
    },

    // HOW they sell
    gtmMotion: null,        // "plg", "sales-led", "hybrid"
    companySize: null,      // "smb", "mid-market", "enterprise", "all"

    // Metadata
    valueProps: [],         // Legacy - key value propositions extracted
    pagesScraped: []
  };

  // Extract language from homepage if we have it
  if (homepageHtml) {
    extractPartnerLanguage(homepageHtml, profile);
  }

  // Known role mappings for normalization
  const roleNormalizations = {
    // Sales roles
    'sales': 'Sales Teams',
    'sales teams': 'Sales Teams',
    'for sales': 'Sales Teams',
    'sales team': 'Sales Teams',
    // Sales leadership
    'sales leaders': 'Sales Leaders',
    'sales leader': 'Sales Leaders',
    'vp sales': 'Sales Leaders',
    'vp of sales': 'Sales Leaders',
    'head of sales': 'Sales Leaders',
    'director of sales': 'Sales Leaders',
    'sales director': 'Sales Leaders',
    'revenue leadership': 'Sales Leaders',
    'leadership': 'Sales Leaders',
    // SDRs/BDRs
    'sdrs': 'SDRs/BDRs',
    'bdrs': 'SDRs/BDRs',
    'sdr': 'SDRs/BDRs',
    'bdr': 'SDRs/BDRs',
    'for sdrs': 'SDRs/BDRs',
    'for bdrs': 'SDRs/BDRs',
    // Account Executives
    'account executives': 'Account Executives',
    'aes': 'Account Executives',
    'ae': 'Account Executives',
    'for aes': 'Account Executives',
    // Marketing
    'marketing': 'Marketing Teams',
    'marketing teams': 'Marketing Teams',
    'for marketing': 'Marketing Teams',
    'marketing team': 'Marketing Teams',
    'demand gen': 'Demand Gen',
    'demand generation': 'Demand Gen',
    // Revenue Operations
    'revops': 'Revenue Operations',
    'revenue operations': 'Revenue Operations',
    'rev ops': 'Revenue Operations',
    'for revops': 'Revenue Operations',
    'revenue ops': 'Revenue Operations',
    // Customer Success
    'customer success': 'Customer Success',
    'cs': 'Customer Success',
    'for customer success': 'Customer Success',
    // Executives
    'executives': 'Executives',
    'cro': 'Executives',
    'cmo': 'Executives',
    'ceo': 'Founders/CEOs',
    'founders': 'Founders/CEOs',
    'for executives': 'Executives',
    // GTM roles
    'gtm': 'GTM Teams',
    'go-to-market': 'GTM Teams',
    'gtm teams': 'GTM Teams',
    'growth': 'Growth Teams',
    'growth teams': 'Growth Teams',
    // Partners/Agencies
    'agencies': 'Agencies',
    'agency': 'Agencies',
    'consultants': 'Consultants',
    'consulting': 'Consultants',
    'for partners': 'Partners',
    'partners': 'Partners'
  };

  // Known industry normalizations
  const industryNormalizations = {
    // Technology/SaaS
    'saas': 'SaaS/Software',
    'software': 'SaaS/Software',
    'technology': 'SaaS/Software',
    'tech': 'SaaS/Software',
    'high-tech': 'SaaS/Software',
    'b2b saas': 'SaaS/Software',
    'b2b tech': 'SaaS/Software',
    'enterprise software': 'SaaS/Software',
    // Financial Services
    'fintech': 'Financial Services',
    'financial services': 'Financial Services',
    'banking': 'Financial Services',
    'insurance': 'Financial Services',
    'financial': 'Financial Services',
    // Healthcare
    'healthcare': 'Healthcare',
    'health': 'Healthcare',
    'life sciences': 'Healthcare/Life Sciences',
    'pharma': 'Healthcare/Life Sciences',
    'biotech': 'Healthcare/Life Sciences',
    'medical': 'Healthcare',
    // Manufacturing
    'manufacturing': 'Manufacturing',
    'industrial': 'Manufacturing',
    // Retail/E-commerce
    'retail': 'Retail/E-commerce',
    'ecommerce': 'Retail/E-commerce',
    'e-commerce': 'Retail/E-commerce',
    'consumer': 'Retail/E-commerce',
    // Professional Services
    'professional services': 'Professional Services',
    'consulting': 'Professional Services',
    'legal': 'Professional Services',
    'accounting': 'Professional Services',
    // Other industries
    'real estate': 'Real Estate',
    'realestate': 'Real Estate',
    'education': 'Education',
    'edtech': 'Education',
    'higher education': 'Education',
    'government': 'Government',
    'public sector': 'Government',
    'nonprofit': 'Nonprofit',
    'non-profit': 'Nonprofit',
    'media': 'Media/Entertainment',
    'entertainment': 'Media/Entertainment',
    'telecommunications': 'Telecommunications',
    'telecom': 'Telecommunications',
    'energy': 'Energy/Utilities',
    'utilities': 'Energy/Utilities',
    'logistics': 'Logistics/Transportation',
    'transportation': 'Logistics/Transportation',
    'hospitality': 'Hospitality/Travel',
    'travel': 'Hospitality/Travel',
    'construction': 'Construction',
    'automotive': 'Automotive'
  };

  // Use case normalizations
  const useCaseNormalizations = {
    // Lead/Pipeline Generation
    'lead generation': 'Lead Generation',
    'lead gen': 'Lead Generation',
    'demand generation': 'Demand Generation',
    'demand gen': 'Demand Generation',
    'pipeline': 'Pipeline Generation',
    'pipeline generation': 'Pipeline Generation',
    'build pipeline': 'Pipeline Generation',
    'pipeline management': 'Pipeline Management',
    'prospecting': 'Prospecting',
    // Outbound/Inbound
    'outbound': 'Outbound Sales',
    'cold calling': 'Outbound Sales',
    'cold email': 'Outbound Sales',
    'outreach': 'Outbound Sales',
    'inbound': 'Inbound Sales',
    'inbound marketing': 'Inbound Sales',
    // Engagement/Automation
    'sales engagement': 'Sales Engagement',
    'sales automation': 'Sales Automation',
    'sales enablement': 'Sales Enablement',
    'cadence': 'Sales Engagement',
    'sequences': 'Sales Engagement',
    // Revenue Intelligence (from Gong)
    'forecasting': 'Forecasting',
    'sales forecasting': 'Forecasting',
    'revenue forecasting': 'Forecasting',
    'forecast': 'Forecasting',
    'revenue intelligence': 'Revenue Intelligence',
    'conversation intelligence': 'Conversation Intelligence',
    'call recording': 'Conversation Intelligence',
    'call analytics': 'Conversation Intelligence',
    'call coaching': 'Conversation Intelligence',
    'deal intelligence': 'Deal Intelligence',
    'sales intelligence': 'Sales Intelligence',
    // Meeting/Scheduling
    'meeting booking': 'Meeting Booking',
    'scheduling': 'Meeting Booking',
    'calendar': 'Meeting Booking',
    // Sales Process
    'qualification': 'Lead Qualification',
    'discovery': 'Discovery Calls',
    'demos': 'Demo Automation',
    'demo': 'Demo Automation',
    'proposals': 'Proposals/Quotes',
    'quotes': 'Proposals/Quotes',
    'contracts': 'Contract Management',
    'closing': 'Deal Closing',
    'deals': 'Deal Management',
    'opportunity management': 'Deal Management',
    // Account Management
    'account management': 'Account Management',
    'customer retention': 'Customer Retention',
    'upsell': 'Upsell/Cross-sell',
    'cross-sell': 'Upsell/Cross-sell',
    'expansion': 'Upsell/Cross-sell'
  };

  // Helper to normalize and dedupe
  const normalizeAndAdd = (arr, value, normalizations) => {
    if (!value) return;
    const lower = value.toLowerCase().trim();
    const normalized = normalizations[lower] || value;
    if (!arr.includes(normalized)) {
      arr.push(normalized);
    }
  };

  // Helper to extract content from a page
  const extractFromPage = (html, pageUrl, pageType) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    profile.pagesScraped.push({ url: pageUrl, type: pageType });

    // Get page title and main headings
    const title = doc.querySelector('title')?.textContent || '';
    const h1s = Array.from(doc.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean);
    const h2s = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(Boolean);

    // Look for role mentions in headings and content
    const allText = doc.body?.textContent?.toLowerCase() || '';

    // Extract roles from this page
    if (pageType === 'role' || pageType === 'solutions') {
      // Check headings for role patterns like "For Sales Teams"
      [...h1s, ...h2s, title].forEach(heading => {
        const lower = heading.toLowerCase();
        for (const [pattern, normalized] of Object.entries(roleNormalizations)) {
          if (lower.includes(pattern)) {
            normalizeAndAdd(profile.targetRoles, normalized, {});
          }
        }
      });
    }

    // Extract industries from this page
    if (pageType === 'industry' || pageType === 'solutions') {
      [...h1s, ...h2s, title].forEach(heading => {
        const lower = heading.toLowerCase();
        for (const [pattern, normalized] of Object.entries(industryNormalizations)) {
          if (lower.includes(pattern)) {
            normalizeAndAdd(profile.targetIndustries, normalized, {});
          }
        }
      });
    }

    // Extract use cases
    if (pageType === 'usecase' || pageType === 'solutions' || pageType === 'product') {
      [...h1s, ...h2s].forEach(heading => {
        const lower = heading.toLowerCase();
        for (const [pattern, normalized] of Object.entries(useCaseNormalizations)) {
          if (lower.includes(pattern)) {
            normalizeAndAdd(profile.useCases, normalized, {});
          }
        }
      });
    }

    // Extract value props from hero sections
    const heroSelectors = [
      '.hero h1', '.hero h2', '.hero p',
      '[class*="hero"] h1', '[class*="hero"] h2',
      '.banner h1', '.banner h2',
      'header h1', 'header h2',
      '.headline', '.tagline', '.subheadline'
    ];

    heroSelectors.forEach(selector => {
      try {
        doc.querySelectorAll(selector).forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 20 && text.length < 200) {
            if (!profile.valueProps.includes(text)) {
              profile.valueProps.push(text);
            }
          }
        });
      } catch (e) {}
    });

    // Detect GTM motion hints
    if (allText.includes('start free') || allText.includes('free trial') || allText.includes('sign up free') || allText.includes('no credit card')) {
      profile.gtmMotion = profile.gtmMotion || 'plg';
    }
    if (allText.includes('request demo') || allText.includes('book a demo') || allText.includes('talk to sales') || allText.includes('contact sales')) {
      profile.gtmMotion = profile.gtmMotion === 'plg' ? 'hybrid' : 'sales-led';
    }

    // Detect target company size
    if (allText.includes('enterprise') || allText.includes('fortune 500') || allText.includes('large organizations')) {
      profile.companySize = 'enterprise';
    } else if (allText.includes('mid-market') || allText.includes('growing companies') || allText.includes('scaling')) {
      profile.companySize = profile.companySize || 'mid-market';
    } else if (allText.includes('small business') || allText.includes('smb') || allText.includes('startups')) {
      profile.companySize = profile.companySize || 'smb';
    }
  };

  // Scrape role-based solution pages
  if (navbarLinks.solutionsByRole.length > 0) {
    console.log(`Scraping ${navbarLinks.solutionsByRole.length} role-based solution pages`);
    for (const { url, text } of navbarLinks.solutionsByRole.slice(0, 5)) {
      try {
        const result = await smartFetchWebpage(url);
        if (result.success) {
          extractFromPage(result.html, url, 'role');
          // Also add the nav text itself as a role hint
          normalizeAndAdd(profile.targetRoles, text, roleNormalizations);
          console.log(`✓ Role page scraped via ${result.source}: ${url}`);
        }
      } catch (e) {
        console.log(`Failed to scrape role page: ${url}`);
      }
    }
  }

  // Scrape industry-based solution pages
  if (navbarLinks.solutionsByIndustry.length > 0) {
    console.log(`Scraping ${navbarLinks.solutionsByIndustry.length} industry solution pages`);
    for (const { url, text } of navbarLinks.solutionsByIndustry.slice(0, 5)) {
      try {
        const result = await smartFetchWebpage(url);
        if (result.success) {
          extractFromPage(result.html, url, 'industry');
          // Also add the nav text itself as an industry hint
          normalizeAndAdd(profile.targetIndustries, text, industryNormalizations);
          console.log(`✓ Industry page scraped via ${result.source}: ${url}`);
        }
      } catch (e) {
        console.log(`Failed to scrape industry page: ${url}`);
      }
    }
  }

  // Scrape use case pages
  if (navbarLinks.useCasePages.length > 0) {
    console.log(`Scraping ${navbarLinks.useCasePages.length} use case pages`);
    for (const { url, text } of navbarLinks.useCasePages.slice(0, 5)) {
      try {
        const result = await smartFetchWebpage(url);
        if (result.success) {
          extractFromPage(result.html, url, 'usecase');
          // Also add the nav text itself as a use case hint
          normalizeAndAdd(profile.useCases, text, useCaseNormalizations);
          console.log(`✓ Use case page scraped via ${result.source}: ${url}`);
        }
      } catch (e) {
        console.log(`Failed to scrape use case page: ${url}`);
      }
    }
  }

  // Scrape product pages for capabilities
  if (navbarLinks.productPages.length > 0) {
    console.log(`Scraping ${navbarLinks.productPages.length} product pages`);
    for (const { url } of navbarLinks.productPages.slice(0, 3)) {
      try {
        const result = await smartFetchWebpage(url);
        if (result.success) {
          extractFromPage(result.html, url, 'product');
          console.log(`✓ Product page scraped via ${result.source}: ${url}`);
        }
      } catch (e) {
        console.log(`Failed to scrape product page: ${url}`);
      }
    }
  }

  // Limit arrays to reasonable sizes
  profile.targetRoles = profile.targetRoles.slice(0, 8);
  profile.targetIndustries = profile.targetIndustries.slice(0, 8);
  profile.useCases = profile.useCases.slice(0, 10);
  profile.valueProps = profile.valueProps.slice(0, 5);

  console.log('Partnership profile extracted:', profile);

  // Store in state for later use
  state.partnershipProfile = profile;

  return profile;
}

// ============================================
// SMART WEBSITE FETCHING (Static + JS Rendering Fallback)
// ============================================

/**
 * Fetches a webpage with intelligent fallback:
 * 1. Try static fetch via CORS proxy (fast, free, works for ~70% of sites)
 * 2. If that fails or returns minimal content, use ScrapingBee with JS rendering
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {boolean} options.requireJsRendering - Force ScrapingBee for known JS-heavy sites
 * @param {number} options.minContentLength - Minimum HTML length to consider successful (default 1000)
 * @returns {Promise<{html: string, source: string, success: boolean}>}
 */
async function smartFetchWebpage(url, options = {}) {
  const { requireJsRendering = false, minContentLength = 1000 } = options;

  console.log(`🌐 Fetching: ${url} (JS required: ${requireJsRendering})`);

  // Check if this domain is known to require JS rendering
  const jsHeavyDomains = [
    'outreach.io',
    'salesforce.com',
    'drift.com',
    'intercom.com',
    'zendesk.com',
    'hubspot.com', // Some pages need JS
    'marketo.com',
    'eloqua.com',
    'pardot.com',
    'react', // Generic React apps
    'angular', // Generic Angular apps
    'app.', // Most app.* subdomains are SPAs
  ];

  const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase();
  const needsJsRendering = requireJsRendering || jsHeavyDomains.some(d => domain.includes(d));

  // Strategy 1: Try static fetch first (unless we know it needs JS)
  if (!needsJsRendering) {
    try {
      const staticResult = await fetchStatic(url);

      // Check if we got meaningful content
      if (staticResult.success && staticResult.html.length >= minContentLength) {
        // Additional check: make sure it's not just a loading shell
        const hasRealContent = !isJsLoadingShell(staticResult.html);
        if (hasRealContent) {
          console.log(`✅ Static fetch successful for ${url} (${staticResult.html.length} chars)`);
          return { ...staticResult, source: 'static' };
        } else {
          console.log(`⚠️ Static fetch returned JS loading shell for ${url}`);
        }
      }
    } catch (e) {
      console.log(`⚠️ Static fetch failed for ${url}: ${e.message}`);
    }
  }

  // Strategy 2: Use ScrapingBee with JS rendering
  if (SCRAPINGBEE_CONFIG.enabled && SCRAPINGBEE_CONFIG.apiKey !== 'YOUR_SCRAPINGBEE_API_KEY') {
    try {
      const jsResult = await fetchWithScrapingBee(url);
      if (jsResult.success) {
        console.log(`✅ ScrapingBee fetch successful for ${url} (${jsResult.html.length} chars)`);
        return { ...jsResult, source: 'scrapingbee' };
      }
    } catch (e) {
      console.log(`❌ ScrapingBee fetch failed for ${url}: ${e.message}`);
    }
  } else if (needsJsRendering) {
    console.log(`⚠️ ScrapingBee not configured but ${domain} likely needs JS rendering`);
  }

  // Strategy 3: Last resort - try static again even for JS sites (might get some content)
  if (needsJsRendering) {
    try {
      const staticResult = await fetchStatic(url);
      if (staticResult.success && staticResult.html.length > 500) {
        console.log(`📄 Fallback static fetch for JS site ${url} (${staticResult.html.length} chars)`);
        return { ...staticResult, source: 'static-fallback' };
      }
    } catch (e) {
      console.log(`❌ All fetch methods failed for ${url}`);
    }
  }

  return { html: '', source: 'none', success: false };
}

/**
 * Static fetch via CORS proxy - fast and free
 */
async function fetchStatic(url) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  const response = await fetch(proxyUrl, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  return { html, success: true };
}

/**
 * Fetch with ScrapingBee - handles JavaScript rendering
 * Documentation: https://www.scrapingbee.com/documentation/
 */
async function fetchWithScrapingBee(url) {
  const params = new URLSearchParams({
    api_key: SCRAPINGBEE_CONFIG.apiKey,
    url: url,
    render_js: 'true',           // Enable JavaScript rendering
    wait: '2000',                // Wait 2s for JS to execute
    wait_for: 'body',            // Wait for body element to be present
    block_ads: 'true',           // Block ads for faster loading
    block_resources: 'false',    // Keep resources to ensure proper rendering
    premium_proxy: 'false',      // Use standard proxies (set true for geo-restricted sites)
    return_page_source: 'true',  // Return rendered HTML, not screenshot
  });

  const response = await fetch(`${SCRAPINGBEE_CONFIG.baseUrl}?${params}`, {
    method: 'GET',
    headers: {
      'Accept': 'text/html',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ScrapingBee error: ${response.status} - ${errorText}`);
  }

  const html = await response.text();
  return { html, success: true };
}

/**
 * Detect if HTML is just a JavaScript loading shell (SPA skeleton)
 * These sites need JS rendering to get actual content
 */
function isJsLoadingShell(html) {
  const lowerHtml = html.toLowerCase();

  // Common SPA indicators
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
    '<noscript>',
  ];

  // Check for SPA loading patterns
  const hasSpaIndicator = spaIndicators.some(indicator => lowerHtml.includes(indicator.toLowerCase()));

  // Check if body is suspiciously empty (typical of React/Vue apps before hydration)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    // Remove scripts and styles from body content
    const bodyContent = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If body has less than 200 chars of actual content, likely a loading shell
    if (bodyContent.length < 200) {
      return true;
    }
  }

  return hasSpaIndicator;
}

/**
 * Check multiple pages and return results with source tracking
 * @param {Array<{url: string, text: string}>} pages - Pages to fetch
 * @returns {Promise<Array<{url: string, text: string, html: string, source: string}>>}
 */
async function smartFetchMultiplePages(pages, options = {}) {
  const results = [];
  const { maxConcurrent = 3 } = options;

  // Process in batches to avoid overwhelming proxies
  for (let i = 0; i < pages.length; i += maxConcurrent) {
    const batch = pages.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(async (page) => {
        const result = await smartFetchWebpage(page.url);
        return {
          url: page.url,
          text: page.text,
          html: result.html,
          source: result.source,
          success: result.success,
        };
      })
    );

    results.push(...batchResults);
  }

  return results;
}

// ============================================
// DEEP PARTNERSHIP PROFILE SCRAPING
// Uses navigation as a roadmap to scrape the most valuable pages
// ============================================

async function scrapePartnershipProfileDeep(website) {
  const domain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const baseUrl = `https://${domain}`;

  console.log('Deep scraping partnership profile for:', baseUrl);

  const profile = {
    targetRoles: [],
    targetIndustries: [],
    useCases: [],
    productCapabilities: [],
    services: [],           // NEW: Actual services they offer
    customers: [],          // NEW: Real customer names from case studies
    certifications: [],     // NEW: Partner certifications
    language: {
      tagline: null,
      heroStatements: [],
      painPoints: [],
      outcomes: [],
      actionVerbs: [],
      customerQuotes: [],
      keyPhrases: []
    },
    gtmMotion: null,
    companySize: null,
    valueProps: [],
    pagesScraped: []
  };

  try {
    // Step 1: Fetch homepage and detect navigation structure
    if (currentActionList) {
      currentActionList.addSubAction('nav-scan', 'Fetching homepage...');
    }

    const homeResult = await smartFetchWebpage(baseUrl);
    if (!homeResult.success) {
      console.log('Could not fetch homepage for deep scraping');
      return profile;
    }

    profile.pagesScraped.push(baseUrl);

    // Extract language from homepage
    extractPartnerLanguage(homeResult.html, profile);

    // Step 2: Detect navigation links - this is our scraping roadmap
    const navLinks = detectNavbarLinks(homeResult.html, baseUrl);

    if (currentActionList) {
      const totalPages = (navLinks.customerPages?.length || 0) +
                        (navLinks.solutionsByIndustry?.length || 0) +
                        (navLinks.useCasePages?.length || 0);
      currentActionList.addSubAction('nav-scan', `Found ${totalPages} priority pages to analyze`);
    }

    // Step 3: Deep scrape CASE STUDIES for real customer names
    const caseStudyPages = navLinks.customerPages || [];
    if (caseStudyPages.length > 0 && currentActionList) {
      currentActionList.addSubAction('nav-scan', `Scraping ${Math.min(caseStudyPages.length, 3)} case study pages...`);
    }

    for (const page of caseStudyPages.slice(0, 3)) {
      try {
        const pageResult = await smartFetchWebpage(page.url);
        if (pageResult.success) {
          profile.pagesScraped.push(page.url);
          extractCustomersFromCaseStudies(pageResult.html, profile);
        }
      } catch (e) {
        console.log('Failed to scrape case study page:', page.url);
      }
    }

    // Step 4: Deep scrape INDUSTRY pages for expertise
    const industryPages = navLinks.solutionsByIndustry || [];
    if (industryPages.length > 0 && currentActionList) {
      currentActionList.addSubAction('nav-scan', `Analyzing ${industryPages.length} industry pages...`);
    }

    for (const page of industryPages.slice(0, 5)) {
      // Extract industry from nav link text directly
      const industryName = normalizeIndustry(page.text);
      if (industryName && !profile.targetIndustries.includes(industryName)) {
        profile.targetIndustries.push(industryName);
      }
    }

    // Step 5: Deep scrape SERVICES/SOLUTIONS pages
    const servicePages = [...(navLinks.useCasePages || []), ...(navLinks.productPages || [])];
    if (servicePages.length > 0 && currentActionList) {
      currentActionList.addSubAction('nav-scan', `Extracting ${servicePages.length} service offerings...`);
    }

    for (const page of servicePages.slice(0, 5)) {
      const serviceName = normalizeService(page.text);
      if (serviceName && !profile.services.includes(serviceName)) {
        profile.services.push(serviceName);
      }
    }

    // Step 6: Extract target roles from role-based solution pages
    const rolePages = navLinks.solutionsByRole || [];
    for (const page of rolePages) {
      const roleName = normalizeRole(page.text);
      if (roleName && !profile.targetRoles.includes(roleName)) {
        profile.targetRoles.push(roleName);
      }
    }

    console.log('Deep scraping complete:', {
      industries: profile.targetIndustries,
      services: profile.services,
      roles: profile.targetRoles,
      customers: profile.customers,
      pagesScraped: profile.pagesScraped.length
    });

    return profile;

  } catch (error) {
    console.error('Deep scraping failed:', error);
    // Fall back to basic scraping
    return await scrapePartnershipProfile(website);
  }
}

// Helper: Extract customers from case study pages
function extractCustomersFromCaseStudies(html, profile) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Look for customer names in case study titles, headings, logos
  const selectors = [
    '.case-study-title', '.case-study h2', '.case-study h3',
    '.client-name', '.customer-name', '.company-name',
    '[class*="case-study"] h2', '[class*="case-study"] h3',
    '.portfolio-item h2', '.portfolio-item h3',
    '.work-item h2', '.work-item h3'
  ];

  selectors.forEach(selector => {
    try {
      doc.querySelectorAll(selector).forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 2 && text.length < 100) {
          // Filter out generic text
          const genericTerms = ['case study', 'case studies', 'read more', 'learn more', 'view all', 'see all'];
          if (!genericTerms.some(term => text.toLowerCase().includes(term))) {
            if (!profile.customers.includes(text)) {
              profile.customers.push(text);
            }
          }
        }
      });
    } catch (e) {}
  });

  // Also look for customer logos with alt text
  doc.querySelectorAll('img[alt]').forEach(img => {
    const alt = img.alt?.trim();
    if (alt && alt.length > 2 && alt.length < 50) {
      const skipTerms = ['logo', 'icon', 'badge', 'award', 'partner', 'certified'];
      const hasSkipTerm = skipTerms.some(term => alt.toLowerCase().includes(term));
      // Only include if it looks like a company name
      if (!hasSkipTerm && /^[A-Z]/.test(alt)) {
        if (!profile.customers.includes(alt)) {
          profile.customers.push(alt);
        }
      }
    }
  });
}

// Helper: Normalize industry names
function normalizeIndustry(text) {
  const industryMap = {
    'healthcare': 'Healthcare',
    'health care': 'Healthcare',
    'senior living': 'Senior Living',
    'manufacturing': 'Manufacturing',
    'saas': 'SaaS',
    'software': 'SaaS',
    'technology': 'Technology',
    'tech': 'Technology',
    'finance': 'Financial Services',
    'financial': 'Financial Services',
    'financial services': 'Financial Services',
    'fintech': 'FinTech',
    'franchise': 'Franchise',
    'education': 'Education',
    'edtech': 'EdTech',
    'ecommerce': 'E-commerce',
    'e-commerce': 'E-commerce',
    'retail': 'Retail',
    'real estate': 'Real Estate',
    'professional services': 'Professional Services',
    'legal': 'Legal',
    'insurance': 'Insurance',
    'media': 'Media & Entertainment',
    'entertainment': 'Media & Entertainment'
  };

  const normalized = text?.toLowerCase().trim();
  return industryMap[normalized] || (normalized && normalized.length > 2 && normalized.length < 30 ?
    text.charAt(0).toUpperCase() + text.slice(1) : null);
}

// Helper: Normalize service names
function normalizeService(text) {
  const serviceMap = {
    'demand generation': 'Demand Generation',
    'demand gen': 'Demand Generation',
    'sales enablement': 'Sales Enablement',
    'revenue operations': 'Revenue Operations',
    'revops': 'Revenue Operations',
    'customer success': 'Customer Success',
    'paid media': 'Paid Media',
    'seo': 'SEO',
    'content marketing': 'Content Marketing',
    'web development': 'Web Development',
    'website development': 'Web Development',
    'pr': 'Public Relations',
    'public relations': 'Public Relations',
    'hubspot': 'HubSpot Services',
    'hubspot onboarding': 'HubSpot Onboarding',
    'crm': 'CRM Implementation',
    'integrations': 'Integrations',
    'migrations': 'Data Migration',
    'training': 'Training & Enablement'
  };

  const normalized = text?.toLowerCase().trim();
  return serviceMap[normalized] || (normalized && normalized.length > 2 && normalized.length < 40 ?
    text.charAt(0).toUpperCase() + text.slice(1) : null);
}

// Helper: Normalize role names
function normalizeRole(text) {
  const roleMap = {
    'sales': 'Sales Teams',
    'for sales': 'Sales Teams',
    'marketing': 'Marketing Teams',
    'for marketing': 'Marketing Teams',
    'customer success': 'Customer Success',
    'revops': 'Revenue Operations',
    'revenue operations': 'Revenue Operations',
    'executives': 'Executives',
    'leadership': 'Leadership',
    'founders': 'Founders/CEOs',
    'agencies': 'Agencies',
    'consultants': 'Consultants'
  };

  const normalized = text?.toLowerCase().trim();
  return roleMap[normalized] || null;
}

// ============================================
// CUSTOMER LOGO SCRAPING & ENRICHMENT
// ============================================

async function scrapeCustomerLogos(website) {
  const domain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const baseUrl = `https://${domain}`;

  console.log('Starting customer logo scraping for:', baseUrl);

  try {
    // Use smart fetch with JS rendering fallback
    const homeResult = await smartFetchWebpage(baseUrl);

    if (!homeResult.success) {
      console.log('Could not fetch website, trying Claude analysis...');
      return await analyzeWebsiteWithClaude(domain);
    }

    const html = homeResult.html;
    console.log(`Homepage fetched via ${homeResult.source} (${html.length} chars)`);

    // Use navbar detection to find actual customer page URLs
    const navbarLinks = detectNavbarLinks(html, baseUrl);
    console.log('Navbar detected customer pages:', navbarLinks.customerPages);

    // Extract potential customer company names from the homepage HTML first
    const customers = extractCustomerNames(html, domain);

    if (customers.length === 0) {
      // Get URLs to try: navbar-detected first, then fallbacks
      const customerPageUrls = navbarLinks.customerPages.length > 0
        ? navbarLinks.customerPages
        : getFallbackUrls(baseUrl, 'customer');

      console.log(`Trying ${customerPageUrls.length} customer pages (source: ${customerPageUrls[0]?.source || 'none'})`);

      for (const { url, source } of customerPageUrls) {
        try {
          console.log(`Fetching customer page: ${url} (${source})`);
          // Use smart fetch for customer pages too
          const pageResult = await smartFetchWebpage(url);
          if (pageResult.success) {
            const pageCustomers = extractCustomerNames(pageResult.html, domain);
            console.log(`Found ${pageCustomers.length} customers on ${url} (via ${pageResult.source})`);
            customers.push(...pageCustomers);
            if (customers.length >= 5) break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // If still no customers found, use Claude to analyze
    if (customers.length === 0) {
      return await analyzeWebsiteWithClaude(domain);
    }

    // Deduplicate and limit
    const uniqueCustomers = [...new Set(customers)].slice(0, 10);
    console.log('Discovered customers:', uniqueCustomers);

    state.customerCompanies = uniqueCustomers;
    return uniqueCustomers;

  } catch (error) {
    console.error('Customer scraping failed:', error);
    return await analyzeWebsiteWithClaude(domain);
  }
}

function extractCustomerNames(html, partnerDomain) {
  const customerLogos = []; // Store {name, imageUrl} objects

  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Get the partner's brand name to filter it out
  const partnerBrand = partnerDomain.split('.')[0].toLowerCase();

  // Known company names for validation (helps identify real companies vs noise)
  const knownCompanies = [
    'adobe', 'salesforce', 'ibm', 'microsoft', 'google', 'amazon', 'oracle',
    'sap', 'hubspot', 'gong', 'outreach', 'salesloft', 'zoom', 'slack', 'dropbox',
    'docusign', 'visa', 'mastercard', 'stripe', 'paypal', 'shopify', 'zendesk',
    'intercom', 'drift', 'marketo', 'eloqua', 'pardot', 'mailchimp', 'segment',
    'twilio', 'snowflake', 'databricks', 'splunk', 'datadog', 'newrelic',
    'coupa', 'concur', 'workday', 'servicenow', 'atlassian', 'jira', 'confluence',
    'asana', 'monday', 'notion', 'figma', 'canva', 'airtable', 'miro',
    'uber', 'lyft', 'airbnb', 'doordash', 'instacart', 'grubhub', 'postmates',
    'netflix', 'spotify', 'disney', 'hulu', 'hbo', 'paramount', 'warner',
    'cisco', 'dell', 'hp', 'lenovo', 'intel', 'amd', 'nvidia', 'qualcomm',
    'vmware', 'citrix', 'fortinet', 'paloalto', 'crowdstrike', 'okta', 'auth0',
    'blackberry', 'thermo', 'fischer', 'edwards', 'hexagon', 'janes', 'harvard',
    'healthedge', 'onemedical', 'unitedhealth', 'anthem', 'cigna', 'aetna', 'humana',
    'accenture', 'deloitte', 'kpmg', 'pwc', 'ey', 'mckinsey', 'bain', 'bcg',
    'toyota', 'ford', 'gm', 'honda', 'bmw', 'mercedes', 'volkswagen', 'tesla',
    'coca', 'pepsi', 'nestle', 'unilever', 'procter', 'johnson', 'pfizer', 'merck',
    'walmart', 'target', 'costco', 'kroger', 'walgreens', 'cvs', 'amazon', 'ebay',
    'box', 'linkedin', 'twitter', 'facebook', 'meta', 'tiktok', 'snapchat', 'pinterest'
  ];

  // Special case name mappings
  const specialCases = {
    'ibm': 'IBM', 'hp': 'HP', 'sap': 'SAP', 'hbo': 'HBO', 'amd': 'AMD',
    'aws': 'AWS', 'gcp': 'GCP', 'usaa': 'USAA', 'att': 'AT&T', 'bmw': 'BMW',
    'pwc': 'PwC', 'ey': 'EY', 'kpmg': 'KPMG', 'bcg': 'BCG', 'gm': 'GM',
    'cvs': 'CVS', 'ups': 'UPS', 'dhl': 'DHL', 'fedex': 'FedEx'
  };

  // Patterns to skip in filenames (not company names)
  const skipPatterns = [
    'logo', 'icon', 'arrow', 'check', 'star', 'badge', 'bg', 'background',
    'hero', 'banner', 'header', 'footer', 'nav', 'menu', 'button', 'cta',
    'white', 'dark', 'light', 'color', 'mono', 'full', 'small', 'large',
    'scroll', 'slide', 'image', 'img', 'asset', 'media', 'placeholder',
    'default', 'thumbnail', 'preview', 'sample', 'demo', 'test'
  ];

  // Helper to clean and validate company name from filename
  function extractCompanyFromFilename(url) {
    if (!url) return null;

    const filename = url.split('/').pop().split('?')[0].split('.')[0].toLowerCase();

    // Skip partner's own branding
    if (filename.includes(partnerBrand)) return null;

    // Clean the filename
    let name = filename
      .replace(/-hp-scroll|-scroll|-logo|-white|-dark|-color|-full|-mono/gi, '')
      .replace(/_logo|_white|_dark|_color|_full|_mono/gi, '')
      .replace(/[-_]/g, ' ')
      .trim();

    // Skip if too short or too long
    if (name.length < 2 || name.length > 35) return null;

    // Filter out generic/utility words
    const words = name.split(' ').filter(w => w.length > 1);
    const meaningfulWords = words.filter(w => !skipPatterns.includes(w.toLowerCase()));
    if (meaningfulWords.length === 0) return null;

    name = meaningfulWords.join(' ');

    // Check if it looks like a real company
    const nameLower = name.toLowerCase();
    const isKnownCompany = knownCompanies.some(kc =>
      nameLower === kc || nameLower.includes(kc) || kc.includes(nameLower)
    );

    // Proper case the name
    let properName = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Apply special case mappings
    if (specialCases[nameLower]) {
      properName = specialCases[nameLower];
    }

    return { name: properName, isKnown: isKnownCompany };
  }

  // Strategy 1: Logo carousels/swipers (dynamic, like Demandbase)
  const carouselSelectors = [
    '.swiper', '[class*="swiper"]', '.slick', '[class*="slick"]',
    '.carousel', '[class*="carousel"]', '.slider', '[class*="slider"]',
    '.logo-parade', '[class*="logo-parade"]', '.logo-scroll', '[class*="logo-scroll"]'
  ];

  // Strategy 2: Static logo grids (common below hero section)
  const staticLogoSelectors = [
    '.logo-grid', '[class*="logo-grid"]', '.logo-wall', '[class*="logo-wall"]',
    '.logo-list', '[class*="logo-list"]', '.logos', '[class*="logos"]',
    '.brand-grid', '[class*="brand-grid"]', '.company-logos', '[class*="company-logo"]'
  ];

  // Strategy 3: "Trusted by" and similar social proof sections
  const socialProofSelectors = [
    '[class*="trusted"]', '[class*="used-by"]', '[class*="powered-by"]',
    '[class*="customer"]', '[class*="client"]', '[class*="partner"]',
    '[class*="social-proof"]', '[class*="proof"]'
  ];

  // Strategy 4: Generic sections that might have logos (near hero, below fold)
  const genericSectionSelectors = [
    'section img', 'main img', '.hero + * img', '[class*="hero"] + * img'
  ];

  // Combine all selectors
  const allSelectors = [
    ...carouselSelectors,
    ...staticLogoSelectors,
    ...socialProofSelectors
  ];

  // Collect all potential logo images
  const logoImages = new Map(); // Use Map to dedupe by URL
  const seenNames = new Set();

  // First pass: targeted selectors
  allSelectors.forEach(selector => {
    try {
      doc.querySelectorAll(selector).forEach(section => {
        section.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          const srcset = img.srcset || '';
          const alt = (img.alt || '').trim();

          // Get best quality image URL
          let imageUrl = src;
          if (srcset) {
            const srcsetParts = srcset.split(',').map(s => s.trim().split(' ')[0]);
            imageUrl = srcsetParts[0] || src;
          }

          if (imageUrl && !logoImages.has(imageUrl)) {
            logoImages.set(imageUrl, { img, alt, section: selector });
          }
        });
      });
    } catch (e) {}
  });

  // Process collected images
  logoImages.forEach(({ img, alt, section }, imageUrl) => {
    // Try to get company name from filename first (most reliable)
    const fromFilename = extractCompanyFromFilename(imageUrl);

    if (fromFilename && !seenNames.has(fromFilename.name.toLowerCase())) {
      seenNames.add(fromFilename.name.toLowerCase());
      customerLogos.push({
        name: fromFilename.name,
        imageUrl: imageUrl,
        source: 'filename',
        isKnown: fromFilename.isKnown
      });
      return;
    }

    // Fallback: try alt text (but be more careful - often has "logo" or brand noise)
    if (alt && alt.length > 2 && alt.length < 40) {
      // Skip if alt contains partner brand or generic words
      const altLower = alt.toLowerCase();
      if (altLower.includes(partnerBrand)) return;
      if (skipPatterns.some(p => altLower.includes(p))) return;

      // Clean the alt text
      let cleanAlt = alt
        .replace(/\s+logo$/i, '')
        .replace(/^logo\s+/i, '')
        .replace(/\s+image$/i, '')
        .trim();

      if (cleanAlt && cleanAlt.length > 2 && !seenNames.has(cleanAlt.toLowerCase())) {
        seenNames.add(cleanAlt.toLowerCase());
        customerLogos.push({
          name: cleanAlt,
          imageUrl: imageUrl,
          source: 'alt',
          isKnown: knownCompanies.some(kc => cleanAlt.toLowerCase().includes(kc))
        });
      }
    }
  });

  // Strategy 5: Look for testimonial quotes with company attribution
  const testimonials = doc.querySelectorAll('[class*="testimonial"], [class*="quote"], [class*="review"], [class*="case-study"]');
  testimonials.forEach(testimonial => {
    const text = testimonial.textContent || '';
    const companyMatch = text.match(/(?:—|–|-|at|from|,)\s+([A-Z][a-zA-Z0-9\s&.]+(?:Inc|LLC|Corp|Ltd)?)/);
    if (companyMatch && companyMatch[1]) {
      const name = companyMatch[1].trim();
      if (name.length > 2 && name.length < 40 &&
          !name.toLowerCase().includes(partnerBrand) &&
          !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        customerLogos.push({
          name: name,
          imageUrl: null,
          source: 'testimonial',
          isKnown: knownCompanies.some(kc => name.toLowerCase().includes(kc))
        });
      }
    }
  });

  // Sort: known companies first, then by source reliability
  customerLogos.sort((a, b) => {
    if (a.isKnown && !b.isKnown) return -1;
    if (!a.isKnown && b.isKnown) return 1;
    const sourceOrder = { 'filename': 0, 'alt': 1, 'testimonial': 2 };
    return (sourceOrder[a.source] || 3) - (sourceOrder[b.source] || 3);
  });

  // Store logos in state for display
  state.customerLogos = customerLogos;

  console.log('Extracted customer logos:', customerLogos.map(c => `${c.name} (${c.source})`));

  // Return just the names for backwards compatibility
  return customerLogos.map(c => c.name);
}

async function analyzeWebsiteWithClaude(domain) {
  console.log('Using Claude to analyze website for customers:', domain);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `I'm researching the company at ${domain}. Based on your knowledge, can you tell me some of their notable customers or clients? Please provide a JSON array of company names that are likely customers of ${domain}.

Return ONLY a JSON array of company names, like:
["Company A", "Company B", "Company C"]

If you don't know any specific customers, return an empty array [].
Focus on well-known companies that might use their services.`
        }]
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.content[0].text;

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const customers = JSON.parse(jsonMatch[0]);
          state.customerCompanies = customers.slice(0, 10);
          return customers.slice(0, 10);
        }
      } catch (e) {
        console.error('Could not parse Claude response:', e);
      }
    }
  } catch (error) {
    console.error('Claude analysis failed:', error);
  }

  return [];
}

async function enrichCustomerCompanies(customers) {
  if (!customers || customers.length === 0) return [];

  console.log('Enriching customer companies:', customers);
  const enrichments = [];

  // Enrich up to 5 customers in parallel
  const customersToEnrich = customers.slice(0, 5);

  const enrichmentPromises = customersToEnrich.map(async (customerName) => {
    try {
      // Try to find domain from company name
      const possibleDomain = customerName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 30) + '.com';

      // Use CORS proxy and token parameter for browser requests
      const targetUrl = `https://api.thecompaniesapi.com/v2/companies/${possibleDomain}?token=${COMPANIES_API_KEY}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          name: customerName,
          enriched: true,
          data: data
        };
      }
    } catch (e) {
      // Enrichment failed for this customer
    }

    return {
      name: customerName,
      enriched: false,
      data: null
    };
  });

  const results = await Promise.allSettled(enrichmentPromises);

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      enrichments.push(result.value);
    }
  });

  state.customerEnrichments = enrichments;
  console.log('Customer enrichments:', enrichments);

  return enrichments;
}

function displayCustomerDiscovery(customers, enrichments) {
  if (!customers || customers.length === 0) return;

  const enrichedCount = enrichments.filter(e => e.enriched).length;
  const customerLogos = state.customerLogos || [];

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';

  // Build customer cards - prioritize scraped logo images
  const customerCards = customers.slice(0, 6).map(customer => {
    const enrichment = enrichments.find(e => e.name === customer);
    const isEnriched = enrichment?.enriched;
    const data = enrichment?.data;

    // Find scraped logo for this customer
    const scrapedLogo = customerLogos.find(cl =>
      cl.name.toLowerCase() === customer.toLowerCase() ||
      customer.toLowerCase().includes(cl.name.toLowerCase()) ||
      cl.name.toLowerCase().includes(customer.toLowerCase())
    );

    // Determine the best logo URL to use
    let logoUrl = null;
    if (data?.logo) {
      logoUrl = data.logo;
    } else if (scrapedLogo?.imageUrl) {
      logoUrl = scrapedLogo.imageUrl;
    }

    if (isEnriched && data) {
      return `
        <div class="customer-card enriched">
          <div class="customer-logo">
            ${logoUrl
              ? `<img src="${logoUrl}" alt="${customer}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <span class="logo-fallback" style="display:none">${customer.charAt(0)}</span>`
              : customer.charAt(0)
            }
          </div>
          <div class="customer-info">
            <div class="customer-name">${data.name || customer}</div>
            <div class="customer-details">${data.industry || ''} ${data.employeesRange ? `· ${data.employeesRange} employees` : ''}</div>
          </div>
          <div class="customer-badge">✓</div>
        </div>
      `;
    } else {
      return `
        <div class="customer-card${logoUrl ? ' has-logo' : ''}">
          <div class="customer-logo">
            ${logoUrl
              ? `<img src="${logoUrl}" alt="${customer}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <span class="logo-fallback" style="display:none">${customer.charAt(0)}</span>`
              : customer.charAt(0)
            }
          </div>
          <div class="customer-info">
            <div class="customer-name">${customer}</div>
          </div>
        </div>
      `;
    }
  }).join('');

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">I also found some of your customers — this helps me understand your target market better:</div>
      <div class="customer-discovery-card">
        <div class="discovery-header">
          <span class="discovery-icon">🔍</span>
          <span class="discovery-title">Customer Discovery</span>
          <span class="discovery-count">${customers.length} found${enrichedCount > 0 ? `, ${enrichedCount} enriched` : ''}</span>
        </div>
        <div class="customer-grid">
          ${customerCards}
        </div>
        <div class="discovery-footer">
          <span class="discovery-note">Using this data to refine your ICP suggestions</span>
        </div>
      </div>
    </div>
  `;

  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();
}

// ============================================
// COMPETITOR DETECTION & PARTNER FIT SIGNALS
// ============================================

async function detectCompetitorsAndFitSignals(website, html = null) {
  const domain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const baseUrl = `https://${domain}`;

  console.log('Detecting competitors and partner fit signals for:', baseUrl);

  let pageContent = html;

  // Fetch website if HTML not provided - use smart fetch with JS fallback
  if (!pageContent) {
    try {
      const result = await smartFetchWebpage(baseUrl);
      if (result.success) {
        pageContent = result.html;
        console.log(`Homepage fetched via ${result.source} for competitor detection`);
      }
    } catch (e) {
      console.log('Could not fetch website for competitor detection');
    }
  }

  // Use navbar detection to find actual partner/integration page URLs
  const navbarLinks = pageContent ? detectNavbarLinks(pageContent, baseUrl) : { partnerPages: [], aboutPages: [] };
  console.log('Navbar detected partner pages:', navbarLinks.partnerPages);
  console.log('Navbar detected about pages:', navbarLinks.aboutPages);

  // Combine navbar-detected partner and about pages, or use fallbacks
  let partnerPageUrls = [
    ...navbarLinks.partnerPages,
    ...navbarLinks.aboutPages
  ];

  if (partnerPageUrls.length === 0) {
    partnerPageUrls = getFallbackUrls(baseUrl, 'partner');
    console.log('Using fallback partner page URLs');
  }

  console.log(`Trying ${partnerPageUrls.length} partner/about pages (source: ${partnerPageUrls[0]?.source || 'none'})`);

  const additionalContent = [];
  for (const { url, source } of partnerPageUrls.slice(0, 4)) {
    try {
      console.log(`Fetching partner page: ${url} (${source})`);
      const result = await smartFetchWebpage(url);
      if (result.success) {
        additionalContent.push(result.html);
        console.log(`✓ Partner page fetched via ${result.source}: ${url}`);
      }
    } catch (e) {
      continue;
    }
  }

  const allContent = [pageContent, ...additionalContent].filter(Boolean).join(' ').toLowerCase();

  // Detect competitors
  const detectedCompetitors = detectCompetitorsInContent(allContent);

  // Analyze partner fit signals
  const fitSignals = analyzePartnerFitSignals(allContent, domain);

  // If we found competitors or signals, also use Claude for deeper analysis
  if (detectedCompetitors.length > 0 || Object.keys(fitSignals).length > 0) {
    const claudeAnalysis = await analyzePartnerWithClaude(domain, detectedCompetitors, fitSignals);
    if (claudeAnalysis) {
      Object.assign(fitSignals, claudeAnalysis.signals || {});
      state.partnerReadinessScore = claudeAnalysis.readinessScore || calculateReadinessScore(detectedCompetitors, fitSignals);
    } else {
      state.partnerReadinessScore = calculateReadinessScore(detectedCompetitors, fitSignals);
    }
  }

  state.competitorSignals = detectedCompetitors;
  state.partnerFitSignals = fitSignals;

  console.log('Detected competitors:', detectedCompetitors);
  console.log('Partner fit signals:', fitSignals);
  console.log('Partner readiness score:', state.partnerReadinessScore);

  return { competitors: detectedCompetitors, fitSignals, readinessScore: state.partnerReadinessScore };
}

function detectCompetitorsInContent(content) {
  const detected = [];

  for (const competitor of AI_SALES_COMPETITORS) {
    for (const pattern of competitor.patterns) {
      // Use word boundary matching to avoid false positives
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(content)) {
        // Check for partner/reseller/integration context
        const contexts = [
          'partner', 'reseller', 'certified', 'integration', 'implement',
          'deploy', 'solution', 'expert', 'specialist', 'provider'
        ];

        // Look for context clues around the match
        const matchIndex = content.search(regex);
        const surroundingText = content.substring(
          Math.max(0, matchIndex - 100),
          Math.min(content.length, matchIndex + 150)
        );

        const hasPartnerContext = contexts.some(ctx => surroundingText.includes(ctx));

        detected.push({
          name: competitor.name,
          category: competitor.category,
          isPartner: hasPartnerContext,
          confidence: hasPartnerContext ? 'high' : 'medium'
        });
        break; // Found this competitor, move to next
      }
    }
  }

  // Deduplicate
  const unique = detected.filter((item, index, self) =>
    index === self.findIndex(t => t.name === item.name)
  );

  return unique;
}

function analyzePartnerFitSignals(content, domain) {
  const signals = {};

  // CRM Ecosystem Signals
  const crmSignals = {
    hubspot: ['hubspot partner', 'hubspot certified', 'hubspot solutions partner', 'hubspot diamond', 'hubspot platinum', 'hubspot gold', 'hubspot implementation'],
    salesforce: ['salesforce partner', 'salesforce consulting', 'appexchange', 'salesforce certified', 'salesforce implementation', 'sfdc partner'],
    microsoft: ['dynamics 365', 'microsoft partner', 'microsoft gold', 'microsoft silver'],
    other: ['crm implementation', 'crm consulting', 'crm partner']
  };

  const detectedCRM = [];
  for (const [crm, patterns] of Object.entries(crmSignals)) {
    if (patterns.some(p => content.includes(p))) {
      detectedCRM.push(crm);
    }
  }
  if (detectedCRM.length > 0) {
    signals.crmEcosystem = detectedCRM;
  }

  // AI/Automation Positioning
  const aiSignals = [
    'ai sales', 'ai-powered', 'artificial intelligence', 'machine learning',
    'sales automation', 'ai agent', 'autonomous', 'ai sdr', 'ai bdr',
    'intelligent automation', 'ai outreach', 'predictive sales'
  ];
  const detectedAI = aiSignals.filter(s => content.includes(s));
  if (detectedAI.length > 0) {
    signals.aiPositioning = true;
    signals.aiKeywords = detectedAI.slice(0, 5);
  }

  // White Label / Reseller Model
  const resellerSignals = [
    'white label', 'whitelabel', 'reseller', 'resell', 'partner program',
    'referral partner', 'channel partner', 'var partner', 'value added reseller',
    'oem', 'private label'
  ];
  const detectedReseller = resellerSignals.filter(s => content.includes(s));
  if (detectedReseller.length > 0) {
    signals.resellerModel = true;
    signals.resellerKeywords = detectedReseller;
  }

  // Service Delivery Capability
  const serviceSignals = [
    'implementation', 'onboarding', 'managed services', 'consulting',
    'professional services', 'training', 'enablement', 'deployment',
    'integration services', 'custom development', 'support services'
  ];
  const detectedServices = serviceSignals.filter(s => content.includes(s));
  if (detectedServices.length >= 2) {
    signals.serviceDelivery = true;
    signals.serviceKeywords = detectedServices.slice(0, 5);
  }

  // Revenue Operations Focus
  const revopsSignals = [
    'revops', 'revenue operations', 'sales operations', 'salesops',
    'go-to-market', 'gtm', 'sales enablement', 'revenue growth',
    'pipeline', 'sales process', 'sales strategy'
  ];
  const detectedRevOps = revopsSignals.filter(s => content.includes(s));
  if (detectedRevOps.length >= 2) {
    signals.revOpsFocus = true;
    signals.revOpsKeywords = detectedRevOps.slice(0, 5);
  }

  // Outcome-Focused Messaging
  const outcomeSignals = [
    'roi', 'return on investment', '% increase', '% growth', 'x revenue',
    '2x', '3x', '10x', 'pipeline growth', 'revenue increase', 'conversion rate',
    'qualified leads', 'meetings booked', 'closed deals', 'sales velocity'
  ];
  const detectedOutcomes = outcomeSignals.filter(s => content.includes(s));
  if (detectedOutcomes.length >= 2) {
    signals.outcomeFocused = true;
    signals.outcomeKeywords = detectedOutcomes.slice(0, 5);
  }

  // Certification Signals
  const certSignals = [
    'certified', 'certification', 'accredited', 'partner badge',
    'solutions partner', 'premier partner', 'elite partner'
  ];
  if (certSignals.some(s => content.includes(s))) {
    signals.hasCertifications = true;
  }

  return signals;
}

function calculateReadinessScore(competitors, fitSignals) {
  let score = 0;

  // Competitor signals are huge (they're already selling AI sales)
  if (competitors.length > 0) {
    score += 30;
    // Bonus for being a certified partner of competitors
    const partnerCount = competitors.filter(c => c.isPartner).length;
    score += Math.min(partnerCount * 10, 20);
  }

  // CRM Ecosystem alignment
  if (fitSignals.crmEcosystem?.length > 0) {
    score += 10;
    if (fitSignals.crmEcosystem.includes('hubspot') || fitSignals.crmEcosystem.includes('salesforce')) {
      score += 5; // Premium CRM ecosystems
    }
  }

  // AI Positioning
  if (fitSignals.aiPositioning) {
    score += 10;
  }

  // Reseller/White Label Model
  if (fitSignals.resellerModel) {
    score += 10;
  }

  // Service Delivery Capability
  if (fitSignals.serviceDelivery) {
    score += 10;
  }

  // RevOps Focus
  if (fitSignals.revOpsFocus) {
    score += 5;
  }

  // Outcome-Focused Messaging
  if (fitSignals.outcomeFocused) {
    score += 5;
  }

  // Certifications
  if (fitSignals.hasCertifications) {
    score += 5;
  }

  return Math.min(score, 100);
}

async function analyzePartnerWithClaude(domain, competitors, fitSignals) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze this partner company for SalesAI partnership fit.

Domain: ${domain}

Detected AI Sales Competitors they work with:
${JSON.stringify(competitors, null, 2)}

Detected Fit Signals:
${JSON.stringify(fitSignals, null, 2)}

Based on this data, provide a JSON response:
{
  "readinessScore": 0-100,
  "partnerTier": "PRO" | "ADVANCED" | "STANDARD" | "EMERGING",
  "signals": {
    "competitorExperience": "Description of their AI sales competitor experience",
    "primaryStrength": "Their main strength as a partner",
    "quickWin": "Immediate opportunity for partnership"
  },
  "recommendation": "Brief recommendation for partnership approach"
}

Scoring Guide:
- PRO (80-100): Already selling AI sales solutions, can transact immediately
- ADVANCED (60-79): Strong CRM/sales tech presence, minimal ramp time
- STANDARD (40-59): Good foundation, needs enablement
- EMERGING (0-39): Potential but requires significant development

Return ONLY valid JSON.`
        }]
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.content[0].text;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Could not parse Claude analysis:', e);
      }
    }
  } catch (error) {
    console.error('Claude partner analysis failed:', error);
  }
  return null;
}

function displayPartnerReadinessCard(competitors, fitSignals, readinessScore) {
  if (competitors.length === 0 && Object.keys(fitSignals).length < 2) return;

  // Determine tier
  let tier, tierColor, tierIcon;
  if (readinessScore >= 80) {
    tier = 'PRO';
    tierColor = '#22c55e';
    tierIcon = '🚀';
  } else if (readinessScore >= 60) {
    tier = 'ADVANCED';
    tierColor = '#3b82f6';
    tierIcon = '⭐';
  } else if (readinessScore >= 40) {
    tier = 'STANDARD';
    tierColor = '#f59e0b';
    tierIcon = '✓';
  } else {
    tier = 'EMERGING';
    tierColor = '#6b7280';
    tierIcon = '🌱';
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';

  // Build competitor badges
  const competitorBadges = competitors.slice(0, 5).map(c => `
    <div class="competitor-badge ${c.isPartner ? 'partner' : ''}">
      <span class="competitor-name">${c.name}</span>
      <span class="competitor-category">${c.category}</span>
      ${c.isPartner ? '<span class="partner-indicator">Partner</span>' : ''}
    </div>
  `).join('');

  // Build signal pills
  const signalPills = [];
  if (fitSignals.crmEcosystem?.length > 0) {
    signalPills.push(`<span class="signal-pill crm">${fitSignals.crmEcosystem.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}</span>`);
  }
  if (fitSignals.aiPositioning) {
    signalPills.push('<span class="signal-pill ai">AI Positioned</span>');
  }
  if (fitSignals.resellerModel) {
    signalPills.push('<span class="signal-pill reseller">Reseller Model</span>');
  }
  if (fitSignals.serviceDelivery) {
    signalPills.push('<span class="signal-pill services">Service Delivery</span>');
  }
  if (fitSignals.revOpsFocus) {
    signalPills.push('<span class="signal-pill revops">RevOps Focus</span>');
  }
  if (fitSignals.hasCertifications) {
    signalPills.push('<span class="signal-pill cert">Certified</span>');
  }

  const proMessage = competitors.length > 0 ?
    `This partner is already in the AI sales ecosystem — they're selling or partnered with ${competitors.map(c => c.name).join(', ')}. This indicates they understand the value prop and can transact quickly.` :
    `This partner shows strong alignment with AI sales positioning and has the infrastructure to deliver.`;

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">${tier === 'PRO' ? '🎯 This looks like a PRO-ready partner!' : 'I analyzed their partner fit signals:'}</div>
      <div class="partner-readiness-card" style="--tier-color: ${tierColor}">
        <div class="readiness-header">
          <div class="readiness-tier">
            <span class="tier-icon">${tierIcon}</span>
            <span class="tier-label">${tier} Partner</span>
          </div>
          <div class="readiness-score">
            <div class="score-circle" style="--score: ${readinessScore}">
              <span class="score-number">${readinessScore}</span>
            </div>
            <span class="score-label">Readiness Score</span>
          </div>
        </div>

        ${competitors.length > 0 ? `
          <div class="readiness-section">
            <div class="section-title">🔥 AI Sales Experience</div>
            <div class="competitor-badges">
              ${competitorBadges}
            </div>
            <p class="readiness-insight">${proMessage}</p>
          </div>
        ` : ''}

        ${signalPills.length > 0 ? `
          <div class="readiness-section">
            <div class="section-title">Partner Fit Signals</div>
            <div class="signal-pills">
              ${signalPills.join('')}
            </div>
          </div>
        ` : ''}

        <div class="readiness-footer">
          <span class="readiness-note">${tier === 'PRO' ? 'Fast-track this partner for immediate enablement' : 'Partner shows good potential for the program'}</span>
        </div>
      </div>
    </div>
  `;

  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();
}

// ============================================
// JVP STORY CARD ("BETTER TOGETHER") - Interactive Use Case Selector
// ============================================

// State for the Better Together card interaction
let btCardState = {
  activeTab: 0,
  validUseCases: new Set([0]),  // Best fit selected by default
  primaryUseCase: null,
  hasInteracted: false,
  isSubmitted: false
};

// Generate fallback JVP stories when Claude doesn't return them
function generateFallbackJVPStories(profile, insights, companyName) {
  // Use cases that align with most common partner scenarios
  const useCaseTemplates = [
    {
      useCase: 'Speed-to-Lead',
      description: 'Instant outbound call within 60 seconds of lead capture',
      trigger: 'New form fill, demo request, inbound inquiry'
    },
    {
      useCase: 'Demo/Meeting Booking',
      description: 'AI schedules meetings directly to rep calendars 24/7',
      trigger: 'Qualified lead needs appointment'
    },
    {
      useCase: 'CRM Lead Reactivation',
      description: 'Multi-touch call sequences for dormant leads',
      trigger: 'Stale MQLs (2-6 months old), closed-lost, no-shows'
    }
  ];

  // Extract available data from profile
  const roles = profile.targetRoles || [];
  const industries = profile.targetIndustries || [];
  const useCases = profile.useCases || [];
  const services = profile.services || [];

  return useCaseTemplates.map((template, index) => ({
    rank: index + 1,
    useCase: template.useCase,
    useCaseTier: index === 0 ? 'perfect' : 'ok',
    persona: {
      title: roles[index] || ['VP of Sales', 'Marketing Director', 'Revenue Operations Manager'][index],
      vertical: industries[index] || ['B2B SaaS', 'Professional Services', 'Technology'][index],
      seniority: 'Director',
      companySize: profile.companySize || 'Mid-Market',
      commonTech: ['HubSpot', 'Salesforce'],
      organizationalGoals: ['Drive revenue growth', 'Improve lead conversion', 'Scale operations']
    },
    currentState: {
      useCase: template.description,
      problemBlocker: 'Manual follow-up creates delays and dropped leads',
      currentWay: `Using ${companyName}'s services with manual outreach processes`,
      problems: ['Slow response times', 'Inconsistent follow-up', 'Limited after-hours coverage'],
      limitation: 'Unable to scale without adding headcount'
    },
    empathyMap: {
      say: ['We need faster lead response', 'Our team can\'t keep up with volume'],
      think: ['We\'re losing deals to competitors who respond faster'],
      feel: ['Frustrated', 'Overwhelmed by lead volume'],
      do: ['Prioritize only hot leads', 'Miss evening/weekend inquiries']
    },
    futureState: {
      betterTogetherCapability: `${companyName} + SalesAI enables instant, 24/7 lead engagement`,
      partnerContribution: services[0] || useCases[0] || `${companyName}'s expertise in their domain`,
      salesAiContribution: 'AI voice agents that respond within 60 seconds, qualify leads, and book meetings automatically',
      connectedFeatures: 'Native CRM integration ensures seamless handoffs and data sync',
      benefits: ['100% lead contact rate', 'Meetings booked 24/7', '2-3x improvement in speed-to-lead'],
      doNothingRisk: 'Competitors with faster response times will continue capturing your prospects'
    },
    jointValueProp: `${companyName} + SalesAI = Every lead contacted instantly, qualified automatically, and converted faster`,
    proofPoints: {
      partnerEvidence: `${companyName} has established expertise serving ${industries[0] || 'B2B companies'}`,
      salesAiEvidence: 'SalesAI customers see 40% increase in meeting bookings with instant follow-up',
      sharedCustomerProfile: `${industries[0] || 'B2B'} companies with high lead volume needing faster response`
    },
    confidence: {
      personaFit: index === 0 ? 'high' : 'medium',
      useCaseFit: index === 0 ? 'high' : 'medium',
      dataQuality: 'medium',
      reasoning: 'Generated from available partner profile data - customize based on actual use cases'
    }
  }));
}

// Display the Better Together card - exact match to V2 design
function displayEnhancedPartnershipCard(profile, insights, enhancedData) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';
  messageDiv.id = 'better-together-card';

  const companyName = state.enrichedCompany?.name || state.formData.companyName || 'Partner';

  // Use Claude stories or generate fallback - NEVER fall back to old UI
  let stories = enhancedData?.jvpStories || [];
  if (!stories.length) {
    console.log('No JVP stories from Claude - generating fallback stories');
    stories = generateFallbackJVPStories(profile, insights, companyName);
  }

  const partnerSummary = enhancedData?.partnerSummary || {
    recommendedPartnershipType: insights.partnershipType || 'referral',
    gtmAlignment: insights.gtmFit || 'moderate',
    primaryValueDriver: 'Speed-to-lead and pipeline acceleration',
    enablementPriority: 'Use case training and co-selling playbook'
  };

  // Reset card state
  btCardState = {
    activeTab: 0,
    validUseCases: new Set([0]),
    primaryUseCase: null,
    hasInteracted: false,
    isSubmitted: false
  };

  // Store stories in state
  state.jvpStories = stories;
  state.partnerSummary = partnerSummary;

  // Partnership type display
  const partnershipLabels = {
    'referral': 'Referral Partner',
    'channel': 'Channel Partner',
    'integrated': 'Integrated Partner'
  };
  const pTypeLabel = partnershipLabels[partnerSummary.recommendedPartnershipType] || 'Referral Partner';

  // GTM fit display
  const gtmLabels = {
    'strong': 'Strong GTM Fit',
    'moderate': 'Moderate GTM Fit',
    'developing': 'Developing Fit'
  };
  const gtmLabel = gtmLabels[partnerSummary.gtmAlignment] || 'Moderate GTM Fit';

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="bt-card">
        <!-- Header -->
        <div class="bt-header">
          <div class="bt-header-content">
            <svg class="bt-sparkle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path>
            </svg>
            <span>Here's our <strong>Better Together</strong> story with ${companyName}</span>
          </div>
        </div>

        <!-- Use Case Navigation -->
        <div class="bt-nav">
          <div class="bt-nav-header">
            <span class="bt-nav-count">We identified <strong>${stories.length} use cases</strong> for your partnership</span>
            <span class="bt-nav-hint" id="bt-nav-hint">
              <svg class="bt-pointer-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                <path d="M13 13l6 6"></path>
              </svg>
              Click to explore
            </span>
          </div>

          <!-- Tab Navigation -->
          <div class="bt-tabs-row">
            <button class="bt-nav-arrow" id="bt-prev" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div class="bt-tabs" id="bt-tabs">
              ${stories.map((story, index) => `
                <button class="bt-tab ${index === 0 ? 'active' : ''} ${!btCardState.hasInteracted && index !== 0 ? 'pulse-hint' : ''}" data-index="${index}">
                  <div class="bt-tab-content">
                    <span class="bt-tab-usecase">${story.useCase}</span>
                    ${index === 0 ? `
                      <span class="bt-tab-best-fit">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        Best Fit
                      </span>
                    ` : `
                      <span class="bt-tab-persona">${story.persona?.title || ''}</span>
                    `}
                  </div>
                  <div class="bt-tab-check" style="display: ${index === 0 ? 'flex' : 'none'};">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div class="bt-tab-star" style="display: none;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                </button>
              `).join('')}
            </div>

            <button class="bt-nav-arrow" id="bt-next" ${stories.length <= 1 ? 'disabled' : ''}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <!-- Progress Dots -->
          <div class="bt-dots">
            ${stories.map((_, index) => `
              <button class="bt-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
            `).join('')}
          </div>
        </div>

        <!-- Content Area -->
        <div class="bt-content" id="bt-content">
          ${renderBTStoryContent(stories[0], companyName)}
        </div>

        <!-- Selection Actions -->
        <div class="bt-actions">
          <div class="bt-action-row">
            <button class="bt-action-btn bt-valid-btn active" id="bt-valid-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Valid Use Case ✓</span>
            </button>
            <button class="bt-action-btn bt-primary-btn" id="bt-primary-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Set as Primary</span>
            </button>
          </div>
          <div class="bt-selection-status" id="bt-selection-status">
            1 use case selected · Will default to <span class="bt-primary-label">${stories[0].useCase}</span> for MAP
          </div>
        </div>

        <!-- Footer -->
        <div class="bt-footer">
          <div class="bt-badges">
            <span class="bt-badge bt-badge-partnership">🤝 ${pTypeLabel}</span>
            <span class="bt-badge bt-badge-gtm">👍 ${gtmLabel}</span>
          </div>
          <button class="bt-confirm-btn" id="bt-confirm-btn">
            Confirm & Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();

  // Initialize event listeners
  initBTCardListeners(stories, companyName);
}

// Render content for a single story - matches V2 design exactly
function renderBTStoryContent(story, companyName) {
  if (!story) return '<div class="bt-empty">No story data available</div>';

  const getConfidenceClass = (level) => {
    switch(level) {
      case 'high': return 'bt-confidence-high';
      case 'medium': return 'bt-confidence-medium';
      case 'low': return 'bt-confidence-low';
      default: return 'bt-confidence-medium';
    }
  };

  return `
    <!-- Persona Badge -->
    <div class="bt-persona">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <span class="bt-persona-title">${story.persona?.title || ''}</span>
      <span class="bt-persona-sep">·</span>
      <span>${story.persona?.vertical || ''}</span>
      <span class="bt-persona-sep">·</span>
      <span>${story.persona?.companySize || ''}</span>
    </div>

    <!-- Joint Value Proposition -->
    <div class="bt-jvp">
      <div class="bt-section-label bt-jvp-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        JOINT VALUE PROPOSITION
      </div>
      <p class="bt-jvp-text">${(story.jointValueProp || '').replace(/Partner/g, companyName)}</p>
    </div>

    <!-- Problem Today -->
    <div class="bt-section">
      <div class="bt-section-label bt-problem-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        THE PROBLEM TODAY
      </div>
      <p class="bt-problem-text">
        ${(story.currentState?.currentWay || '').replace(/Partner/g, companyName)}
        <span class="bt-problem-but"> ...but </span>
        <span class="bt-problem-blocker">${story.currentState?.problemBlocker || ''}</span>
      </p>
    </div>

    <!-- Better Together -->
    <div class="bt-together">
      <div class="bt-section-label bt-together-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path>
        </svg>
        BETTER TOGETHER
      </div>
      <div class="bt-together-grid">
        <div class="bt-together-col">
          <div class="bt-together-col-label">Partner brings:</div>
          <p>${story.futureState?.partnerContribution || ''}</p>
        </div>
        <div class="bt-together-col">
          <div class="bt-together-col-label">SalesAI adds:</div>
          <p>${story.futureState?.salesAiContribution || ''}</p>
        </div>
      </div>
    </div>

    <!-- Benefits -->
    <div class="bt-section">
      <div class="bt-section-label bt-benefits-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
        WHAT THEY GET
      </div>
      <ul class="bt-benefits">
        ${(story.futureState?.benefits || []).map(benefit => `
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            ${benefit}
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Do Nothing Risk -->
    <div class="bt-risk">
      <div class="bt-risk-label">⚠️ DO NOTHING RISK</div>
      <p>${story.futureState?.doNothingRisk || ''}</p>
    </div>

    <!-- Confidence -->
    <div class="bt-confidence">
      <span class="bt-confidence-label">Confidence:</span>
      <span class="${getConfidenceClass(story.confidence?.personaFit)}">Persona ${story.confidence?.personaFit || 'medium'}</span>
      <span class="${getConfidenceClass(story.confidence?.useCaseFit)}">Use Case ${story.confidence?.useCaseFit || 'medium'}</span>
      <span class="${getConfidenceClass(story.confidence?.dataQuality)}">Data ${story.confidence?.dataQuality || 'medium'}</span>
    </div>
  `;
}

// Initialize event listeners for the Better Together card
function initBTCardListeners(stories, companyName) {
  // Tab clicks
  document.querySelectorAll('.bt-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const index = parseInt(tab.dataset.index);
      setActiveBTTab(index, stories, companyName);
    });
  });

  // Dot clicks
  document.querySelectorAll('.bt-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index);
      setActiveBTTab(index, stories, companyName);
    });
  });

  // Navigation arrows
  document.getElementById('bt-prev')?.addEventListener('click', () => {
    if (btCardState.activeTab > 0) {
      setActiveBTTab(btCardState.activeTab - 1, stories, companyName);
    }
  });

  document.getElementById('bt-next')?.addEventListener('click', () => {
    if (btCardState.activeTab < stories.length - 1) {
      setActiveBTTab(btCardState.activeTab + 1, stories, companyName);
    }
  });

  // Valid use case button
  document.getElementById('bt-valid-btn')?.addEventListener('click', () => {
    toggleValidUseCase(btCardState.activeTab, stories);
  });

  // Primary use case button
  document.getElementById('bt-primary-btn')?.addEventListener('click', () => {
    setPrimaryUseCase(btCardState.activeTab, stories);
  });

  // Confirm button
  document.getElementById('bt-confirm-btn')?.addEventListener('click', () => {
    confirmBTSelection(stories);
  });
}

// Set active tab
function setActiveBTTab(index, stories, companyName) {
  btCardState.activeTab = index;
  btCardState.hasInteracted = true;

  // Update tabs
  document.querySelectorAll('.bt-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });

  // Update dots
  document.querySelectorAll('.bt-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Update navigation arrows
  const prevBtn = document.getElementById('bt-prev');
  const nextBtn = document.getElementById('bt-next');
  if (prevBtn) prevBtn.disabled = index === 0;
  if (nextBtn) nextBtn.disabled = index === stories.length - 1;

  // Update hint
  const hint = document.getElementById('bt-nav-hint');
  if (hint) {
    hint.innerHTML = `${index + 1} of ${stories.length}`;
    hint.classList.add('counter');
  }

  // Update content
  const content = document.getElementById('bt-content');
  if (content) {
    content.innerHTML = renderBTStoryContent(stories[index], companyName);
  }

  // Update action buttons state
  updateActionButtonsState(index, stories);
}

// Toggle valid use case
function toggleValidUseCase(index, stories) {
  if (btCardState.validUseCases.has(index)) {
    btCardState.validUseCases.delete(index);
    if (btCardState.primaryUseCase === index) {
      btCardState.primaryUseCase = null;
    }
  } else {
    btCardState.validUseCases.add(index);
  }
  updateActionButtonsState(index, stories);
  updateTabIndicators();
}

// Set primary use case
function setPrimaryUseCase(index, stories) {
  if (!btCardState.validUseCases.has(index)) {
    btCardState.validUseCases.add(index);
  }
  btCardState.primaryUseCase = index;
  updateActionButtonsState(index, stories);
  updateTabIndicators();
}

// Update action buttons state
function updateActionButtonsState(index, stories) {
  const validBtn = document.getElementById('bt-valid-btn');
  const primaryBtn = document.getElementById('bt-primary-btn');
  const statusEl = document.getElementById('bt-selection-status');

  const isValid = btCardState.validUseCases.has(index);
  const isPrimary = btCardState.primaryUseCase === index;

  if (validBtn) {
    validBtn.classList.toggle('active', isValid);
    validBtn.querySelector('span').textContent = isValid ? 'Valid Use Case ✓' : 'Mark as Valid';
  }

  if (primaryBtn) {
    primaryBtn.classList.toggle('active', isPrimary);
    primaryBtn.querySelector('span').textContent = isPrimary ? 'Primary ★' : 'Set as Primary';
  }

  // Update selection status
  if (statusEl) {
    const count = btCardState.validUseCases.size;
    const effectivePrimary = btCardState.primaryUseCase !== null
      ? btCardState.primaryUseCase
      : (btCardState.validUseCases.size > 0 ? Array.from(btCardState.validUseCases)[0] : 0);
    const primaryLabel = stories[effectivePrimary]?.useCase || stories[0].useCase;

    if (count === 0) {
      statusEl.innerHTML = 'Select at least one valid use case to continue';
    } else {
      statusEl.innerHTML = `${count} use case${count > 1 ? 's' : ''} selected · ${btCardState.primaryUseCase !== null ? 'Primary' : 'Will default to'}: <span class="bt-primary-label">${primaryLabel}</span>`;
    }
  }

  // Update confirm button state
  const confirmBtn = document.getElementById('bt-confirm-btn');
  if (confirmBtn) {
    confirmBtn.disabled = btCardState.validUseCases.size === 0;
  }
}

// Update tab indicators
function updateTabIndicators() {
  document.querySelectorAll('.bt-tab').forEach((tab, i) => {
    const checkIndicator = tab.querySelector('.bt-tab-check');
    const starIndicator = tab.querySelector('.bt-tab-star');

    if (checkIndicator) {
      checkIndicator.style.display = btCardState.validUseCases.has(i) ? 'flex' : 'none';
    }
    if (starIndicator) {
      starIndicator.style.display = btCardState.primaryUseCase === i ? 'flex' : 'none';
    }
  });
}

// Confirm Better Together selection
function confirmBTSelection(stories) {
  if (btCardState.validUseCases.size === 0 || btCardState.isSubmitted) return;

  const effectivePrimary = btCardState.primaryUseCase !== null
    ? btCardState.primaryUseCase
    : Array.from(btCardState.validUseCases)[0];

  const selectedData = {
    validUseCases: Array.from(btCardState.validUseCases).map(i => stories[i].useCase),
    primaryUseCase: stories[effectivePrimary].useCase,
    primaryStory: stories[effectivePrimary]
  };

  // Store in state
  state.selectedJVP = selectedData;
  btCardState.isSubmitted = true;

  // Update UI
  const confirmBtn = document.getElementById('bt-confirm-btn');
  if (confirmBtn) {
    confirmBtn.innerHTML = 'Confirmed <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>';
    confirmBtn.classList.add('confirmed');
    confirmBtn.disabled = true;
  }

  console.log('Better Together Selection confirmed:', selectedData);

  // Proceed to next step in the conversation
  setTimeout(() => {
    proceedAfterBTSelection(selectedData);
  }, 500);
}

// Proceed after Better Together selection
function proceedAfterBTSelection(selectedData) {
  // Add confirmation message
  const typingId = addTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator(typingId);

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-assistant';
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">
          Excellent choice! <strong>${selectedData.primaryUseCase}</strong> is a great fit for your partnership.
          We'll build your Mutual Action Plan around this use case. Let's continue with a few more questions to finalize your application.
        </div>
      </div>
    `;
    chatMessagesInner.appendChild(messageDiv);
    scrollToBottom();

    // Continue with next conversation step
    setTimeout(() => {
      processNextStep();
    }, 800);
  }, 600);
}

// ============================================
// SMART PRE-FILL WITH CLAUDE
// ============================================

async function generateSmartPrefill(companyData) {
  if (!companyData) return;

  // Use normalizer to handle nested API responses
  const normalized = normalizeCompanyData(companyData);

  // CONSERVATIVE PREFILL: Only prefill what we KNOW from the API
  // Don't guess at ICP, sales motion, certifications, etc.
  // Those require user confirmation - the API tells us about THEM, not their customers

  const prefill = {
    // Location - we know this from headquarters
    location: mapLocationToCode(normalized.hqCountryCode || normalized.hqCountry),

    // Their company's revenue - direct from API
    companyRevenue: mapRevenueToCode(normalized.revenue),

    // That's it. Everything else is speculation.
    // ICP, sales motion, certifications, etc. should come from the user.
  };

  state.smartPrefill = prefill;
  console.log('📋 Conservative prefill (API data only):', prefill);
}

// Map country to location code
function mapLocationToCode(country) {
  if (!country) return null;
  const c = country.toLowerCase();
  if (c === 'us' || c.includes('united states') || c.includes('america')) return 'us';
  if (c === 'ca' || c.includes('canada')) return 'ca';
  if (c === 'gb' || c === 'uk' || c.includes('united kingdom') || c.includes('britain')) return 'uk';
  if (c === 'au' || c.includes('australia')) return 'apac';
  if (['de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'ie', 'pt'].includes(c) ||
      c.includes('germany') || c.includes('france') || c.includes('spain') || c.includes('europe')) return 'eu';
  if (['jp', 'cn', 'kr', 'sg', 'hk', 'tw', 'in', 'nz'].includes(c) ||
      c.includes('japan') || c.includes('china') || c.includes('singapore') || c.includes('asia')) return 'apac';
  if (['mx', 'br', 'ar', 'cl', 'co', 'pe'].includes(c) ||
      c.includes('mexico') || c.includes('brazil') || c.includes('latin')) return 'latam';
  return 'other';
}

// Map revenue string to code
function mapRevenueToCode(revenue) {
  if (!revenue) return null;
  const r = revenue.toLowerCase();
  if (r.includes('over-1b') || r.includes('1b+') || r.includes('billion')) return '10m+';
  if (r.includes('500m') || r.includes('100m') || r.includes('50m')) return '10m+';
  if (r.includes('10m') || r.includes('25m')) return '5-10m';
  if (r.includes('5m')) return '1-5m';
  if (r.includes('1m')) return '500k-1m';
  if (r.includes('500k')) return '0-500k';
  if (r.includes('pre-revenue') || r.includes('0')) return 'pre-revenue';
  return null;
}

// REMOVED: The old Claude inference approach that guessed at everything
// ICP, sales motion, certifications, etc. should come from the USER
// The API tells us about the partner's company, NOT their customers

function _deprecatedClaudeInference() {
  // This function is intentionally empty - keeping as documentation
  // of what we removed and why.
  //
  // Previously, we sent company data to Claude and asked it to infer:
  // - ICP revenue/headcount/verticals (WRONG: we don't know their customers)
  // - Sales motion/cycle/deal size (WRONG: pure speculation)
  // - Certifications (WRONG: having tech ≠ certified)
  // - Growth goals (WRONG: no data basis)
  //
  // This led to pre-filled answers that were often wrong, creating
  // bad data and user frustration.
  console.log('Claude inference disabled - using direct API data only');
}

async function showPrefillNotification(prefillData) {
  const fieldsCount = Object.keys(prefillData).filter(k =>
    k !== 'reasoning' && prefillData[k] !== null &&
    (Array.isArray(prefillData[k]) ? prefillData[k].length > 0 : true)
  ).length;

  if (fieldsCount === 0) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-assistant';
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="smart-prefill-notice">
        <div class="prefill-header">
          <span class="prefill-icon">✨</span>
          <span class="prefill-title">Smart Suggestions Ready</span>
        </div>
        <p class="prefill-text">Based on what I found about your company, I've prepared suggestions for <strong>${fieldsCount} questions</strong>. You'll see my recommendations pre-selected as we go — just confirm or adjust them.</p>
      </div>
    </div>
  `;
  chatMessagesInner.appendChild(messageDiv);
  scrollToBottom();

  await delay(800);
}

// Get prefill value for a specific field
function getPrefillValue(field) {
  if (!state.smartPrefill) return null;
  return state.smartPrefill[field] || null;
}

// Get intelligence data for a field to show "what we discovered"
function getFieldIntelligence(field) {
  // Only show intelligence if we have scraped data
  if (!state.partnershipProfile && !state.enrichedCompany && !state.customerEnrichments?.length) {
    return null;
  }

  const profile = state.partnershipProfile || {};
  const company = state.enrichedCompany || {};
  const customers = state.customerEnrichments || [];

  // Map fields to relevant intelligence
  const intelligenceMap = {
    // ICP Questions
    icpVerticals: {
      title: 'What we found',
      icon: '🔍',
      content: profile.targetIndustries?.length > 0
        ? `Your website shows solutions for these industries:`
        : customers.length > 0
          ? `Based on ${customers.length} customers we found on your website:`
          : null,
      tags: profile.targetIndustries?.length > 0
        ? profile.targetIndustries.slice(0, 5)
        : customers.filter(c => c.data?.industry).map(c => c.data.industry).slice(0, 5),
      source: profile.targetIndustries?.length > 0
        ? 'Detected from your solutions pages'
        : 'Detected from your customer logos'
    },
    icpHeadcount: {
      title: 'What we found',
      icon: '🏢',
      content: profile.companySize
        ? `Your website suggests you target ${profile.companySize} companies`
        : customers.length > 0
          ? `Your customers range in size:`
          : null,
      details: customers.filter(c => c.data?.employees).slice(0, 3).map(c =>
        `${c.name}: ${c.data.employees} employees`
      ),
      source: 'Detected from your customer data'
    },
    // Sales Motion Questions
    salesMotion: {
      title: 'What we found',
      icon: '🎯',
      content: profile.gtmMotion
        ? `Your GTM motion appears to be: ${profile.gtmMotion.toUpperCase()}`
        : null,
      details: profile.gtmMotion === 'plg'
        ? ['We saw "Free Trial" and self-serve options']
        : profile.gtmMotion === 'sales-led'
          ? ['We saw "Request Demo" and "Talk to Sales" CTAs']
          : profile.gtmMotion === 'hybrid'
            ? ['We saw both self-serve and sales-led options']
            : null,
      source: 'Detected from your website CTAs'
    },
    // Tech Stack
    techStack: {
      title: 'What we found',
      icon: '🔌',
      content: state.competitorSignals?.length > 0
        ? `We found these tools mentioned on your site:`
        : company.technologies?.length > 0
          ? `Technologies detected:`
          : null,
      tags: state.competitorSignals?.length > 0
        ? state.competitorSignals.map(c => c.name).slice(0, 6)
        : company.technologies?.slice(0, 6),
      source: 'Detected from your integrations page'
    },
    // Role-based questions
    icpTraits: {
      title: 'What we found',
      icon: '👥',
      content: profile.targetRoles?.length > 0
        ? `Your solutions are designed for:`
        : null,
      tags: profile.targetRoles?.slice(0, 5),
      source: 'Detected from your "For [Role]" pages'
    }
  };

  const intel = intelligenceMap[field];
  if (!intel || !intel.content) return null;

  return intel;
}

// Render an intelligence card showing what we discovered
function renderIntelligenceCard(intelligence) {
  if (!intelligence) return '';

  const tagsHtml = intelligence.tags?.length > 0
    ? `<div class="intelligence-tags">
        ${intelligence.tags.map(tag => `<span class="intelligence-tag">${tag}</span>`).join('')}
       </div>`
    : '';

  const detailsHtml = intelligence.details?.length > 0
    ? intelligence.details.map(d => `
        <div class="intelligence-detail">
          <span class="intelligence-detail-icon">→</span>
          <span class="intelligence-detail-text">${d}</span>
        </div>
      `).join('')
    : '';

  return `
    <div class="intelligence-card">
      <div class="intelligence-header">
        <span class="intelligence-icon">${intelligence.icon || '🔍'}</span>
        <span class="intelligence-title">${intelligence.title}</span>
      </div>
      <div class="intelligence-content">
        ${intelligence.content}
        ${tagsHtml}
        ${detailsHtml}
      </div>
      ${intelligence.source ? `<div class="intelligence-source">${intelligence.source}</div>` : ''}
    </div>
  `;
}

// Enhanced prefill using SCRAPED DATA (not inference)
// Customer data → ICP (high confidence - these are REAL customers)
// Partner fit signals → Certifications (high confidence - from their website)
async function generateSmartPrefillWithCustomers(companyData, customerEnrichments) {
  if (!companyData) return;

  // Use normalizer for partner data
  const normalized = normalizeCompanyData(companyData);

  // Normalize customer data
  const customers = customerEnrichments
    .filter(c => c.enriched && c.data)
    .map(c => normalizeCompanyData(c.data));

  // ============================================
  // EXTRACT ICP FROM REAL CUSTOMER DATA
  // ============================================

  // ICP Industries - from actual customer industries
  const customerIndustries = customers
    .map(c => c.industry)
    .filter(Boolean)
    .map(ind => mapIndustryToVertical(ind));
  const icpVerticals = [...new Set(customerIndustries)].slice(0, 5);

  // ICP Headcount - from actual customer sizes
  const customerSizes = customers
    .map(c => mapEmployeesToHeadcount(c.employeesExact || c.employees))
    .filter(Boolean);
  const icpHeadcount = [...new Set(customerSizes)];

  // ICP Revenue - from actual customer revenue
  const customerRevenues = customers
    .map(c => mapRevenueToIcpRevenue(c.revenue))
    .filter(Boolean);
  const icpRevenue = [...new Set(customerRevenues)];

  // ICP Regions - from actual customer locations
  const customerRegions = customers
    .map(c => mapLocationToRegion(c.hqCountry || c.location))
    .filter(Boolean);
  const icpRegions = [...new Set(customerRegions)];

  // ============================================
  // EXTRACT CERTIFICATIONS FROM PARTNER FIT SIGNALS
  // ============================================
  const certifications = extractCertificationsFromSignals(state.partnerFitSignals);

  // ============================================
  // BUILD CONSERVATIVE PREFILL
  // ============================================
  const prefill = {
    // From partner's API data (high confidence)
    location: mapLocationToCode(normalized.hqCountryCode || normalized.hqCountry),
    companyRevenue: mapRevenueToCode(normalized.revenue),

    // From REAL customer data (high confidence)
    icpVerticals: icpVerticals.length > 0 ? icpVerticals : null,
    icpHeadcount: icpHeadcount.length > 0 ? icpHeadcount : null,
    icpRevenue: icpRevenue.length > 0 ? icpRevenue : null,
    icpRegions: icpRegions.length > 0 ? icpRegions : null,

    // From scraped partner badges (high confidence)
    certifications: certifications.length > 0 ? certifications : null,

    // NOT inferring: role, sales motion, deal size, growth goals, etc.
    // Those require user confirmation
  };

  // Clean nulls
  Object.keys(prefill).forEach(key => {
    if (prefill[key] === null) delete prefill[key];
  });

  state.smartPrefill = prefill;
  console.log('📋 Prefill from scraped data:', prefill);
  console.log('   - Based on', customers.length, 'enriched customers');
  console.log('   - Partner signals:', Object.keys(state.partnerFitSignals || {}));

  // Show notification about what was pre-filled
  if (Object.keys(prefill).length > 2) {
    await showScrapedDataPrefillNotification(prefill, customers.length);
  }
}

// ============================================
// MAPPING HELPERS FOR SCRAPED DATA
// ============================================

function mapIndustryToVertical(industry) {
  if (!industry) return null;
  const ind = industry.toLowerCase();

  const mappings = {
    'saas': 'SaaS / Software',
    'software': 'SaaS / Software',
    'technology': 'Technology / IT',
    'information-technology': 'Technology / IT',
    'professional-services': 'Professional Services',
    'consulting': 'Professional Services',
    'financial': 'Financial Services',
    'banking': 'Financial Services',
    'healthcare': 'Healthcare',
    'medical': 'Healthcare',
    'manufacturing': 'Manufacturing',
    'retail': 'Retail / E-commerce',
    'e-commerce': 'Retail / E-commerce',
    'ecommerce': 'Retail / E-commerce',
    'real-estate': 'Real Estate',
    'construction': 'Construction',
    'logistics': 'Logistics / Transportation',
    'transportation': 'Logistics / Transportation',
    'education': 'Education',
    'legal': 'Legal Services',
    'marketing': 'Marketing / Advertising',
    'advertising': 'Marketing / Advertising',
    'energy': 'Energy / Utilities',
    'hospitality': 'Hospitality',
    'insurance': 'Insurance',
    'telecom': 'Telecommunications',
    'automotive': 'Automotive',
    'media': 'Media / Entertainment',
    'entertainment': 'Media / Entertainment'
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (ind.includes(key)) return value;
  }
  return null;
}

function mapEmployeesToHeadcount(employees) {
  if (!employees) return null;

  // Handle exact numbers
  if (typeof employees === 'number') {
    if (employees <= 10) return '1-10';
    if (employees <= 50) return '11-50';
    if (employees <= 200) return '51-200';
    if (employees <= 500) return '201-500';
    if (employees <= 1000) return '501-1000';
    if (employees <= 5000) return '1001-5000';
    return '5000+';
  }

  // Handle string ranges
  const emp = employees.toLowerCase();
  if (emp.includes('1-10') || emp.includes('1 to 10')) return '1-10';
  if (emp.includes('11-50') || emp.includes('11 to 50')) return '11-50';
  if (emp.includes('51-200') || emp.includes('51 to 200')) return '51-200';
  if (emp.includes('201-500') || emp.includes('201 to 500')) return '201-500';
  if (emp.includes('501-1000') || emp.includes('501 to 1000') || emp.includes('501-1k')) return '501-1000';
  if (emp.includes('1001-5000') || emp.includes('1k-5k')) return '1001-5000';
  if (emp.includes('5000+') || emp.includes('5k+') || emp.includes('over-10k') || emp.includes('10k+')) return '5000+';

  return null;
}

function mapRevenueToIcpRevenue(revenue) {
  if (!revenue) return null;
  const r = revenue.toLowerCase();

  if (r.includes('over-1b') || r.includes('1b+') || r.includes('billion')) return '100m+';
  if (r.includes('500m') || r.includes('250m') || r.includes('100m')) return '100m+';
  if (r.includes('50m') || r.includes('50-100m')) return '50-100m';
  if (r.includes('25m') || r.includes('25-50m')) return '25-50m';
  if (r.includes('10m') || r.includes('10-25m')) return '10-25m';
  if (r.includes('5m') || r.includes('5-10m')) return '5-10m';
  if (r.includes('1m') || r.includes('1-5m')) return '1-5m';
  if (r.includes('0-1m') || r.includes('under-1m') || r.includes('500k')) return '0-1m';
  if (r.includes('pre-revenue')) return 'pre-revenue';

  return null;
}

function mapLocationToRegion(location) {
  if (!location) return null;
  const loc = location.toLowerCase();

  if (loc.includes('united states') || loc.includes('usa') || loc === 'us') return 'United States';
  if (loc.includes('canada') || loc === 'ca') return 'Canada';
  if (loc.includes('united kingdom') || loc.includes('uk') || loc === 'gb') return 'United Kingdom';
  if (loc.includes('australia') || loc === 'au') return 'Australia';
  if (loc.includes('europe') || ['de', 'fr', 'es', 'it', 'nl'].some(c => loc.includes(c))) return 'Europe';
  if (['jp', 'cn', 'sg', 'hk', 'kr', 'in'].some(c => loc.includes(c)) ||
      loc.includes('asia') || loc.includes('japan') || loc.includes('china')) return 'APAC';
  if (['mx', 'br', 'ar'].some(c => loc.includes(c)) ||
      loc.includes('latin') || loc.includes('brazil') || loc.includes('mexico')) return 'LATAM';

  return null;
}

function extractCertificationsFromSignals(signals) {
  if (!signals) return [];
  const certs = [];

  if (signals.salesforce) certs.push('Salesforce');
  if (signals.hubspot) certs.push('HubSpot');
  if (signals.microsoft || signals.dynamics) certs.push('Microsoft Dynamics');
  if (signals.pipedrive) certs.push('Pipedrive');
  if (signals.zoho) certs.push('Zoho');
  if (signals.monday) certs.push('Monday.com');

  return certs;
}

async function showScrapedDataPrefillNotification(prefill, customerCount) {
  const fields = [];
  if (prefill.icpVerticals) fields.push(`${prefill.icpVerticals.length} industries`);
  if (prefill.icpHeadcount) fields.push('company sizes');
  if (prefill.icpRevenue) fields.push('revenue ranges');
  if (prefill.certifications) fields.push(`${prefill.certifications.length} certifications`);

  if (fields.length === 0) return;

  const message = `Based on ${customerCount} customer${customerCount > 1 ? 's' : ''} from your website, I've pre-filled: ${fields.join(', ')}. You can adjust these.`;

  // Add a subtle notification message
  const notificationDiv = document.createElement('div');
  notificationDiv.className = 'message message-assistant prefill-notification';
  notificationDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text prefill-message">
        <span class="prefill-icon">✨</span>
        ${message}
      </div>
    </div>
  `;
  chatMessagesInner.appendChild(notificationDiv);
  scrollToBottom();
}


// ============================================
// SUMMARY & SUBMISSION
// ============================================

function renderSummary() {
  const data = state.formData;
  const enrichedCompany = state.enrichedCompany || {};
  const competitors = state.competitorSignals || [];
  const fitSignals = state.partnerFitSignals || {};

  // Calculate assessment metrics for the comparison
  const assessmentData = calculateAssessmentMetrics(data, enrichedCompany, competitors, fitSignals);
  const { tier, tierColor, tierIcon } = getPartnerTier(assessmentData.overallScore);

  return `
    <div class="chat-component" style="max-width: 100%;">
      <div class="chat-component-header" style="display: flex; align-items: center; justify-content: space-between;">
        <span>📊 Partner Profile Analysis</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Alignment Score:</span>
          <span style="font-size: 18px; font-weight: 700; color: ${tierColor};">${assessmentData.overallScore}</span>
        </div>
      </div>
      <div class="chat-component-body" style="padding: 0;">
        <!-- Comparison Table -->
        <div class="comparison-table" style="border: none; border-radius: 0;">
          <div class="comparison-header">
            <div class="comparison-header-cell">Metric</div>
            <div class="comparison-header-cell partner-col">${data.companyName || 'Your Company'}</div>
            <div class="comparison-header-cell ideal-col">SalesAI Ideal Partner</div>
          </div>

          ${generateComparisonRow('Target Customer Revenue',
            formatArray(data.icpRevenue) || 'Not specified',
            '$1M - $50M+ (Mid-market)',
            assessmentData.revenueMatch
          )}

          ${generateComparisonRow('Primary Verticals',
            formatVerticalTags(data.icpVerticals, PERFECT_PARTNER_PROFILE.icpAlignment.idealVerticals),
            formatVerticalTags(PERFECT_PARTNER_PROFILE.icpAlignment.idealVerticals.slice(0, 3), PERFECT_PARTNER_PROFILE.icpAlignment.idealVerticals),
            assessmentData.verticalsMatch
          )}

          ${generateComparisonRow('Sales Motion',
            formatValue(data.salesMotion) || 'Not specified',
            'Direct or Hybrid',
            assessmentData.salesMotionMatch
          )}

          ${generateComparisonRow('Average Deal Size',
            formatValue(data.avgDealSize) || 'Not specified',
            '$25K+ ACV',
            assessmentData.dealSizeMatch
          )}

          ${generateComparisonRow('Monthly Lead Capacity',
            formatValue(data.leadsPerMonth) || 'Not specified',
            '10+ qualified leads/month',
            assessmentData.leadCapacityMatch
          )}

          ${generateComparisonRow('Partnership Model',
            formatArray(data.partnershipType) || 'Not specified',
            'Multi-model (Referral + Resell)',
            assessmentData.partnershipMatch
          )}

          ${generateComparisonRow('Service Capabilities',
            formatArray(data.services) || 'Not specified',
            'Full-service implementation',
            assessmentData.servicesMatch
          )}
        </div>

        <!-- Insights -->
        <div style="padding: 16px; border-top: 1px solid #1e1e2e;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            ${assessmentData.strengths.length > 0 ? `
              <div>
                <div style="font-size: 12px; font-weight: 600; color: #22c55e; margin-bottom: 8px;">💪 Key Strengths</div>
                <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #aaa;">
                  ${assessmentData.strengths.slice(0, 3).map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${assessmentData.opportunities.length > 0 ? `
              <div>
                <div style="font-size: 12px; font-weight: 600; color: #3b82f6; margin-bottom: 8px;">🎯 Growth Opportunities</div>
                <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #aaa;">
                  ${assessmentData.opportunities.slice(0, 3).map(o => `<li style="margin-bottom: 4px;">${o}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Tier Badge -->
        <div style="padding: 12px 16px; background: rgba(255,255,255,0.02); border-top: 1px solid #1e1e2e; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${tierIcon}</span>
            <span style="font-size: 12px; color: #888;">Recommended Tier:</span>
            <span style="font-size: 14px; font-weight: 600; color: ${tierColor};">${tier} Partner</span>
          </div>
          <div style="font-size: 11px; color: #666;">Based on ${assessmentData.dataPointsAnalyzed} data points</div>
        </div>
      </div>
    </div>
  `;
}

function renderPartnerStackPreview() {
  const payload = mapToPartnerStackPayload();
  const data = state.formData;
  const enrichedCompany = state.enrichedCompany || {};

  // Helper to create an editable field
  const editableField = (key, label, value, fieldType = 'text') => {
    const displayValue = Array.isArray(value) ? value.join(', ') : (value || '—');
    const isEmpty = !value || (Array.isArray(value) && value.length === 0);

    return `
      <div class="ps-preview-field" data-field-key="${key}" data-field-type="${fieldType}">
        <div class="ps-preview-label">${label}</div>
        <div class="ps-preview-value ${isEmpty ? 'empty' : ''}" data-original="${encodeURIComponent(displayValue)}">
          <span class="ps-value-text">${displayValue}</span>
          <svg class="ps-edit-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
      </div>
    `;
  };

  // Build the preview sections
  return `
    <div class="chat-component ps-preview-container" style="max-width: 100%;">
      <div class="chat-component-header">
        <span>📋 PartnerStack Account Preview</span>
        <span class="ps-preview-hint">Click any field to edit</span>
      </div>
      <div class="chat-component-body ps-preview-body">

        <!-- Personal Information -->
        <div class="ps-preview-section">
          <div class="ps-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Personal Information
          </div>
          <div class="ps-preview-fields">
            ${editableField('firstName', 'First Name', data.firstName)}
            ${editableField('lastName', 'Last Name', data.lastName)}
            ${editableField('email', 'Email', data.email, 'email')}
            ${editableField('phone', 'Phone', data.phone, 'tel')}
            ${editableField('role', 'Role/Title', data.role)}
          </div>
        </div>

        <!-- Company Information -->
        <div class="ps-preview-section">
          <div class="ps-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Company Information
          </div>
          <div class="ps-preview-fields">
            ${editableField('companyName', 'Company Name', data.companyName)}
            ${editableField('website', 'Website', data.website || enrichedCompany.domain, 'url')}
            ${editableField('companyRevenue', 'Annual Revenue', formatRevenueRange(data.companyRevenue))}
            ${editableField('teamSize', 'Team Size', data.teamSize)}
            ${editableField('hq', 'Headquarters', data.hq || enrichedCompany.headquarters)}
          </div>
        </div>

        <!-- ICP & Target Market -->
        <div class="ps-preview-section">
          <div class="ps-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            ICP & Target Market
          </div>
          <div class="ps-preview-fields">
            ${editableField('icpVerticals', 'Target Verticals', data.icpVerticals, 'tags')}
            ${editableField('icpRevenue', 'Target Customer Revenue', data.icpRevenue, 'tags')}
            ${editableField('icpLocations', 'Target Regions', data.icpLocations, 'tags')}
          </div>
        </div>

        <!-- Sales & Partnership -->
        <div class="ps-preview-section">
          <div class="ps-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Sales & Partnership
          </div>
          <div class="ps-preview-fields">
            ${editableField('salesMotion', 'Sales Motion', formatSalesMotion(data.salesMotion))}
            ${editableField('avgDealSize', 'Average Deal Size', formatDealSize(data.avgDealSize))}
            ${editableField('leadsPerMonth', 'Monthly Lead Capacity', formatLeadCapacity(data.leadsPerMonth))}
            ${editableField('partnershipType', 'Partnership Model', data.partnershipType, 'tags')}
            ${editableField('services', 'Services Offered', data.services, 'tags')}
          </div>
        </div>

        <!-- Partnership Tier -->
        <div class="ps-preview-tier">
          <div class="ps-tier-label">Assigned Partner Tier</div>
          <div class="ps-tier-value" style="color: ${getPartnerTier(calculateAssessmentMetrics(data, enrichedCompany, state.competitorSignals || [], state.partnerFitSignals || {}).overallScore).tierColor}">
            ${getPartnerTier(calculateAssessmentMetrics(data, enrichedCompany, state.competitorSignals || [], state.partnerFitSignals || {}).overallScore).tier}
          </div>
          <div class="ps-tier-note">Based on your profile analysis</div>
        </div>

      </div>
    </div>
  `;
}

// Helper formatters for PartnerStack preview
function formatRevenueRange(value) {
  const ranges = {
    'pre-revenue': 'Pre-revenue',
    '0-500k': '$0 - $500K',
    '500k-1m': '$500K - $1M',
    '1-5m': '$1M - $5M',
    '5-10m': '$5M - $10M',
    '10m+': '$10M+'
  };
  return ranges[value] || value;
}

function formatSalesMotion(value) {
  const motions = {
    'direct': 'Direct Sales',
    'channel': 'Channel/Partner',
    'hybrid': 'Hybrid (Direct + Channel)',
    'product-led': 'Product-Led Growth'
  };
  return motions[value] || value;
}

function formatDealSize(value) {
  const sizes = {
    '<5k': 'Under $5K',
    '5-25k': '$5K - $25K',
    '25-100k': '$25K - $100K',
    '100k+': '$100K+'
  };
  return sizes[value] || value;
}

function formatLeadCapacity(value) {
  const capacities = {
    '1-5': '1-5 leads/month',
    '6-10': '6-10 leads/month',
    '11-25': '11-25 leads/month',
    '25+': '25+ leads/month'
  };
  return capacities[value] || value;
}

function renderSandboxNotification() {
  const data = state.formData;
  const result = state.partnerStackResult || {};

  return `
    <div class="chat-component sandbox-notification" style="max-width: 100%;">
      <div class="chat-component-body" style="padding: 0;">
        <!-- Sandbox Card -->
        <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <div style="display: flex; align-items: flex-start; gap: 16px;">
            <div style="width: 56px; height: 56px; background: rgba(34, 197, 94, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #e5e5e5;">Your SalesAI Sandbox is Ready</h3>
              <p style="margin: 0; font-size: 14px; color: #aaa; line-height: 1.5;">
                We've provisioned a full demo environment for you to explore SalesAI's capabilities. Use it to run demos, train your team, and understand exactly how to position SalesAI to your prospects.
              </p>
            </div>
          </div>
        </div>

        <!-- Sandbox Details -->
        <div style="padding: 20px; border-top: 1px solid #1e1e2e;">
          <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Sandbox Access Details</div>
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
              <span style="font-size: 13px; color: #888;">Environment</span>
              <span style="font-size: 13px; color: #22c55e; font-weight: 500;">sandbox.salesai.com</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
              <span style="font-size: 13px; color: #888;">Login Email</span>
              <span style="font-size: 13px; color: #e5e5e5;">${data.email}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
              <span style="font-size: 13px; color: #888;">Access Period</span>
              <span style="font-size: 13px; color: #e5e5e5;">30 days (renewable)</span>
            </div>
          </div>
        </div>

        <!-- What's Included -->
        <div style="padding: 20px; border-top: 1px solid #1e1e2e; background: rgba(255,255,255,0.01);">
          <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">What's Included</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #aaa;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Sample opportunity data
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #aaa;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              AI-powered analysis tools
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #aaa;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Demo scripts & playbooks
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #aaa;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Training resources
            </div>
          </div>
        </div>

        <!-- Email Note -->
        <div style="padding: 16px 20px; background: rgba(59, 130, 246, 0.1); border-top: 1px solid rgba(59, 130, 246, 0.2);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style="font-size: 13px; color: #3b82f6;">Check your email for login instructions and getting started guide</span>
          </div>
        </div>
      </div>
    </div>
    <button class="chat-continue-btn sandbox-continue" style="margin-top: 12px;">Got it, what's next? →</button>
  `;
}

function renderExtensionIntro() {
  const data = state.formData;

  return `
    <div class="chat-component extension-intro" style="max-width: 100%;">
      <div class="chat-component-body" style="padding: 0;">
        <!-- Extension Header -->
        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <div style="display: flex; align-items: flex-start; gap: 16px;">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #e5e5e5;">U4IA Chrome Extension</h3>
              <p style="margin: 0; font-size: 14px; color: #aaa; line-height: 1.5;">
                The secret weapon that turns your everyday Gmail conversations into qualified opportunities — automatically.
              </p>
            </div>
          </div>
        </div>

        <!-- How It Works -->
        <div style="padding: 20px;">
          <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">How It Works</div>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: flex-start; gap: 14px;">
              <div style="width: 32px; height: 32px; background: rgba(139, 92, 246, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 600; color: #8b5cf6;">1</div>
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #e5e5e5; margin-bottom: 4px;">Scans Your Gmail (Privacy-First)</div>
                <div style="font-size: 13px; color: #888;">Analyzes external conversations only — internal emails never leave your browser.</div>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 14px;">
              <div style="width: 32px; height: 32px; background: rgba(139, 92, 246, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 600; color: #8b5cf6;">2</div>
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #e5e5e5; margin-bottom: 4px;">Identifies SalesAI-Fit Prospects</div>
                <div style="font-size: 13px; color: #888;">AI matches conversations against SalesAI's ideal customer profile.</div>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 14px;">
              <div style="width: 32px; height: 32px; background: rgba(139, 92, 246, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 600; color: #8b5cf6;">3</div>
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #e5e5e5; margin-bottom: 4px;">Shows You the Money</div>
                <div style="font-size: 13px; color: #888;">See potential commission for each opportunity before you make an intro.</div>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 14px;">
              <div style="width: 32px; height: 32px; background: rgba(34, 197, 94, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 600; color: #22c55e;">$</div>
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #e5e5e5; margin-bottom: 4px;">Generates Warm Intro Drafts</div>
                <div style="font-size: 13px; color: #888;">One-click personalized emails to connect your contact with SalesAI.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Team Benefit -->
        <div style="padding: 20px; border-top: 1px solid #1e1e2e; background: rgba(255,255,255,0.02);">
          <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            For Your Entire Team
          </div>
          <p style="margin: 0 0 12px; font-size: 13px; color: #aaa; line-height: 1.6;">
            Every person at <strong style="color: #e5e5e5;">${data.companyName || 'your company'}</strong> who installs the extension becomes a warm lead source.
            Sales, CS, leadership — anyone talking to prospects who might need AI-powered sales development.
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span style="padding: 4px 10px; background: rgba(139, 92, 246, 0.1); border-radius: 4px; font-size: 11px; color: #8b5cf6;">Founders</span>
            <span style="padding: 4px 10px; background: rgba(139, 92, 246, 0.1); border-radius: 4px; font-size: 11px; color: #8b5cf6;">Sales Reps</span>
            <span style="padding: 4px 10px; background: rgba(139, 92, 246, 0.1); border-radius: 4px; font-size: 11px; color: #8b5cf6;">Customer Success</span>
            <span style="padding: 4px 10px; background: rgba(139, 92, 246, 0.1); border-radius: 4px; font-size: 11px; color: #8b5cf6;">Consultants</span>
          </div>
        </div>

        <!-- Install CTA -->
        <div style="padding: 20px; border-top: 1px solid #1e1e2e;">
          <a href="https://chrome.google.com/webstore/detail/u4ia" target="_blank" class="extension-install-btn" style="display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); border: none; border-radius: 8px; color: white; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.2s ease;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="21.17" y1="8" x2="12" y2="8"/>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
            </svg>
            Install Chrome Extension
          </a>
          <p style="margin: 12px 0 0; text-align: center; font-size: 12px; color: #666;">
            Free to install • Works with Google Workspace
          </p>
        </div>
      </div>
    </div>
    <button class="chat-continue-btn extension-continue" style="margin-top: 12px;">Continue →</button>
  `;
}

function renderCalendarEmbed() {
  const data = state.formData;

  return `
    <div class="chat-component calendar-embed" style="max-width: 100%;">
      <div class="chat-component-body" style="padding: 0;">
        <!-- Calendar Header -->
        <div style="padding: 20px; border-bottom: 1px solid #1e1e2e;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; background: rgba(34, 197, 94, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div style="font-size: 16px; font-weight: 600; color: #e5e5e5;">Partner Onboarding Call</div>
              <div style="font-size: 13px; color: #888;">30 minutes with Blake Williams</div>
            </div>
          </div>
          <p style="margin: 0; font-size: 13px; color: #aaa; line-height: 1.5;">
            We'll walk through your sandbox, answer questions, and map out your first 30 days as a partner.
          </p>
        </div>

        <!-- Calendar Embed Placeholder -->
        <div id="calendar-embed-container" style="padding: 20px; min-height: 400px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02);">
          <!-- Calendly or other embed will go here -->
          <div style="text-align: center; color: #666;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
            <p style="margin: 0 0 8px; font-size: 14px;">Calendar loading...</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">Select a time that works for you</p>
          </div>
        </div>

        <!-- Alternative -->
        <div style="padding: 16px 20px; border-top: 1px solid #1e1e2e; text-align: center;">
          <span style="font-size: 12px; color: #666;">
            Prefer email? Reach out at <a href="mailto:blake@salesai.com" style="color: #22c55e; text-decoration: none;">blake@salesai.com</a>
          </span>
        </div>
      </div>
    </div>
    <button class="chat-continue-btn calendar-continue" style="margin-top: 12px;">I've booked my call →</button>
  `;
}

function addFinalWrapUp() {
  // Just show the message, no additional button needed
  const wrapUpDiv = document.createElement('div');
  wrapUpDiv.className = 'message message-assistant';
  wrapUpDiv.innerHTML = `
    <div class="message-content" style="padding-bottom: 40px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="font-size: 32px;">🎉</div>
        <div style="font-size: 18px; font-weight: 600; color: #22c55e;">You're All Set!</div>
      </div>
      <p style="margin: 0 0 16px; font-size: 14px; color: #aaa; line-height: 1.6;">
        Welcome to the SalesAI partner family! You're now ready to start identifying and referring opportunities.
      </p>
      <div style="background: rgba(34, 197, 94, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 600; color: #888; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Quick Links</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="https://partners.salesai.com" target="_blank" style="display: flex; align-items: center; gap: 8px; color: #22c55e; text-decoration: none; font-size: 13px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Partner Portal (PartnerStack)
          </a>
          <a href="https://sandbox.salesai.com" target="_blank" style="display: flex; align-items: center; gap: 8px; color: #22c55e; text-decoration: none; font-size: 13px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            SalesAI Sandbox
          </a>
          <a href="https://chrome.google.com/webstore/detail/u4ia" target="_blank" style="display: flex; align-items: center; gap: 8px; color: #22c55e; text-decoration: none; font-size: 13px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            Chrome Extension
          </a>
        </div>
      </div>
      <p style="margin: 0; font-size: 13px; color: #666;">
        Questions? Reply to any email from us or reach out at <a href="mailto:partners@salesai.com" style="color: #22c55e;">partners@salesai.com</a>
      </p>
    </div>
  `;
  chatMessagesInner.appendChild(wrapUpDiv);
  scrollToBottom();

  // Mark onboarding complete in sidebar
  updateMilestoneStatus('partnerstack', 'completed');
}

function addPartnerStackSignupButton() {
  const btnDiv = document.createElement('div');
  btnDiv.className = 'message message-assistant';
  btnDiv.innerHTML = `
    <div class="message-content">
      <button class="ps-signup-btn" id="partnerstack-signup-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Create My Partner Account
      </button>
    </div>
  `;
  chatMessagesInner.appendChild(btnDiv);
  scrollToBottom();

  document.getElementById('partnerstack-signup-btn').addEventListener('click', createPartnerAccount);
}

async function createPartnerAccount() {
  const btn = document.getElementById('partnerstack-signup-btn');

  // Disable and show loading state
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = `
    <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
    Creating your account...
  `;

  try {
    // Submit to PartnerStack
    const result = await submitToPartnerStack();

    if (result.success) {
      // Success state
      btn.classList.remove('loading');
      btn.classList.add('success');
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Account Created Successfully!
      `;

      // Store result for later use
      state.partnerStackResult = result;

      // Wait a moment then continue the flow (sandbox, extension, calendar)
      await delay(1500);
      currentFlowIndex++;
      processNextStep();
    } else {
      // Error state
      btn.classList.remove('loading');
      btn.classList.add('error');
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Error - Click to Retry
      `;

      // Allow retry
      setTimeout(() => {
        btn.classList.remove('error');
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Create My Partner Account
        `;
      }, 3000);
    }
  } catch (error) {
    console.error('Partner account creation failed:', error);
    btn.classList.remove('loading');
    btn.classList.add('error');
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      Error - Click to Retry
    `;
  }
}

function showPartnerAccountSuccess(result) {
  const data = state.formData;
  const modal = document.getElementById('success-modal');
  const content = document.getElementById('success-content');

  content.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(34, 197, 94, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 style="margin: 0 0 8px; color: #e5e5e5; font-size: 24px;">Welcome to the Partner Program!</h2>
      <p style="margin: 0 0 24px; color: #888; font-size: 14px;">
        Your partner account has been created, ${data.firstName}!
      </p>
    </div>

    <div style="background: rgba(34, 197, 94, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 600; color: #22c55e; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</div>
      <div style="display: grid; gap: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #888;">Partner Email</span>
          <span style="color: #e5e5e5;">${result.partnership?.email || data.email}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #888;">Company</span>
          <span style="color: #e5e5e5;">${result.partnership?.name || data.companyName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #888;">Partner Tier</span>
          <span style="color: #22c55e; font-weight: 600;">${result.partnership?.tier || 'STANDARD'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #888;">Status</span>
          <span style="color: #22c55e;">${result.partnership?.status === 'active' ? 'Active' : 'Pending Activation'}</span>
        </div>
      </div>
    </div>

    <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 20px;">
      <div style="font-size: 12px; font-weight: 600; color: #888; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">What's Next?</div>
      <ul style="margin: 0; padding-left: 20px; color: #aaa; font-size: 13px; line-height: 1.8;">
        <li>Check your email for portal access instructions</li>
        <li>Complete your partner profile in PartnerStack</li>
        <li>Access training materials and certification paths</li>
        <li>Start submitting leads and tracking commissions</li>
      </ul>
    </div>

    ${result.simulated ? `
      <div style="margin-top: 16px; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.2);">
        <div style="display: flex; align-items: center; gap: 8px; color: #fbbf24; font-size: 12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Demo Mode - This is a simulated account creation</span>
        </div>
      </div>
    ` : ''}
  `;

  // Update the button text
  const modalBtn = modal.querySelector('.btn-primary');
  if (modalBtn) {
    modalBtn.textContent = 'Go to Partner Portal';
    modalBtn.onclick = () => {
      if (result.portalUrl) {
        window.open(result.portalUrl, '_blank');
      }
      closeModal();
    };
  }

  modal.classList.add('active');
}

// Legacy function for viewing assessment (kept for compatibility)
async function submitApplication() {
  const btn = document.getElementById('submit-application');
  btn.disabled = true;
  btn.innerHTML = 'Analyzing your partnership fit...';

  // Calculate score
  const score = calculateScore();
  state.score = score;

  // Simulate processing
  await delay(1000);
  btn.innerHTML = 'Generating assessment report...';
  await delay(1000);

  // Show assessment report instead of modal
  showAssessmentReport();
}

function calculateScore() {
  let score = 0;
  const data = state.formData;

  // Revenue scoring
  if (['1-5m', '5-10m', '10m+'].includes(data.companyRevenue)) score += 15;
  else if (data.companyRevenue === '500k-1m') score += 10;
  else score += 5;

  // ICP alignment
  if (data.icpVerticals?.length >= 3) score += 10;
  if (data.icpRevenue?.length >= 2) score += 10;

  // Sales capability
  if (['direct', 'hybrid'].includes(data.salesMotion)) score += 10;
  if (data.avgDealSize === '25-100k' || data.avgDealSize === '100k+') score += 10;

  // Partnership potential
  if (data.leadsPerMonth === '11-25' || data.leadsPerMonth === '25+') score += 15;
  else if (data.leadsPerMonth === '6-10') score += 10;
  else score += 5;

  // Services
  if (data.services?.length >= 3) score += 10;
  if (data.certifications?.length >= 2) score += 10;

  // Engagement
  if (data.successCriteria?.length > 50) score += 10;

  return Math.min(score, 100);
}

function showSuccessModal() {
  const modal = document.getElementById('success-modal');
  const content = document.getElementById('success-content');

  content.innerHTML = `
    <p>Welcome to the SalesAI Partner Family, ${state.formData.firstName}!</p>
    <p>Your Partner Portal is ready. Inside you'll find:</p>
    <ul style="margin: 16px 0; padding-left: 20px; color: #aaa;">
      <li>Partner dashboard & analytics</li>
      <li>Lead submission portal</li>
      <li>Marketing resources & co-branded materials</li>
      <li>Training & certification paths</li>
      <li>Dedicated partner support</li>
    </ul>
    <p>We're thrilled to have you on board!</p>
  `;

  modal.classList.add('active');
}

function showReviewModal() {
  const modal = document.getElementById('disqualified-modal');
  const content = document.getElementById('disqualified-content');

  content.innerHTML = `
    <p>Thanks for your interest in partnering with SalesAI, ${state.formData.firstName}!</p>
    <p>Our partner team will review your application and reach out within 2-3 business days to discuss next steps.</p>
    <p>In the meantime, feel free to explore our resources and learn more about how SalesAI can help your clients.</p>
  `;

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('success-modal').classList.remove('active');
}

function closeDisqualifiedModal() {
  document.getElementById('disqualified-modal').classList.remove('active');
}

// ============================================
// PARTNER ASSESSMENT REPORT
// ============================================

// SalesAI Perfect Partner Profile definition
const PERFECT_PARTNER_PROFILE = {
  icpAlignment: {
    label: 'ICP Alignment',
    ideal: 'B2B sales teams, $1M-$50M revenue, 10-500 employees',
    idealVerticals: ['SaaS / Software', 'Professional Services', 'Financial Services', 'Technology'],
    description: 'Focus on companies with active outbound sales teams'
  },
  revenueRange: {
    label: 'Target Customer Revenue',
    ideal: ['1-5m', '5-10m', '10m+'],
    description: 'Mid-market and enterprise focus'
  },
  salesMotion: {
    label: 'Sales Motion',
    ideal: ['direct', 'hybrid'],
    description: 'Direct or hybrid sales approach with dedicated reps'
  },
  dealSize: {
    label: 'Average Deal Size',
    ideal: ['25-100k', '100k+'],
    good: ['10-25k'],
    description: '$25K+ ACV preferred'
  },
  leadCapacity: {
    label: 'Monthly Lead Capacity',
    ideal: ['11-25', '25+'],
    good: ['6-10'],
    description: '10+ qualified leads per month'
  },
  partnershipTypes: {
    label: 'Partnership Model',
    ideal: ['Referral Partner', 'Reseller', 'Implementation Partner'],
    description: 'Multi-channel partnership capability'
  },
  services: {
    label: 'Service Capabilities',
    ideal: ['CRM Implementation', 'Sales Consulting', 'Training & Enablement', 'Managed Services'],
    description: 'Full-service delivery capability'
  },
  techStack: {
    label: 'Tech Ecosystem',
    ideal: ['HubSpot', 'Salesforce', 'Outreach', 'Gong'],
    description: 'CRM and sales tech expertise'
  },
  aiExperience: {
    label: 'AI Sales Experience',
    ideal: true,
    competitors: AI_SALES_COMPETITORS.map(c => c.name),
    description: 'Prior AI sales tool experience'
  }
};

function generateAssessmentReport() {
  const data = state.formData;
  const enrichedCompany = state.enrichedCompany || {};
  const competitors = state.competitorSignals || [];
  const fitSignals = state.partnerFitSignals || {};
  const customerEnrichments = state.customerEnrichments || [];
  const readinessScore = state.partnerReadinessScore || state.score;

  // Calculate match scores for each dimension
  const assessmentData = calculateAssessmentMetrics(data, enrichedCompany, competitors, fitSignals);

  // Determine tier
  const { tier, tierColor, tierIcon } = getPartnerTier(assessmentData.overallScore);

  // Generate report ID
  const reportId = `SAI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const reportHTML = `
    <!-- Score Banner -->
    <div class="assessment-score-banner" style="--score: ${assessmentData.overallScore}; --score-color: ${tierColor};">
      <div class="score-banner-left">
        <div class="score-ring" style="--score: ${assessmentData.overallScore}; --score-color: ${tierColor};">
          <div class="score-ring-inner">
            <div class="score-ring-value">${assessmentData.overallScore}</div>
            <div class="score-ring-label">Score</div>
          </div>
        </div>
        <div class="score-banner-info">
          <h2>Strong Partnership Alignment</h2>
          <p>Based on ${assessmentData.dataPointsAnalyzed} data points from company enrichment, website analysis, customer discovery, and your application responses.</p>
        </div>
      </div>
      <div class="score-banner-right">
        <div class="partner-tier-badge" style="--tier-color: ${tierColor};">
          <span class="tier-badge-icon">${tierIcon}</span>
          <div class="tier-badge-content">
            <div class="tier-badge-label">Recommended Tier</div>
            <div class="tier-badge-name">${tier} Partner</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Partner vs Perfect Partner Comparison -->
    <div class="comparison-section">
      <h3 class="comparison-section-title">
        <span class="section-icon">📊</span>
        Partner Profile Comparison
      </h3>
      <div class="comparison-table">
        <div class="comparison-header">
          <div class="comparison-header-cell">Metric</div>
          <div class="comparison-header-cell partner-col">${data.companyName || 'Your Company'}</div>
          <div class="comparison-header-cell ideal-col">SalesAI Perfect Partner</div>
        </div>

        ${generateComparisonRow('ICP & Target Market',
          formatPartnerICP(data),
          PERFECT_PARTNER_PROFILE.icpAlignment.ideal,
          assessmentData.icpMatch
        )}

        ${generateComparisonRow('Target Customer Revenue',
          formatArray(data.icpRevenue) || 'Not specified',
          '$1M - $50M+ (Mid-market focus)',
          assessmentData.revenueMatch
        )}

        ${generateComparisonRow('Primary Verticals',
          formatVerticalTags(data.icpVerticals, PERFECT_PARTNER_PROFILE.icpAlignment.idealVerticals),
          formatVerticalTags(PERFECT_PARTNER_PROFILE.icpAlignment.idealVerticals, PERFECT_PARTNER_PROFILE.icpAlignment.idealVerticals),
          assessmentData.verticalsMatch
        )}

        ${generateComparisonRow('Sales Motion',
          formatValue(data.salesMotion) || 'Not specified',
          'Direct or Hybrid',
          assessmentData.salesMotionMatch
        )}

        ${generateComparisonRow('Average Deal Size',
          formatValue(data.avgDealSize) || 'Not specified',
          '$25K+ ACV',
          assessmentData.dealSizeMatch
        )}

        ${generateComparisonRow('Monthly Lead Capacity',
          formatValue(data.leadsPerMonth) || 'Not specified',
          '10+ qualified leads/month',
          assessmentData.leadCapacityMatch
        )}

        ${generateComparisonRow('Partnership Model',
          formatArray(data.partnershipType) || 'Not specified',
          'Multi-model (Referral + Resell + Implement)',
          assessmentData.partnershipMatch
        )}

        ${generateComparisonRow('Service Capabilities',
          formatArray(data.services) || 'Not specified',
          'Full-service (CRM, Consulting, Training, Managed)',
          assessmentData.servicesMatch
        )}

        ${generateComparisonRow('Tech Ecosystem',
          fitSignals.crmEcosystem?.length > 0 ? fitSignals.crmEcosystem.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') : 'Not detected',
          'HubSpot, Salesforce, Outreach, Gong',
          assessmentData.techMatch
        )}

        ${generateComparisonRow('AI Sales Experience',
          competitors.length > 0 ? competitors.map(c => c.name).join(', ') : 'None detected',
          'Prior AI sales tool experience',
          assessmentData.aiExperienceMatch
        )}
      </div>
    </div>

    <!-- Insights Grid -->
    <div class="insights-grid">
      <div class="insight-card">
        <div class="insight-card-header">
          <div class="insight-card-icon strength">💪</div>
          <div class="insight-card-title">Key Strengths</div>
        </div>
        <div class="insight-card-content">
          <ul>
            ${assessmentData.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="insight-card">
        <div class="insight-card-header">
          <div class="insight-card-icon opportunity">🎯</div>
          <div class="insight-card-title">Growth Opportunities</div>
        </div>
        <div class="insight-card-content">
          <ul>
            ${assessmentData.opportunities.map(o => `<li>${o}</li>`).join('')}
          </ul>
        </div>
      </div>

      ${competitors.length > 0 ? `
        <div class="insight-card">
          <div class="insight-card-header">
            <div class="insight-card-icon signal">🔥</div>
            <div class="insight-card-title">PRO Partner Signals</div>
          </div>
          <div class="insight-card-content">
            <p>Already working with AI sales platforms:</p>
            <ul>
              ${competitors.slice(0, 4).map(c => `<li><strong>${c.name}</strong> (${c.category})${c.isPartner ? ' — Certified Partner' : ''}</li>`).join('')}
            </ul>
            <p style="margin-top: 12px; color: #22c55e;">This indicates immediate transact capability.</p>
          </div>
        </div>
      ` : ''}

      <div class="insight-card">
        <div class="insight-card-header">
          <div class="insight-card-icon action">🚀</div>
          <div class="insight-card-title">Recommended Next Steps</div>
        </div>
        <div class="insight-card-content">
          <ul>
            ${assessmentData.nextSteps.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- Customer Intelligence (if available) -->
    ${customerEnrichments.length > 0 ? `
      <div class="comparison-section">
        <h3 class="comparison-section-title">
          <span class="section-icon">👥</span>
          Customer Intelligence
        </h3>
        <div class="insight-card" style="margin-bottom: 0;">
          <div class="insight-card-content">
            <p>We analyzed <strong>${customerEnrichments.length} of your customers</strong> to triangulate your ideal customer profile:</p>
            <ul style="margin-top: 12px;">
              ${customerEnrichments.slice(0, 5).map(c => `
                <li><strong>${c.name || c.domain}</strong>${c.industry ? ` — ${c.industry}` : ''}${c.employeeCount ? `, ${c.employeeCount} employees` : ''}</li>
              `).join('')}
            </ul>
            ${state.smartPrefill?.icpInsights ? `
              <p style="margin-top: 16px; padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 3px solid #22c55e;">
                <em>"${state.smartPrefill.icpInsights}"</em>
              </p>
            ` : ''}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Better Together Story (in Partner's Voice) -->
    ${state.betterTogetherInsights?.partnerVoiceStory ? `
      <div class="comparison-section better-together-section">
        <h3 class="comparison-section-title">
          <span class="section-icon">🤝</span>
          Better Together: Your Partnership Story
        </h3>
        <div class="partner-voice-story">
          <div class="story-elevator">
            <div class="story-elevator-quote">"${state.betterTogetherInsights.partnerVoiceStory.elevator}"</div>
          </div>

          <div class="story-grid">
            <div class="story-card pain">
              <div class="story-card-header">
                <div class="story-card-icon">🎯</div>
                <div class="story-card-title">The Challenge</div>
              </div>
              <p>${state.betterTogetherInsights.partnerVoiceStory.painStatement}</p>
            </div>

            <div class="story-card outcome">
              <div class="story-card-header">
                <div class="story-card-icon">📈</div>
                <div class="story-card-title">The Outcome</div>
              </div>
              <p>${state.betterTogetherInsights.partnerVoiceStory.outcomeStatement}</p>
            </div>
          </div>

          <div class="story-value-props">
            <div class="story-value-props-header">What We Deliver Together</div>
            <ul class="story-value-props-list">
              ${(state.betterTogetherInsights.partnerVoiceStory.valueProps || []).map(vp => `
                <li>
                  <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  ${vp}
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="story-customer-narrative">
            <div class="story-narrative-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
              Your Customer's Journey
            </div>
            <p>${state.betterTogetherInsights.partnerVoiceStory.customerStory}</p>
          </div>

          ${state.betterTogetherInsights.partnerVoiceStory.callToAction ? `
            <div class="story-cta">
              ${state.betterTogetherInsights.partnerVoiceStory.callToAction}
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Data Sources -->
    <div class="data-sources">
      <div class="data-sources-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        Data Sources Used in This Assessment
      </div>
      <div class="data-sources-grid">
        <div class="data-source-item">
          <div class="data-source-icon">🏢</div>
          <div class="data-source-info">
            <div class="data-source-name">Company Enrichment</div>
            <div class="data-source-status">${enrichedCompany?.name ? 'Verified' : 'Application Data'}</div>
          </div>
        </div>
        <div class="data-source-item">
          <div class="data-source-icon">🌐</div>
          <div class="data-source-info">
            <div class="data-source-name">Website Analysis</div>
            <div class="data-source-status">${Object.keys(fitSignals).length > 0 ? 'Analyzed' : 'Pending'}</div>
          </div>
        </div>
        <div class="data-source-item">
          <div class="data-source-icon">👥</div>
          <div class="data-source-info">
            <div class="data-source-name">Customer Discovery</div>
            <div class="data-source-status">${customerEnrichments.length > 0 ? `${customerEnrichments.length} found` : 'Not available'}</div>
          </div>
        </div>
        <div class="data-source-item">
          <div class="data-source-icon">🤖</div>
          <div class="data-source-info">
            <div class="data-source-name">AI Analysis</div>
            <div class="data-source-status">${state.smartPrefill ? 'Complete' : 'Not run'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Footer -->
    <div class="report-footer">
      <div class="report-timestamp">Report generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      <div class="report-id">Report ID: ${reportId}</div>
    </div>
  `;

  return { html: reportHTML, reportId, tier, score: assessmentData.overallScore };
}

function calculateAssessmentMetrics(data, enrichedCompany, competitors, fitSignals) {
  let dataPointsAnalyzed = 0;
  const strengths = [];
  const opportunities = [];
  const nextSteps = [];

  // ICP Match
  let icpMatch = 'partial';
  if (data.icpRevenue?.length >= 2) {
    icpMatch = 'good';
    dataPointsAnalyzed++;
  }
  if (data.icpRevenue?.some(r => ['1-5m', '5-10m', '10m+'].includes(r))) {
    icpMatch = 'excellent';
    strengths.push('Strong alignment with SalesAI target customer revenue range');
  }

  // Revenue Match
  let revenueMatch = 'partial';
  if (data.icpRevenue?.some(r => ['1-5m', '5-10m'].includes(r))) {
    revenueMatch = 'excellent';
    dataPointsAnalyzed++;
  } else if (data.icpRevenue?.includes('500k-1m')) {
    revenueMatch = 'good';
  }

  // Verticals Match
  let verticalsMatch = 'partial';
  const idealVerticals = PERFECT_PARTNER_PROFILE.icpAlignment.idealVerticals;
  const matchingVerticals = data.icpVerticals?.filter(v =>
    idealVerticals.some(iv => v.toLowerCase().includes(iv.toLowerCase().split(' ')[0]))
  ) || [];
  if (matchingVerticals.length >= 3) {
    verticalsMatch = 'excellent';
    strengths.push(`Strong vertical alignment (${matchingVerticals.length} matching industries)`);
    dataPointsAnalyzed++;
  } else if (matchingVerticals.length >= 1) {
    verticalsMatch = 'good';
  }

  // Sales Motion Match
  let salesMotionMatch = 'partial';
  if (['direct', 'hybrid'].includes(data.salesMotion)) {
    salesMotionMatch = 'excellent';
    strengths.push('Direct sales capability enables high-touch partner selling');
    dataPointsAnalyzed++;
  }

  // Deal Size Match
  let dealSizeMatch = 'partial';
  if (['25-100k', '100k+'].includes(data.avgDealSize)) {
    dealSizeMatch = 'excellent';
    strengths.push('Enterprise deal experience aligns with SalesAI pricing');
    dataPointsAnalyzed++;
  } else if (data.avgDealSize === '10-25k') {
    dealSizeMatch = 'good';
  } else {
    opportunities.push('Consider positioning SalesAI for your larger deal opportunities first');
  }

  // Lead Capacity Match
  let leadCapacityMatch = 'partial';
  if (['11-25', '25+'].includes(data.leadsPerMonth)) {
    leadCapacityMatch = 'excellent';
    strengths.push('Strong lead generation capacity for partnership success');
    dataPointsAnalyzed++;
  } else if (data.leadsPerMonth === '6-10') {
    leadCapacityMatch = 'good';
  } else {
    opportunities.push('Develop lead generation strategy for SalesAI opportunities');
  }

  // Partnership Match
  let partnershipMatch = 'partial';
  if (data.partnershipType?.length >= 2) {
    partnershipMatch = 'excellent';
    strengths.push('Multi-model partnership approach maximizes revenue potential');
    dataPointsAnalyzed++;
  } else if (data.partnershipType?.length === 1) {
    partnershipMatch = 'good';
    opportunities.push('Consider expanding to additional partnership models over time');
  }

  // Services Match
  let servicesMatch = 'partial';
  if (data.services?.length >= 3) {
    servicesMatch = 'excellent';
    dataPointsAnalyzed++;
  } else if (data.services?.length >= 1) {
    servicesMatch = 'good';
    opportunities.push('Expand service offerings to include SalesAI implementation');
  }

  // Tech Stack Match
  let techMatch = 'partial';
  if (fitSignals.crmEcosystem?.length > 0) {
    techMatch = fitSignals.crmEcosystem.includes('hubspot') || fitSignals.crmEcosystem.includes('salesforce') ? 'excellent' : 'good';
    strengths.push(`${fitSignals.crmEcosystem.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')} ecosystem expertise`);
    dataPointsAnalyzed++;
  }

  // AI Experience Match
  let aiExperienceMatch = 'low';
  if (competitors.length > 0) {
    aiExperienceMatch = competitors.some(c => c.isPartner) ? 'excellent' : 'good';
    strengths.push('Existing AI sales experience enables rapid SalesAI enablement');
    dataPointsAnalyzed += competitors.length;
  } else {
    opportunities.push('AI sales training will be provided during onboarding');
  }

  // Add enrichment data points
  if (enrichedCompany?.name) dataPointsAnalyzed += 5;
  if (fitSignals.aiPositioning) dataPointsAnalyzed++;
  if (fitSignals.resellerModel) {
    strengths.push('Established reseller model for technology solutions');
    dataPointsAnalyzed++;
  }
  if (fitSignals.serviceDelivery) dataPointsAnalyzed++;

  // Calculate overall score
  const matchScores = {
    excellent: 10,
    good: 7,
    partial: 4,
    low: 1
  };

  const overallScore = Math.min(100, Math.round(
    (matchScores[icpMatch] + matchScores[revenueMatch] + matchScores[verticalsMatch] +
     matchScores[salesMotionMatch] + matchScores[dealSizeMatch] + matchScores[leadCapacityMatch] +
     matchScores[partnershipMatch] + matchScores[servicesMatch] + matchScores[techMatch] +
     matchScores[aiExperienceMatch]) * 1.1 + (competitors.length > 0 ? 10 : 0)
  ));

  // Generate next steps based on tier
  if (overallScore >= 80) {
    nextSteps.push('Complete PartnerStack registration for immediate portal access');
    nextSteps.push('Schedule partner enablement call within 48 hours');
    nextSteps.push('Access co-marketing materials and start pipeline building');
  } else if (overallScore >= 60) {
    nextSteps.push('Review partnership agreement and complete PartnerStack setup');
    nextSteps.push('Enroll in SalesAI Partner Certification program');
    nextSteps.push('Identify 3-5 initial customers to approach with SalesAI');
  } else {
    nextSteps.push('Partner team will reach out to discuss optimal partnership path');
    nextSteps.push('Consider starting with referral partnership model');
    nextSteps.push('Access foundational training resources in partner portal');
  }

  return {
    icpMatch,
    revenueMatch,
    verticalsMatch,
    salesMotionMatch,
    dealSizeMatch,
    leadCapacityMatch,
    partnershipMatch,
    servicesMatch,
    techMatch,
    aiExperienceMatch,
    overallScore,
    dataPointsAnalyzed: dataPointsAnalyzed + 10, // Base application data points
    strengths: strengths.length > 0 ? strengths : ['Application submitted successfully', 'Partnership interest demonstrated'],
    opportunities: opportunities.length > 0 ? opportunities : ['Explore full partnership potential during onboarding'],
    nextSteps
  };
}

function getPartnerTier(score) {
  if (score >= 80) {
    return { tier: 'PRO', tierColor: '#22c55e', tierIcon: '🚀' };
  } else if (score >= 60) {
    return { tier: 'ADVANCED', tierColor: '#3b82f6', tierIcon: '⭐' };
  } else if (score >= 40) {
    return { tier: 'STANDARD', tierColor: '#f59e0b', tierIcon: '✓' };
  } else {
    return { tier: 'EMERGING', tierColor: '#6b7280', tierIcon: '🌱' };
  }
}

function generateComparisonRow(metricName, partnerValue, idealValue, matchLevel) {
  const matchClass = matchLevel || 'partial';
  return `
    <div class="comparison-row">
      <div class="comparison-cell metric-name">${metricName}</div>
      <div class="comparison-cell partner-col">
        <span class="match-indicator ${matchClass}"></span>
        <span class="cell-value">${partnerValue}</span>
      </div>
      <div class="comparison-cell ideal-col">
        <span class="cell-value">${idealValue}</span>
      </div>
    </div>
  `;
}

function formatPartnerICP(data) {
  const parts = [];
  if (data.icpVerticals?.length > 0) {
    parts.push(data.icpVerticals.slice(0, 2).join(', '));
  }
  if (data.icpRevenue?.length > 0) {
    parts.push(formatArray(data.icpRevenue));
  }
  return parts.length > 0 ? parts.join(' · ') : 'Not specified';
}

function formatVerticalTags(verticals, idealVerticals = []) {
  if (!verticals || verticals.length === 0) return 'Not specified';
  return `<div class="cell-tags">${verticals.slice(0, 4).map(v => {
    const isMatch = idealVerticals.some(iv => v.toLowerCase().includes(iv.toLowerCase().split(' ')[0]));
    return `<span class="cell-tag${isMatch ? ' match' : ''}">${v}</span>`;
  }).join('')}${verticals.length > 4 ? `<span class="cell-tag">+${verticals.length - 4}</span>` : ''}</div>`;
}

function showAssessmentReport() {
  const report = generateAssessmentReport();

  // Update partner name in header
  document.getElementById('assessment-partner-name').textContent =
    state.formData.companyName || 'Partner Assessment';

  // Inject report content
  document.getElementById('assessment-content').innerHTML = report.html;

  // Show overlay
  document.getElementById('assessment-overlay').classList.add('active');

  // Update milestone state
  updateMilestoneState('assessment', 'active');
}

function updateMilestoneState(milestone, status) {
  const milestoneSteps = document.querySelectorAll('.milestone-step');
  milestoneSteps.forEach(step => {
    const stepMilestone = step.dataset.milestone;
    step.classList.remove('active', 'completed', 'locked');

    if (stepMilestone === milestone) {
      if (status === 'active') step.classList.add('active');
      else if (status === 'completed') step.classList.add('completed');
    } else if (getMilestoneOrder(stepMilestone) < getMilestoneOrder(milestone)) {
      step.classList.add('completed');
    } else if (getMilestoneOrder(stepMilestone) > getMilestoneOrder(milestone)) {
      step.classList.add('locked');
    }
  });
}

function getMilestoneOrder(milestone) {
  const order = { assessment: 1, partnerstack: 2, valueprop: 3, gtm: 4 };
  return order[milestone] || 0;
}

function shareAssessment() {
  // Generate shareable link (in production, this would create a server-stored report)
  const reportData = {
    company: state.formData.companyName,
    score: state.score,
    date: new Date().toISOString()
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?report=${btoa(JSON.stringify(reportData))}`;

  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert('Report link copied to clipboard!');
  }).catch(() => {
    prompt('Copy this link to share the report:', shareUrl);
  });
}

async function proceedToPartnerStack() {
  // Mark assessment as active
  updateMilestoneState('partnerstack', 'active');

  // Show loading state
  const btn = document.querySelector('.assessment-header-right .btn-primary');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `
    <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/>
    </svg>
    Creating your partner account...
  `;

  try {
    // Submit to PartnerStack API
    const result = await submitToPartnerStack();

    if (result.success) {
      // Mark partnerstack as completed
      updateMilestoneState('partnerstack', 'completed');

      // Show success state
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Account Created!
      `;
      btn.classList.add('success');

      // Store the partner data for reference
      state.partnerStackResult = result;

      // Show success message and redirect option
      await delay(1500);
      showPartnerStackSuccess(result);
    } else {
      throw new Error(result.error || 'Failed to create partner account');
    }
  } catch (error) {
    console.error('PartnerStack signup failed:', error);

    // Show error state
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      Error - Try Again
    `;
    btn.classList.add('error');

    // Reset after delay
    await delay(2000);
    btn.classList.remove('error');
    btn.innerHTML = originalText;
    btn.disabled = false;

    // Show error details
    alert(`Could not create your partner account: ${error.message}\n\nPlease try again or contact support.`);
  }
}

// ============================================
// PARTNERSTACK API INTEGRATION
// ============================================

/**
 * Map collected onboarding data to PartnerStack API format
 * Combines form data, enrichment data, and assessment results
 */
function mapToPartnerStackPayload() {
  const data = state.formData;
  const enrichedCompany = state.enrichedCompany || {};
  const competitors = state.competitorSignals || [];
  const fitSignals = state.partnerFitSignals || {};
  const assessmentData = calculateAssessmentMetrics(data, enrichedCompany, competitors, fitSignals);
  const { tier } = getPartnerTier(assessmentData.overallScore);

  // Determine the appropriate group based on tier
  const groupKey = PARTNERSTACK_CONFIG.tierGroups[tier] || PARTNERSTACK_CONFIG.defaultGroupKey;

  // Build tags array from various sources
  const tags = [];

  // Add partnership type tags
  if (data.partnershipType?.length > 0) {
    data.partnershipType.forEach(pt => {
      const tagName = pt.split(' — ')[0].toLowerCase().replace(/\s+/g, '-');
      tags.push(`partnership-${tagName}`);
    });
  }

  // Add industry/vertical tags
  if (data.icpVerticals?.length > 0) {
    data.icpVerticals.slice(0, 5).forEach(v => {
      tags.push(`vertical-${v.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    });
  }

  // Add tech stack tags
  if (data.techStack?.length > 0) {
    data.techStack.forEach(tech => {
      tags.push(`tech-${tech.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    });
  }

  // Add AI experience tag if they work with AI sales tools
  if (competitors.length > 0) {
    tags.push('ai-sales-experience');
    competitors.forEach(c => {
      tags.push(`uses-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    });
  }

  // Add assessment tier tag
  tags.push(`tier-${tier.toLowerCase()}`);

  // Add lead capacity tag
  if (data.leadsPerMonth) {
    tags.push(`leads-${data.leadsPerMonth}`);
  }

  // Build custom fields object
  const customFields = {
    // Company Information
    company_website: data.companyWebsite || enrichedCompany.domain || null,
    company_industry: enrichedCompany.industry || null,
    company_employee_count: enrichedCompany.employeesRange || null,
    company_founded: enrichedCompany.founded || null,
    company_description: enrichedCompany.description || null,
    company_revenue: data.companyRevenue || null,
    revenue_model: data.revenueModel || null,
    recurring_revenue_pct: data.recurringPct || null,

    // Role Information
    partner_role: data.role || null,
    partner_location: data.location || null,

    // ICP Profile
    icp_revenue_range: Array.isArray(data.icpRevenue) ? data.icpRevenue.join(', ') : data.icpRevenue,
    icp_headcount_range: Array.isArray(data.icpHeadcount) ? data.icpHeadcount.join(', ') : data.icpHeadcount,
    icp_verticals: Array.isArray(data.icpVerticals) ? data.icpVerticals.join(', ') : data.icpVerticals,
    icp_traits: Array.isArray(data.icpTraits) ? data.icpTraits.join(', ') : data.icpTraits,
    icp_regions: Array.isArray(data.icpRegions) ? data.icpRegions.join(', ') : data.icpRegions,

    // Sales Information
    sales_motion: data.salesMotion || null,
    sales_cycle: data.salesCycle || null,
    avg_deal_size: data.avgDealSize || null,
    tech_stack: Array.isArray(data.techStack) ? data.techStack.join(', ') : data.techStack,

    // Partnership Details
    partnership_types: Array.isArray(data.partnershipType) ? data.partnershipType.join(', ') : data.partnershipType,
    lead_gen_methods: Array.isArray(data.leadGenMethods) ? data.leadGenMethods.join(', ') : data.leadGenMethods,
    leads_per_month: data.leadsPerMonth || null,

    // Services & Capabilities
    services_offered: Array.isArray(data.services) ? data.services.join(', ') : data.services,
    certifications: Array.isArray(data.certifications) ? data.certifications.join(', ') : data.certifications,

    // Goals & Context
    growth_goals: Array.isArray(data.growthGoals) ? data.growthGoals.join(', ') : data.growthGoals,
    success_criteria: data.successCriteria || null,
    referral_source: data.referralSource || null,

    // Assessment Results
    assessment_score: assessmentData.overallScore,
    assessment_tier: tier,
    assessment_strengths: assessmentData.strengths.join('; '),
    assessment_opportunities: assessmentData.opportunities.join('; '),
    data_points_analyzed: assessmentData.dataPointsAnalyzed,

    // AI/Competitor Signals (PRO partner indicator)
    ai_sales_experience: competitors.length > 0,
    ai_tools_used: competitors.map(c => c.name).join(', '),

    // Partner Fit Signals from website analysis
    crm_ecosystem: Array.isArray(fitSignals.crmEcosystem) ? fitSignals.crmEcosystem.join(', ') : null,
    has_reseller_model: fitSignals.resellerModel || false,
    has_service_delivery: fitSignals.serviceDelivery || false,
    ai_positioning: fitSignals.aiPositioning || null,
    partner_readiness_score: state.partnerReadinessScore || null,

    // Application metadata
    application_date: new Date().toISOString(),
    application_source: 'salesai-partner-portal-chat'
  };

  // Remove null/undefined values
  Object.keys(customFields).forEach(key => {
    if (customFields[key] === null || customFields[key] === undefined || customFields[key] === '') {
      delete customFields[key];
    }
  });

  // Build the PartnerStack API payload
  const payload = {
    // Required fields
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    group_key: groupKey,

    // Optional core fields
    name: data.companyName || enrichedCompany.name || `${data.firstName} ${data.lastName}`,
    partner_key: generatePartnerKey(data),
    country: LOCATION_TO_COUNTRY[data.location] || null,

    // Meta information
    meta: {
      phone: data.phone || null,
      website: data.companyWebsite || enrichedCompany.domain || null,
      role: data.role || null,
      headquarters: enrichedCompany.headquarters || null
    },

    // Tags for segmentation
    tags: tags.filter(t => t && t.length > 0),

    // Custom partnership fields
    fields: customFields,

    // Set tier if PartnerStack supports it in create
    tier: tier.toLowerCase()
  };

  // Clean up null values from meta
  Object.keys(payload.meta).forEach(key => {
    if (payload.meta[key] === null) {
      delete payload.meta[key];
    }
  });

  // Remove country if null
  if (!payload.country) {
    delete payload.country;
  }

  return payload;
}

/**
 * Generate a unique partner key from the data
 * PartnerStack keys are alphanumeric, lowercase, no spaces or special chars
 */
function generatePartnerKey(data) {
  const firstName = (data.firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const lastName = (data.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36).slice(-4);

  return `${firstName}${lastName}${timestamp}`;
}

/**
 * Submit partnership data to PartnerStack API
 */
async function submitToPartnerStack() {
  const payload = mapToPartnerStackPayload();

  console.log('PartnerStack payload:', JSON.stringify(payload, null, 2));

  // Check if we have valid API credentials
  if (PARTNERSTACK_CONFIG.apiKey === 'YOUR_PARTNERSTACK_API_KEY') {
    console.warn('PartnerStack API key not configured. Simulating success...');

    // Simulate API response for demo/development
    return {
      success: true,
      simulated: true,
      partnership: {
        partner_key: payload.partner_key,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        name: payload.name,
        group: { key: payload.group_key },
        tier: payload.tier,
        status: 'active',
        created_at: new Date().toISOString()
      },
      portalUrl: `https://partners.salesai.com/login?email=${encodeURIComponent(payload.email)}`,
      message: 'Demo mode: Partnership would be created with PartnerStack'
    };
  }

  try {
    // Make the actual API call to PartnerStack
    const response = await fetch(`${PARTNERSTACK_CONFIG.baseUrl}/partnerships`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PARTNERSTACK_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (response.ok) {
      return {
        success: true,
        partnership: responseData,
        portalUrl: `https://partners.salesai.com/login?email=${encodeURIComponent(payload.email)}`,
        message: 'Partnership created successfully'
      };
    } else {
      // Handle API errors
      console.error('PartnerStack API error:', responseData);
      return {
        success: false,
        error: responseData.message || responseData.error || 'API request failed',
        details: responseData
      };
    }
  } catch (error) {
    console.error('PartnerStack API request failed:', error);
    return {
      success: false,
      error: error.message || 'Network request failed'
    };
  }
}

/**
 * Show success modal after PartnerStack account creation
 */
function showPartnerStackSuccess(result) {
  const modal = document.getElementById('success-modal');
  const content = document.getElementById('success-content');
  const partnership = result.partnership;

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(34, 197, 94, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h3 style="color: #22c55e; margin-bottom: 8px;">Welcome to the Team, ${state.formData.firstName}!</h3>
      <p style="color: #888; font-size: 14px;">Your ${partnership.tier?.toUpperCase() || 'PARTNER'} account is ready</p>
    </div>

    <div style="background: #12121a; border: 1px solid #1e1e2e; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="display: grid; gap: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <span style="color: #888;">Partner Key</span>
          <span style="color: #fff; font-family: monospace;">${partnership.partner_key}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <span style="color: #888;">Email</span>
          <span style="color: #fff;">${partnership.email}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <span style="color: #888;">Company</span>
          <span style="color: #fff;">${partnership.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <span style="color: #888;">Partner Tier</span>
          <span style="color: #22c55e; font-weight: 600;">${partnership.tier?.toUpperCase() || 'STANDARD'}</span>
        </div>
      </div>
    </div>

    <div style="background: rgba(34, 197, 94, 0.05); border-left: 3px solid #22c55e; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="color: #aaa; font-size: 14px; margin: 0;">
        <strong style="color: #fff;">Next Steps:</strong><br>
        Check your email for login instructions and access to your Partner Portal. Inside you'll find your referral links, marketing resources, and commission tracking.
      </p>
    </div>

    ${result.simulated ? `
      <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <p style="color: #fbbf24; font-size: 12px; margin: 0;">
          <strong>Demo Mode:</strong> This is a simulated response. Configure your PartnerStack API key to create real partnerships.
        </p>
      </div>
    ` : ''}
  `;

  // Update modal button
  const modalFooter = modal.querySelector('.modal-footer');
  modalFooter.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="window.open('${result.portalUrl}', '_blank')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Open Partner Portal
    </button>
  `;

  modal.classList.add('active');

  // Update milestone
  updateMilestoneState('partnerstack', 'completed');
}

// Update global functions
window.shareAssessment = shareAssessment;
window.proceedToPartnerStack = proceedToPartnerStack;

// ============================================
// NAVIGATION & UI UPDATES
// ============================================

function updateNavigation() {
  const steps = navSteps.querySelectorAll('.nav-step');
  steps.forEach((step, i) => {
    step.classList.remove('active', 'completed');
    if (i < state.currentSection) {
      step.classList.add('completed');
    } else if (i === state.currentSection) {
      step.classList.add('active');
    }
  });

  // Update progress text
  progressText.textContent = SECTIONS[state.currentSection].label;
}

function showInputError(message) {
  // Could add visual error feedback
  console.error(message);
}

// ============================================
// UTILITIES
// ============================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatContent(text) {
  return text
    .split('\n\n')
    .map(p => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
    .join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatValue(value) {
  if (!value) return 'Not specified';
  return value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatArray(arr) {
  if (!arr || !arr.length) return 'Not specified';
  if (arr.length <= 3) return arr.join(', ');
  return `${arr.slice(0, 3).join(', ')} +${arr.length - 3} more`;
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

window.closeModal = closeModal;
window.closeDisqualifiedModal = closeDisqualifiedModal;

// ============================================
// TEST FUNCTIONS (for development/demo)
// ============================================

/**
 * Test the PartnerStack integration with sample data
 * Run from browser console: testPartnerStackIntegration()
 */
async function testPartnerStackIntegration() {
  console.log('🧪 Testing PartnerStack Integration...\n');

  // Populate state with sample data
  state.formData = {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@acmeconsulting.com',
    phone: '+1-555-123-4567',
    companyName: 'Acme Consulting Group',
    companyWebsite: 'acmeconsulting.com',
    role: 'partner-manager',
    location: 'us',
    icpRevenue: ['1-5m', '5-10m', '10-25m'],
    icpHeadcount: ['51-200', '201-500'],
    icpVerticals: ['SaaS / Software', 'Professional Services', 'Financial Services', 'Technology / IT'],
    icpTraits: ['Rapid growth phase', 'Sales team of 5+', 'Tech-savvy leadership'],
    icpRegions: ['North America', 'United States', 'Canada'],
    salesMotion: 'hybrid',
    salesCycle: '30-90',
    avgDealSize: '25-100k',
    techStack: ['Salesforce', 'HubSpot', 'Outreach', 'Gong', 'LinkedIn Sales Navigator'],
    companyRevenue: '5-10m',
    revenueModel: 'hybrid',
    recurringPct: '51-75',
    partnershipType: ['Referral Partner — Send leads, earn commission', 'Reseller — Sell SalesAI as part of your offering', 'Implementation Partner — Help customers get started'],
    leadGenMethods: ['Existing client base', 'Content marketing', 'Events & webinars', 'Referral network'],
    leadsPerMonth: '11-25',
    services: ['CRM Implementation', 'Sales Training & Coaching', 'Sales Process Design', 'RevOps Consulting'],
    certifications: ['Salesforce', 'HubSpot'],
    growthGoals: ['Increase revenue', 'Add new service offerings', 'Build recurring revenue'],
    successCriteria: 'We want to add AI sales solutions to our service portfolio and generate additional recurring revenue through SalesAI referrals and implementations.',
    referralSource: 'referral'
  };

  // Add enriched company data
  state.enrichedCompany = {
    name: 'Acme Consulting Group',
    domain: 'acmeconsulting.com',
    description: 'Acme Consulting Group is a leading sales and revenue operations consultancy helping B2B companies optimize their go-to-market strategies.',
    industry: 'Business Consulting',
    employeesRange: '51-200',
    founded: '2018',
    headquarters: 'Austin, TX',
    type: 'Private',
    tags: ['consulting', 'sales', 'revops', 'crm']
  };

  // Add competitor signals (indicates AI sales experience)
  state.competitorSignals = [
    { name: 'Gong', category: 'Conversation Intelligence', isPartner: true },
    { name: 'Outreach', category: 'Sales Engagement', isPartner: false },
    { name: 'Clari', category: 'Revenue Intelligence', isPartner: false }
  ];

  // Add partner fit signals
  state.partnerFitSignals = {
    crmEcosystem: ['salesforce', 'hubspot'],
    resellerModel: true,
    serviceDelivery: true,
    aiPositioning: 'AI-forward positioning detected on website'
  };

  state.partnerReadinessScore = 85;

  console.log('📋 Sample Data Loaded:');
  console.log('   Partner:', state.formData.firstName, state.formData.lastName);
  console.log('   Company:', state.formData.companyName);
  console.log('   Email:', state.formData.email);
  console.log('');

  // Generate the payload
  console.log('🔄 Generating PartnerStack Payload...\n');
  const payload = mapToPartnerStackPayload();

  console.log('📦 PartnerStack API Payload:');
  console.log('─'.repeat(50));
  console.log(JSON.stringify(payload, null, 2));
  console.log('─'.repeat(50));
  console.log('');

  // Show key mappings
  console.log('🗺️  Key Field Mappings:');
  console.log('   first_name:', payload.first_name);
  console.log('   last_name:', payload.last_name);
  console.log('   email:', payload.email);
  console.log('   name (company):', payload.name);
  console.log('   partner_key:', payload.partner_key);
  console.log('   group_key:', payload.group_key);
  console.log('   tier:', payload.tier);
  console.log('   tags:', payload.tags.length, 'tags');
  console.log('   custom fields:', Object.keys(payload.fields).length, 'fields');
  console.log('');

  // Calculate assessment
  const assessmentData = calculateAssessmentMetrics(
    state.formData,
    state.enrichedCompany,
    state.competitorSignals,
    state.partnerFitSignals
  );
  const { tier, tierColor } = getPartnerTier(assessmentData.overallScore);

  console.log('📊 Assessment Results:');
  console.log('   Score:', assessmentData.overallScore);
  console.log('   Tier:', tier);
  console.log('   Strengths:', assessmentData.strengths.length);
  console.log('   Opportunities:', assessmentData.opportunities.length);
  console.log('   Data Points:', assessmentData.dataPointsAnalyzed);
  console.log('');

  // Test the API submission (demo mode)
  console.log('🚀 Submitting to PartnerStack API (Demo Mode)...\n');
  const result = await submitToPartnerStack();

  if (result.success) {
    console.log('✅ SUCCESS! Partnership Created (Simulated)');
    console.log('─'.repeat(50));
    console.log('   Partner Key:', result.partnership.partner_key);
    console.log('   Email:', result.partnership.email);
    console.log('   Company:', result.partnership.name);
    console.log('   Tier:', result.partnership.tier);
    console.log('   Status:', result.partnership.status);
    console.log('   Portal URL:', result.portalUrl);
    console.log('─'.repeat(50));

    if (result.simulated) {
      console.log('\n⚠️  Note: Running in DEMO MODE');
      console.log('   To create real partnerships, configure PARTNERSTACK_CONFIG.apiKey');
    }
  } else {
    console.log('❌ FAILED:', result.error);
  }

  console.log('\n🧪 Test Complete!\n');

  return { payload, result, assessmentData };
}

// Expose test function globally
window.testPartnerStackIntegration = testPartnerStackIntegration;

// ============================================
// INIT
// ============================================

// Start with cinematic reveal, then transition to main app
document.addEventListener('DOMContentLoaded', initCinematicReveal);
