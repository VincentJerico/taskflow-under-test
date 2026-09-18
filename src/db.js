import Database from 'better-sqlite3';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'todo',
  due_date   TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
`;

/**
 * Create/open a database and ensure the schema exists.
 * Pass ':memory:' for isolated test databases.
 */
export function createDb(path = process.env.DATABASE_PATH || 'taskflow.db') {
  const db = new Database(path);
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}
