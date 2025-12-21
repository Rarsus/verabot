const os = require('os');
const StatsHandler = require('../../../../src/app/handlers/core/StatsHandler');

describe('StatsHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new StatsHandler();
  });

  it('should return success CommandResult', async () => {
    const result = await handler.handle();
    expect(result.success).toBe(true);
  });

  it('should include uptime in response', async () => {
    const result = await handler.handle();
    expect(result.data.uptime).toBeGreaterThan(0);
    expect(typeof result.data.uptime).toBe('number');
  });

  it('should include loadavg from os module', async () => {
    const result = await handler.handle();
    expect(result.data.loadavg).toBeDefined();
    expect(Array.isArray(result.data.loadavg)).toBe(true);
    expect(result.data.loadavg.length).toBe(3);
  });

  it('should include memory metrics', async () => {
    const result = await handler.handle();
    const { memory } = result.data;
    expect(memory).toBeDefined();
    expect(memory.rss).toBeGreaterThan(0);
    expect(memory.heapUsed).toBeGreaterThan(0);
    expect(memory.heapTotal).toBeGreaterThan(0);
  });

  it('should have heapUsed less than or equal to heapTotal', async () => {
    const result = await handler.handle();
    const { memory } = result.data;
    expect(memory.heapUsed).toBeLessThanOrEqual(memory.heapTotal);
  });

  it('should include all required memory fields', async () => {
    const result = await handler.handle();
    expect(Object.keys(result.data.memory)).toEqual(['rss', 'heapUsed', 'heapTotal']);
  });

  it('should reflect actual process statistics', async () => {
    const result = await handler.handle();
    const actualUptime = process.uptime();
    const actualLoad = os.loadavg();
    const actualMem = process.memoryUsage();

    // Uptime should be close (within 0.1 seconds)
    expect(Math.abs(result.data.uptime - actualUptime)).toBeLessThan(0.1);
    // Load averages should match
    expect(result.data.loadavg).toEqual(actualLoad);
    // Memory values should be close to actual values (within 1% due to timing)
    expect(result.data.memory.rss).toBeLessThanOrEqual(actualMem.rss * 1.01);
    expect(result.data.memory.rss).toBeGreaterThanOrEqual(actualMem.rss * 0.99);
    expect(result.data.memory.heapUsed).toBeLessThanOrEqual(actualMem.heapUsed * 1.01);
    expect(result.data.memory.heapUsed).toBeGreaterThanOrEqual(actualMem.heapUsed * 0.99);
  });

  it('should return consistent data structure on multiple calls', async () => {
    const result1 = await handler.handle();
    const result2 = await handler.handle();

    expect(Object.keys(result1.data)).toEqual(Object.keys(result2.data));
    expect(Object.keys(result1.data.memory)).toEqual(Object.keys(result2.data.memory));
  });
});
