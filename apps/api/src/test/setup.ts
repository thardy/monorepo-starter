import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import config from '#server/config/config';
import testUtils from '#test/test.utils';
import testApiUtils from '#test/test-api.utils';
import { externalApp, setupExternalExpress } from '#root/external-app';

let mongo: MongoMemoryServer;
let mongoClient: MongoClient;

// Increase timeout to 1 minute for the first run
vi.setConfig({ testTimeout: 60000 });

beforeAll(async () => {
  try {
    // setApiCommonConfig(config.apiCommonConfig);
    mongo = await MongoMemoryServer.create({
      instance: {
        port: 27017 + Math.floor(Math.random() * 1000), // Use a random port in safe range
        ip: '127.0.0.1', // Use localhost instead of 0.0.0.0
      }
    });
    const mongoUri = mongo.getUri();
    mongoClient = await MongoClient.connect(mongoUri);
    const db = mongoClient.db(config.databaseName);
    
    // Initialize test utils with database
    await testUtils.initialize(db);
    await testUtils.createIndexes(db);
    
    // Initialize API utils with app
    testApiUtils.initialize(externalApp);
    
    // Setup express app
    setupExternalExpress(db);
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
});

afterAll(async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  if (mongo) {
    await mongo.stop();
  }
});

beforeEach(async () => {
  // todo: change this to be more targeted
  // if (!mongoClient) {
  //   throw new Error('MongoDB client not initialized');
  // }
  // const collections = await mongoClient.db(config.databaseName).collections();
  // for (const collection of collections) {
  //   await collection.deleteMany({});
  // }
});
