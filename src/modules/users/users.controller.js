'use strict';

const usersService = require('./users.service');
const { successResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  return successResponse(res, usersService.getAllUsers({ status }));
});

const getUserById = asyncHandler(async (req, res) => {
  return successResponse(res, usersService.getUserById(req.params.id));
});

const createUser = asyncHandler(async (req, res) => {
  const user = usersService.createUser(req.body, req.user.id);
  return successResponse(res, user, 'User created successfully', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = usersService.updateUser(req.params.id, req.body, req.user.id);
  return successResponse(res, user, 'User updated successfully');
});

const deactivateUser = asyncHandler(async (req, res) => {
  const result = usersService.deactivateUser(req.params.id, req.user.id);
  return successResponse(res, null, result.message);
});

module.exports = { getAllUsers, getUserById, createUser, updateUser, deactivateUser };
