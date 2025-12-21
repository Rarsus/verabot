const { healthCheck } = require('../../../../src/infra/health/HealthCheck');

describe('HealthCheck', () => {
  let mockContainer;

  beforeEach(() => {
    mockContainer = {
      db: {
        isConnected: jest.fn().mockReturnValue(true),
      },
      discordClient: {
        user: { id: 'bot123' },
      },
      wsClient: {
        isConnected: jest.fn().mockReturnValue(true),
      },
    };
  });

  it('should return health status', async () => {
    const status = await healthCheck(mockContainer);

    expect(status).toBeDefined();
    expect(status.status).toBe('ok');
  });

  it('should include database status', async () => {
    const status = await healthCheck(mockContainer);

    expect(status.db).toBeDefined();
  });

  it('should check database connection', async () => {
    const status = await healthCheck(mockContainer);

    expect(status.db).toBe('up');
    expect(mockContainer.db.isConnected).toHaveBeenCalled();
  });

  it('should include Discord client status', async () => {
    const status = await healthCheck(mockContainer);

    expect(status.discord).toBe('up');
  });

  it('should report Discord down when no user', async () => {
    mockContainer.discordClient.user = null;
    const status = await healthCheck(mockContainer);

    expect(status.discord).toBe('down');
  });

  it('should include WebSocket status', async () => {
    const status = await healthCheck(mockContainer);

    expect(status.ws).toBeDefined();
  });

  it('should report database down when disconnected', async () => {
    mockContainer.db.isConnected.mockReturnValue(false);
    const status = await healthCheck(mockContainer);

    expect(status.db).toBe('down');
  });

  it('should handle missing WebSocket client', async () => {
    mockContainer.wsClient = undefined;
    const status = await healthCheck(mockContainer);

    expect(status.ws).toBe('down');
  });
});
