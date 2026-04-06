'use strict';

/**
 * Demo data seeder — populates the DB with sample users and financial records
 * for testing all endpoints and dashboard visualisations.
 *
 * Usage:
 *   node scripts/seed-demo.js
 *
 * Safe to re-run: skips seeding if demo records already exist.
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, getDb } = require('../src/config/database');

initializeDatabase();
const db = getDb();

// ── Guard: skip if demo data already exists ──────────────────────────────
const existingRecords = db.prepare("SELECT COUNT(*) AS c FROM financial_records").get();
if (existingRecords.c > 0) {
  console.log('⏭  Demo data already exists — skipping seed. Drop the DB file to re-seed.');
  process.exit(0);
}

console.log('🌱 Seeding demo data...\n');

// ── Users ────────────────────────────────────────────────────────────────
const users = [
  { name: 'Admin User',    email: 'admin@finance.com',   password: 'admin123',   role: 'admin'   },
  { name: 'Alice Analyst', email: 'alice@finance.com',   password: 'alice123',   role: 'analyst' },
  { name: 'Bob Viewer',    email: 'bob@finance.com',     password: 'bob12345',   role: 'viewer'  },
  { name: 'Inactive User', email: 'inactive@finance.com',password: 'inactive1',  role: 'viewer', status: 'inactive' },
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)'
);

const userIds = {};
for (const u of users) {
let user = db.prepare("SELECT id FROM users WHERE email = ?").get(u.email);

if (!user) {
  const id = uuidv4();
  const hash = bcrypt.hashSync(u.password, 10);

  insertUser.run(id, u.name, u.email, hash, u.role, u.status || 'active');

  userIds[u.email] = id;
} else {
  userIds[u.email] = user.id;
}
  console.log(`  👤 ${u.role.padEnd(8)} ${u.email}  /  ${u.password}`);
}

const adminId = userIds['admin@finance.com'];

// ── Financial Records (last 6 months) ────────────────────────────────────
const now = new Date();

function monthAgo(n, day = 1) {
  const d = new Date(now);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

const records = [
  // Income
  { amount: 75000, type: 'income',  category: 'salary',      date: monthAgo(0, 1),  notes: 'Monthly salary — April 2026'     },
  { amount: 75000, type: 'income',  category: 'salary',      date: monthAgo(1, 1),  notes: 'Monthly salary — March 2026'     },
  { amount: 75000, type: 'income',  category: 'salary',      date: monthAgo(2, 1),  notes: 'Monthly salary — February 2026'  },
  { amount: 75000, type: 'income',  category: 'salary',      date: monthAgo(3, 1),  notes: 'Monthly salary — January 2026'   },
  { amount: 75000, type: 'income',  category: 'salary',      date: monthAgo(4, 1),  notes: 'Monthly salary — December 2025'  },
  { amount: 75000, type: 'income',  category: 'salary',      date: monthAgo(5, 1),  notes: 'Monthly salary — November 2025'  },
  { amount: 12000, type: 'income',  category: 'freelance',   date: monthAgo(0, 10), notes: 'Website redesign project'         },
  { amount:  8500, type: 'income',  category: 'freelance',   date: monthAgo(1, 15), notes: 'API integration contract'         },
  { amount:  5000, type: 'income',  category: 'investments', date: monthAgo(0, 20), notes: 'Dividend payout Q1'               },
  { amount:  3200, type: 'income',  category: 'investments', date: monthAgo(3, 20), notes: 'Dividend payout Q4'               },
  { amount:  2000, type: 'income',  category: 'other',       date: monthAgo(2, 5),  notes: 'Tax refund'                       },

  // Expenses
  { amount: 22000, type: 'expense', category: 'rent',        date: monthAgo(0, 1),  notes: 'Monthly rent — April'            },
  { amount: 22000, type: 'expense', category: 'rent',        date: monthAgo(1, 1),  notes: 'Monthly rent — March'            },
  { amount: 22000, type: 'expense', category: 'rent',        date: monthAgo(2, 1),  notes: 'Monthly rent — February'         },
  { amount: 22000, type: 'expense', category: 'rent',        date: monthAgo(3, 1),  notes: 'Monthly rent — January'          },
  { amount: 22000, type: 'expense', category: 'rent',        date: monthAgo(4, 1),  notes: 'Monthly rent — December'         },
  { amount: 22000, type: 'expense', category: 'rent',        date: monthAgo(5, 1),  notes: 'Monthly rent — November'         },
  { amount:  8500, type: 'expense', category: 'food',        date: monthAgo(0, 8),  notes: 'Groceries + dining'              },
  { amount:  9200, type: 'expense', category: 'food',        date: monthAgo(1, 8),  notes: 'Groceries + dining'              },
  { amount:  7800, type: 'expense', category: 'food',        date: monthAgo(2, 8),  notes: 'Groceries + dining'              },
  { amount:  4500, type: 'expense', category: 'utilities',   date: monthAgo(0, 5),  notes: 'Electricity + internet + water'  },
  { amount:  4200, type: 'expense', category: 'utilities',   date: monthAgo(1, 5),  notes: 'Electricity + internet + water'  },
  { amount:  3800, type: 'expense', category: 'utilities',   date: monthAgo(2, 5),  notes: 'Electricity + internet + water'  },
  { amount: 15000, type: 'expense', category: 'travel',      date: monthAgo(1, 22), notes: 'Team offsite travel'             },
  { amount:  6000, type: 'expense', category: 'travel',      date: monthAgo(4, 10), notes: 'Conference — flights + hotel'    },
  { amount:  3500, type: 'expense', category: 'software',    date: monthAgo(0, 3),  notes: 'SaaS subscriptions bundle'       },
  { amount:  3500, type: 'expense', category: 'software',    date: monthAgo(1, 3),  notes: 'SaaS subscriptions bundle'       },
  { amount:  2200, type: 'expense', category: 'health',      date: monthAgo(0, 15), notes: 'Health insurance premium'        },
  { amount:  1800, type: 'expense', category: 'health',      date: monthAgo(2, 15), notes: 'Dental + optician'               },
  { amount:  5000, type: 'expense', category: 'education',   date: monthAgo(3, 10), notes: 'Online course subscription'      },
];

const insertRecord = db.prepare(
  'INSERT INTO financial_records (id, amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

const seedRecords = db.transaction(() => {
  for (const r of records) {
    insertRecord.run(uuidv4(), r.amount, r.type, r.category, r.date, r.notes, adminId);
  }
});
seedRecords();

console.log(`\n  💰 ${records.length} financial records inserted (last 6 months)\n`);

// ── Summary ──────────────────────────────────────────────────────────────
const summary = db.prepare(`
  SELECT
    ROUND(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 2) AS income,
    ROUND(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 2) AS expenses,
    COUNT(*) AS total
  FROM financial_records
`).get();

console.log('📊 Seeded summary:');
console.log(`  Income:   ₹${summary.income.toLocaleString()}`);
console.log(`  Expenses: ₹${summary.expenses.toLocaleString()}`);
console.log(`  Net:      ₹${(summary.income - summary.expenses).toLocaleString()}`);
console.log(`  Records:  ${summary.total}`);
console.log('\n✅ Demo seed complete. Start the server with: npm run dev\n');
