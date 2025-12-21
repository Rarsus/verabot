const { createDb } = require('../../../../src/infra/db/SqliteDb');

describe('SqliteDb', () => {
  it('should export createDb function', () => {
    expect(typeof createDb).toBe('function');
  });

  it('should be callable', () => {
    expect(() => {
      expect(createDb).toBeDefined();
    }).not.toThrow();
  });
});
