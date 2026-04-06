'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./records.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roles');
const { handleValidationErrors } = require('../../middleware/errorHandler');
const { recordValidators } = require('../../utils/validators');

const allRoles = [authenticate, requireRole('viewer', 'analyst', 'admin')];
const adminOnly = [authenticate, requireRole('admin')];

/**
 * @openapi
 * /records:
 *   get:
 *     tags: [Records]
 *     summary: List financial records with filters and pagination
 *     description: All authenticated roles can access. Only returns non-deleted records.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string, example: salary }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, example: '2026-01-01' }
 *         description: Start date (inclusive)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, example: '2026-03-31' }
 *         description: End date (inclusive)
 *       - in: query
 *         name: search
 *         schema: { type: string, example: salary }
 *         description: Searches notes and category fields
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/PaginatedRecords' }
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', ...allRoles, controller.getRecords);

/**
 * @openapi
 * /records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get a single financial record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found or deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', ...allRoles, controller.getRecordById);

/**
 * @openapi
 * /records:
 *   post:
 *     tags: [Records]
 *     summary: Create a new financial record
 *     description: Admin only. Automatically logged to audit trail.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount: { type: number, minimum: 0.01, example: 5000 }
 *               type: { type: string, enum: [income, expense], example: income }
 *               category: { type: string, minLength: 2, maxLength: 50, example: salary }
 *               date: { type: string, format: date, example: '2026-03-01' }
 *               notes: { type: string, maxLength: 500, example: March salary payment }
 *     responses:
 *       201:
 *         description: Record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/FinancialRecord' }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/', ...adminOnly, recordValidators.create, handleValidationErrors, controller.createRecord);

/**
 * @openapi
 * /records/{id}:
 *   patch:
 *     tags: [Records]
 *     summary: Partially update a financial record
 *     description: Admin only. Only provided fields are updated. Logged to audit trail.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number, minimum: 0.01, example: 5500 }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string, minLength: 2, maxLength: 50 }
 *               date: { type: string, format: date }
 *               notes: { type: string, maxLength: 500, example: Revised amount }
 *     responses:
 *       200:
 *         description: Record updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch('/:id', ...adminOnly, recordValidators.update, handleValidationErrors, controller.updateRecord);

/**
 * @openapi
 * /records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft-delete a financial record
 *     description: Admin only. Sets is_deleted=1. Record is never physically removed. Logged to audit trail.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Record deleted successfully }
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete('/:id', ...adminOnly, controller.deleteRecord);

module.exports = router;
