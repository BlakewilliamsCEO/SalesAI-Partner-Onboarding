const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Generate config.js dynamically with environment variables
function generateConfig() {
  return `// Auto-generated configuration from environment variables
window.CONFIG = {
  COMPANIES_API_KEY: '${process.env.COMPANIES_API_KEY || 'YOUR_COMPANIES_API_KEY'}',
  ANTHROPIC_API_KEY: '${process.env.ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY'}',
  SCRAPINGBEE_API_KEY: '${process.env.SCRAPINGBEE_API_KEY || 'YOUR_SCRAPINGBEE_API_KEY'}',
  PARTNERSTACK_API_KEY: '${process.env.PARTNERSTACK_API_KEY || 'YOUR_PARTNERSTACK_API_KEY'}',
  PARTNERSTACK_PUBLIC_KEY: '${process.env.PARTNERSTACK_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'}',
  PARTNERSTACK_SECRET_KEY: '${process.env.PARTNERSTACK_SECRET_KEY || 'YOUR_SECRET_KEY'}'
};
`;
}

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;

  // Remove query strings
  filePath = filePath.split('?')[0];

  // Serve dynamic config.js
  if (filePath === '/config.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(generateConfig());
    return;
  }

  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback - serve index.html for routes
        fs.readFile(path.join(__dirname, 'index.html'), (err2, indexContent) => {
          if (err2) {
            res.writeHead(500);
            res.end('Server Error');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent);
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Config loaded with API keys: COMPANIES=${process.env.COMPANIES_API_KEY ? 'SET' : 'NOT SET'}, ANTHROPIC=${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}, SCRAPINGBEE=${process.env.SCRAPINGBEE_API_KEY ? 'SET' : 'NOT SET'}`);
});
