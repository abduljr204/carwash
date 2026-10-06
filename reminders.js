const configured = (env = process.env) => !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);
function twilioSender(env = process.env) {
  return async (phone, message) => {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`, {
      method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ From: env.TWILIO_FROM_NUMBER, To: phone, Body: message }), signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw Object.assign(new Error(`SMS provider HTTP ${response.status}`), { retryable: response.status === 429, permanent: response.status >= 400 && response.status < 500 && response.status !== 429 });
    const result = await response.json();
    if (!result.sid) throw new Error('SMS provider did not return a message ID.');
    return result.sid;
  };
}
function createReminderWorker(db, { send = twilioSender(), enabled = configured, now = Date.now } = {}) {
  // An interrupted request may already have reached the provider. Never automatically resend it.
  db.prepare("UPDATE reminders SET status='unknown', error='Server restarted during delivery; check provider logs.' WHERE status='sending'").run();
  let running = false;
  async function tick() {
    if (running || !enabled()) return;
    running = true;
    try {
      const jobs = db.prepare("SELECT * FROM reminders WHERE status IN ('pending','retry') AND next_attempt<=? ORDER BY due LIMIT 20").all(now());
      for (const job of jobs) {
        const row = db.prepare('SELECT * FROM appointments WHERE id=?').get(job.appointment);
        if (!row || row.status !== 'booked' || row.revision !== job.revision || row.starts <= now()) { db.prepare("UPDATE reminders SET status='cancelled' WHERE id=?").run(job.id); continue; }
        const claimed = db.prepare("UPDATE reminders SET status='sending', attempts=attempts+1 WHERE id=? AND status IN ('pending','retry')").run(job.id);
        if (!claimed.changes) continue;
        try {
          const message = `Naqa Qurtuba: your ${row.package} wash is on ${row.date} at ${row.time} (Tripoli). Please bring your booking QR code. Call 091 210 3120 for help.`;
          const providerId = await send(row.phone, message);
          db.prepare("UPDATE reminders SET status='accepted', provider_id=?, error=NULL WHERE id=?").run(providerId, job.id);
        } catch (error) {
          const status = error.retryable && job.attempts < 2 ? 'retry' : error.permanent || error.retryable ? 'failed' : 'unknown';
          db.prepare('UPDATE reminders SET status=?, next_attempt=?, error=? WHERE id=?').run(status, now() + 60000 * (job.attempts + 1), error.message.slice(0, 200), job.id);
        }
      }
    } finally { running = false; }
  }
  const timer = setInterval(() => tick().catch(error => console.error('Reminder worker:', error.message)), 30000);
  timer.unref();
  tick().catch(error => console.error('Reminder worker:', error.message));
  return { tick, stop: () => clearInterval(timer) };
}
module.exports = { configured, twilioSender, createReminderWorker };
