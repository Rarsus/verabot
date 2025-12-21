const UptimeHandler = require('../../../../src/app/handlers/core/UptimeHandler');

describe('UptimeHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new UptimeHandler();
  });

  it('should return success CommandResult', async () => {
    const result = await handler.handle();
    expect(result.success).toBe(true);
  });

  it('should return uptimeSeconds in response', async () => {
    const result = await handler.handle();
    expect(result.data).toBeDefined();
    expect(result.data.uptimeSeconds).toBeDefined();
  });

  it('should return positive uptime value', async () => {
    const result = await handler.handle();
    expect(result.data.uptimeSeconds).toBeGreaterThan(0);
  });

  it('should return number type for uptimeSeconds', async () => {
    const result = await handler.handle();
    expect(typeof result.data.uptimeSeconds).toBe('number');
  });

  it('should match actual process uptime', async () => {
    const before = process.uptime();
    const result = await handler.handle();
    const after = process.uptime();

    expect(result.data.uptimeSeconds).toBeGreaterThanOrEqual(before);
    expect(result.data.uptimeSeconds).toBeLessThanOrEqual(after);
  });

  it('should increase on consecutive calls', async () => {
    const result1 = await handler.handle();
    const result2 = await handler.handle();

    expect(result2.data.uptimeSeconds).toBeGreaterThanOrEqual(result1.data.uptimeSeconds);
  });

  it('should have only uptimeSeconds in data', async () => {
    const result = await handler.handle();
    expect(Object.keys(result.data)).toEqual(['uptimeSeconds']);
  });

  it('should return result with success property', async () => {
    const result = await handler.handle();
    expect(result.success).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
});
