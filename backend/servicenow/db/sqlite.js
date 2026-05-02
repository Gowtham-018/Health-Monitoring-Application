const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../data/incidents.db');
const DB_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err.message);
    process.exit(1);
  }
});

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const initDatabase = async () => {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      servicenow_sys_id TEXT,
      short_description TEXT NOT NULL,
      description TEXT,
      urgency TEXT,
      impact TEXT,
      caller_id TEXT,
      status TEXT NOT NULL,
      resolution_notes TEXT,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
};

const createIncidentLocal = async ({
  servicenowSysId = null,
  short_description,
  description,
  urgency,
  impact,
  caller_id,
  status,
  resolution_notes = null,
  source = 'servicenow',
}) => {
  const now = new Date().toISOString();
  const result = await runAsync(
    `INSERT INTO incidents (
      servicenow_sys_id,
      short_description,
      description,
      urgency,
      impact,
      caller_id,
      status,
      resolution_notes,
      source,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      servicenowSysId,
      short_description,
      description,
      urgency,
      impact,
      caller_id,
      status,
      resolution_notes,
      source,
      now,
      now,
    ]
  );

  return getAsync('SELECT * FROM incidents WHERE id = ?', [result.lastID]);
};

const getIncidentById = async (id) =>
  getAsync('SELECT * FROM incidents WHERE id = ?', [id]);

const updateIncidentLocal = async (id, fields) => {
  const updates = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    updates.push(`${key} = ?`);
    params.push(value);
  }

  params.push(new Date().toISOString(), id);

  await runAsync(
    `UPDATE incidents SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
    params
  );

  return getIncidentById(id);
};

module.exports = {
  initDatabase,
  createIncidentLocal,
  getIncidentById,
  updateIncidentLocal,
};
