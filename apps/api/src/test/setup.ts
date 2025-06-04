import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import config from '#server/config/config';
import testUtils from '#test/test.utils';
import testApiUtils from '#test/test-api.utils';
import {expressUtils} from '@loomcore/api/utils';
import { setBaseApiConfig } from '@loomcore/api/config';
import {setupRoutes} from '#server/routes/routes';

let mongo: MongoMemoryServer;
let mongoClient: MongoClient;

// Increase timeout to 1 minute for the first run
vi.setConfig({ testTimeout: 60000 });

beforeAll(async () => {
  try {
    // Initialize API common config with mock values for testing
    setBaseApiConfig({
      env: 'test',
      hostName: 'localhost',
      appName: 'test-app',
      clientSecret: 'test-secret',
      mongoDbUrl: '',
      databaseName: '',
      externalPort: 4000,
      internalPort: 8083,
      corsAllowedOrigins: ['*'],
      saltWorkFactor: 10,
      jobTypes: '',
      deployedBranch: '',
      debug: {
        showErrors: false
      },
      app: { multiTenant: true },
      auth: {
        jwtExpirationInSeconds: 3600,
        refreshTokenExpirationInDays: 7,
        deviceIdCookieMaxAgeInDays: 730,
        passwordResetTokenExpirationInMinutes: 20
      },
      email: {
        // These can be empty/undefined in tests as specified by the interface
        sendGridApiKey: 'SG.WeDontHaveAKeyYet',
        fromAddress: undefined
      }
    });
    
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
    
    // Setup express app
    const externalApp = expressUtils.setupExpressApp(db, config, setupRoutes);

    // Initialize API utils with app
    testApiUtils.initialize(externalApp);    
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
