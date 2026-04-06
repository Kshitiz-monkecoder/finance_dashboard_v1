'use strict';

/**
 * Typed application error.
 * Throw this anywhere in services/middleware instead of plain Error objects.
 *
 * Usage:
 *   throw new AppError('User not found', 404, 'USER_NOT_FOUND');
 */
class AppError extends Error {
  /**
   * @param {string} message   - Human-readable message sent to the client
   * @param {number} statusCode - HTTP status code (default 400)
   * @param {string} code      - Machine-readable error code (default 'APP_ERROR')
   */
  constructor(message, statusCode = 400, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    // Capture stack trace, excluding this constructor call
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

module.exports = AppError;
