'use strict';

const { getDb } = require('../../config/database');

function getSummary() {
  const db = getDb();

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
      COUNT(*) AS total_records,
      SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) AS income_count,
      SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) AS expense_count
    FROM financial_records
    WHERE is_deleted = 0
  `).get();

  return {
    total_income: row.total_income,
    total_expenses: row.total_expenses,
    net_balance: row.total_income - row.total_expenses,
    total_records: row.total_records,
    income_count: row.income_count,
    expense_count: row.expense_count,
  };
}

function getByCategory() {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      category,
      type,
      SUM(amount) AS total,
      COUNT(*) AS count
    FROM financial_records
    WHERE is_deleted = 0
    GROUP BY category, type
    ORDER BY total DESC
  `).all();

  return rows;
}

function getTrends({ period = 'monthly' } = {}) {
  const db = getDb();

  let periodExpr;
  let limitRows;

  if (period === 'weekly') {
    periodExpr = "strftime('%Y-%W', date)";
    limitRows = 12;
  } else {
    periodExpr = "strftime('%Y-%m', date)";
    limitRows = 12;
  }

  const rows = db.prepare(`
    SELECT
      ${periodExpr} AS period,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
    FROM financial_records
    WHERE is_deleted = 0
    GROUP BY period
    ORDER BY period DESC
    LIMIT ?
  `).all(limitRows);

  // Reverse so oldest period comes first (chronological order)
  const ordered = rows.reverse();

  return ordered.map((row) => ({
    period: row.period,
    income: row.income,
    expenses: row.expenses,
    net: row.income - row.expenses,
  }));
}

function getRecent({ limit = 5 } = {}) {
  const db = getDb();

  const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 5), 20);

  const rows = db.prepare(`
    SELECT * FROM financial_records
    WHERE is_deleted = 0
    ORDER BY date DESC, created_at DESC
    LIMIT ?
  `).all(parsedLimit);

  return rows;
}

module.exports = { getSummary, getByCategory, getTrends, getRecent };
