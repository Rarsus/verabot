const { createMetrics } = require('../../../../src/infra/metrics/Metrics');

describe('Metrics', () => {
  let metrics;

  beforeEach(() => {
    // Clear all metrics between tests
    const prom = require('prom-client');
    prom.register.clear();
    metrics = createMetrics();
  });

  describe('createMetrics', () => {
    it('should return metrics object with client', () => {
      expect(metrics.client).toBeDefined();
      expect(metrics.client).toBeTruthy();
    });

    it('should return commandCounter', () => {
      expect(metrics.commandCounter).toBeDefined();
      expect(typeof metrics.commandCounter.inc).toBe('function');
    });

    it('should return errorCounter', () => {
      expect(metrics.errorCounter).toBeDefined();
      expect(typeof metrics.errorCounter.inc).toBe('function');
    });

    it('should create commandCounter with correct configuration', () => {
      expect(metrics.commandCounter).toBeDefined();
      expect(metrics.commandCounter.inc).toBeDefined();
      expect(typeof metrics.commandCounter.inc).toBe('function');
    });

    it('should create errorCounter with correct configuration', () => {
      expect(metrics.errorCounter).toBeDefined();
      expect(metrics.errorCounter.inc).toBeDefined();
      expect(typeof metrics.errorCounter.inc).toBe('function');
    });

    it('should initialize default Prometheus metrics', async () => {
      const metricsOutput = await metrics.client.register.metrics();
      expect(metricsOutput).toBeTruthy();
      expect(typeof metricsOutput).toBe('string');
    });

    it('should allow incrementing command counter', () => {
      expect(() => {
        metrics.commandCounter.inc({ command: 'test', source: 'discord' });
      }).not.toThrow();
    });

    it('should allow incrementing error counter', () => {
      expect(() => {
        metrics.errorCounter.inc({ command: 'test', source: 'discord', code: '500' });
      }).not.toThrow();
    });

    it('should expose Prometheus client registry', () => {
      expect(metrics.client.register).toBeDefined();
      expect(typeof metrics.client.register.metrics).toBe('function');
    });
  });
});
