import {Application} from 'express';
import request from 'supertest';
import testUtils from './test.utils.js';
import crypto from 'crypto';

let app: Application;
let deviceIdCookie: string;

function initialize(theApp: Application) {
  app = theApp;
  
  // Generate a consistent device ID for tests
  deviceIdCookie = crypto.randomBytes(16).toString('hex');
}

async function loginWithTestUser() {
  // todo: not getting a valid UserContext (problem is either here or in the login function in auth.service.ts)
  // Create agent to maintain cookies
  const agent = request.agent(app);
  
  // Set deviceId cookie first
  agent.set('Cookie', [`deviceId=${deviceIdCookie}`]);
  
  const response = await agent
    .post('/api/auth/login')
    .send({
      email: testUtils.testUserEmail,
      password: testUtils.testUserPassword,
    });

  // Make sure we got a valid response
  if (!response.body?.data?.tokens?.accessToken) {
    console.error('Login failed:', response.body);
    throw new Error('Failed to login with test user');
  }

  const authorizationHeaderValue = `Bearer ${response.body?.data?.tokens?.accessToken}`;
  return authorizationHeaderValue;
}

const testApiUtils = {
  initialize,
  loginWithTestUser,
  getDeviceIdCookie: () => deviceIdCookie
}

export default testApiUtils;
