const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { setup } = require('../backend/appointments');
const { createReminderWorker } = require('../backend/reminders');
test('persistent reminders: due time, deduplication, cancellation, retries, and ambiguous delivery', async () => {
  const db = new DatabaseSync(':memory:');
  setup(db);
  let now = Date.now(),
    enabled = false,
    sends = 0,
    behavior = 'success';
  const worker = createReminderWorker(db, {
    enabled: () => enabled,
    now: () => now,
    send: async () => {
      sends++;
      if (behavior === 'retry') throw Object.assign(new Error('rate limit'), { retryable: true });
      if (behavior === 'unknown') throw new Error('timeout');
      return 'SM-test';
    },
  });
  const seed = (id, starts = now + 3600000, status = 'booked', revision = 1) => {
    db.prepare(
      'INSERT INTO appointments (id,phone,starts,date,time,vehicle,package,quote,status,qr,request_key,reminder,created,revision) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ).run(
      id,
      '+218911111111',
      starts,
      '2026-10-07',
      '10:00',
      JSON.stringify({ type: 'car' }),
      'full',
      '{}',
      status,
      id,
      id,
      1,
      now,
      revision,
    );
    db.prepare(
      'INSERT INTO reminders (id,appointment,revision,due,next_attempt) VALUES (?,?,?,?,?)',
    ).run(id, id, 1, starts - 3600000, starts - 3600000);
  };
  try {
    seed('due');
    seed('future', now + 7200000);
    seed('cancelled', now + 3600000, 'cancelled');
    seed('old-revision', now + 3600000, 'booked', 2);
    seed('expired', now - 1);
    await worker.tick();
    assert.equal(sends, 0);
    enabled = true;
    await worker.tick();
    assert.equal(sends, 1);
    assert.equal(
      db.prepare('SELECT status FROM reminders WHERE id=?').get('due').status,
      'accepted',
    );
    await worker.tick();
    assert.equal(sends, 1);
    for (const id of ['cancelled', 'old-revision', 'expired'])
      assert.equal(
        db.prepare('SELECT status FROM reminders WHERE id=?').get(id).status,
        'cancelled',
      );
    behavior = 'retry';
    seed('retry');
    await worker.tick();
    assert.equal(sends, 2);
    assert.equal(
      db.prepare('SELECT status FROM reminders WHERE id=?').get('retry').status,
      'retry',
    );
    behavior = 'success';
    now += 61000;
    await worker.tick();
    assert.equal(sends, 3);
    assert.equal(
      db.prepare('SELECT status FROM reminders WHERE id=?').get('retry').status,
      'accepted',
    );
    behavior = 'unknown';
    seed('unknown');
    await worker.tick();
    assert.equal(sends, 4);
    await worker.tick();
    assert.equal(sends, 4);
    assert.equal(
      db.prepare('SELECT status FROM reminders WHERE id=?').get('unknown').status,
      'unknown',
    );
    seed('interrupted');
    db.prepare("UPDATE reminders SET status='sending' WHERE id='interrupted'").run();
    const restarted = createReminderWorker(db, { enabled: () => false });
    restarted.stop();
    assert.equal(
      db.prepare('SELECT status FROM reminders WHERE id=?').get('interrupted').status,
      'unknown',
    );
  } finally {
    worker.stop();
    db.close();
  }
});
