import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Application, Request, Response, NextFunction } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';
import express from 'express';
import supertest from 'supertest';
import jsonwebtoken from 'jsonwebtoken';
import { ApiController } from '../api.controller.js';
import { GenericApiService } from '../../services/generic-api.service.js';
import { IEntity, IAuditable, IUserContext } from '../../models/index.js';
import { Type } from '@sinclair/typebox';
import { entityUtils } from '../../utils/index.js';
import bodyParser from 'body-parser';

// Mock model for testing
interface ITestItem extends IEntity, IAuditable {
  name: string;
  value?: number;
}

const TestItemSchema = Type.Object({
  name: Type.String(),
  value: Type.Optional(Type.Number())
});

// Create model specs - auditable
const TestItemSpec = entityUtils.getModelSpec(TestItemSchema, { isAuditable: true });

// Test service and controller
class TestItemService extends GenericApiService<ITestItem> {
  constructor(db: Db) {
    super(db, 'testItems', 'testItem', TestItemSpec);
  }
}

class TestItemController extends ApiController<ITestItem> {
  constructor(app: Application, service: TestItemService) {
    super('test-items', app, service, 'testItem');
  }
}

describe('[library] ApiController - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let connection: MongoClient;
  let db: Db;
  let app: Application;
  let service: TestItemService;
  let controller: TestItemController;
  let authToken: string;
  let userId: string;
  let testAgent: supertest.SuperTest<supertest.Test>;
  const testOrgId = '67e8e19b149f740323af93d7';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    connection = await MongoClient.connect(uri);
    db = connection.db();
    
    // Create Express app
    app = express();
    app.use(bodyParser.json());
    
    // Mock authentication middleware
    userId = new ObjectId().toString();
    authToken = jsonwebtoken.sign({ sub: userId, email: 'test@example.com', orgId: testOrgId }, 'test-secret');
    
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
          const decoded = jsonwebtoken.verify(token, 'test-secret') as any;
          
          // Set proper userContext that matches your application structure
          req.userContext = {
            user: {
              _id: new ObjectId(userId),
              email: decoded.email,
              _created: new Date(),
              _createdBy: 'system',
              _updated: new Date(),
              _updatedBy: 'system'
            },
            orgId: testOrgId
          };
          
        } catch (err) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      }
      next();
    });
    
    // Create service and controller
    service = new TestItemService(db);
    controller = new TestItemController(app, service);
    
    // Create supertest agent
    testAgent = supertest(app);
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await db.collection('testItems').deleteMany({});
  });

  describe('auditable behavior', () => {
    it('should include audit properties in POST response', async () => {
      const response = await testAgent
        .post('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Item', value: 42 })
        .expect(201);
      
      // Check if the response is wrapped in a success/data format
      const entity = response.body.data;
      
      expect(entity).toBeDefined();
      expect(entity).toHaveProperty('_created');
      expect(entity).toHaveProperty('_createdBy', userId);
      expect(entity).toHaveProperty('_updated');
      expect(entity).toHaveProperty('_updatedBy', userId);
    });

    it('should update audit fields correctly when using PATCH', async () => {
      // First create an item
      const createResponse = await testAgent
        .post('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Original Name', value: 100 });
      
      expect(createResponse.status).toBe(201);
      
      // Extract the entity from the response
      const originalItem = createResponse.body.data;
      expect(originalItem).toBeDefined();
      expect(originalItem._id).toBeDefined();
      
      const itemId = originalItem._id;
      const originalCreated = originalItem._created;
      const originalCreatedBy = originalItem._createdBy;
      
      // Wait a bit to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update with PATCH
      const updateResponse = await testAgent
        .patch(`/api/test-items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });
      
      expect(updateResponse.status).toBe(200);
      
      // Extract the updated entity
      const updatedItem = updateResponse.body.data;
      expect(updatedItem).toBeDefined();
      
      // Verify audit properties
      expect(updatedItem._created).toEqual(originalCreated);
      expect(updatedItem._createdBy).toEqual(originalCreatedBy);
      expect(updatedItem._updated).not.toEqual(originalItem._updated);
      expect(updatedItem._updatedBy).toEqual(userId);
    });

    it('should update audit fields correctly when using PUT', async () => {
      // First create an item
      const createResponse = await testAgent
        .post('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Original Name', value: 100 });
      
      expect(createResponse.status).toBe(201);
      
      // Extract the entity from the response
      const originalItem = createResponse.body.data;
      expect(originalItem).toBeDefined();
      expect(originalItem._id).toBeDefined();
      
      const itemId = originalItem._id;
      const originalCreated = originalItem._created;
      const originalCreatedBy = originalItem._createdBy;
      
      // Wait a bit to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update with PUT - include all required fields
      const updateResponse = await testAgent
        .put(`/api/test-items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'New Name', 
          value: 200
        });
      
      expect(updateResponse.status).toBe(200);
      
      // Extract the updated entity
      const updatedItem = updateResponse.body.data;
      expect(updatedItem).toBeDefined();
      
      // Verify audit properties
      expect(updatedItem._created).toEqual(originalCreated);
      expect(updatedItem._createdBy).toEqual(originalCreatedBy);
      expect(updatedItem._updated).not.toEqual(originalItem._updated);
      expect(updatedItem._updatedBy).toEqual(userId);
    });

    it('should reject attempts to tamper with audit properties', async () => {
      // First create an item
      const createResponse = await testAgent
        .post('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Original Item' });
      
      expect(createResponse.status).toBe(201);
      
      // Extract the entity from the response
      const originalItem = createResponse.body.data;
      expect(originalItem).toBeDefined();
      expect(originalItem._id).toBeDefined();
      
      const itemId = originalItem._id;
      
      // Try to tamper with audit properties during update
      const tamperedDate = new Date(2000, 1, 1).toISOString();
      const updateResponse = await testAgent
        .patch(`/api/test-items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'Tampered Item',
          _created: tamperedDate,
          _createdBy: 'hacker',
          _updated: tamperedDate,
          _updatedBy: 'hacker'
        });
      
      expect(updateResponse.status).toBe(200);
      
      // Extract the updated entity
      const updatedItem = updateResponse.body.data;
      expect(updatedItem).toBeDefined();
      
      // Verify tamper attempt failed
      expect(updatedItem._created).toEqual(originalItem._created);
      expect(updatedItem._createdBy).toEqual(originalItem._createdBy);
      expect(updatedItem._updated).not.toEqual(tamperedDate);
      expect(updatedItem._updatedBy).not.toEqual('hacker');
      expect(updatedItem._updatedBy).toEqual(userId);
    });

    it('should preserve audit properties when returning lists of items', async () => {
      // Create several items
      await testAgent
        .post('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Item 1', value: 10 })
        .expect(201);
      
      await testAgent
        .post('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Item 2', value: 20 })
        .expect(201);
      
      // Get all items
      const response = await testAgent
        .get('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // ApiController returns responses wrapped in IApiResponse format with paged result
      const pagedResult = response.body.data;
      const items = pagedResult.entities;
      
      // Verify we got an array of items
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      
      // Verify all items have audit properties
      items.forEach((item: any) => {
        expect(item).toHaveProperty('_created');
        expect(item).toHaveProperty('_createdBy');
        expect(item).toHaveProperty('_updated');
        expect(item).toHaveProperty('_updatedBy');
      });
    });

    it('should return audit properties when getting a single item', async () => {
      // Create an item
      const createResponse = await testAgent
        .post('/api/test-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Single Item', value: 42 });
      
      expect(createResponse.status).toBe(201);
      
      // Extract the entity and ID from the response
      const createdItem = createResponse.body.data;
      expect(createdItem).toBeDefined();
      
      const itemId = createdItem._id;
      expect(itemId).toBeDefined();
      
      // Get the item
      const getResponse = await testAgent
        .get(`/api/test-items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getResponse.status).toBe(200);
      
      // Extract the retrieved entity
      const retrievedItem = getResponse.body.data;
      expect(retrievedItem).toBeDefined();
      
      // Verify audit properties
      expect(retrievedItem).toHaveProperty('_created');
      expect(retrievedItem).toHaveProperty('_createdBy', userId);
      expect(retrievedItem).toHaveProperty('_updated');
      expect(retrievedItem).toHaveProperty('_updatedBy', userId);
    });
  });
}); 