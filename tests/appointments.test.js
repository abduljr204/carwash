const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');
const { today } = require('../backend/appointments');
const dataDir = mkdtempSync(join(tmpdir(), 'naqa-bookings-'));
const base = 'http://127.0.0.1:3188';
let child, db, customer, other, staff;
const call = (route, cookie, body) =>
  fetch(base + '/api/' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
async function signup(phone) {
  const res = await call('signup', null, { phone, password: 'test-password-2026' });
  assert.equal(res.status, 200);
  return res.headers.get('set-cookie').split(';')[0];
}
before(async () => {
  child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: '3188', DATA_DIR: dataDir, TWILIO_ACCOUNT_SID: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    child.stdout.once('data', resolve);
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error('Server exit ' + code)));
  });
  db = new DatabaseSync(join(dataDir, 'accounts.sqlite'));
  customer = await signup('0911111111');
  other = await signup('0922222222');
  staff = await signup('0933333333');
  db.prepare('INSERT INTO staff VALUES (?)').run('+218933333333');
});
after(async () => {
  db?.close();
  if (child && child.exitCode === null) {
    child.kill();
    await new Promise((resolve) => child.once('exit', resolve));
  }
  rmSync(dataDir, { recursive: true, force: true });
});
const date = today(Date.now() + 86400000);
const booking = (time = '10:00') => ({
  date,
  time,
  vehicle: { type: 'car' },
  package: 'full',
  addons: ['wax'],
  reminder: true,
  requestKey: crypto.randomUUID(),
});
test('booking ownership, capacity, QR decoding, rescheduling, check-in, receipts, and cancellation', async () => {
  assert.equal((await call('appointments')).status, 401);
  assert.equal((await call('staff/bookings', customer)).status, 403);
  assert.equal(
    (await call('staff/login', null, { username: 'admin', password: 'wrong-password' })).status,
    401,
  );
  const staffLogin = await call('staff/login', null, {
    username: 'admin',
    password: 'Admin123',
  });
  assert.equal(staffLogin.status, 200);
  staff = staffLogin.headers.get('set-cookie').split(';')[0];
  const input = booking();
  assert.equal(
    (await call('appointments', customer, { ...input, vehicle: { type: 'invalid' } })).status,
    400,
  );
  assert.equal(
    (await call('appointments', customer, { ...input, package: '__proto__' })).status,
    400,
  );
  assert.equal(
    (await call('appointments', customer, { ...input, date: '2026-02-31' })).status,
    400,
  );
  const created = await call('appointments', customer, input);
  assert.equal(created.status, 201);
  let row = (await created.json()).appointment;
  assert.deepEqual(row.vehicle, { type: 'car' });
  assert.equal(row.quote.total, 40);
  assert.equal(row.qr, undefined);
  assert.equal((await (await call('appointments', customer, input)).json()).appointment.id, row.id);
  assert.equal((await call(`appointments/${row.id}/qr`, other)).status, 404);
  assert.equal((await call(`appointments/${row.id}/cancel`, other, {})).status, 404);
  assert.equal((await call(`appointments/${row.id}/receipt`, customer)).status, 409);
  const qr = await (await call(`appointments/${row.id}/qr`, customer)).json();
  const png = PNG.sync.read(Buffer.from(qr.image.split(',')[1], 'base64'));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height).data;
  assert.match(decoded, /^NQ1:[a-f0-9]{48}$/);
  assert.equal((await call('staff/check-in', customer, { qr: decoded })).status, 403);
  assert.equal((await call('staff/check-in', staff, { qr: decoded })).status, 409);
  assert.equal(
    (await call(`appointments/${row.id}/reschedule`, customer, { date, time: '11:00' })).status,
    200,
  );
  assert.equal((await call('staff/check-in', staff, { qr: decoded })).status, 404);
  assert.equal(
    db
      .prepare("SELECT COUNT(*) AS n FROM reminders WHERE appointment=? AND status='pending'")
      .get(row.id).n,
    1,
  );
  assert.equal(
    db
      .prepare("SELECT COUNT(*) AS n FROM reminders WHERE appointment=? AND status='cancelled'")
      .get(row.id).n,
    1,
  );
  db.prepare('UPDATE appointments SET starts=?,date=? WHERE id=?').run(Date.now(), today(), row.id);
  const search = await (await call('staff/bookings?phone=0911111111', staff)).json();
  assert.equal(search.appointments[0].id, row.id);
  const token = db.prepare('SELECT qr FROM appointments WHERE id=?').get(row.id).qr;
  assert.equal((await call('staff/check-in', staff, { qr: 'NQ1:' + token })).status, 200);
  const duplicate = await (await call('staff/check-in', staff, { id: row.id })).json();
  assert.equal(duplicate.alreadyCheckedIn, true);
  assert.equal((await call(`appointments/${row.id}/cancel`, customer, {})).status, 409);
  assert.equal((await call('staff/complete', staff, { id: row.id, paid: false })).status, 400);
  assert.equal((await call('staff/complete', staff, { id: row.id, paid: true })).status, 200);
  const receipt = await (await call(`appointments/${row.id}/receipt`, customer)).json();
  assert.equal(receipt.appointment.quote.total, 40);
  assert.ok(receipt.paidAt);
  assert.equal((await call(`appointments/${row.id}/receipt`, other)).status, 404);
  assert.equal((await call('staff/check-in', staff, { qr: 'NQ1:' + token })).status, 409);
  const cancelled = (await (await call('appointments', customer, booking('12:00'))).json())
    .appointment;
  assert.equal((await call(`appointments/${cancelled.id}/cancel`, customer, {})).status, 200);
  assert.equal((await call(`appointments/${cancelled.id}/qr`, customer)).status, 409);
  assert.equal(
    db.prepare('SELECT status FROM reminders WHERE appointment=?').get(cancelled.id).status,
    'cancelled',
  );
  const responses = await Promise.all(
    Array.from({ length: 4 }, () => call('appointments', customer, booking('15:00'))),
  );
  assert.deepEqual(responses.map((res) => res.status).sort(), [201, 201, 201, 409]);
  const availability = await (await call('availability?date=' + date, customer)).json();
  assert.equal(availability.slots.find((slot) => slot.time === '15:00').available, false);
  assert.equal((await call('staff/check-in', staff, { qr: 'fake' })).status, 404);
  const history = await (await call('appointments', customer)).json();
  assert.ok(history.appointments.some((a) => a.status === 'completed'));
  assert.ok(history.appointments.some((a) => a.status === 'cancelled'));
  assert.equal((await fetch(base + '/reminders.js')).status, 404);
});
