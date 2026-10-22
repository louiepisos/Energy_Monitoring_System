// SQLite is built into Node 22+, so there's no native module to install
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'energy.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create the tables if they don't exist yet
db.exec(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));

// Demo rooms: A is the real clamp node, B and C are simulated
const { n } = db.prepare('SELECT COUNT(*) AS n FROM rooms').get();
if (n === 0) {
  const insert = db.prepare('INSERT INTO rooms (code, name, is_simulated) VALUES (?, ?, ?)');
  insert.run('A', 'Room A (real clamp node)', 0);
  insert.run('B', 'Room B (simulated)', 1);
  insert.run('C', 'Room C (simulated)', 1);
}

module.exports = db;
