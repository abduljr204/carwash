const { openDatabase } = require('./backend/database');
const { createApp } = require('./backend/app');
const { grantStaffAccess } = require('./backend/auth');
const { createReminderWorker } = require('./backend/reminders');

const db = openDatabase();
const app = createApp(db);

if (process.argv[2] === '--staff') {
  try {
    console.log('Staff access granted to ' + grantStaffAccess(db, process.argv[3]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
} else {
  createReminderWorker(db);
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  app.listen(port, host, () => console.log('Naqa Qurtuba running on http://localhost:' + port));
}
