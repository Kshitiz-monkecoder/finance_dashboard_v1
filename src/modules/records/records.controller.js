'use strict';

const recordsService = require('./records.service');
const { successResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getRecords = asyncHandler(async (req, res) => {
  const { type, category, from, to, page, limit, search } = req.query;
  return successResponse(res, recordsService.getRecords({ type, category, from, to, page, limit, search }));
});

const getRecordById = asyncHandler(async (req, res) => {
  return successResponse(res, recordsService.getRecordById(req.params.id));
});

const createRecord = asyncHandler(async (req, res) => {
  const record = recordsService.createRecord(req.body, req.user.id);
  return successResponse(res, record, 'Record created successfully', 201);
});

const updateRecord = asyncHandler(async (req, res) => {
  const record = recordsService.updateRecord(req.params.id, req.body, req.user.id);
  return successResponse(res, record, 'Record updated successfully');
});

const deleteRecord = asyncHandler(async (req, res) => {
  const result = recordsService.deleteRecord(req.params.id, req.user.id);
  return successResponse(res, null, result.message);
});

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
