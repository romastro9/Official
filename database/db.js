const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'masterpost.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  page_token_enc TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  type TEXT NOT NULL,
  caption TEXT,
  file_name TEXT,
  file_url TEXT,
  status TEXT NOT NULL,
  facebook_post_id TEXT,
  error_message TEXT,
  payload_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  app_name TEXT DEFAULT 'MasterPost AI',
  default_caption_footer TEXT DEFAULT '',
  max_upload_size_mb INTEGER DEFAULT 50,
  allowed_file_types TEXT DEFAULT 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime',
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en'
);
`);

const hasAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(process.env.ADMIN_USERNAME || 'admin');
if (!hasAdmin) {
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(process.env.ADMIN_USERNAME || 'admin', hash);
}

const settings = db.prepare('SELECT id FROM settings WHERE id=1').get();
if (!settings) {
  db.prepare('INSERT INTO settings (id) VALUES (1)').run();
}

module.exports = db;
