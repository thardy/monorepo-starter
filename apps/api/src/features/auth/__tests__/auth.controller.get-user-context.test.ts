import request from 'supertest';

import { externalApp } from '#root/external-app';
import testUtils from '#test/test.utils';
import testApiUtils from '#test/test-api.utils';

describe('AuthController', () => {
  beforeAll(async () => {
    await testUtils.setupTestUsers();
  });

  afterAll(async () => {
    await testUtils.deleteAllTestUsers()
  });

  describe('GET /auth/get-user-context', () => {
    const apiEndpoint = '/api/auth/get-user-context';

    it('should return a 200, and a valid client userContext when a valid authToken is supplied', async () => {
      const authorizationHeaderValue = await testApiUtils.loginWithTestUser();
      const response = await request(externalApp)
        .get(apiEndpoint)
        .set('Authorization', authorizationHeaderValue)
        .expect(200);

      expect(response.body?.data?.user?.email).toEqual(testUtils.testUserEmail);
    });

    it('should return a 401 when no authToken is supplied', async () => {
      const response = await request(externalApp)
        .get(apiEndpoint)
        .expect(401);

      expect(response.body?.errors[0]?.message).toEqual('Unauthenticated');
      expect(response.body?.data?.user).toEqual(undefined);
    });

    // test an expired authToken

  });
});

