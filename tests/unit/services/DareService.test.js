const DareService = require('../../../src/core/services/DareService');

describe('DareService', () => {
  let dareService;
  let mockDareRepo;
  let mockPerchanceService;

  beforeEach(() => {
    mockDareRepo = {
      add: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      getRandom: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      complete: jest.fn(),
      count: jest.fn(),
    };
    mockPerchanceService = {
      generateDare: jest.fn(),
      getAvailableThemes: jest.fn().mockReturnValue(['general', 'funny', 'creative']),
      isValidTheme: jest.fn((theme) => ['general', 'funny', 'creative'].includes(theme)),
    };
    dareService = new DareService(mockDareRepo, mockPerchanceService);
  });

  describe('generateDareFromPerchance', () => {
    it('should generate a dare from Perchance and store it', async () => {
      mockPerchanceService.generateDare.mockResolvedValue({
        content: 'Test dare content',
        source: 'perchance',
        theme: 'funny',
      });
      mockDareRepo.add.mockResolvedValue(1);

      const result = await dareService.generateDareFromPerchance('funny', 'user123');

      expect(result.id).toBe(1);
      expect(result.content).toBe('Test dare content');
      expect(result.source).toBe('perchance');
      expect(result.theme).toBe('funny');
      expect(mockPerchanceService.generateDare).toHaveBeenCalledWith('funny');
      expect(mockDareRepo.add).toHaveBeenCalledWith('Test dare content', 'perchance', 'user123', 'funny');
    });

    it('should use default theme when not provided', async () => {
      mockPerchanceService.generateDare.mockResolvedValue({
        content: 'Test dare',
        source: 'fallback',
        theme: 'general',
      });
      mockDareRepo.add.mockResolvedValue(2);

      await dareService.generateDareFromPerchance();

      expect(mockPerchanceService.generateDare).toHaveBeenCalledWith('general');
    });
  });

  describe('createDare', () => {
    it('should create a dare successfully', async () => {
      mockDareRepo.add.mockResolvedValue(1);

      const result = await dareService.createDare('Test dare', 'user123', 'funny');

      expect(result).toBe(1);
      expect(mockDareRepo.add).toHaveBeenCalledWith('Test dare', 'user', 'user123', 'funny');
    });

    it('should trim whitespace from content', async () => {
      mockDareRepo.add.mockResolvedValue(1);

      await dareService.createDare('  Test dare  ', 'user123');

      expect(mockDareRepo.add).toHaveBeenCalledWith('Test dare', 'user', 'user123', null);
    });

    it('should throw error for empty content', async () => {
      await expect(dareService.createDare('', 'user123')).rejects.toThrow('Dare content cannot be empty');
    });

    it('should throw error for content that is too long', async () => {
      const longContent = 'a'.repeat(501);
      await expect(dareService.createDare(longContent, 'user123')).rejects.toThrow('Dare content is too long');
    });
  });

  describe('getAllDares', () => {
    it('should return all dares with pagination', async () => {
      const mockDares = [
        { id: 1, content: 'Dare 1', status: 'active' },
        { id: 2, content: 'Dare 2', status: 'active' },
      ];
      mockDareRepo.getAll.mockResolvedValue(mockDares);
      mockDareRepo.count.mockResolvedValue(42);

      const result = await dareService.getAllDares({ page: 2, perPage: 10 });

      expect(result.dares).toEqual(mockDares);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(10);
      expect(result.pagination.total).toBe(42);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('should use default pagination when not provided', async () => {
      mockDareRepo.getAll.mockResolvedValue([]);
      mockDareRepo.count.mockResolvedValue(0);

      const result = await dareService.getAllDares();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(20);
    });

    it('should filter by status and theme', async () => {
      mockDareRepo.getAll.mockResolvedValue([]);
      mockDareRepo.count.mockResolvedValue(0);

      await dareService.getAllDares({ status: 'active', theme: 'funny' });

      expect(mockDareRepo.getAll).toHaveBeenCalledWith({
        status: 'active',
        theme: 'funny',
        limit: 20,
        offset: 0,
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
    it('should return a random dare', async () => {
      const mockDare = { id: 1, content: 'Random dare', status: 'active' };
      mockDareRepo.getRandom.mockResolvedValue(mockDare);

      const result = await dareService.getRandomDare();

      expect(result).toEqual(mockDare);
      expect(mockDareRepo.getRandom).toHaveBeenCalledWith({ status: 'active', theme: undefined });
    });

    it('should filter by status and theme', async () => {
      mockDareRepo.getRandom.mockResolvedValue(null);

      await dareService.getRandomDare({ status: 'completed', theme: 'funny' });

      expect(mockDareRepo.getRandom).toHaveBeenCalledWith({ status: 'completed', theme: 'funny' });
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
      await expect(dareService.updateDare(0, {})).rejects.toThrow('Invalid dare ID');
    });

    it('should throw error for empty content update', async () => {
      await expect(dareService.updateDare(1, { content: '' })).rejects.toThrow('Dare content cannot be empty');
    });

    it('should throw error for content that is too long', async () => {
      const longContent = 'a'.repeat(501);
      await expect(dareService.updateDare(1, { content: longContent })).rejects.toThrow('Dare content is too long');
    });

    it('should throw error for invalid status', async () => {
      await expect(dareService.updateDare(1, { status: 'invalid' })).rejects.toThrow('Invalid status');
    });
  });

  describe('deleteDare', () => {
    it('should delete a dare successfully', async () => {
      mockDareRepo.getById.mockResolvedValue({ id: 1, content: 'Test dare' });
      mockDareRepo.delete.mockResolvedValue(true);

      const result = await dareService.deleteDare(1);

      expect(result).toBe(true);
      expect(mockDareRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid id', async () => {
      await expect(dareService.deleteDare(0)).rejects.toThrow('Invalid dare ID');
    });

    it('should throw error if dare not found', async () => {
      mockDareRepo.getById.mockResolvedValue(null);

      await expect(dareService.deleteDare(1)).rejects.toThrow('Dare not found');
    });
  });

  describe('completeDare', () => {
    it('should complete a dare successfully', async () => {
      mockDareRepo.getById.mockResolvedValue({ id: 1, content: 'Test dare', status: 'active' });
      mockDareRepo.complete.mockResolvedValue(true);

      const result = await dareService.completeDare(1, 'Completed notes');

      expect(result).toBe(true);
      expect(mockDareRepo.complete).toHaveBeenCalledWith(1, 'Completed notes');
    });

    it('should throw error for invalid id', async () => {
      await expect(dareService.completeDare(0)).rejects.toThrow('Invalid dare ID');
    });

    it('should throw error if dare not found', async () => {
      mockDareRepo.getById.mockResolvedValue(null);

      await expect(dareService.completeDare(1)).rejects.toThrow('Dare not found');
    });

    it('should throw error if dare already completed', async () => {
      mockDareRepo.getById.mockResolvedValue({ id: 1, status: 'completed' });

      await expect(dareService.completeDare(1)).rejects.toThrow('Dare is already completed');
    });

    it('should throw error for notes that are too long', async () => {
      const longNotes = 'a'.repeat(1001);
      await expect(dareService.completeDare(1, longNotes)).rejects.toThrow('Completion notes are too long');
    });
  });

  describe('assignDare', () => {
    it('should assign a dare to a user', async () => {
      mockDareRepo.update.mockResolvedValue(true);

      const result = await dareService.assignDare(1, 'user456');

      expect(result).toBe(true);
      expect(mockDareRepo.update).toHaveBeenCalledWith(1, { assigned_to: 'user456' });
    });

    it('should throw error for invalid id', async () => {
      await expect(dareService.assignDare(0, 'user456')).rejects.toThrow('Invalid dare ID');
    });

    it('should throw error if user ID not provided', async () => {
      await expect(dareService.assignDare(1, null)).rejects.toThrow('User ID is required');
    });
  });

  describe('getDareCount', () => {
    it('should return dare count', async () => {
      mockDareRepo.count.mockResolvedValue(42);

      const result = await dareService.getDareCount();

      expect(result).toBe(42);
      expect(mockDareRepo.count).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockDareRepo.count.mockResolvedValue(10);

      await dareService.getDareCount({ status: 'active' });

      expect(mockDareRepo.count).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  describe('getAvailableThemes', () => {
    it('should return available themes from Perchance service', () => {
      const result = dareService.getAvailableThemes();

      expect(result).toEqual(['general', 'funny', 'creative']);
      expect(mockPerchanceService.getAvailableThemes).toHaveBeenCalled();
    });
  });
});
