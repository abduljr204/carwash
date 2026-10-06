const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
const derive = promisify(scrypt);
const dataDir = process.env.DATA_DIR || path.join(__dirname, '.data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'accounts.sqlite'));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users (phone TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, phone TEXT NOT NULL, expires INTEGER NOT NULL);');
const digest = value => createHash('sha256').update(value).digest('hex');
const normalize = value => {
  let phone = String(value || '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\s()-]/g, '');
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (/^09\d{8}$/.test(phone)) phone = '+218' + phone.slice(1);
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
};
const attempts = new Map();
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const reply = (status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(body)); };
  const cookie = (value, age) => `naqa_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  try {
    if (url.pathname.startsWith('/api/')) {
      const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('naqa_session='))?.slice(13) || '';
      if (req.method === 'GET' && url.pathname === '/api/session') {
        const session = db.prepare('SELECT phone FROM sessions WHERE token = ? AND expires > ?').get(digest(token), Date.now());
        return reply(200, { user: session || null });
      }
      if (req.method !== 'POST') return reply(405, { error: 'Method not allowed.' });
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return reply(403, { error: 'Request origin rejected.' });
      if (url.pathname === '/api/logout') {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(digest(token));
        return reply(200, { ok: true }, { 'Set-Cookie': cookie('', 0) });
      }
      if (!['/api/login', '/api/signup'].includes(url.pathname)) return reply(404, { error: 'Not found.' });
      const now = Date.now();
      for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
      const ip = req.socket.remoteAddress;
      const rate = attempts.get(ip) || { count: 0, until: now + 900000 };
      attempts.set(ip, rate);
      if (++rate.count > 30) return reply(429, { error: 'Too many attempts. Please try again in 15 minutes.' });
      if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'JSON required.' });
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 4096) return reply(413, { error: 'Request too large.' }); }
      let body; try { body = JSON.parse(raw); } catch { return reply(400, { error: 'Invalid request.' }); }
      const phone = normalize(body?.phone);
      const password = body?.password;
      if (!phone || typeof password !== 'string' || password.length < 8 || password.length > 128) return reply(400, { error: 'Enter a valid phone number and a password of 8–128 characters.' });
      const signup = url.pathname === '/api/signup';
      const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
      const salt = signup || !user ? randomBytes(16).toString('hex') : user.salt;
      const hash = await derive(password, salt, 64);
      if (signup) {
        try { db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(phone, salt, hash.toString('hex')); }
        catch (error) { if (error.code === 'ERR_SQLITE_ERROR' && error.message.includes('UNIQUE')) return reply(409, { error: 'An account already exists for this phone number. Please log in.' }); throw error; }
      } else if (!user || !timingSafeEqual(hash, Buffer.from(user.hash, 'hex'))) return reply(401, { error: 'Phone number or password is incorrect.' });
      db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now);
      const sessionToken = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(sessionToken), phone, now + 86400000);
      return reply(200, { user: { phone } }, { 'Set-Cookie': cookie(sessionToken, 86400) });
    }
    if (!['GET', 'HEAD'].includes(req.method)) return reply(405, { error: 'Method not allowed.' });
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!/^(index|login|signup)\.html$/.test(name) && !/^(journey|assets)\/[\w-]+\.(js|css|png)$/.test(name)) return reply(404, { error: 'Not found.' });
    const file = path.join(__dirname, name);
    if (!fs.existsSync(file)) return reply(404, { error: 'Not found.' });
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' })[path.extname(file)], 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; form-action 'self'" });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (error) { console.error(error); if (!res.headersSent) reply(500, { error: 'Something went wrong. Please try again.' }); else res.end(); }
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('Naqa Qurtuba running on http://localhost:' + (process.env.PORT || 3000)));
