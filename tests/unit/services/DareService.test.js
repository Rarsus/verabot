const DareService = require('../../../src/core/services/DareService');

describe('DareService', () => {
  let dareService;
  let mockDareRepo;
  let mockPerchanceService;
  let mockConfig;
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
    mockPerchanceService = {
      generateDare: jest.fn(),
    };
    mockConfig = {
      DARE_THEMES: ['general', 'humiliating', 'sexy', 'chastity', 'anal', 'funny'],
      PERCHANCE_DARE_GENERATOR: 'dare-generator',
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    dareService = new DareService(mockDareRepo, mockPerchanceService, mockConfig, mockLogger);
  });

  describe('createDare', () => {
    it('should generate dare from Perchance and store in database', async () => {
      mockPerchanceService.generateDare.mockResolvedValue('Test dare from API');
      mockDareRepo.add.mockResolvedValue(1);

      const result = await dareService.createDare('user123', 'general');

      expect(result).toEqual({
        id: 1,
        content: 'Test dare from API',
        theme: 'general',
        source: 'perchance',
        created_by: 'user123',
        status: 'active',
      });
      expect(mockPerchanceService.generateDare).toHaveBeenCalledWith('dare-generator', 'general');
      expect(mockDareRepo.add).toHaveBeenCalledWith(
        'Test dare from API',
        'general',
        'perchance',
        'user123',
      );
    });

    it('should use custom generator when provided', async () => {
      mockPerchanceService.generateDare.mockResolvedValue('Test dare from custom');
      mockDareRepo.add.mockResolvedValue(2);

      await dareService.createDare('user123', 'humiliating', 'custom-generator');

      expect(mockPerchanceService.generateDare).toHaveBeenCalledWith(
        'custom-generator',
        'humiliating',
      );
    });

    it('should throw error for invalid theme', async () => {
      await expect(dareService.createDare('user123', 'invalid-theme')).rejects.toThrow(
        'Invalid theme',
      );
      expect(mockPerchanceService.generateDare).not.toHaveBeenCalled();
    });

    it('should fallback to database dare when API fails', async () => {
      mockPerchanceService.generateDare.mockRejectedValue(new Error('API error'));
      mockDareRepo.getRandom.mockResolvedValue({
        id: 5,
        content: 'Fallback dare',
        theme: 'general',
        source: 'perchance',
        created_by: 'user456',
        status: 'active',
      });

      const result = await dareService.createDare('user123', 'general');

      expect(result).toEqual({
        id: 5,
        content: 'Fallback dare',
        theme: 'general',
        source: 'database_fallback',
        created_by: 'user456',
        status: 'active',
        fallback: true,
      });
      expect(mockDareRepo.getRandom).toHaveBeenCalledWith({ status: 'active', theme: 'general' });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw error when API fails and no fallback available', async () => {
      mockPerchanceService.generateDare.mockRejectedValue(new Error('API error'));
      mockDareRepo.getRandom.mockResolvedValue(null);

      await expect(dareService.createDare('user123', 'general')).rejects.toThrow(
        'Failed to generate dare from Perchance API and no fallback dares available',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should truncate content that is too long', async () => {
      const longContent = 'a'.repeat(2100);
      mockPerchanceService.generateDare.mockResolvedValue(longContent);
      mockDareRepo.add.mockResolvedValue(4);

      await dareService.createDare('user123', 'general');

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockDareRepo.add).toHaveBeenCalledWith(
        longContent.substring(0, 2000),
        'general',
        'perchance',
        'user123',
      );
    });
  });

  describe('addDare', () => {
    it('should add a user-created dare', async () => {
      mockDareRepo.add.mockResolvedValue(1);

      const result = await dareService.addDare('Custom dare', 'general', 'user123');

      expect(result).toBe(1);
      expect(mockDareRepo.add).toHaveBeenCalledWith('Custom dare', 'general', 'user', 'user123');
    });

    it('should trim whitespace from content', async () => {
      mockDareRepo.add.mockResolvedValue(1);

      await dareService.addDare('  Custom dare  ', 'general', 'user123');

      expect(mockDareRepo.add).toHaveBeenCalledWith('Custom dare', 'general', 'user', 'user123');
    });

    it('should throw error for empty content', async () => {
      await expect(dareService.addDare('', 'general', 'user123')).rejects.toThrow(
        'Dare content cannot be empty',
      );
    });

    it('should throw error for content that is too long', async () => {
      const longContent = 'a'.repeat(2001);
      await expect(dareService.addDare(longContent, 'general', 'user123')).rejects.toThrow(
        'Dare content is too long',
      );
    });

    it('should throw error for invalid theme', async () => {
      await expect(dareService.addDare('Custom dare', 'invalid-theme', 'user123')).rejects.toThrow(
        'Invalid theme',
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
      expect(mockDareRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          assignedTo: 'user123',
          assignedAt: expect.any(String),
        }),
      );
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

    it('should throw error for invalid dare id', async () => {
      await expect(dareService.completeDare(0, 'user123')).rejects.toThrow('Invalid dare ID');
      await expect(dareService.completeDare(-1, 'user123')).rejects.toThrow('Invalid dare ID');
      await expect(dareService.completeDare(null, 'user123')).rejects.toThrow('Invalid dare ID');
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
