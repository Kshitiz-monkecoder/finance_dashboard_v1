'use strict';

const AppError = require('../utils/AppError');

/**
 * Role-based access control middleware factory.
 * Place AFTER authenticate middleware in every protected route.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole('admin'), controller)
 *   router.get('/analyst+', authenticate, requireRole('analyst', 'admin'), controller)
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { requireRole };
