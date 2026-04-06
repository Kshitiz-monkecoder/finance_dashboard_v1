'use strict';

/**
 * Wraps an async Express route handler and forwards any thrown error
 * to Express's next() — eliminating try/catch in every controller.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
