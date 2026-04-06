'use strict';

function successResponse(res, data, message = null, statusCode = 200) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  return res.status(statusCode).json(payload);
}

function errorResponse(res, message, statusCode = 400, code = null, details = null) {
  const payload = {
    success: false,
    error: { message },
  };
  if (code) payload.error.code = code;
  if (details) payload.error.details = details;
  return res.status(statusCode).json(payload);
}

module.exports = { successResponse, errorResponse };
