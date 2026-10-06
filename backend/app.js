const http = require('node:http');
const { createAuth, normalizePhone } = require('./auth');
const { createAppointments } = require('./appointments');
const { configured } = require('./reminders');
const { sendJson, requirePost, readJson } = require('./http');
const { serveStatic } = require('./static');

function createApp(db) {
  const auth = createAuth(db);
  const appointments = createAppointments({
    db,
    normalize: normalizePhone,
    smsConfigured: configured,
  });

  return http.createServer(async (req, res) => {
    const reply = (status, body, headers) => sendJson(res, status, body, headers);
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url);

      const { token, user } = auth.getSession(req);
      if (req.method === 'GET' && url.pathname === '/api/session') {
        return reply(200, { user });
      }
      if (auth.matches(url.pathname)) return await auth.handle(req, url, token, reply);

      let body;
      if (req.method !== 'GET') {
        requirePost(req);
        body = await readJson(req, 8192);
      }
      if (await appointments(req, url, user, body, reply)) return;
      return reply(404, { error: 'Not found.' });
    } catch (error) {
      if (!error.status) console.error(error);
      if (res.headersSent) return res.end();
      reply(error.status || 500, {
        error: error.status ? error.message : 'Something went wrong. Please try again.',
      });
    }
  });
}

module.exports = { createApp };
