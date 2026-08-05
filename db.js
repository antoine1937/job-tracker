const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(__dirname, 'job-tracker.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'A postuler',
    date_applied TEXT,
    url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
