'use strict';

const { body, query, param } = require('express-validator');

const userValidators = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin'),
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],

  updateUser: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role')
      .optional()
      .isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin'),
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
};

const recordValidators = {
  create: [
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('type')
      .notEmpty().withMessage('Type is required')
      .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)')
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
    body('notes')
      .optional()
      .isLength({ max: 500 }).withMessage('Notes must be 500 characters or fewer'),
  ],

  update: [
    body('amount')
      .optional()
      .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('type')
      .optional()
      .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters'),
    body('date')
      .optional()
      .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)')
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
    body('notes')
      .optional()
      .isLength({ max: 500 }).withMessage('Notes must be 500 characters or fewer'),
  ],
};

const dashboardValidators = {
  trends: [
    query('period')
      .optional()
      .isIn(['monthly', 'weekly']).withMessage('Period must be monthly or weekly'),
  ],
  recent: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  ],
};

module.exports = { userValidators, recordValidators, dashboardValidators };
