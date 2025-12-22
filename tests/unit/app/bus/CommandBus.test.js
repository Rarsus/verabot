const CommandBus = require('../../../../src/app/bus/CommandBus');
const MiddlewarePipeline = require('../../../../src/app/bus/MiddlewarePipeline');
const Command = require('../../../../src/core/commands/Command');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('CommandBus', () => {
  let bus;
  let registryMock;
  let pipelineMock;
  let handlerMock;

  beforeEach(() => {
    handlerMock = {
      handle: jest.fn().mockResolvedValue(CommandResult.ok({ data: 'test' })),
    };

    registryMock = {
      getMeta: jest.fn().mockReturnValue({
        handler: handlerMock,
        name: 'test-command',
        category: 'test',
      }),
    };

    pipelineMock = {
      execute: jest.fn(),
    };

    bus = new CommandBus(registryMock, pipelineMock);
  });

  describe('execute', () => {
    it('should execute command through pipeline', async () => {
      const command = new Command({
        name: 'test-command',
        source: 'discord',
        userId: '123',
        channelId: '456',
      });

      pipelineMock.execute.mockImplementation((context, handler) => {
        return handler(context);
      });

      await bus.execute(command);

      expect(registryMock.getMeta).toHaveBeenCalledWith('test-command');
      expect(pipelineMock.execute).toHaveBeenCalled();
      expect(handlerMock.handle).toHaveBeenCalledWith(command);
    });

    it('should throw error when command handler not found', async () => {
      registryMock.getMeta.mockReturnValue(null);

      const command = new Command({
        name: 'unknown-command',
        source: 'discord',
      });

      await expect(bus.execute(command)).rejects.toThrow(
        "No handler for command 'unknown-command'",
      );
    });

    it('should throw error with COMMAND_NOT_FOUND code', async () => {
      registryMock.getMeta.mockReturnValue(null);

      const command = new Command({
        name: 'unknown',
        source: 'discord',
      });

      await expect(bus.execute(command)).rejects.toThrow(
        "No handler for command 'unknown'",
      );
    });

    it('should pass command context to pipeline', async () => {
      const command = new Command({
        name: 'test-command',
        source: 'discord',
        userId: '789',
        channelId: '012',
        args: ['arg1', 'arg2'],
      });

      let capturedContext = null;
      pipelineMock.execute.mockImplementation((context, handler) => {
        capturedContext = context;
        return handler(context);
      });

      await bus.execute(command);

      expect(capturedContext).toBeDefined();
      expect(capturedContext.command).toEqual(command);
      expect(capturedContext.category).toBe('test');
    });

    it('should return handler result', async () => {
      const expectedResult = CommandResult.ok({ data: 'success' });
      handlerMock.handle.mockResolvedValue(expectedResult);

      pipelineMock.execute.mockImplementation((context, handler) => {
        return handler(context);
      });

      const command = new Command({
        name: 'test-command',
        source: 'discord',
      });

      const result = await bus.execute(command);

      expect(result).toEqual(expectedResult);
    });

    it('should handle pipeline execution', async () => {
      const command = new Command({
        name: 'test-command',
        source: 'discord',
      });

      const middlewareResult = CommandResult.fail(new Error('Middleware blocked'));
      pipelineMock.execute.mockResolvedValue(middlewareResult);

      const result = await bus.execute(command);

      expect(result).toEqual(middlewareResult);
    });

    it('should handle handler exceptions in pipeline', async () => {
      const command = new Command({
        name: 'test-command',
        source: 'discord',
      });

      const error = new Error('Handler failed');
      pipelineMock.execute.mockImplementation((context, handler) => {
        throw error;
      });

      await expect(bus.execute(command)).rejects.toThrow('Handler failed');
    });
  });

  describe('initialization', () => {
    it('should store registry and pipeline references', () => {
      expect(bus.registry).toBe(registryMock);
      expect(bus.pipeline).toBe(pipelineMock);
    });
  });
});
