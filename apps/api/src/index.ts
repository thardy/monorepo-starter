import { first } from '#server/first'; // keep this first
import {Db, MongoClient} from 'mongodb';
import { Server } from 'http';

import {setBaseApiConfig, initSystemUserContext} from '@loomcore/api/config';
import {expressUtils} from '@loomcore/api/utils';

import {setupRoutes} from '#server/routes/routes';
//import {setupInternalRoutes} from '#server/routes/internal-routes';
import config from '#server/config/config';
import { Application } from 'express';

let mongoClient: MongoClient;
let db: Db;
let externalServer: Server | null = null;
let internalServer: Server | null = null;

const startServer = async () => {
  let externalApp: Application;
  let internalApp: Application;

  first.initialize();  // Call initialize to prevent module from being dropped (the import loaded the env vars)
  
  console.log(`Starting api server on ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}...`);
  console.log(`config.env is set to: "${config.env}"`);

  // ensure we have all required config values
  checkForRequiredConfigValues();
  setBaseApiConfig(config);
	
  try {
    mongoClient = new MongoClient(`${config.mongoDbUrl}/${config.databaseName}`);
    console.log('connecting to mongoDb...');
    await mongoClient.connect();
    db = mongoClient.db(config.databaseName);
    console.log('...connected to mongoDb');

    await initSystemUserContext(db);
    // we need db to be ready before setting up express - all the controllers need it when they get instantiated
    externalApp = expressUtils.setupExpressApp(db, config, setupRoutes);
    // internalApp = expressUtils.setupExpressApp(db, config, setupInternalRoutes);

    if (db) {
      // Start servers only after successful setup
      externalServer = externalApp.listen(config.externalPort, () => {
        console.log(`risk-answers-api (external) listening on port ${config.externalPort} (inside k8s cluster). env = (${config.env})!!!`);
        console.log(`k8s ingress maps external to ${config.hostName}/api!!! You should have ${config.hostName} mapped in your hosts file to 127.0.0.1.`);
      });
      // internalServer = internalApp.listen(config.internalPort, () => {
      //   console.log(`risk-answers-api (internal) listening on port ${config.internalPort} (inside k8s cluster). env = (${config.env})!!!`);
      // });
    }
    else {
      cleanup('DATABASE_CONNECTION_ERROR');
    }
  }
  catch(err) {
    console.error(err);
    cleanup('DATABASE_CONNECTION_ERROR');
  }
};


const checkForRequiredConfigValues = () => {
  // todo: add all required config values to this check
  if (!config.clientSecret) { throw new Error('config.clientSecret is not defined'); }
}

const cleanup = (event: any) => {
  console.log(`monorepo-starter-api server stopping due to ${event} event. running cleanup...`);
  expressUtils.performGracefulShutdown(event, mongoClient, externalServer, internalServer);
};

// SIGINT is sent for example when you Ctrl+C a running process from the command line.
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Add handlers for uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup('UNHANDLED_REJECTION');
});

startServer();
