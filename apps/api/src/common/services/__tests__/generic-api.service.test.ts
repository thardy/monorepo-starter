import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db, MongoClient, Collection, ObjectId } from 'mongodb';
import { GenericApiService } from '../generic-api.service.js';
import { IUserContext, QueryOptions, IEntity } from '../../models/index.js';
import { Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { IdNotFoundError, DuplicateKeyError, BadRequestError } from '../../errors/index.js';
import { entityUtils } from '../../utils/entity.utils.js';

// Define a test entity interface
interface TestEntity extends IEntity {
  name: string;
  description?: string;
  isActive?: boolean;
  tags?: string[];
  count?: number;
}

// Create a model spec for validation
const TestEntitySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String())),
  count: Type.Optional(Type.Number())
});

// Add partial schema for PATCH operations
const PartialTestEntitySchema = Type.Partial(TestEntitySchema);

// Create model spec object
const testModelSpec = entityUtils.getModelSpec(TestEntitySchema, { isAuditable: true });

// Helper function to create a mock user context
const createUserContext = (): IUserContext => ({
  user: { 
    _id: new ObjectId(),
    email: 'test@example.com' 
  }
});

describe('[library] GenericApiService - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let db: Db;
  let service: GenericApiService<TestEntity>;
  let collection: Collection;
  
  // Set up MongoDB Memory Server before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    db = mongoClient.db('test-db');
  });
  
  // Clean up MongoDB Memory Server after all tests
  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
  
  // Set up service before each test
  beforeEach(async () => {
    // Create a clean collection for each test
    if (collection) {
      await collection.drop().catch(() => {
        // Ignore errors if collection doesn't exist yet
      });
    }
    collection = db.collection('testEntities');
    
    // Create test service
    service = new GenericApiService<TestEntity>(
      db,
      'testEntities',
      'testEntity',
      testModelSpec
    );
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Additional cleanup if needed
  });
  
  describe('CRUD Operations', () => {
    it('should create and retrieve an entity', async () => {
      // Arrange
      const userContext = createUserContext();
      const testEntity: Partial<TestEntity> = {
        name: 'Test Entity',
        description: 'This is a test entity',
        isActive: true
      };
      
      // Act
      const createdEntity = await service.create(userContext, testEntity as TestEntity);
      const retrievedEntity = await service.getById(userContext, createdEntity!._id.toString());
      
      // Assert
      expect(createdEntity).toBeDefined();
      expect(createdEntity!.name).toBe(testEntity.name);
      expect(createdEntity!.description).toBe(testEntity.description);
      expect(createdEntity!.isActive).toBe(testEntity.isActive);
      
      expect(retrievedEntity).toBeDefined();
      expect(retrievedEntity._id).toBeDefined();
      expect(retrievedEntity.name).toBe(testEntity.name);
      expect(retrievedEntity.description).toBe(testEntity.description);
      expect(retrievedEntity.isActive).toBe(testEntity.isActive);
    });
    
    it('should create multiple entities and retrieve them all', async () => {
      // Arrange
      const userContext = createUserContext();
      const testEntities: TestEntity[] = [
        { name: 'Entity 1', isActive: true } as TestEntity,
        { name: 'Entity 2', isActive: false } as TestEntity,
        { name: 'Entity 3', isActive: true } as TestEntity
      ];
      
      // Act
      const createdEntities = await service.createMany(userContext, testEntities);
      const allEntities = await service.getAll(userContext);
      
      // Assert
      expect(createdEntities).toHaveLength(3);
      expect(allEntities).toHaveLength(3);
      
      // Check if all entities are present
      const entityNames = allEntities.map(e => e.name).sort();
      expect(entityNames).toEqual(['Entity 1', 'Entity 2', 'Entity 3']);
    });
    
    it('should update an entity', async () => {
      // Arrange
      const userContext = createUserContext();
      const initialEntity: Partial<TestEntity> = {
        name: 'Initial Name',
        description: 'Initial description',
        isActive: true
      };
      
      // Create the entity first
      const createdEntity = await service.create(userContext, initialEntity as TestEntity);
      
      // Act - Update the entity
      const updateData: Partial<TestEntity> = {
        name: 'Updated Name',
        description: 'Updated description'
      };
      
      const updatedEntity = await service.partialUpdateById(
        userContext, 
        createdEntity!._id.toString(), 
        updateData
      );
      
      // Assert
      expect(updatedEntity).toBeDefined();
      expect(updatedEntity.name).toBe('Updated Name');
      expect(updatedEntity.description).toBe('Updated description');
      expect(updatedEntity.isActive).toBe(true); // Should remain unchanged
    });
    
    it('should delete an entity', async () => {
      // Arrange
      const userContext = createUserContext();
      const testEntity: Partial<TestEntity> = {
        name: 'Entity to Delete',
        isActive: true
      };
      
      // Create the entity first
      const createdEntity = await service.create(userContext, testEntity as TestEntity);
      
      // Act
      const deleteResult = await service.deleteById(
        userContext, 
        createdEntity!._id.toString()
      );
      
      // Assert
      expect(deleteResult.deletedCount).toBe(1);
      
      // Verify the entity is deleted by trying to retrieve it
      await expect(service.getById(
        userContext, 
        createdEntity!._id.toString()
      )).rejects.toThrow(IdNotFoundError);
    });
  });
  
  describe('Query Operations', () => {
    // Create test data
    beforeEach(async () => {
      const userContext = createUserContext();
      const testEntities: TestEntity[] = [
        { name: 'Entity A', tags: ['tag1', 'tag2'], count: 10, isActive: true } as TestEntity,
        { name: 'Entity B', tags: ['tag2', 'tag3'], count: 20, isActive: false } as TestEntity,
        { name: 'Entity C', tags: ['tag1', 'tag3'], count: 30, isActive: true } as TestEntity,
        { name: 'Entity D', tags: ['tag4'], count: 40, isActive: false } as TestEntity,
        { name: 'Entity E', tags: ['tag1', 'tag4'], count: 50, isActive: true } as TestEntity
      ];
      
      await service.createMany(userContext, testEntities);
    });
    
    it('should get all entities', async () => {
      // Arrange
      const userContext = createUserContext();
      
      // Act
      const results = await service.getAll(userContext);
      
      // Assert
      expect(results).toHaveLength(5);
    });
    
    it('should get entities with pagination', async () => {
      // Arrange
      const userContext = createUserContext();
      const queryOptions = new QueryOptions();
      queryOptions.page = 1;
      queryOptions.pageSize = 2;
      
      // Act
      const pagedResult = await service.get(userContext, queryOptions);
      
      // Assert
      expect(pagedResult.entities).toBeDefined();
      expect(pagedResult.entities!.length).toBe(2);
      expect(pagedResult.total).toBe(5);
      expect(pagedResult.page).toBe(1);
      expect(pagedResult.pageSize).toBe(2);
      expect(pagedResult.totalPages).toBe(3);
    });
    
    it('should get entities with sorting', async () => {
      // Arrange
      const userContext = createUserContext();
      const queryOptions = new QueryOptions();
      queryOptions.orderBy = 'name';
      queryOptions.sortDirection = 'desc';
      
      // Act
      const pagedResult = await service.get(userContext, queryOptions);
      
      // Assert
      expect(pagedResult.entities).toBeDefined();
      expect(pagedResult.entities!.length).toBe(5);
      expect(pagedResult.entities![0].name).toBe('Entity E');
      expect(pagedResult.entities![1].name).toBe('Entity D');
      expect(pagedResult.entities![2].name).toBe('Entity C');
    });
    
    it('should get entities with filtering', async () => {
      // Arrange
      const userContext = createUserContext();
      const queryOptions = new QueryOptions();
      queryOptions.filters = {
        isActive: { eq: true }
      };
      
      // Act
      const pagedResult = await service.get(userContext, queryOptions);
      
      // Assert
      expect(pagedResult.entities).toBeDefined();
      expect(pagedResult.entities!.length).toBe(3);
      expect(pagedResult.entities!.every(e => e.isActive === true)).toBe(true);
    });
    
    it('should find entities matching a query', async () => {
      // Arrange
      const userContext = createUserContext();
      
      // Act
      const results = await service.find(userContext, { count: { $gt: 30 } });
      
      // Assert
      expect(results).toHaveLength(2);
      expect(results.some(e => e.name === 'Entity D')).toBe(true);
      expect(results.some(e => e.name === 'Entity E')).toBe(true);
    });
  });
  
  describe('Validation', () => {
    it('should reject an entity that fails validation', async () => {
      // Arrange
      const userContext = createUserContext();
      const invalidEntity: Partial<TestEntity> = {
        // Missing required 'name' field
        description: 'This entity is invalid'
      };
      
      // Act & Assert
      await expect(
        service.create(userContext, invalidEntity as TestEntity)
      ).rejects.toThrow();
    });
    
    it('should accept a valid entity', async () => {
      // Arrange
      const userContext = createUserContext();
      const validEntity: Partial<TestEntity> = {
        name: 'Valid Entity'
      };
      
      // Act
      const result = await service.create(userContext, validEntity as TestEntity);
      
      // Assert
      expect(result).toBeDefined();
      expect(result!.name).toBe('Valid Entity');
    });
    
    it('should accept a partial update with only some fields', async () => {
      // Arrange
      const userContext = createUserContext();
      const initialEntity: Partial<TestEntity> = {
        name: 'Initial Entity',
        description: 'Initial description',
        isActive: true
      };
      
      // Create the entity first
      const createdEntity = await service.create(userContext, initialEntity as TestEntity);
      
      // Act - Only update description
      const updateData: Partial<TestEntity> = {
        description: 'Updated description only'
      };
      
      const updatedEntity = await service.partialUpdateById(
        userContext, 
        createdEntity!._id.toString(), 
        updateData
      );
      
      // Assert
      expect(updatedEntity).toBeDefined();
      expect(updatedEntity.name).toBe('Initial Entity'); // Unchanged
      expect(updatedEntity.description).toBe('Updated description only');
      expect(updatedEntity.isActive).toBe(true); // Unchanged
    });
    
    it('should strip properties not defined in the schema while preserving system properties', async () => {
      // Arrange
      const userContext = createUserContext();
      
      // Create an entity with an extra property not defined in the schema
      const testEntity: any = {
        name: 'Entity with extra props',
        extraProperty: 'This property is not in the schema',
        anotherExtraProperty: 42,
        nestedExtra: { foo: 'bar' }
      };
      
      // Act
      const createdEntity = await service.create(userContext, testEntity as TestEntity);
      const retrievedEntity = await service.getById(userContext, createdEntity!._id.toString());
      
      // Assert
      expect(createdEntity).toBeDefined();
      expect(createdEntity!.name).toBe(testEntity.name);
      
      // Check that extra properties were stripped out
      expect((createdEntity as any).extraProperty).toBeUndefined();
      expect((createdEntity as any).anotherExtraProperty).toBeUndefined();
      expect((createdEntity as any).nestedExtra).toBeUndefined();
      
      // Check that they're also not present when retrieving
      expect((retrievedEntity as any).extraProperty).toBeUndefined();
      expect((retrievedEntity as any).anotherExtraProperty).toBeUndefined();
      expect((retrievedEntity as any).nestedExtra).toBeUndefined();
      
      // Check that system properties were preserved
      expect(retrievedEntity._id).toBeDefined();
      if (entityUtils.isAuditable(retrievedEntity)) {
        expect((retrievedEntity as any).created).toBeDefined();
        expect((retrievedEntity as any).createdBy).toBeDefined();
        expect((retrievedEntity as any).updated).toBeDefined();
        expect((retrievedEntity as any).updatedBy).toBeDefined();
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should throw IdNotFoundError when getting non-existent entity', async () => {
      // Arrange
      const userContext = createUserContext();
      const nonExistentId = new ObjectId().toString();
      
      // Act & Assert
      await expect(
        service.getById(userContext, nonExistentId)
      ).rejects.toThrow(IdNotFoundError);
    });
    
    it('should throw BadRequestError when providing invalid ObjectId', async () => {
      // Arrange
      const userContext = createUserContext();
      const invalidId = 'not-an-object-id';
      
      // Act & Assert
      await expect(
        service.getById(userContext, invalidId)
      ).rejects.toThrow(BadRequestError);
    });
    
    it('should throw DuplicateKeyError when creating entity with duplicate unique key', async () => {
      // Arrange
      const userContext = createUserContext();
      
      // First, create a collection with a unique index
      await collection.createIndex({ name: 1 }, { unique: true });
      
      // Create first entity
      const entity1: Partial<TestEntity> = {
        name: 'Unique Name'
      };
      await service.create(userContext, entity1 as TestEntity);
      
      // Try to create second entity with same name
      const entity2: Partial<TestEntity> = {
        name: 'Unique Name'
      };
      
      // Act & Assert
      await expect(
        service.create(userContext, entity2 as TestEntity)
      ).rejects.toThrow(DuplicateKeyError);
    });
  });
}); 