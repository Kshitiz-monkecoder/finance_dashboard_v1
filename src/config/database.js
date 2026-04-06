'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use environment variable if provided (useful for Render later)
const DB_PATH = process.env.DB_PATH || './database/finance.db';
const resolvedPath = path.resolve(DB_PATH);

// Ensure the database directory exists
const dbDir = path.dirname(resolvedPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

// Singleton DB connection
function getDb() {
  if (!db) {
    db = new sqlite3.Database(resolvedPath, (err) => {
      if (err) {
        console.error('❌ DB connection error:', err.message);
      } else {
        console.log('✅ Connected to SQLite database');

        // Enable WAL mode (better concurrency)
        db.run("PRAGMA journal_mode = WAL;");

        // Enable foreign key constraints
        db.run("PRAGMA foreign_keys = ON;");
      }
    });
  }
  return db;
}

// Initialize tables
function initializeDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('viewer', 'analyst', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_records_date       ON financial_records(date);
    CREATE INDEX IF NOT EXISTS idx_records_type       ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_records_category   ON financial_records(category);
    CREATE INDEX IF NOT EXISTS idx_records_is_deleted ON financial_records(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_records_created_by ON financial_records(created_by);

    CREATE INDEX IF NOT EXISTS idx_audit_user_id   ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_target_id ON audit_log(target_id);
  `, (err) => {
    if (err) {
      console.error('❌ Error initializing database:', err.message);
    } else {
      console.log('✅ Database initialized successfully');
    }
  });

  return database;
}

module.exports = { getDb, initializeDatabase };