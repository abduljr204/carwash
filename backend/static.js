const fs = require('node:fs');
const path = require('node:path');
const { httpError } = require('./http');

const PROJECT_ROOT = path.join(__dirname, '..');
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
};

function serveStatic(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method)) throw httpError(405, 'Method not allowed.');
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const allowed =
    /^(index|login|signup|dashboard|staff)\.html$/.test(name) ||
    name === 'vendor/jsqr.js' ||
    /^(journey|assets)\/[\w-]+\.(js|css|png)$/.test(name);
  if (!allowed) throw httpError(404, 'Not found.');
  const file = name === 'vendor/jsqr.js' ? require.resolve('jsqr') : path.join(PROJECT_ROOT, name);
  if (!fs.existsSync(file)) throw httpError(404, 'Not found.');
  res.writeHead(200, {
    'Content-Type': CONTENT_TYPES[path.extname(file)],
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; form-action 'self'",
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

module.exports = { serveStatic };
