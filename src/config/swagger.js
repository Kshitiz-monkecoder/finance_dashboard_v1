'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance API',
      version: '1.0.0',
      description:
        'Production-grade Finance Data Processing and Access Control API.\n\n' +
        'Three roles: **viewer** (read records only), **analyst** (+ dashboard access), **admin** (full access).\n\n' +
        '**Quick start:** Call `POST /auth/login` with `admin@finance.com` / `admin123`, ' +
        'copy the returned token, click **Authorize** above and enter `Bearer <token>`.',
    },
    servers: [{ url: '/api', description: 'API base' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Alice Smith' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
            status: { type: 'string', enum: ['active', 'inactive'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        FinancialRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 5000 },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string', example: 'salary' },
            date: { type: 'string', format: 'date', example: '2026-03-01' },
            notes: { type: 'string', example: 'Monthly salary' },
            is_deleted: { type: 'integer', enum: [0, 1] },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedRecords: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/FinancialRecord' } },
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            total_income: { type: 'number', example: 15000 },
            total_expenses: { type: 'number', example: 6200 },
            net_balance: { type: 'number', example: 8800 },
            total_records: { type: 'integer', example: 24 },
            income_count: { type: 'integer', example: 8 },
            expense_count: { type: 'integer', example: 16 },
          },
        },
        CategoryBreakdown: {
          type: 'object',
          properties: {
            category: { type: 'string', example: 'salary' },
            type: { type: 'string', enum: ['income', 'expense'] },
            total: { type: 'number', example: 5000 },
            count: { type: 'integer', example: 3 },
          },
        },
        TrendPoint: {
          type: 'object',
          properties: {
            period: { type: 'string', example: '2026-03' },
            income: { type: 'number', example: 5000 },
            expenses: { type: 'number', example: 2000 },
            net: { type: 'number', example: 3000 },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Human readable error message' },
                code: { type: 'string', example: 'ERROR_CODE' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Login, register, view own profile' },
      { name: 'Users', description: 'User management (admin only)' },
      { name: 'Records', description: 'Financial records with filters & pagination' },
      { name: 'Dashboard', description: 'Aggregations & analytics (analyst + admin)' },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

module.exports = swaggerJsdoc(options);
