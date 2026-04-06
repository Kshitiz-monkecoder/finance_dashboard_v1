'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { AUDIT_ACTIONS } = require('../../constants');

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

function insertAuditLog(db, { userId, action, targetType, targetId }) {
  db.prepare(
    'INSERT INTO audit_log (id, user_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)'
  ).run(uuidv4(), userId, action, targetType || null, targetId || null);
}

function getAllUsers({ status } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const users = db.prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC`).all(...params);
  return users.map(sanitizeUser);
}

function getUserById(id) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return sanitizeUser(user);
}

function createUser({ name, email, password, role }, requestingUserId) {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new AppError('Email already in use', 409, 'DUPLICATE_EMAIL');

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);

  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, email, password_hash, role);

  insertAuditLog(db, {
    userId: requestingUserId,
    action: AUDIT_ACTIONS.CREATE_USER,
    targetType: 'user',
    targetId: id,
  });

  return sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
}

function updateUser(id, updates, requestingUserId) {
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  if (id === requestingUserId && updates.role !== undefined) {
    throw new AppError('You cannot change your own role', 403, 'SELF_ROLE_CHANGE');
  }
  if (id === requestingUserId && updates.status === 'inactive') {
    throw new AppError('You cannot deactivate your own account', 403, 'SELF_DEACTIVATION');
  }

  const allowedFields = ['name', 'role', 'status'];
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

  db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  insertAuditLog(db, {
    userId: requestingUserId,
    action: AUDIT_ACTIONS.UPDATE_USER,
    targetType: 'user',
    targetId: id,
  });

  return sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
}

function deactivateUser(id, requestingUserId) {
  const db = getDb();

  if (id === requestingUserId) {
    throw new AppError('You cannot deactivate your own account', 403, 'SELF_DEACTIVATION');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  if (user.status === 'inactive') {
    throw new AppError('User is already inactive', 409, 'ALREADY_INACTIVE');
  }

  db.prepare("UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ?").run(id);

  insertAuditLog(db, {
    userId: requestingUserId,
    action: AUDIT_ACTIONS.DEACTIVATE_USER,
    targetType: 'user',
    targetId: id,
  });

  return { message: 'User deactivated successfully' };
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deactivateUser };
