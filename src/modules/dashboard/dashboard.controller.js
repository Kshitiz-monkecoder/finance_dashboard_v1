'use strict';

const dashboardService = require('./dashboard.service');
const { successResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  return successResponse(res, dashboardService.getSummary());
});

const getByCategory = asyncHandler(async (req, res) => {
  return successResponse(res, dashboardService.getByCategory());
});

const getTrends = asyncHandler(async (req, res) => {
  return successResponse(res, dashboardService.getTrends({ period: req.query.period }));
});

const getRecent = asyncHandler(async (req, res) => {
  return successResponse(res, dashboardService.getRecent({ limit: req.query.limit }));
});

module.exports = { getSummary, getByCategory, getTrends, getRecent };
