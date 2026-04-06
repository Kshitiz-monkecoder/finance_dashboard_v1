'use strict';

const authService = require('./auth.service');
const { successResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = authService.register(req.body);
  return successResponse(res, result, 'User registered successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return successResponse(res, result, 'Login successful');
  
});

const getMe = asyncHandler(async (req, res) => {
  const user = authService.getMe(req.user.id);
  return successResponse(res, user);
});

module.exports = { register, login, getMe };
