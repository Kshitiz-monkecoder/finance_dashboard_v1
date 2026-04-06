'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/finance.db';
const resolvedPath = path.resolve(DB_PATH);

// Ensure the database directory exists before opening the file
const dbDir = path.dirname(resolvedPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(resolvedPath);
    // WAL mode: concurrent reads don't block writes
    db.pragma('journal_mode = WAL');
    // Enforce foreign key constraints (SQLite disables them by default)
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT    PRIMARY KEY,
      name          TEXT    NOT NULL,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL CHECK(role IN ('viewer', 'analyst', 'admin')),
      status        TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id         TEXT    PRIMARY KEY,
      amount     REAL    NOT NULL CHECK(amount > 0),
      type       TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      category   TEXT    NOT NULL,
      date       TEXT    NOT NULL,
      notes      TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_by TEXT    NOT NULL REFERENCES users(id),
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      action      TEXT NOT NULL,
      target_type TEXT,
      target_id   TEXT,
      timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for common filter/sort patterns on financial_records
    CREATE INDEX IF NOT EXISTS idx_records_date       ON financial_records(date);
    CREATE INDEX IF NOT EXISTS idx_records_type       ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_records_category   ON financial_records(category);
    CREATE INDEX IF NOT EXISTS idx_records_is_deleted ON financial_records(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_records_created_by ON financial_records(created_by);

    -- Indexes for audit log lookups
    CREATE INDEX IF NOT EXISTS idx_audit_user_id   ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_target_id ON audit_log(target_id);
  `);

  return database;
}

module.exports = { getDb, initializeDatabase };
