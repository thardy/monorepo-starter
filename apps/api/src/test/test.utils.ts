import {Db, ObjectId} from 'mongodb';
import _ from 'lodash';
import moment from 'moment';

import config from '#server/config/config';
import { passwordUtils, entityUtils } from '#common/utils/index';

let db: Db;
let collections: any = {};

// const testUserId = '5af51f4cf6dd9aae8deaeffa';
let testUserId: string = '';
const testOrgId = '67e8e19b149f740323af93d7';
const testUserEmail = 'test@test.com';
const testUserEmailCaseInsensitive = 'tesT@test.com';
const testUserPassword = 'test';
const newUser1Email= 'one@test.com';
const newUser1Password = 'testone';
let updateUserId: string = '';
const updateUserEmail = 'updateme@test.com'
const updateUserFirstName = 'Joe';
const updateUserLastName = 'Smith';
const updateUserPassword = 'updateme';
let testClient1Id: string = '';
const testClient1AppliedId = 'testClient1AppliedId';
let testClient2Id: string = '';
const testClient2AppliedId = 'testClient2AppliedId';

function initialize(database: Db) {
  db = database;
  collections = {
    organizations: db.collection('organizations'),
    users: db.collection('users'),
    clients: db.collection('clients')
  };
}

async function createIndexes(db: Db) {
  // create indexes - keep this in sync with the k8s/02-mongo-init-configmap.yaml that is used for actual deployment
  //  If we can figure out how to use a single file for both, that would be great.
  await db.command({
    createIndexes: "users", indexes: [ { key: { email: 1 }, name: 'email_index', unique: true, collation: { locale: 'en', strength: 1 } }]
  });
}

async function setupTestUsers() {
  try {
    const result = await deleteAllTestUsers();
    return createTestUsers();
  }
  catch (error: any) {
    console.log(error);
    throw error;
  }
}

async function createTestUsers() {
  if (!db || !collections.users) {
    throw new Error('Database not initialized. Call initialize() first.');
  }

  try {
    const testUsers: any[] = [];
    const hashedAndSaltedTestUserPassword = await passwordUtils.hashPassword(testUserPassword);
    const hashedAndSaltedUpdateUserPassword = await passwordUtils.hashPassword(updateUserPassword);
    
    // Create a test organization if it doesn't exist
    const existingOrg = await collections.organizations.findOne({ _id: new ObjectId(testOrgId) });
    if (!existingOrg) {
      await collections.organizations.insertOne({ 
        _id: new ObjectId(testOrgId), 
        name: 'Test Organization',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Add orgId to all test users
    testUsers.push({
      email: testUserEmail, 
      password: hashedAndSaltedTestUserPassword,
      roles: ['user'],
      _orgId: testOrgId
    });
    testUsers.push({
      email: updateUserEmail, 
      password: hashedAndSaltedUpdateUserPassword, 
      firstName: updateUserFirstName, 
      lastName: updateUserLastName,
      roles: ['user'],
      _orgId: testOrgId
    });

    const insertResults = await Promise.all([
      collections.users.insertMany(testUsers),
    ]);
    testUtils.existingUsers = testUsers;
    
    if (insertResults[0]?.insertedIds) {
      // _.forEach(testUtils.existingUsers, (item: any) => {
      //   entityUtils.useFriendlyId(item);
      //   entityUtils.removeMongoId(item);
      // });
      testUtils.testUserId = testUtils.existingUsers[0]?._id;
      testUtils.updateUserId = testUtils.existingUsers[1]?._id;
    }
    return testUtils.existingUsers;
  }
  catch (error: any) {
    console.log('Error in createTestUsers:', error);
    throw error;
  }
}

function deleteAllTestUsers() {
  let promise = Promise.resolve(null);
  if (testUtils.existingUsers.length > 0) {
    promise = collections.users.deleteOne({_id: testUtils.existingUsers[0]?._id});
  }
  return promise;
}

async function setupTestClients() {
	try {
		const result = await deleteAllTestClients();
		return createTestClients();
	}
	catch (error: any) {
		console.log(error);
		throw error;
	}
}

async function createTestClients() {
	try {
		const testClients: any[] = [];
		testClients.push({
			appliedId: testClient1AppliedId, 
			location: {lat: 10, lng: 20},
			_orgId: testUtils.testOrgId
		});
		testClients.push({
			appliedId: testClient2AppliedId, 
			location: {lat: 100, lng: 200},
			_orgId: testUtils.testOrgId
		});

		const insertResults = await collections.clients.insertMany(testClients);
		testUtils.existingClients = testClients;

		// insertMany response looks like this {"acknowledged":true,"insertedCount":2,"insertedIds":{"0":"66fc75b3dcd36da71ee749e7","1":"66fc75b3dcd36da71ee749e8"}}
		if (insertResults?.insertedCount > 0) {
			// _.forEach(testUtils.existingClients, (item: any) => {
			// 	entityUtils.useFriendlyId(item);
			// 	entityUtils.removeMongoId(item);
			// });
			testClient1Id = testUtils.existingClients[0]?._id;
			testClient2Id = testUtils.existingClients[1]?._id;
		}
		return testUtils.existingClients;
	}
	catch (error: any) {
		console.log(error);
		throw error;
	}
}

function deleteAllTestClients() {
	let promise = Promise.resolve(null);
	if (testUtils.existingClients.length > 0) {
		promise = collections.clients.deleteOne({_id: testUtils.existingClients[0]?._id});
	}
	return promise;
}

const testUtils = {
	testUserId,
	testUserEmail,
	testUserEmailCaseInsensitive,
  testUserPassword,
  newUser1Email,
  newUser1Password,
	updateUserId,
	updateUserEmail,
	updateUserPassword,
	testClient1Id,
	testClient1AppliedId,
	testClient2Id,
	testClient2AppliedId,
	testOrgId,
  existingProducts: [],
  existingDifferentProducts: [],
  existingSchemas: [],
  existingUsers: [] as any[],
  existingOrgs: [] as any[],
	existingClients: [] as any[],
  existingSites: [],
  initialize,
  createIndexes,
  setupTestUsers,
  deleteAllTestUsers,
	setupTestClients,
	deleteAllTestClients,
};

export default testUtils;
