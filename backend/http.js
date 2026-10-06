function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function requirePost(req) {
  if (req.method !== 'POST') throw httpError(405, 'Method not allowed.');
  if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {
    throw httpError(403, 'Request origin rejected.');
  }
}

async function readJson(req, maxBytes) {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw httpError(415, 'JSON required.');
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > maxBytes) throw httpError(413, 'Request too large.');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw httpError(400, 'Invalid request.');
  }
}

module.exports = { httpError, sendJson, requirePost, readJson };
