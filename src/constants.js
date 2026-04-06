'use strict';

const ROLES = Object.freeze({
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
});

const RECORD_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const AUDIT_ACTIONS = Object.freeze({
  CREATE_RECORD: 'CREATE_RECORD',
  UPDATE_RECORD: 'UPDATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
});

module.exports = { ROLES, RECORD_TYPES, USER_STATUS, AUDIT_ACTIONS };
