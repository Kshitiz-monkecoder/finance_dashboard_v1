'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../config/database');
const AppError = require('../../utils/AppError');

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

function register({ name, email, password, role }) {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new AppError('Email already in use', 409, 'DUPLICATE_EMAIL');
  }

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);

  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, email, password_hash, role);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return { token: generateToken(user), user: sanitizeUser(user) };
}

async function login({ email, password }) {
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Use same message for missing user and wrong password — prevents user enumeration
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status === 'inactive') {
    throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
  }

  return { token: generateToken(user), user: sanitizeUser(user) };
}

function getMe(userId) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return sanitizeUser(user);
}

module.exports = { register, login, getMe };
