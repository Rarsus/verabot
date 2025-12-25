const { createDb } = require('../../src/infra/db/SqliteDb');
const { createRepositories } = require('../../src/infra/db/Repositories');

describe('DareRepository Integration Tests', () => {
  let db;
  let dareRepo;
  let logger;

  beforeEach(() => {
    // Create in-memory database for testing
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // Create a test database (will use commands.db in test environment)
    db = createDb({}, logger);
    const repositories = createRepositories(db, logger);
    dareRepo = repositories.dareRepo;

    // Clean up dares table before each test
    db.raw.prepare('DELETE FROM dares').run();
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('add', () => {
    it('should add a new dare', async () => {
      const id = await dareRepo.add('Test dare content', 'perchance', 'user123');

      expect(id).toBeGreaterThan(0);

      const dare = await dareRepo.getById(id);
      expect(dare).toBeDefined();
      expect(dare.content).toBe('Test dare content');
      expect(dare.source).toBe('perchance');
      expect(dare.created_by).toBe('user123');
      expect(dare.status).toBe('active');
    });

    it('should add multiple dares', async () => {
      const id1 = await dareRepo.add('Dare 1', 'perchance', 'user1');
      const id2 = await dareRepo.add('Dare 2', 'user', 'user2');

      expect(id2).toBeGreaterThan(id1);

      const dares = await dareRepo.getAll();
      expect(dares.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      await dareRepo.add('Active dare 1', 'perchance', 'user1');
      await dareRepo.add('Active dare 2', 'perchance', 'user2');
      const completedId = await dareRepo.add('Completed dare', 'user', 'user3');
      await dareRepo.update(completedId, { status: 'completed' });
    });

    it('should get all dares', async () => {
      const dares = await dareRepo.getAll();
      expect(dares.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', async () => {
      const activeDares = await dareRepo.getAll({ status: 'active' });
      expect(activeDares.length).toBe(2);
      activeDares.forEach(dare => {
        expect(dare.status).toBe('active');
      });

      const completedDares = await dareRepo.getAll({ status: 'completed' });
      expect(completedDares.length).toBe(1);
      expect(completedDares[0].status).toBe('completed');
    });

    it('should filter by assigned user', async () => {
      const dares = await dareRepo.getAll();
      await dareRepo.update(dares[0].id, { assignedTo: 'targetUser' });

      const assignedDares = await dareRepo.getAll({ assignedTo: 'targetUser' });
      expect(assignedDares.length).toBe(1);
      expect(assignedDares[0].assigned_to).toBe('targetUser');
    });

    it('should filter by both status and assigned user', async () => {
      const dares = await dareRepo.getAll();
      await dareRepo.update(dares[0].id, { assignedTo: 'targetUser', status: 'completed' });

      const filtered = await dareRepo.getAll({ status: 'completed', assignedTo: 'targetUser' });
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getById', () => {
    it('should get dare by id', async () => {
      const id = await dareRepo.add('Test dare', 'perchance', 'user123');
      const dare = await dareRepo.getById(id);

      expect(dare).toBeDefined();
      expect(dare.id).toBe(id);
      expect(dare.content).toBe('Test dare');
    });

    it('should return null for non-existent id', async () => {
      const dare = await dareRepo.getById(99999);
      expect(dare).toBeNull();
    });
  });

  describe('getRandom', () => {
    beforeEach(async () => {
      await dareRepo.add('Active dare 1', 'perchance', 'user1');
      await dareRepo.add('Active dare 2', 'perchance', 'user2');
      const completedId = await dareRepo.add('Completed dare', 'user', 'user3');
      await dareRepo.update(completedId, { status: 'completed' });
    });

    it('should get a random dare', async () => {
      const dare = await dareRepo.getRandom();
      expect(dare).toBeDefined();
      expect(dare.content).toBeDefined();
    });

    it('should filter by status when getting random', async () => {
      const activeDare = await dareRepo.getRandom({ status: 'active' });
      expect(activeDare).toBeDefined();
      expect(activeDare.status).toBe('active');

      const completedDare = await dareRepo.getRandom({ status: 'completed' });
      expect(completedDare).toBeDefined();
      expect(completedDare.status).toBe('completed');
    });

    it('should return null when no dares match filter', async () => {
      const dare = await dareRepo.getRandom({ status: 'archived' });
      expect(dare).toBeNull();
    });
  });

  describe('update', () => {
    it('should update dare content', async () => {
      const id = await dareRepo.add('Original content', 'perchance', 'user123');

      const updated = await dareRepo.update(id, { content: 'Updated content' });
      expect(updated).toBe(true);

      const dare = await dareRepo.getById(id);
      expect(dare.content).toBe('Updated content');
    });

    it('should update dare status', async () => {
      const id = await dareRepo.add('Test dare', 'perchance', 'user123');

      await dareRepo.update(id, { status: 'completed' });

      const dare = await dareRepo.getById(id);
      expect(dare.status).toBe('completed');
    });

    it('should update assigned user', async () => {
      const id = await dareRepo.add('Test dare', 'perchance', 'user123');

      await dareRepo.update(id, { assignedTo: 'targetUser' });

      const dare = await dareRepo.getById(id);
      expect(dare.assigned_to).toBe('targetUser');
    });

    it('should update multiple fields', async () => {
      const id = await dareRepo.add('Test dare', 'perchance', 'user123');

      await dareRepo.update(id, {
        content: 'New content',
        status: 'completed',
        assignedTo: 'targetUser',
        completedAt: '2024-01-01T00:00:00Z',
        completionNotes: 'Great dare!',
      });

      const dare = await dareRepo.getById(id);
      expect(dare.content).toBe('New content');
      expect(dare.status).toBe('completed');
      expect(dare.assigned_to).toBe('targetUser');
      expect(dare.completed_at).toBe('2024-01-01T00:00:00Z');
      expect(dare.completion_notes).toBe('Great dare!');
    });

    it('should return false when updating non-existent dare', async () => {
      const updated = await dareRepo.update(99999, { content: 'New content' });
      expect(updated).toBe(false);
    });

    it('should return false when no fields to update', async () => {
      const id = await dareRepo.add('Test dare', 'perchance', 'user123');
      const updated = await dareRepo.update(id, {});
      expect(updated).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a dare', async () => {
      const id = await dareRepo.add('Test dare', 'perchance', 'user123');

      const deleted = await dareRepo.delete(id);
      expect(deleted).toBe(true);

      const dare = await dareRepo.getById(id);
      expect(dare).toBeNull();
    });

    it('should return false when deleting non-existent dare', async () => {
      const deleted = await dareRepo.delete(99999);
      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      await dareRepo.add('Active dare 1', 'perchance', 'user1');
      await dareRepo.add('Active dare 2', 'perchance', 'user2');
      const completedId = await dareRepo.add('Completed dare', 'user', 'user3');
      await dareRepo.update(completedId, { status: 'completed' });
    });

    it('should count all dares', async () => {
      const count = await dareRepo.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('should count dares by status', async () => {
      const activeCount = await dareRepo.count({ status: 'active' });
      expect(activeCount).toBe(2);

      const completedCount = await dareRepo.count({ status: 'completed' });
      expect(completedCount).toBe(1);
    });

    it('should return 0 when no dares match filter', async () => {
      const count = await dareRepo.count({ status: 'archived' });
      expect(count).toBe(0);
    });
  });
});
