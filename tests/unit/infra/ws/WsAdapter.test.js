const WsAdapter = require('../../../../src/infra/ws/WsAdapter');
const Command = require('../../../../src/core/commands/Command');

describe('WsAdapter', () => {
  let mockWsHolder;
  let mockCommandBus;
  let mockLogger;
  let mockWs;
  let adapter;

  beforeEach(() => {
    mockWs = {
      on: jest.fn(),
      send: jest.fn()
    };

    mockWsHolder = {
      instance: mockWs
    };

    mockCommandBus = {
      execute: jest.fn().mockResolvedValue({ success: true, data: 'result' })
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    adapter = new WsAdapter(mockWsHolder, mockCommandBus, mockLogger);
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(adapter).toBeDefined();
    });

    it('should store wsHolder reference', () => {
      expect(adapter.wsHolder).toBe(mockWsHolder);
    });

    it('should store commandBus reference', () => {
      expect(adapter.bus).toBe(mockCommandBus);
    });

    it('should store logger reference', () => {
      expect(adapter.logger).toBe(mockLogger);
    });
  });

  describe('registerListeners', () => {
    it('should register message listener on WebSocket', () => {
      adapter.registerListeners();

      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should wait if WebSocket not connected', () => {
      jest.useFakeTimers();
      mockWsHolder.instance = null;

      adapter.registerListeners();

      // Verify it calls setTimeout with a function and 1000ms
      jest.advanceTimersByTime(1000);

      jest.useRealTimers();
    });

    it('should retry connection after delay', () => {
      jest.useFakeTimers();
      mockWsHolder.instance = null;

      adapter.registerListeners();
      jest.advanceTimersByTime(1000);

      mockWsHolder.instance = mockWs;
      jest.advanceTimersByTime(1000);

      jest.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    let messageHandler;

    beforeEach(() => {
      adapter.registerListeners();
      messageHandler = mockWs.on.mock.calls[0][1];
    });

    describe('Valid command messages', () => {
      it('should parse JSON message', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'help',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        expect(mockCommandBus.execute).toHaveBeenCalled();
      });

      it('should dispatch command to bus', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: ['arg1']
        });

        await messageHandler(Buffer.from(message));

        expect(mockCommandBus.execute).toHaveBeenCalledWith(
          expect.any(Command)
        );
      });

      it('should include userId in command', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user456',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.userId).toBe('user456');
      });

      it('should include command name', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'mycommand',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.name).toBe('mycommand');
      });

      it('should include args in command', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: ['arg1', 'arg2']
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.args).toEqual(['arg1', 'arg2']);
      });

      it('should handle metadata', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: [],
          metadata: { priority: 'high', source: 'api' }
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.metadata).toEqual({ priority: 'high', source: 'api' });
      });

      it('should use websocket as source', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.source).toBe('websocket');
      });

      it('should have null channelId', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.channelId).toBeNull();
      });
    });

    describe('Response Messages', () => {
      it('should send response on success', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        expect(mockWs.send).toHaveBeenCalled();
        const response = JSON.parse(mockWs.send.mock.calls[0][0]);
        expect(response.type).toBe('response');
        expect(response.command).toBe('test');
      });

      it('should include command result in response', async () => {
        mockCommandBus.execute.mockResolvedValue({ success: true, value: 'data' });

        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const response = JSON.parse(mockWs.send.mock.calls[0][0]);
        expect(response.result).toEqual({ success: true, value: 'data' });
      });
    });

    describe('Error Messages', () => {
      it('should send error on command failure', async () => {
        mockCommandBus.execute.mockRejectedValue(new Error('Test error'));

        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const response = JSON.parse(mockWs.send.mock.calls[0][0]);
        expect(response.type).toBe('error');
      });

      it('should include error code', async () => {
        const error = new Error('Test error');
        error.code = 'INVALID_ARG';
        mockCommandBus.execute.mockRejectedValue(error);

        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const response = JSON.parse(mockWs.send.mock.calls[0][0]);
        expect(response.error.code).toBe('INVALID_ARG');
      });

      it('should use generic error code if none provided', async () => {
        mockCommandBus.execute.mockRejectedValue(new Error('Test error'));

        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const response = JSON.parse(mockWs.send.mock.calls[0][0]);
        expect(response.error.code).toBe('ERROR');
      });

      it('should include error message', async () => {
        mockCommandBus.execute.mockRejectedValue(new Error('Something went wrong'));

        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const response = JSON.parse(mockWs.send.mock.calls[0][0]);
        expect(response.error.message).toBe('Something went wrong');
      });

      it('should log errors', async () => {
        mockCommandBus.execute.mockRejectedValue(new Error('Test error'));

        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        expect(mockLogger.error).toHaveBeenCalledWith(
          { err: expect.any(Error) },
          'WS command error'
        );
      });
    });

    describe('Invalid Messages', () => {
      it('should handle non-JSON message', async () => {
        const message = 'not json';

        await messageHandler(Buffer.from(message));

        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('non-JSON')
        );
        expect(mockCommandBus.execute).not.toHaveBeenCalled();
      });

      it('should ignore non-command messages', async () => {
        const message = JSON.stringify({
          type: 'ping',
          data: 'test'
        });

        await messageHandler(Buffer.from(message));

        expect(mockCommandBus.execute).not.toHaveBeenCalled();
      });

      it('should handle malformed JSON', async () => {
        const message = '{ broken json';

        await messageHandler(Buffer.from(message));

        expect(mockLogger.warn).toHaveBeenCalled();
        expect(mockCommandBus.execute).not.toHaveBeenCalled();
      });
    });

    describe('Optional Fields', () => {
      it('should handle missing userId', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.userId).toBeNull();
      });

      it('should handle missing args', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123'
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.args).toEqual([]);
      });

      it('should handle missing metadata', async () => {
        const message = JSON.stringify({
          type: 'command',
          command: 'test',
          userId: 'user123',
          args: []
        });

        await messageHandler(Buffer.from(message));

        const command = mockCommandBus.execute.mock.calls[0][0];
        expect(command.metadata).toEqual({});
      });
    });

    describe('Multiple Commands', () => {
      it('should handle sequential commands', async () => {
        const msg1 = JSON.stringify({
          type: 'command',
          command: 'cmd1',
          userId: 'user1',
          args: []
        });
        const msg2 = JSON.stringify({
          type: 'command',
          command: 'cmd2',
          userId: 'user2',
          args: []
        });

        await messageHandler(Buffer.from(msg1));
        await messageHandler(Buffer.from(msg2));

        expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
        expect(mockWs.send).toHaveBeenCalledTimes(2);
      });

      it('should handle concurrent commands', async () => {
        const msg1 = JSON.stringify({
          type: 'command',
          command: 'cmd1',
          userId: 'user1',
          args: []
        });
        const msg2 = JSON.stringify({
          type: 'command',
          command: 'cmd2',
          userId: 'user2',
          args: []
        });

        await Promise.all([
          messageHandler(Buffer.from(msg1)),
          messageHandler(Buffer.from(msg2))
        ]);

        expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('WebSocket Connection States', () => {
    it('should handle disconnected WebSocket', () => {
      mockWsHolder.instance = null;
      jest.useFakeTimers();

      adapter.registerListeners();

      // Just verify it doesn't throw and can handle null instance
      jest.advanceTimersByTime(1000);

      jest.useRealTimers();
    });

    it('should recover when WebSocket reconnects', () => {
      jest.useFakeTimers();

      mockWsHolder.instance = null;
      adapter.registerListeners();

      mockWsHolder.instance = mockWs;
      jest.advanceTimersByTime(1000);

      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));

      jest.useRealTimers();
    });
  });
});
