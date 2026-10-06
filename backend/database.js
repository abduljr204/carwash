const { DatabaseSync } = require('node:sqlite');
const { scryptSync } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function openDatabase() {
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', '.data');
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'accounts.sqlite'));
  db.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users (
      phone TEXT PRIMARY KEY,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS staff_users (
      username TEXT PRIMARY KEY,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL
    );
  `);
  const defaultSalt = 'naqa-default-admin-salt-v1';
  const defaultHash = scryptSync('Admin123', defaultSalt, 64).toString('hex');
  db.prepare('INSERT OR IGNORE INTO staff_users (username, salt, hash) VALUES (?, ?, ?)').run(
    'admin',
    defaultSalt,
    defaultHash,
  );
  return db;
}

module.exports = { openDatabase };
