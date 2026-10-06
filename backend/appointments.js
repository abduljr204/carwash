const { randomBytes, randomUUID } = require('node:crypto');
const QRCode = require('qrcode');
const config = require('../journey/config');
const HOUR = 3600000;
const today = (now = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};

function setup(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS staff (phone TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY, phone TEXT NOT NULL, starts INTEGER NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL,
      vehicle TEXT NOT NULL, package TEXT NOT NULL, quote TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'booked',
      qr TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL DEFAULT 1, request_key TEXT NOT NULL,
      reminder INTEGER NOT NULL, created INTEGER NOT NULL, checked_in INTEGER, completed INTEGER, worker TEXT,
      UNIQUE(phone, request_key));
    CREATE INDEX IF NOT EXISTS appointments_customer ON appointments(phone, starts);
    CREATE INDEX IF NOT EXISTS appointments_schedule ON appointments(date, time, status);
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY, appointment TEXT NOT NULL, revision INTEGER NOT NULL, due INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL,
      provider_id TEXT, error TEXT, UNIQUE(appointment, revision));`);
}
function schedule(date, time, now = Date.now()) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !config.timeSlots.includes(time)
  )
    fail(400, 'Choose a valid appointment date and time.');
  // Libya uses UTC+02:00; round-trip through the business timezone rejects invalid dates.
  const starts = Date.parse(`${date}T${time}:00+02:00`);
  if (
    !Number.isFinite(starts) ||
    today(starts) !== date ||
    starts <= now ||
    starts > now + config.bookingHorizonDays * 24 * HOUR
  )
    fail(400, 'Choose a future appointment within the next 30 days.');
  return starts;
}
function publicBooking(row) {
  const { qr, request_key, ...safe } = row;
  return {
    ...safe,
    vehicle: { type: JSON.parse(row.vehicle).type },
    quote: JSON.parse(row.quote),
    status: row.status === 'booked' && row.starts + HOUR / 2 < Date.now() ? 'missed' : row.status,
  };
}
function createAppointments({ db, normalize, smsConfigured }) {
  setup(db);
  const get = (id) => db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  const queue = (row) => {
    if (row.reminder) {
      const due = row.starts - HOUR;
      db.prepare(
        'INSERT INTO reminders (id, appointment, revision, due, next_attempt) VALUES (?, ?, ?, ?, ?)',
      ).run(randomUUID(), row.id, row.revision, due, Math.max(Date.now(), due));
    }
  };
  const capacity = (date, time, exclude = '') =>
    config.slotCapacity -
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM appointments WHERE date = ? AND time = ? AND status IN ('booked','checked_in','completed') AND id != ?",
      )
      .get(date, time, exclude).n;
  const transact = (action) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
  return async function route(req, url, session, body, reply) {
    const p = url.pathname;
    if (p === '/api/booking-config' && req.method === 'GET') {
      reply(200, { ...config, smsConfigured: smsConfigured() });
      return true;
    }
    if (
      !p.startsWith('/api/appointments') &&
      !p.startsWith('/api/staff/') &&
      p !== '/api/availability'
    )
      return false;
    if (!session) fail(401, 'Please log in to manage appointments.');
    const isStaff = !!db.prepare('SELECT phone FROM staff WHERE phone = ?').get(session.phone);
    if (p.startsWith('/api/staff/') && !isStaff) fail(403, 'Staff access is required.');
    if (p === '/api/availability' && req.method === 'GET') {
      const date = url.searchParams.get('date');
      const exclude = url.searchParams.get('exclude') || '';
      if (exclude && get(exclude)?.phone !== session.phone) fail(404, 'Appointment not found.');
      reply(200, {
        slots: config.timeSlots.map((time) => {
          let valid = true;
          try {
            schedule(date, time);
          } catch {
            valid = false;
          }
          return { time, available: valid && capacity(date, time, exclude) > 0 };
        }),
      });
      return true;
    }
    if (p === '/api/appointments' && req.method === 'GET') {
      reply(200, {
        appointments: db
          .prepare('SELECT * FROM appointments WHERE phone = ? ORDER BY starts DESC')
          .all(session.phone)
          .map(publicBooking),
        smsConfigured: smsConfigured(),
      });
      return true;
    }
    if (p === '/api/appointments' && req.method === 'POST') {
      if (!body || typeof body.requestKey !== 'string' || !/^[\w-]{16,80}$/.test(body.requestKey))
        fail(400, 'A booking request ID is required.');
      const existing = db
        .prepare('SELECT * FROM appointments WHERE phone = ? AND request_key = ?')
        .get(session.phone, body.requestKey);
      if (existing) {
        reply(200, { appointment: publicBooking(existing) });
        return true;
      }
      const starts = schedule(body.date, body.time);
      const vehicle = body.vehicle;
      const vehicleType = config.vehicles.find((v) => v.id === vehicle?.type);
      if (!vehicleType) fail(400, 'Choose a valid vehicle type.');
      if (!Object.hasOwn(config.packageSurcharges, body.package))
        fail(400, 'Choose a wash package.');
      if (
        !Array.isArray(body.addons) ||
        body.addons.some((id) => !config.addons.some((a) => a.id === id))
      )
        fail(400, 'Choose valid extras.');
      const addons = config.addons.filter((a) => body.addons.includes(a.id));
      const quote = {
        currency: config.currency,
        base: vehicleType.basePrice,
        package: config.packageSurcharges[body.package],
        addons,
        total:
          vehicleType.basePrice +
          config.packageSurcharges[body.package] +
          addons.reduce((sum, a) => sum + a.price, 0),
      };
      const id = randomUUID();
      const cleanVehicle = { type: vehicleType.id };
      transact(() => {
        if (capacity(body.date, body.time) <= 0)
          fail(409, 'This time is fully booked. Please choose another time.');
        db.prepare(
          'INSERT INTO appointments (id,phone,starts,date,time,vehicle,package,quote,qr,request_key,reminder,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        ).run(
          id,
          session.phone,
          starts,
          body.date,
          body.time,
          JSON.stringify(cleanVehicle),
          body.package,
          JSON.stringify(quote),
          randomBytes(24).toString('hex'),
          body.requestKey,
          body.reminder === true ? 1 : 0,
          Date.now(),
        );
        queue(get(id));
      });
      reply(201, { appointment: publicBooking(get(id)) });
      return true;
    }
    const match = p.match(/^\/api\/appointments\/([\w-]+)\/(qr|cancel|reschedule|receipt)$/);
    if (match) {
      const [, id, action] = match;
      const row = get(id);
      if (!row || row.phone !== session.phone) fail(404, 'Appointment not found.');
      if (action === 'qr' && req.method === 'GET') {
        if (!['booked', 'checked_in'].includes(publicBooking(row).status))
          fail(409, 'This appointment is no longer active.');
        reply(200, {
          appointment: publicBooking(row),
          image: await QRCode.toDataURL('NQ1:' + row.qr, {
            width: 320,
            margin: 4,
            errorCorrectionLevel: 'M',
          }),
        });
        return true;
      }
      if (action === 'receipt' && req.method === 'GET') {
        if (row.status !== 'completed')
          fail(409, 'A receipt is available after staff records payment and completes your wash.');
        reply(200, {
          appointment: publicBooking(row),
          receipt: 'NQ-' + row.id.toUpperCase(),
          paidAt: row.completed,
          paymentMethod: 'Paid at the wash',
        });
        return true;
      }
      if (['cancel', 'reschedule'].includes(action) && req.method === 'POST') {
        if (row.status !== 'booked' || row.starts <= Date.now())
          fail(409, 'Only future, unchecked appointments can be changed.');
        if (
          db
            .prepare("SELECT id FROM reminders WHERE appointment = ? AND status = 'sending'")
            .get(id)
        )
          fail(409, 'A reminder is being processed. Please try again in a few seconds.');
        transact(() => {
          if (action === 'cancel')
            db.prepare("UPDATE appointments SET status = 'cancelled', qr = ? WHERE id = ?").run(
              randomBytes(24).toString('hex'),
              id,
            );
          else {
            const starts = schedule(body?.date, body?.time);
            if (capacity(body.date, body.time, id) <= 0)
              fail(409, 'This time is fully booked. Please choose another time.');
            db.prepare(
              'UPDATE appointments SET date=?, time=?, starts=?, revision=revision+1, qr=? WHERE id=?',
            ).run(body.date, body.time, starts, randomBytes(24).toString('hex'), id);
          }
          db.prepare(
            "UPDATE reminders SET status='cancelled' WHERE appointment=? AND status IN ('pending','retry')",
          ).run(id);
          if (action === 'reschedule') queue(get(id));
        });
        reply(200, { appointment: publicBooking(get(id)) });
        return true;
      }
      fail(405, 'Method not allowed.');
    }
    if (p === '/api/staff/bookings' && req.method === 'GET') {
      const search = url.searchParams.get('phone');
      const phone = search ? normalize(search) : null;
      if (search && !phone) fail(400, 'Enter the full customer phone number.');
      const rows = phone
        ? db
            .prepare(
              "SELECT * FROM appointments WHERE date=? AND phone=? AND status IN ('booked','checked_in') ORDER BY starts",
            )
            .all(today(), phone)
        : db
            .prepare(
              "SELECT * FROM appointments WHERE date=? AND status IN ('booked','checked_in') ORDER BY starts",
            )
            .all(today());
      reply(200, {
        date: today(),
        appointments: rows.map(publicBooking),
        smsConfigured: smsConfigured(),
        reminderIssues: db
          .prepare("SELECT COUNT(*) AS n FROM reminders WHERE status IN ('failed','unknown')")
          .get().n,
      });
      return true;
    }
    if (p === '/api/staff/check-in' && req.method === 'POST') {
      const row =
        typeof body?.qr === 'string' && /^NQ1:[a-f0-9]{48}$/.test(body.qr)
          ? db.prepare('SELECT * FROM appointments WHERE qr=?').get(body.qr.slice(4))
          : body?.id
            ? get(body.id)
            : null;
      if (!row) fail(404, 'No booking matches this QR code. Try searching by phone number.');
      if (row.status === 'checked_in') {
        reply(200, { appointment: publicBooking(row), alreadyCheckedIn: true });
        return true;
      }
      if (
        row.status !== 'booked' ||
        row.date !== today() ||
        Date.now() < row.starts - HOUR ||
        Date.now() > row.starts + HOUR / 2
      )
        fail(
          409,
          'Check-in opens 1 hour before the appointment and closes 30 minutes after it. Cancelled or completed bookings cannot check in.',
        );
      db.prepare(
        "UPDATE appointments SET status='checked_in', checked_in=?, worker=? WHERE id=? AND status='booked'",
      ).run(Date.now(), session.phone, row.id);
      db.prepare(
        "UPDATE reminders SET status='cancelled' WHERE appointment=? AND status IN ('pending','retry')",
      ).run(row.id);
      reply(200, { appointment: publicBooking(get(row.id)) });
      return true;
    }
    if (p === '/api/staff/complete' && req.method === 'POST') {
      const row = get(body?.id || '');
      if (!row || row.status !== 'checked_in')
        fail(409, 'Only a checked-in wash can be completed.');
      if (body.paid !== true) fail(400, 'Confirm payment was collected before issuing a receipt.');
      db.prepare(
        "UPDATE appointments SET status='completed', completed=?, worker=? WHERE id=? AND status='checked_in'",
      ).run(Date.now(), session.phone, row.id);
      reply(200, { appointment: publicBooking(get(row.id)) });
      return true;
    }
    fail(404, 'Not found.');
  };
}
module.exports = { createAppointments, setup, today, schedule, publicBooking };
