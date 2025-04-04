import request from 'supertest';
import { externalApp } from '#root/external-app';
import testUtils from '#test/test.utils';
import testApiUtils from '#test/test-api.utils';

describe('ClientsController', () => {
	let authorizationHeaderValue: string;

	beforeAll(async () => {
		await testUtils.setupTestUsers();
		authorizationHeaderValue = await testApiUtils.loginWithTestUser();
	});

	afterAll(async () => {
		await testUtils.deleteAllTestUsers()
	});

	describe('PATCH /users', () => {
		const apiEndpoint = '/api/users';

		it("should return a 200 and only update provided properties", async () => {
			const userId = testUtils.updateUserId;
			const path = `${apiEndpoint}/${userId}`;
			const updatedRole = 'admin';
			const updatedUser = {
				role: updatedRole
			};

			const response = await request(externalApp)
				.patch(path)
				.set('Authorization', authorizationHeaderValue)
				.send(updatedUser)
				.expect(200);

			expect(response.body?.data?.role).toEqual(updatedRole);
			expect(response.body?.data?.email).toEqual(testUtils.updateUserEmail); // because this is partial update, properties we did not provide should remain the same
		});
	});

});

