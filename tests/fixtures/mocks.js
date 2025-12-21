/**
 * Mock helpers for testing
 * Provides factory functions for creating mock objects
 */

// Mock logger
const createMockLogger = () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

// Mock command result
const createMockCommandResult = (data = {}, success = true) => ({
  success,
  data,
  error: success ? null : new Error('Command failed'),
  timestamp: new Date().toISOString(),
});

// Mock middleware
const createMockMiddleware = () => jest.fn((command) => Promise.resolve(command));

// Mock registry
const createMockRegistry = (handlers = {}) => ({
  get: jest.fn((name) => handlers[name] || null),
  register: jest.fn(),
  getAll: jest.fn(() => Object.values(handlers)),
  has: jest.fn((name) => name in handlers),
});

// Mock permission service
const createMockPermissionService = () => ({
  checkPermission: jest.fn().mockResolvedValue(true),
  hasRole: jest.fn().mockResolvedValue(true),
  validateUser: jest.fn().mockResolvedValue({ valid: true }),
});

// Mock rate limit service
const createMockRateLimitService = () => ({
  checkLimit: jest.fn().mockResolvedValue({ allowed: true }),
  resetLimit: jest.fn().mockResolvedValue(true),
  getUserLimit: jest.fn().mockResolvedValue({ remaining: 10 }),
});

// Mock command service
const createMockCommandService = () => ({
  execute: jest.fn().mockResolvedValue({ success: true, data: {} }),
  validateCommand: jest.fn().mockResolvedValue(true),
  registerHandler: jest.fn(),
});

// Mock help service
const createMockHelpService = () => ({
  getHelp: jest.fn().mockResolvedValue('Help text'),
  listCommands: jest.fn().mockResolvedValue([]),
  getCommandHelp: jest.fn().mockResolvedValue('Command help'),
});

module.exports = {
  createMockLogger,
  createMockCommandResult,
  createMockMiddleware,
  createMockRegistry,
  createMockPermissionService,
  createMockRateLimitService,
  createMockCommandService,
  createMockHelpService,
};
