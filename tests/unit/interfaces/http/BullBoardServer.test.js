const { createBullBoardServer } = require('../../../../src/interfaces/http/BullBoardServer');

describe('BullBoardServer', () => {
  let mockContainer;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockContainer = {
      jobQueue: {
        queue: { name: 'test-queue' },
      },
      logger: mockLogger,
      config: { HTTP_PORT: '3000' },
    };
  });

  describe('createBullBoardServer', () => {
    it('should be a function', () => {
      expect(typeof createBullBoardServer).toBe('function');
    });

    it('should export function from module', () => {
      expect(createBullBoardServer).toBeDefined();
    });
  });
});
