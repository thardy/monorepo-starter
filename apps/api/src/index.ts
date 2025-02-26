import { first } from '#server/first';

import mongoose from "mongoose";
import { externalApp, setupExternalExpress } from '#root/external-app';
//import { internalApp, setupInternalExpress } from '#root/internal-app';
import config from '#server/config/config';


let mongoClient: MongoClient;
let db: Db;

const startServer = async () => {
  first.initialize();  // Call initialize to load environment variables
  
  console.log(`Starting risk-answers-api server on ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}...`);
  console.log(`NODE_ENV is set to: "${process.env.NODE_ENV}"`);
  console.log(`config.env is set to: "${config.env}"`);

  // ensure we have all required config values
  checkForRequiredConfigValues();
	setApiCommonConfig(config.apiCommonConfig);

  try {
		mongoClient = new MongoClient(`${config.mongoDbUrl}/${config.databaseName}`);
    console.log('connecting to mongoDb...');
    await mongoClient.connect();
    db = mongoClient.db(config.databaseName);
    console.log('...connected to mongoDb');

    // we need db to be ready before setting up express - all the controllers need it when they get instantiated
    setupExternalExpress(db);
	  setupInternalExpress(db);
  }
  catch(err) {
    console.error(err);
  }

  if (db!) {
    externalApp.listen(config.externalPort, () => {
      console.log(`risk-answers-api listening on port ${config.externalPort} (${config.env})!!!`);
    });
	  internalApp.listen(config.internalPort, () => {
		  console.log(`risk-answers-api (internal) listening on port ${config.internalPort} (${config.env})!!!`);
	  });
  }
  else {
    cleanup('DATABASE_CONNECTION_ERROR');
  }
};


const checkForRequiredConfigValues = () => {
  // todo: add all required config values to this check
  //if (!config.apiCommonConfig.clientSecret) { throw new Error('config.commonConfig.clientSecret is not defined'); }
}

// ******** Shutdown Cleanup Begin ********
const cleanup = (event: any) => {
  console.log(`risk-answers-api server stopping due to ${event} event. running cleanup...`);
  // clean stuff up here
  if (mongoClient) {
    console.log('closing mongodb connection');
    mongoClient.close(); // Close MongodDB Connection when Process ends
  }
  process.exit(); // Exit with default success-code '0'.
};

// SIGINT is sent for example when you Ctrl+C a running process from the command line.
process.on('SIGINT', cleanup('SIGINT'));
process.on('SIGTERM', cleanup('SIGTERM'));

// Add handlers for uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup('UNHANDLED_REJECTION');
});
// ******** Shutdown Cleanup End ********

// const setupManualTestData = async (db: any) => {
//   testUtils.initialize(db);
//   await testUtils.setupTestOrgs();
//   await testUtils.setupTestUsers();
// };

startServer();

