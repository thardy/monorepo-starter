import { first } from '#server/first';

import mongoose from 'mongoose';
import { externalApp, setupExternalExpress } from '#root/external-app';
//import { internalApp, setupInternalExpress } from '#root/internal-app';
import config from '#server/config/config';

let db: mongoose.Connection | null = null;

const startServer = async () => {
  first.initialize();  // Call initialize to load environment variables
  
  console.log(`Starting api server on ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}...`);
  console.log(`config.env is set to: "${config.env}"`);

  // ensure we have all required config values
  checkForRequiredConfigValues();
	
  try {
    console.log('connecting to mongoDb...');

    await mongoose.connect(`${config.mongoUri}/${config.databaseName}`);
    db = mongoose.connection;
    console.log("...connected to mongoDb")

    // we need db to be ready before setting up express - all the controllers need it when they get instantiated
    setupExternalExpress();
  }
  catch(err) {
    console.error(err);

    cleanup('DATABASE_CONNECTION_ERROR');
  }

  if (db) {
    externalApp.listen(config.port, () => {
      console.log(`risk-answers-api listening on port ${config.port} (${config.env})!!!`);
    });
  }
  else {
    await cleanup('DATABASE_CONNECTION_ERROR');
  }
};


const checkForRequiredConfigValues = () => {
  // todo: add all required config values to this check
  //if (!config.apiCommonConfig.clientSecret) { throw new Error('config.commonConfig.clientSecret is not defined'); }
}

// ******** Shutdown Cleanup Begin ********
const cleanup = async (event: any) => {
  console.log(`risk-answers-api server stopping due to ${event} event. running cleanup...`);
  // clean stuff up here
  if (db) {
    console.log('closing mongodb connection');
    await mongoose.connection.close(); // Close MongodDB Connection when Process ends
  }
  process.exit(); // Exit with default success-code '0'.
};

// SIGINT is sent for example when you Ctrl+C a running process from the command line.
process.on('SIGINT', async () => await cleanup('SIGINT'));
process.on('SIGTERM', async () => await cleanup('SIGTERM'));

// Add handlers for uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await cleanup('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanup('UNHANDLED_REJECTION');
});
// ******** Shutdown Cleanup End ********

// const setupManualTestData = async (db: any) => {
//   testUtils.initialize(db);
//   await testUtils.setupTestOrgs();
//   await testUtils.setupTestUsers();
// };

startServer();

