/**
 * Live test of navbar detection against real websites
 * Run with: node test-navbar-live.cjs
 *
 * Tests both static fetching and ScrapingBee (when configured)
 */

const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

// ScrapingBee Configuration - set your API key here to test JS rendering
const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY || 'YOUR_API_KEY';
const SCRAPINGBEE_ENABLED = SCRAPINGBEE_API_KEY !== 'YOUR_API_KEY';

// Test websites - mix of static and JS-heavy sites
const TEST_SITES = [
  // Known to work with static fetching
  { domain: 'gong.io', expectsJs: false },
  { domain: 'salesloft.com', expectsJs: false },

  // Known to require JS rendering
  { domain: 'outreach.io', expectsJs: true },
  { domain: 'salesforce.com', expectsJs: true },

  // Hybrid - some JS but static nav often works
  { domain: 'hubspot.com', expectsJs: false },
  { domain: 'drift.com', expectsJs: true },
];

// Keywords (copied from app-chat.js)
const KEYWORDS = {
  customer: [
    'customers', 'clients', 'case studies', 'case-studies', 'casestudies',
    'success stories', 'success-stories', 'testimonials', 'who we serve',
    'our customers', 'customer stories', 'results', 'portfolio'
  ],
  partner: [
    'partners', 'integrations', 'integration', 'technology', 'tech partners',
    'ecosystem', 'alliances', 'marketplace', 'apps', 'connect', 'plugins'
  ],
  role: [
    'for sales', 'for marketing', 'for revenue', 'for revops', 'for ops',
    'for executives', 'for cro', 'for cmo', 'sales teams', 'marketing teams',
    'for sdrs', 'for bdrs', 'for account executives', 'for aes',
    'for customer success', 'by role', 'by team',
    'leadership', 'leaders', 'vp of sales', 'head of sales',
    'revenue leader', 'gtm', 'go-to-market'
  ],
  industry: [
    'healthcare', 'financial services', 'fintech', 'banking', 'insurance',
    'technology', 'saas', 'software', 'manufacturing', 'retail', 'ecommerce',
    'real estate', 'professional services', 'legal', 'education',
    'by industry', 'industries', 'verticals',
    '/solutions/tech', '/solutions/healthcare', '/solutions/financial'
  ],
  usecase: [
    'lead generation', 'lead gen', 'demand generation', 'pipeline',
    'prospecting', 'outbound', 'inbound', 'sales engagement',
    'sales automation', 'sales enablement', 'forecasting',
    'use cases', 'solutions', 'capabilities',
    'conversation intelligence', 'call recording', 'revenue forecasting',
    'deal intelligence', 'sales intelligence',
    '/use-case/', '/use-cases/', '/solutions/'
  ],
  product: [
    'products', 'product', 'features', 'platform', 'capabilities',
    'how it works', 'pricing', 'plans'
  ]
};

/**
 * Detect if HTML is just a JavaScript loading shell (SPA skeleton)
 */
function isJsLoadingShell(html) {
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

/**
 * Fetch page via native HTTPS (static fetch)
 */
async function fetchStatic(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const req = protocol.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchStatic(res.headers.location).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ html: data, source: 'static' }));
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

/**
 * Fetch page via ScrapingBee (with JS rendering)
 */
