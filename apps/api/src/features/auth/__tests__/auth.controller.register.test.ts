import request from 'supertest';
import { externalApp } from '#root/external-app';
import testUtils from '#test/test.utils';
import jwt from 'jsonwebtoken';
import config from '#server/config/config';

describe('AuthController', () => {
  let authToken: string;
  
  beforeAll(async () => {
    await testUtils.setupTestUsers();
    
    // Create auth token for test user with orgId
    const testUser = testUtils.existingUsers[0];
    const payload = { 
      user: { 
        _id: testUser.id,
        email: testUser.email
      }, 
      _orgId: testUtils.testOrgId 
    };
    authToken = jwt.sign(
      payload,
      config.apiCommonConfig.clientSecret,
      { expiresIn: 3600 }
    );
  });

  afterAll(async () => {
    await testUtils.deleteAllTestUsers()
  });

  // consider clearing out auth data before each test
  // beforeEach(async () => {
  //   await testUtils.deleteAllTestUsers();
  // });

  describe('POST /auth/register', () => {
    const apiEndpoint = '/api/auth/register';

    it("should return a 201 and a newly created user on successful creation", async () => {
      const newUser = {
        email: testUtils.newUser1Email,
        password: testUtils.newUser1Password,
        orgId: testUtils.testOrgId
      };
      const response = await request(externalApp)
        .post(apiEndpoint)
        .set('Authorization', `Bearer ${authToken}`) // Add auth token
        .send(newUser)
        .expect(201);

      expect(response.body?.data).toHaveProperty('id');
      expect(response.body?.data).toHaveProperty('email', newUser.email);
      expect(response.body?.data).toHaveProperty('orgId', testUtils.testOrgId);
    });

    it('should return a 400 with an invalid email', async () => {
      const newUser = {
        email: 'test',
        password: testUtils.newUser1Password,
        orgId: testUtils.testOrgId
      };
      return request(externalApp)
        .post(apiEndpoint)
        .set('Authorization', `Bearer ${authToken}`) // Add auth token
        .send(newUser)
        .expect(400);
    });

    it('should return a 400 with an invalid password', async () => {
      const newUser = {
        email: testUtils.newUser1Email,
        password: 't',
        orgId: testUtils.testOrgId
      };
      return request(externalApp)
        .post(apiEndpoint)
        .set('Authorization', `Bearer ${authToken}`) // Add auth token
        .send(newUser)
        .expect(400);
    });

    it('should return a 400 with missing email or password', async () => {
      await request(externalApp)
        .post(apiEndpoint)
        .set('Authorization', `Bearer ${authToken}`) // Add auth token
        .send({ // missing password
          email: "shouldfail@test.com",
          orgId: testUtils.testOrgId 
        }) // missing password
        .expect(400);

      await request(externalApp)
        .post(apiEndpoint)
        .set('Authorization', `Bearer ${authToken}`) // Add auth token
        .send({ // missing email
          password: "shouldfail",
          orgId: testUtils.testOrgId 
        }) // missing email
        .expect(400);
    });

    it('should return a 400 if user with duplicate email already exists', async () => {
      const newUser = {
        email: testUtils.testUserEmail, // testUserEmail gets created in beforeAll, so we should not be able to use the same email again
        password: testUtils.testUserPassword,
        orgId: testUtils.testOrgId
      };
      return request(externalApp)
        .post(apiEndpoint)
        .set('Authorization', `Bearer ${authToken}`) // Add auth token
        .send(newUser)
        .expect(400);
    });
  });

});


