const { createConfig } = require('../../../../src/infra/config/Config');

describe('Config', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      DISCORD_TOKEN: 'test-token',
      DISCORD_CLIENT_ID: 'test-id',
      WS_URL: 'ws://localhost:8080',
      NODE_ENV: 'test'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create config from environment', () => {
    const config = createConfig();

    expect(config).toBeDefined();
  });

  it('should parse DISCORD_TOKEN', () => {
    const config = createConfig();

    expect(config.DISCORD_TOKEN).toBe('test-token');
  });

  it('should parse DISCORD_CLIENT_ID', () => {
    const config = createConfig();

    expect(config.DISCORD_CLIENT_ID).toBe('test-id');
  });

  it('should parse WS_URL', () => {
    const config = createConfig();

    expect(config.WS_URL).toBe('ws://localhost:8080');
  });

  it('should use NODE_ENV from environment', () => {
    const config = createConfig();

    expect(config.NODE_ENV).toBe('test');
  });

  it('should provide default LOG_LEVEL', () => {
    const config = createConfig();

    expect(config.LOG_LEVEL).toBeDefined();
  });

  it('should provide default HTTP_PORT', () => {
    const config = createConfig();

    expect(config.HTTP_PORT).toBeDefined();
  });
});
