'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Express middleware — checks express-validator results.
 * Attach after validator chains in any route that needs input validation.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      },
    });
  }
  next();
}

/**
 * Global Express error handler (must have 4 parameters).
 * Handles AppError, SQLite constraint errors, JWT errors, and generic 500s.
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  // Our own typed errors — trust the statusCode and code we set
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }

  // SQLite unique constraint violation
  if (
    err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    (err.message && err.message.includes('UNIQUE constraint failed'))
  ) {
    return res.status(409).json({
      success: false,
      error: { message: 'A record with that value already exists', code: 'DUPLICATE_ENTRY' },
    });
  }

  // Other SQLite errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({
      success: false,
      error: { message: 'Database error', code: err.code },
    });
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { message: 'Token has expired. Please log in again.', code: 'TOKEN_EXPIRED' },
    });
  }

  // JWT malformed / wrong secret
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' },
    });
  }

  // Generic fallback — never leak stack traces to clients
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      message: isDev ? err.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDev && { stack: err.stack }),
    },
  });
}

module.exports = { handleValidationErrors, globalErrorHandler };
