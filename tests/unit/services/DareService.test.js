const DareService = require('../../../src/core/services/DareService');

describe('DareService', () => {
  let dareService;
  let mockDareRepo;
  let mockLogger;

  beforeEach(() => {
    mockDareRepo = {
      add: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      getRandom: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    dareService = new DareService(mockDareRepo, mockLogger);
  });

  describe('createDare', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn();
    });

    afterEach(() => {
      // Clean up
      delete global.fetch;
    });

    it('should generate dare from Perchance and store in database', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ result: 'Test dare from API' }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      mockDareRepo.add.mockResolvedValue(1);

      const result = await dareService.createDare('user123');

      expect(result).toEqual({
        id: 1,
        content: 'Test dare from API',
        source: 'perchance',
        created_by: 'user123',
        status: 'active',
      });
      expect(mockDareRepo.add).toHaveBeenCalledWith('Test dare from API', 'perchance', 'user123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle Perchance API with output field', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ output: 'Test dare from output' }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      mockDareRepo.add.mockResolvedValue(2);

      const result = await dareService.createDare('user123');

      expect(result.content).toBe('Test dare from output');
    });

    it('should handle Perchance API with text field', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ text: 'Test dare from text' }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      mockDareRepo.add.mockResolvedValue(3);

      const result = await dareService.createDare('user123');

      expect(result.content).toBe('Test dare from text');
    });

    it('should throw error when Perchance API returns non-OK status', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(dareService.createDare('user123')).rejects.toThrow(
        'Failed to generate dare from external API',
      );
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw error when Perchance API returns unexpected format', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ unexpected: 'format' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(dareService.createDare('user123')).rejects.toThrow(
        'Failed to generate dare from external API',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(dareService.createDare('user123')).rejects.toThrow(
        'Failed to generate dare from external API',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should truncate content that is too long', async () => {
      const longContent = 'a'.repeat(2100);
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ result: longContent }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      mockDareRepo.add.mockResolvedValue(4);

      await dareService.createDare('user123');

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockDareRepo.add).toHaveBeenCalledWith(
        longContent.substring(0, 2000),
        'perchance',
        'user123',
      );
    });
  });

  describe('addDare', () => {
    it('should add a user-created dare', async () => {
      mockDareRepo.add.mockResolvedValue(1);

      const result = await dareService.addDare('Custom dare', 'user123');

      expect(result).toBe(1);
      expect(mockDareRepo.add).toHaveBeenCalledWith('Custom dare', 'user', 'user123');
    });

    it('should trim whitespace from content', async () => {
      mockDareRepo.add.mockResolvedValue(1);

      await dareService.addDare('  Custom dare  ', 'user123');

      expect(mockDareRepo.add).toHaveBeenCalledWith('Custom dare', 'user', 'user123');
    });

    it('should throw error for empty content', async () => {
      await expect(dareService.addDare('', 'user123')).rejects.toThrow(
        'Dare content cannot be empty',
      );
    });

    it('should throw error for content that is too long', async () => {
      const longContent = 'a'.repeat(2001);
      await expect(dareService.addDare(longContent, 'user123')).rejects.toThrow(
        'Dare content is too long',
      );
    });
  });

  describe('getAllDares', () => {
    it('should return all dares', async () => {
      const mockDares = [
        { id: 1, content: 'Dare 1', status: 'active' },
        { id: 2, content: 'Dare 2', status: 'completed' },
      ];
      mockDareRepo.getAll.mockResolvedValue(mockDares);

      const result = await dareService.getAllDares();

      expect(result).toEqual(mockDares);
      expect(mockDareRepo.getAll).toHaveBeenCalledWith({});
    });

    it('should pass filters to repository', async () => {
      mockDareRepo.getAll.mockResolvedValue([]);

      await dareService.getAllDares({ status: 'active', assignedTo: 'user123' });

      expect(mockDareRepo.getAll).toHaveBeenCalledWith({
        status: 'active',
        assignedTo: 'user123',
      });
    });
  });

  describe('getDareById', () => {
    it('should return dare by id', async () => {
      const mockDare = { id: 1, content: 'Test dare', status: 'active' };
      mockDareRepo.getById.mockResolvedValue(mockDare);

      const result = await dareService.getDareById(1);

      expect(result).toEqual(mockDare);
      expect(mockDareRepo.getById).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid id', async () => {
      await expect(dareService.getDareById(0)).rejects.toThrow('Invalid dare ID');
      await expect(dareService.getDareById(-1)).rejects.toThrow('Invalid dare ID');
    });
  });

  describe('getRandomDare', () => {
    it('should return a random active dare by default', async () => {
      const mockDare = { id: 1, content: 'Random dare', status: 'active' };
      mockDareRepo.getRandom.mockResolvedValue(mockDare);

      const result = await dareService.getRandomDare();

      expect(result).toEqual(mockDare);
      expect(mockDareRepo.getRandom).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should use provided filters', async () => {
      mockDareRepo.getRandom.mockResolvedValue(null);

      await dareService.getRandomDare({ status: 'completed' });

      expect(mockDareRepo.getRandom).toHaveBeenCalledWith({ status: 'completed' });
    });
  });

  describe('updateDare', () => {
    it('should update a dare successfully', async () => {
      mockDareRepo.update.mockResolvedValue(true);

      const result = await dareService.updateDare(1, { content: 'Updated content' });

      expect(result).toBe(true);
      expect(mockDareRepo.update).toHaveBeenCalledWith(1, { content: 'Updated content' });
    });

    it('should throw error for invalid id', async () => {
      await expect(dareService.updateDare(0, { content: 'Test' })).rejects.toThrow(
        'Invalid dare ID',
      );
    });

    it('should validate status', async () => {
      await expect(dareService.updateDare(1, { status: 'invalid' })).rejects.toThrow(
        'Invalid status',
      );
    });

    it('should allow valid statuses', async () => {
      mockDareRepo.update.mockResolvedValue(true);

      await dareService.updateDare(1, { status: 'active' });
      await dareService.updateDare(1, { status: 'completed' });
      await dareService.updateDare(1, { status: 'archived' });

      expect(mockDareRepo.update).toHaveBeenCalledTimes(3);
    });

    it('should throw error when dare not found', async () => {
      mockDareRepo.update.mockResolvedValue(false);

      await expect(dareService.updateDare(1, { content: 'Test' })).rejects.toThrow(
        'Dare not found',
      );
    });

    it('should validate content length', async () => {
      const longContent = 'a'.repeat(2001);
      await expect(dareService.updateDare(1, { content: longContent })).rejects.toThrow(
        'Dare content is too long',
      );
    });
  });

  describe('deleteDare', () => {
    it('should delete a dare successfully', async () => {
      mockDareRepo.delete.mockResolvedValue(true);

      const result = await dareService.deleteDare(1);

      expect(result).toBe(true);
      expect(mockDareRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid id', async () => {
      await expect(dareService.deleteDare(0)).rejects.toThrow('Invalid dare ID');
    });

    it('should throw error when dare not found', async () => {
      mockDareRepo.delete.mockResolvedValue(false);

      await expect(dareService.deleteDare(1)).rejects.toThrow('Dare not found');
    });
  });

  describe('assignDare', () => {
    it('should assign a dare to a user', async () => {
      mockDareRepo.update.mockResolvedValue(true);

      const result = await dareService.assignDare(1, 'user123');

      expect(result).toBe(true);
      expect(mockDareRepo.update).toHaveBeenCalledWith(1, { assignedTo: 'user123' });
    });

    it('should throw error for invalid id', async () => {
      await expect(dareService.assignDare(0, 'user123')).rejects.toThrow('Invalid dare ID');
    });

    it('should throw error for missing user id', async () => {
      await expect(dareService.assignDare(1, '')).rejects.toThrow('User ID is required');
    });
  });

  describe('completeDare', () => {
    it('should complete a dare', async () => {
      const mockDare = { id: 1, content: 'Test', assigned_to: 'user123' };
      mockDareRepo.getById.mockResolvedValue(mockDare);
      mockDareRepo.update.mockResolvedValue(true);

      const result = await dareService.completeDare(1, 'user123');

      expect(result).toBe(true);
      expect(mockDareRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: 'completed',
        completedAt: expect.any(String),
      }));
    });

    it('should include notes when provided', async () => {
      const mockDare = { id: 1, content: 'Test', assigned_to: 'user123' };
      mockDareRepo.getById.mockResolvedValue(mockDare);
      mockDareRepo.update.mockResolvedValue(true);

      await dareService.completeDare(1, 'user123', 'It was fun!');

      expect(mockDareRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        completionNotes: 'It was fun!',
      }));
    });

    it('should throw error when dare not found', async () => {
      mockDareRepo.getById.mockResolvedValue(null);

      await expect(dareService.completeDare(1, 'user123')).rejects.toThrow('Dare not found');
    });

    it('should throw error when user is not assigned to dare', async () => {
      const mockDare = { id: 1, content: 'Test', assigned_to: 'otherUser' };
      mockDareRepo.getById.mockResolvedValue(mockDare);

      await expect(dareService.completeDare(1, 'user123')).rejects.toThrow(
        'You can only complete dares assigned to you',
      );
    });

    it('should allow completion of unassigned dares', async () => {
      const mockDare = { id: 1, content: 'Test', assigned_to: null };
      mockDareRepo.getById.mockResolvedValue(mockDare);
      mockDareRepo.update.mockResolvedValue(true);

      const result = await dareService.completeDare(1, 'user123');

      expect(result).toBe(true);
    });
  });

  describe('getDareCount', () => {
    it('should return dare count', async () => {
      mockDareRepo.count.mockResolvedValue(42);

      const result = await dareService.getDareCount();

      expect(result).toBe(42);
      expect(mockDareRepo.count).toHaveBeenCalledWith({});
    });

    it('should pass filters to repository', async () => {
      mockDareRepo.count.mockResolvedValue(10);

      await dareService.getDareCount({ status: 'active' });

      expect(mockDareRepo.count).toHaveBeenCalledWith({ status: 'active' });
    });
  });
});
