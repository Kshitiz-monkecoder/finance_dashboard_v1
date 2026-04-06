'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * JWT authentication middleware.
 * Reads Bearer token from Authorization header, verifies it,
 * and attaches decoded { id, email, role } to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required', 401, 'MISSING_TOKEN'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    // Let the global error handler translate JWT errors into proper responses
    next(err);
  }
}

module.exports = { authenticate };
