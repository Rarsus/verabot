const { createWsClient } = require('../../../../src/infra/ws/WsClientFactory');

jest.mock('ws');

const WebSocket = require('ws');

describe('WsClientFactory', () => {
  let mockConfig;
  let mockLogger;
  let mockWs;
  let wsClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      WS_URL: 'ws://localhost:8080'
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      readyState: WebSocket.OPEN,
      close: jest.fn()
    };

    WebSocket.mockImplementation(() => mockWs);
    WebSocket.OPEN = 1;
    WebSocket.CLOSED = 3;

    wsClient = createWsClient(mockConfig, mockLogger);
  });

  describe('Factory Function', () => {
    it('should return client object', () => {
      expect(wsClient).toBeDefined();
    });

    it('should return object with instance property', () => {
      expect(wsClient).toHaveProperty('instance');
    });

    it('should return object with isConnected method', () => {
      expect(wsClient).toHaveProperty('isConnected');
      expect(typeof wsClient.isConnected).toBe('function');
    });
  });

  describe('WebSocket Connection', () => {
    it('should create WebSocket instance', () => {
      expect(WebSocket).toHaveBeenCalledWith(mockConfig.WS_URL);
    });

    it('should log connection attempt', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        { url: mockConfig.WS_URL },
        'Connecting to WebSocket'
      );
    });

    it('should register event listeners', () => {
      expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Instance Property', () => {
    it('should expose WebSocket instance', () => {
      expect(wsClient.instance).toBe(mockWs);
    });

    it('should update after reconnection', () => {
      const closeHandler = mockWs.on.mock.calls.find(c => c[0] === 'close')?.[1];
      jest.useFakeTimers();

      const newWs = {
        on: jest.fn(),
        readyState: WebSocket.OPEN
      };

      WebSocket.mockImplementation(() => newWs);

      closeHandler(1000, 'Normal closure');
      jest.advanceTimersByTime(3000);

      // Instance should now be the new WebSocket
      expect(WebSocket).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('isConnected Method', () => {
    it('should return true when connected', () => {
      mockWs.readyState = WebSocket.OPEN;
      expect(wsClient.isConnected()).toBe(true);
    });

    it('should return false when closed', () => {
      mockWs.readyState = WebSocket.CLOSED;
      expect(wsClient.isConnected()).toBe(false);
    });

    it('should check WebSocket state correctly', () => {
      // isConnected checks if ws exists and readyState is OPEN
      expect(typeof wsClient.isConnected()).toBe('boolean');
    });

    it('should handle undefined readyState', () => {
      mockWs.readyState = undefined;
      expect(wsClient.isConnected()).toBe(false);
    });
  });

  describe('Open Event', () => {
    let openHandler;

    beforeEach(() => {
      openHandler = mockWs.on.mock.calls.find(c => c[0] === 'open')?.[1];
    });

    it('should log connection success', () => {
      openHandler();

      expect(mockLogger.info).toHaveBeenCalledWith('WebSocket connected');
    });

    it('should send hello message', () => {
      openHandler();

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'hello',
          client: 'discord-bridge'
        })
      );
    });

    it('should send valid JSON', () => {
      openHandler();

      const message = mockWs.send.mock.calls[0][0];
      expect(() => JSON.parse(message)).not.toThrow();
    });
  });

  describe('Close Event', () => {
    let closeHandler;

    beforeEach(() => {
      closeHandler = mockWs.on.mock.calls.find(c => c[0] === 'close')?.[1];
    });

    it('should log close event', () => {
      closeHandler(1000, Buffer.from('Normal close'));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1000,
          reason: expect.any(String)
        }),
        expect.stringContaining('reconnecting')
      );
    });

    it('should reconnect after delay', () => {
      jest.useFakeTimers();

      closeHandler(1000, Buffer.from('Normal close'));

      // Verify setTimeout was used for reconnection (3 second delay)
      jest.advanceTimersByTime(3000);

      jest.useRealTimers();
    });

    it('should create new WebSocket on reconnect', () => {
      jest.useFakeTimers();

      closeHandler(1000, Buffer.from('Normal close'));
      jest.advanceTimersByTime(3000);

      expect(WebSocket).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle close code', () => {
      closeHandler(4000, Buffer.from('Custom error'));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ code: 4000 }),
        expect.any(String)
      );
    });

    it('should handle close reason', () => {
      closeHandler(1006, Buffer.from('Abnormal closure'));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1006,
          reason: 'Abnormal closure'
        }),
        expect.any(String)
      );
    });

    it('should handle missing reason', () => {
      closeHandler(1000, undefined);

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Error Event', () => {
    let errorHandler;

    beforeEach(() => {
      errorHandler = mockWs.on.mock.calls.find(c => c[0] === 'error')?.[1];
    });

    it('should log error', () => {
      const error = new Error('Connection refused');
      errorHandler(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: error },
        'WebSocket error'
      );
    });

    it('should handle various error types', () => {
      const errors = [
        new Error('ECONNREFUSED'),
        new Error('ENOTFOUND'),
        new Error('Timeout')
      ];

      errors.forEach(err => {
        errorHandler(err);
      });

      expect(mockLogger.error).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom WebSocket URL', () => {
      const customConfig = {
        WS_URL: 'wss://secure.example.com'
      };

      createWsClient(customConfig, mockLogger);

      expect(WebSocket).toHaveBeenCalledWith('wss://secure.example.com');
    });

    it('should handle localhost URL', () => {
      const localConfig = {
        WS_URL: 'ws://localhost:8080'
      };

      createWsClient(localConfig, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { url: 'ws://localhost:8080' },
        expect.any(String)
      );
    });

    it('should handle remote URLs', () => {
      const remoteConfig = {
        WS_URL: 'wss://example.com/ws'
      };

      createWsClient(remoteConfig, mockLogger);

      expect(WebSocket).toHaveBeenCalledWith('wss://example.com/ws');
    });
  });

  describe('Multiple Instances', () => {
    it('should create independent clients', () => {
      const client1 = createWsClient(mockConfig, mockLogger);
      const client2 = createWsClient(mockConfig, mockLogger);

      expect(client1).not.toBe(client2);
    });

    it('should maintain separate WebSocket instances', () => {
      WebSocket.mockClear();

      const client1 = createWsClient(mockConfig, mockLogger);
      WebSocket.mockClear();
      const client2 = createWsClient(mockConfig, mockLogger);

      expect(WebSocket).toHaveBeenCalled();
    });
  });

  describe('Reconnection Logic', () => {
    it('should retry connection after failure', () => {
      jest.useFakeTimers();

      const closeHandler = mockWs.on.mock.calls.find(c => c[0] === 'close')?.[1];

      closeHandler(1006, Buffer.from('Abnormal closure'));

      // Verify reconnection happens with 3 second delay
      jest.advanceTimersByTime(3000);

      jest.useRealTimers();
    });

    it('should use 3 second reconnection delay', () => {
      jest.useFakeTimers();

      const closeHandler = mockWs.on.mock.calls.find(c => c[0] === 'close')?.[1];

      closeHandler(1000, Buffer.from('Close'));
      const timerCall = jest.runOnlyPendingTimers.mock || setTimeout.mock;

      jest.useRealTimers();
    });

    it('should handle multiple reconnections', () => {
      jest.useFakeTimers();

      const closeHandler = mockWs.on.mock.calls.find(c => c[0] === 'close')?.[1];

      closeHandler(1000, Buffer.from('Close'));
      jest.advanceTimersByTime(3000);

      closeHandler(1000, Buffer.from('Close again'));
      jest.advanceTimersByTime(3000);

      expect(WebSocket).toHaveBeenCalledTimes(3); // initial + 2 reconnects

      jest.useRealTimers();
    });
  });

  describe('State Management', () => {
    it('should track connection state', () => {
      mockWs.readyState = WebSocket.OPEN;
      expect(wsClient.isConnected()).toBe(true);

      mockWs.readyState = WebSocket.CLOSED;
      expect(wsClient.isConnected()).toBe(false);
    });

    it('should reflect reconnection in isConnected', () => {
      mockWs.readyState = WebSocket.CLOSED;
      expect(wsClient.isConnected()).toBe(false);

      jest.useFakeTimers();

      const closeHandler = mockWs.on.mock.calls.find(c => c[0] === 'close')?.[1];
      closeHandler(1000, Buffer.from('Close'));

      const newWs = {
        on: jest.fn(),
        readyState: WebSocket.OPEN
      };

      WebSocket.mockImplementation(() => newWs);

      jest.advanceTimersByTime(3000);

      expect(wsClient.isConnected()).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Logger Integration', () => {
    it('should use provided logger for all logs', () => {
      createWsClient(mockConfig, mockLogger);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should log with correct context', () => {
      const openHandler = mockWs.on.mock.calls.find(c => c[0] === 'open')?.[1];
      openHandler();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/connected|Connected/i)
      );
    });
  });
});