async function fetchWithScrapingBee(url) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      api_key: SCRAPINGBEE_API_KEY,
      url: url.startsWith('http') ? url : `https://${url}`,
      render_js: 'true',
      wait: '2000',
      block_ads: 'true',
    });

    const apiUrl = `https://app.scrapingbee.com/api/v1?${params}`;

    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ html: data, source: 'scrapingbee' });
        } else {
          reject(new Error(`ScrapingBee error: ${res.statusCode} - ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Smart fetch: try static first, fallback to ScrapingBee if needed
 */
async function smartFetch(url, expectsJs = false) {
  // Try static first (unless we know it needs JS)
  if (!expectsJs) {
    try {
      const result = await fetchStatic(url);
      if (result.html.length > 1000 && !isJsLoadingShell(result.html)) {
        return { ...result, isJsShell: false };
      }
      console.log('  ⚠️  Static fetch returned JS shell, trying ScrapingBee...');
    } catch (e) {
      console.log(`  ⚠️  Static fetch failed: ${e.message}`);
    }
  }

  // Try ScrapingBee if available
  if (SCRAPINGBEE_ENABLED) {
    try {
      const result = await fetchWithScrapingBee(url);
      return { ...result, isJsShell: false };
    } catch (e) {
      console.log(`  ❌ ScrapingBee failed: ${e.message}`);
    }
  }

  // Last resort: return static even if it's a shell
  if (expectsJs) {
    try {
      const result = await fetchStatic(url);
      return { ...result, isJsShell: isJsLoadingShell(result.html) };
    } catch (e) {
      throw new Error(`All fetch methods failed: ${e.message}`);
    }
  }

  throw new Error('Fetch failed');
}

function detectNavbarLinks(html, baseUrl) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const discovered = {
    customerPages: [],
    partnerPages: [],
    solutionsByRole: [],
    solutionsByIndustry: [],
    useCasePages: [],
    productPages: []
  };

  // Get all nav links
  const navSelectors = [
    'nav a', 'header a', '[role="navigation"] a',
    '.nav a', '.navbar a', '.navigation a',
    '.menu a', '.main-menu a', '[class*="nav-"] a',
    '[class*="dropdown"] a', '[class*="submenu"] a', '[class*="mega-menu"] a'
  ];

  const allLinks = new Set();

  navSelectors.forEach(selector => {
    try {
      doc.querySelectorAll(selector).forEach(link => {
        const href = link.getAttribute('href');
        const text = (link.textContent || '').trim();
        if (href && text && text.length < 50) {
          allLinks.add(JSON.stringify({ href, text }));
        }
      });
    } catch (e) {}
  });

  // Helper to resolve URLs
  const resolveUrl = (href) => {
    if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
      return null;
    }
    try {
      if (href.startsWith('http')) {
        const url = new URL(href);
        const baseDomain = new URL(baseUrl).hostname.replace('www.', '');
        if (url.hostname.replace('www.', '').includes(baseDomain.split('.')[0])) {
          return href;
        }
        return null;
      }
      return new URL(href, baseUrl).href;
    } catch (e) {
      return null;
    }
  };

  // Helper to match keywords
  const matchesKeywords = (text, href, keywords) => {
    const lowerText = text.toLowerCase();
    const lowerHref = href.toLowerCase();
    return keywords.some(kw => {
      const kwLower = kw.toLowerCase();
      const kwSlug = kwLower.replace(/\s+/g, '-');
      return lowerText.includes(kwLower) || lowerHref.includes(kwSlug);
    });
  };

  // Categorize links
  allLinks.forEach(linkJson => {
    const { href, text } = JSON.parse(linkJson);
    const resolvedUrl = resolveUrl(href);
    if (!resolvedUrl) return;

    if (matchesKeywords(text, href, KEYWORDS.customer)) {
      discovered.customerPages.push({ url: resolvedUrl, text });
    }
    if (matchesKeywords(text, href, KEYWORDS.partner)) {
      discovered.partnerPages.push({ url: resolvedUrl, text });
    }
    if (matchesKeywords(text, href, KEYWORDS.role)) {
      discovered.solutionsByRole.push({ url: resolvedUrl, text });
    }
    if (matchesKeywords(text, href, KEYWORDS.industry)) {
      discovered.solutionsByIndustry.push({ url: resolvedUrl, text });
    }
    if (matchesKeywords(text, href, KEYWORDS.usecase)) {
      discovered.useCasePages.push({ url: resolvedUrl, text });
    }
    if (matchesKeywords(text, href, KEYWORDS.product)) {
      discovered.productPages.push({ url: resolvedUrl, text });
    }
  });

  // Dedupe
  const dedupe = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  };

  Object.keys(discovered).forEach(key => {
    discovered[key] = dedupe(discovered[key]);
  });

  return discovered;
}

async function testSite({ domain, expectsJs }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌐 Testing: ${domain} ${expectsJs ? '(JS-heavy)' : '(static)'}`);
  console.log('='.repeat(60));

  try {
    const { html, source, isJsShell } = await smartFetch(`https://www.${domain}`, expectsJs);
    console.log(`  📥 Fetched via: ${source} (${html.length} chars)`);

    if (isJsShell) {
      console.log('  ⚠️  WARNING: HTML appears to be a JS loading shell');
      console.log('     ScrapingBee integration needed for full content');
    }

    const results = detectNavbarLinks(html, `https://www.${domain}`);

    const categories = [
      { key: 'customerPages', icon: '👥', label: 'Customer Pages' },
      { key: 'partnerPages', icon: '🤝', label: 'Partner/Integration Pages' },
      { key: 'solutionsByRole', icon: '👤', label: 'Solutions by Role' },
      { key: 'solutionsByIndustry', icon: '🏢', label: 'Solutions by Industry' },
      { key: 'useCasePages', icon: '🎯', label: 'Use Case Pages' },
      { key: 'productPages', icon: '📦', label: 'Product Pages' }
    ];

    let totalFound = 0;

    categories.forEach(({ key, icon, label }) => {
      const pages = results[key];
      if (pages.length > 0) {
        console.log(`\n${icon} ${label} (${pages.length}):`);
        pages.slice(0, 5).forEach(p => {
          console.log(`   • "${p.text}" → ${p.url}`);
        });
        if (pages.length > 5) {
          console.log(`   ... and ${pages.length - 5} more`);
        }
        totalFound += pages.length;
      }
    });

    if (totalFound === 0) {
      console.log('\n⚠️  No matching pages found in navbar');
    } else {
      console.log(`\n✅ Total: ${totalFound} pages discovered`);
    }

    return { domain, success: true, results, totalFound, source, isJsShell };

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    return { domain, success: false, error: error.message };
  }
}

async function main() {
  console.log('🧪 Live Navbar Detection Test with Smart Fetching\n');
  console.log(`ScrapingBee: ${SCRAPINGBEE_ENABLED ? '✅ Enabled' : '❌ Not configured'}`);

  if (!SCRAPINGBEE_ENABLED) {
    console.log('   Set SCRAPINGBEE_API_KEY env var to enable JS rendering');
    console.log('   Get a free API key at: https://app.scrapingbee.com');
  }

  console.log('\nTesting against real websites...');

  // Check if jsdom is installed
  try {
    require('jsdom');
  } catch (e) {
    console.log('\n⚠️  jsdom not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install jsdom', { cwd: __dirname, stdio: 'inherit' });
  }

  const results = [];

  for (const site of TEST_SITES) {
    const result = await testSite(site);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  let staticSuccessCount = 0;
  let scrapingBeeSuccessCount = 0;
  let failedCount = 0;

  results.forEach(r => {
    if (r.success) {
      const status = r.isJsShell ? '⚠️ ' : '✅';
      const sourceInfo = r.source === 'scrapingbee' ? ' (via ScrapingBee)' : '';
      console.log(`${status} ${r.domain}: ${r.totalFound} pages found${sourceInfo}`);

      if (r.source === 'scrapingbee') {
        scrapingBeeSuccessCount++;
      } else if (!r.isJsShell) {
        staticSuccessCount++;
      }
    } else {
      console.log(`❌ ${r.domain}: ${r.error}`);
      failedCount++;
    }
  });

  console.log('\n📈 Statistics:');
  console.log(`   Static fetch success: ${staticSuccessCount}/${results.length}`);
  if (SCRAPINGBEE_ENABLED) {
    console.log(`   ScrapingBee fallback: ${scrapingBeeSuccessCount}/${results.length}`);
  }
  console.log(`   Failed: ${failedCount}/${results.length}`);

  if (!SCRAPINGBEE_ENABLED && results.some(r => r.isJsShell)) {
    console.log('\n💡 TIP: Enable ScrapingBee to handle JS-heavy sites');
    console.log('   Run: SCRAPINGBEE_API_KEY=your_key node test-navbar-live.cjs');
  }
}

main().catch(console.error);
