'use strict';

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { AUDIT_ACTIONS } = require('../../constants');

function insertAuditLog(db, { userId, action, targetType, targetId }) {
  db.prepare(
    'INSERT INTO audit_log (id, user_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)'
  ).run(uuidv4(), userId, action, targetType || null, targetId || null);
}

function getRecords({ type, category, from, to, page = 1, limit = 10, search } = {}) {
  const db = getDb();

  const conditions = ['is_deleted = 0'];
  const params = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (category) {
    conditions.push('LOWER(category) = LOWER(?)');
    params.push(category);
  }
  if (from) {
    conditions.push('date >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('date <= ?');
    params.push(to);
  }
  if (search) {
    conditions.push('(LOWER(notes) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 100);
  const offset = (parsedPage - 1) * parsedLimit;

  const { total } = db.prepare(
    `SELECT COUNT(*) AS total FROM financial_records ${where}`
  ).get(...params);

  const data = db.prepare(
    `SELECT * FROM financial_records ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parsedLimit, offset);

  return {
    data,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit),
  };
}

function getRecordById(id) {
  const db = getDb();
  const record = db.prepare(
    'SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0'
  ).get(id);
  if (!record) throw new AppError('Record not found', 404, 'RECORD_NOT_FOUND');
  return record;
}

function createRecord({ amount, type, category, date, notes }, userId) {
  const db = getDb();
  const id = uuidv4();

  db.prepare(
    'INSERT INTO financial_records (id, amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, amount, type, category, date, notes || null, userId);

  insertAuditLog(db, { userId, action: AUDIT_ACTIONS.CREATE_RECORD, targetType: 'record', targetId: id });

  return db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);
}

function updateRecord(id, updates, userId) {
  const db = getDb();

  const record = db.prepare(
    'SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0'
  ).get(id);
  if (!record) throw new AppError('Record not found', 404, 'RECORD_NOT_FOUND');

  const allowedFields = ['amount', 'type', 'category', 'date', 'notes'];
  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new AppError('No valid fields provided for update', 400, 'NO_UPDATE_FIELDS');
  }

  setClauses.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE financial_records SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  insertAuditLog(db, { userId, action: AUDIT_ACTIONS.UPDATE_RECORD, targetType: 'record', targetId: id });

  return db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);
}

function deleteRecord(id, userId) {
  const db = getDb();

  const record = db.prepare(
    'SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0'
  ).get(id);
  if (!record) throw new AppError('Record not found', 404, 'RECORD_NOT_FOUND');

  db.prepare(
    "UPDATE financial_records SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?"
  ).run(id);

  insertAuditLog(db, { userId, action: AUDIT_ACTIONS.DELETE_RECORD, targetType: 'record', targetId: id });

  return { message: 'Record deleted successfully' };
}

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
