import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import testUtils from './common-test.utils.js';
import { config as apiCommonConfig } from '../../config/index.js';
import { setApiCommonConfig } from '../../config/api-common-config.js';
import { initializeTypeBox } from '../../validation/typebox-setup.js';
import { errorHandler } from '../../middleware/error-handler.js';
import { ensureUserContext } from '../../middleware/ensure-user-context.js';
import 'express-async-errors'; // This package helps Express catch async errors

/**
 * Utility class for setting up a minimal Express application for testing
 * This uses the real authentication middleware, unlike our previous approach
 */
export class TestExpressApp {
  private static app: Application;
  private static mongoServer: MongoMemoryServer;
  private static client: MongoClient;
  private static db: Db;
  
  /**
   * Initialize the Express application with a MongoDB memory server
   * @returns Promise resolving to an object with the app, db, and supertest agent
   */
  static async init(): Promise<{ 
    app: Application, 
    db: Db, 
    agent: any  // Using any type for supertest agent to avoid type issues
  }> {
    // Set up a fake clientSecret for authentication
    // IMPORTANT: Must set the API common config using the proper function
    setApiCommonConfig({
      env: 'test',
      hostName: 'localhost',
      appName: 'test-app',
      clientSecret: 'test-secret',
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
        sendGridApiKey: undefined,
        fromAddress: undefined
      }
    });

    // Initialize TypeBox format validators
    initializeTypeBox();
    
    // Set up MongoDB memory server if not already done
    if (!this.db) {
      this.mongoServer = await MongoMemoryServer.create();
      const uri = this.mongoServer.getUri();
      this.client = await MongoClient.connect(uri);
      this.db = this.client.db();
      testUtils.initialize(this.db);
      await testUtils.createIndexes(this.db);
    }
    
    // Set up Express app if not already done
    if (!this.app) {
      this.app = express();
      this.app.use(bodyParser.json());
      this.app.use(cookieParser());  // Add cookie-parser middleware
      this.app.use(ensureUserContext);
      
      // Add diagnostic middleware to log all requests
      this.app.use((req, res, next) => {
        next();
      });
    }
    
    // Create a supertest agent for making test requests
    const agent = supertest.agent(this.app);
    
    return { 
      app: this.app, 
      db: this.db,
      agent
    };
  }

  // Use the real error handler from our application
  static async setupErrorHandling(): Promise<void> {
    // Add the same error handling middleware used in the real app
    this.app.use(errorHandler);
  }
  
  /**
   * Clean up resources
   */
  static async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
  }
  
  /**
   * Clear all collections in the database
   */
  static async clearCollections(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const collections = await this.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
} 