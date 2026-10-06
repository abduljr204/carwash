const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const { httpError, requirePost, readJson } = require('./http');

const derive = promisify(scrypt);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const AUTH_PATHS = new Set(['/api/login', '/api/signup', '/api/staff/login', '/api/logout']);

function normalizePhone(value) {
  let phone = String(value || '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (/^09\d{8}$/.test(phone)) phone = '+218' + phone.slice(1);
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

function sessionCookie(value, age) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `naqa_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure}`;
}

function grantStaffAccess(db, value) {
  const phone = normalizePhone(value);
  if (!phone || !db.prepare('SELECT phone FROM users WHERE phone=?').get(phone)) {
    throw new Error('First create a customer account, then run: node server.js --staff +218...');
  }
  db.prepare('INSERT OR IGNORE INTO staff VALUES (?)').run(phone);
  return phone;
}

function createAuth(db) {
  const attempts = new Map();
  const roleFor = () => 'customer';

  function getSession(req) {
    const token =
      (req.headers.cookie || '')
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith('naqa_session='))
        ?.slice(13) || '';
    const user = db
      .prepare('SELECT phone FROM sessions WHERE token = ? AND expires > ?')
      .get(digest(token), Date.now());
    if (user) {
      if (user.phone.startsWith('staff:')) {
        user.username = user.phone.slice('staff:'.length);
        user.phone = null;
        user.role = 'staff';
      } else {
        user.role = roleFor(user.phone);
      }
    }
    return { token, user: user || null };
  }

  async function handle(req, url, token, reply) {
    requirePost(req);
    if (url.pathname === '/api/logout') {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(digest(token));
      return reply(200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    }

    const now = Date.now();
    for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
    const ip = req.socket.remoteAddress;
    const rate = attempts.get(ip) || { count: 0, until: now + 900000 };
    attempts.set(ip, rate);
    if (++rate.count > 30)
      throw httpError(429, 'Too many attempts. Please try again in 15 minutes.');

    const body = await readJson(req, 4096);
    const password = body?.password;
    const staffLogin = url.pathname === '/api/staff/login';
    if (staffLogin) {
      const username = String(body?.username || '').trim();
      if (
        !/^[a-zA-Z0-9_.-]{3,64}$/.test(username) ||
        typeof password !== 'string' ||
        password.length < 8 ||
        password.length > 128
      ) {
        throw httpError(400, 'Enter a valid username and a password of 8–128 characters.');
      }
      const staff = db.prepare('SELECT * FROM staff_users WHERE username = ?').get(username);
      const salt = staff?.salt || randomBytes(16).toString('hex');
      const hash = await derive(password, salt, 64);
      if (!staff || !timingSafeEqual(hash, Buffer.from(staff.hash, 'hex'))) {
        throw httpError(401, 'Username or password is incorrect.');
      }
      if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
      db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now);
      const sessionToken = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(
        digest(sessionToken),
        `staff:${username}`,
        now + 86400000,
      );
      return reply(
        200,
        { user: { username, role: 'staff' } },
        { 'Set-Cookie': sessionCookie(sessionToken, 86400) },
      );
    }
    const phone = normalizePhone(body?.phone);
    if (!phone || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      throw httpError(400, 'Enter a valid phone number and a password of 8–128 characters.');
    }
    const signup = url.pathname === '/api/signup';
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    const salt = signup || !user ? randomBytes(16).toString('hex') : user.salt;
    const hash = await derive(password, salt, 64);
    if (signup) {
      try {
        db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(phone, salt, hash.toString('hex'));
      } catch (error) {
        if (error.code === 'ERR_SQLITE_ERROR' && error.message.includes('UNIQUE')) {
          throw httpError(409, 'An account already exists for this phone number. Please log in.');
        }
        throw error;
      }
    } else if (!user || !timingSafeEqual(hash, Buffer.from(user.hash, 'hex'))) {
      throw httpError(401, 'Phone number or password is incorrect.');
    }
    const role = roleFor(phone);
    if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
    db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now);
    const sessionToken = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(
      digest(sessionToken),
      phone,
      now + 86400000,
    );
    return reply(
      200,
      { user: { phone, role } },
      { 'Set-Cookie': sessionCookie(sessionToken, 86400) },
    );
  }

  return { getSession, handle, matches: (pathname) => AUTH_PATHS.has(pathname) };
}

module.exports = { createAuth, normalizePhone, grantStaffAccess };
