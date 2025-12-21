const path = require('path');

module.exports = {
  // Config file is in .config/ subdirectory, so rootDir must point to project root
  rootDir: path.resolve(__dirname, '..'),
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageThreshold: {
    global: {
      lines: 70,
      statements: 70,
      functions: 70,
      branches: 60,
    },
    './src/app/handlers/': {
      lines: 80,
      statements: 80,
      functions: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
};
