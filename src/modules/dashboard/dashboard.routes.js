'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roles');
const { handleValidationErrors } = require('../../middleware/errorHandler');
const { dashboardValidators } = require('../../utils/validators');

const analystAndAdmin = [authenticate, requireRole('analyst', 'admin')];

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Overall financial summary
 *     description: Returns total income, expenses, net balance, and record counts. Analyst + Admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/DashboardSummary' }
 *       403:
 *         description: Viewers cannot access dashboard
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/summary', ...analystAndAdmin, controller.getSummary);

/**
 * @openapi
 * /dashboard/by-category:
 *   get:
 *     tags: [Dashboard]
 *     summary: Breakdown of records grouped by category
 *     description: Returns totals and counts per category+type combination. Analyst + Admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CategoryBreakdown' }
 */
router.get('/by-category', ...analystAndAdmin, controller.getByCategory);

/**
 * @openapi
 * /dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Time-series income vs expense trends
 *     description: Returns last 12 periods. Analyst + Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, weekly]
 *           default: monthly
 *         description: Grouping period — monthly (YYYY-MM) or weekly (YYYY-WW)
 *     responses:
 *       200:
 *         description: Trend data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TrendPoint' }
 *       422:
 *         description: Invalid period value
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  '/trends',
  ...analystAndAdmin,
  dashboardValidators.trends,
  handleValidationErrors,
  controller.getTrends
);

/**
 * @openapi
 * /dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Most recent financial records
 *     description: Returns N most recent non-deleted records ordered by date. Analyst + Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *           maximum: 20
 *         description: Number of records to return (max 20)
 *     responses:
 *       200:
 *         description: Recent records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FinancialRecord' }
 *       422:
 *         description: Invalid limit value
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  '/recent',
  ...analystAndAdmin,
  dashboardValidators.recent,
  handleValidationErrors,
  controller.getRecent
);

module.exports = router;
