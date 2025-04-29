import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { TestExpressApp } from '../../__tests__/setup/test-express-app.js';
import testUtils from '../../__tests__/setup/common-test.utils.js';
import { AuthController } from '../auth.controller.js';

describe('[library] AuthController', () => {
  let testAgent: any;
  let authController: AuthController;

  beforeAll(async () => {
    const testSetup = await TestExpressApp.init();
    testAgent = testSetup.agent;
    
    // Initialize the AuthController with the Express app and database
    authController = new AuthController(testSetup.app, testSetup.db);
  
    // Setup error handling middleware AFTER controller initialization
    await TestExpressApp.setupErrorHandling();
    
    // Set up test user data
    await testUtils.setupTestUser();
  });

  afterAll(async () => {
    await TestExpressApp.cleanup();
  });

  describe('POST /auth/login', () => {
    const apiEndpoint = '/api/auth/login';

    it('should return a 200, an accessToken, and a userContext if correct credentials are given', async () => {
      const user = {
        email: testUtils.testUserEmail,
        password: testUtils.testUserPassword
      };
      
      // Set a device ID cookie before making the request
      testAgent.set('Cookie', [`deviceId=${testUtils.constDeviceIdCookie}`]);
      
      const response = await testAgent
        .post(apiEndpoint)
        .send(user)
        .expect(200);

      expect(response.body?.data?.tokens?.accessToken).toBeDefined();
      expect(response.body?.data?.userContext?.user?.email).toEqual(user.email.toLowerCase());
    });

    it('should allow email to be case insensitive', async () => {
      const user = {
        email: testUtils.testUserEmailCaseInsensitive,
        password: testUtils.testUserPassword
      };
      
      // Set a device ID cookie before making the request
      testAgent.set('Cookie', [`deviceId=${testUtils.constDeviceIdCookie}`]);
      
      const response = await testAgent
        .post(apiEndpoint)
        .send(user)
        .expect(200);

      expect(response.body?.data?.tokens?.accessToken).toBeDefined();
      expect(response.body?.data?.userContext?.user?.email).toEqual(user.email.toLowerCase());
    });

    it('should return a 400 if email does not exist', async () => {
      const user = {
        email: 'yourmom97@mom.com',
        password: 'yourmom'
      };
      
      // Set a device ID cookie before making the request
      testAgent.set('Cookie', [`deviceId=${testUtils.constDeviceIdCookie}`]);
      
      const response = await testAgent
        .post(apiEndpoint)
        .send(user)
        .expect(400);
    });

    it('should return a 400 if password is incorrect', async () => {
      const user = {
        email: testUtils.testUserEmail,
        password: 'yourmom'
      };
      
      // Set a device ID cookie before making the request
      testAgent.set('Cookie', [`deviceId=${testUtils.constDeviceIdCookie}`]);
      
      const response = await testAgent
        .post(apiEndpoint)
        .send(user)
        .expect(400);
    });

    it('should not return any sensitive information in the usercontext', async () => {
      const user = {
        email: testUtils.testUserEmail,
        password: testUtils.testUserPassword
      };
      
      // Set a device ID cookie before making the request
      testAgent.set('Cookie', [`deviceId=${testUtils.constDeviceIdCookie}`]);
      
      const response = await testAgent
        .post(apiEndpoint)
        .send(user)
        .expect(200);

      expect(response.body?.data?.userContext?.user?.password).toBeUndefined();
    });
  });
});


// it("should return unauthenticated for an authenticated route without a valid token", () => {
//   return request
//     .get('/api/auth/random-number')
//     .expect(401)
//     .then(result => {
//       result.error.text.should.equal('Unauthenticated');
//     });
// });

// it ("should allow access to authenticated route with valid token", () => {
//
// });

// return request
//   .post('/api/auth/login')
//   .send({
//     email: 'admin',
//     password: 'test'
//   })
//   .expect(200)
//   .then(response => {
//     // todo: look for the auth cookie
//     const cookies = response.header['set-cookie'];
//     if (cookies && cookies.length > 0) {
//       authCookie = cookies[0]
//     }
//     if (response.body && response.body.tokens && response.body.tokens.accessToken) {
//       authorizationHeaderValue = `Bearer ${response.body.tokens.accessToken}`;
//     }
//     return response;
//   });

