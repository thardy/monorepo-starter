import { first } from '#server/first';
import {Db, MongoClient} from 'mongodb';
import { Server } from 'http';

import { externalApp, setupExternalExpress } from '#root/external-app';
//import { internalApp, setupInternalExpress } from '#root/internal-app';
import config from '#server/config/config';

let mongoClient: MongoClient;
let db: Db;
let externalServer: Server | null = null;
let internalServer: Server | null = null;

const startServer = async () => {
  first.initialize();  // Call initialize to load environment variables
  
  console.log(`Starting api server on ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}...`);
  console.log(`config.env is set to: "${config.env}"`);

  // ensure we have all required config values
  checkForRequiredConfigValues();
	
  try {
    mongoClient = new MongoClient(`${config.mongoUri}/${config.databaseName}`);
    console.log('connecting to mongoDb...');
    await mongoClient.connect();
    db = mongoClient.db(config.databaseName);
    console.log('...connected to mongoDb');

    // we need db to be ready before setting up express - all the controllers need it when they get instantiated
    setupExternalExpress(db);
  }
  catch(err) {
    console.error(err);

    cleanup('DATABASE_CONNECTION_ERROR');
  }

  if (db) {
    // internalServer = internalApp.listen(config.internalPort, () => {
		//   console.log(`risk-answers-api (internal) listening on port ${config.internalPort} (inside k8s cluster). env = (${config.env})!!!`);
	  // });
    externalServer = externalApp.listen(config.externalPort, () => {
      console.log(`risk-answers-api (external) listening on port ${config.externalPort} (inside k8s cluster). env = (${config.env})!!!`);
      console.log(`k8s ingress maps external to ${config.hostName}/api!!! You should have ${config.hostName} mapped in your hosts file to 127.0.0.1.`);
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

const cleanup = (event: any) => {
  console.log(`monorepo-starter-api server stopping due to ${event} event. running cleanup...`);
  performGracefulShutdown(event);
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

// const setupManualTestData = async (db: any) => {
//   testUtils.initialize(db);
//   await testUtils.setupTestOrgs();
//   await testUtils.setupTestUsers();
// };

startServer();




// ******** Detailed Shutdown Implementation ********
/**
 * Performs a graceful shutdown of all server resources
 * - Closes HTTP servers with a timeout
 * - Ensures MongoDB connection is always closed
 * - Exits the process when cleanup is complete
 */
function performGracefulShutdown(event: any): void {
  // Function to close MongoDB connection
  const closeMongoConnection = async (): Promise<void> => {
    if (mongoClient) {
      console.log('closing mongodb connection');
      try {
        await mongoClient.close();
        console.log('MongoDB connection closed successfully');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      }
    }
  };

  // Create a promise to track server shutdown completion
  const shutdownServers = new Promise<void>((resolve) => {
    let serversClosedCount = 0;
    const totalServers = (externalServer ? 1 : 0) + (internalServer ? 1 : 0);
    
    const onServerClosed = () => {
      serversClosedCount++;
      if (serversClosedCount >= totalServers) {
        resolve();
      }
    };

    // If no servers were started, resolve immediately
    if (totalServers === 0) {
      resolve();
      return;
    }

    // Close the HTTP servers
    if (externalServer) {
      console.log('Closing external HTTP server...');
      externalServer.close((err) => {
        if (err) console.error('Error closing external server:', err);
        console.log('External HTTP server closed');
        onServerClosed();
      });
    }

    if (internalServer) {
      console.log('Closing internal HTTP server...');
      internalServer.close((err) => {
        if (err) console.error('Error closing internal server:', err);
        console.log('Internal HTTP server closed');
        onServerClosed();
      });
    }

    // Force resolve after timeout if servers don't close gracefully
    setTimeout(() => {
      console.log('Server shutdown timeout reached, proceeding with MongoDB cleanup');
      resolve();
    }, 5000); // 5 second timeout
  });

  // Handle the complete shutdown sequence
  Promise.race([
    // Normal path: servers close, then MongoDB
    shutdownServers.then(() => closeMongoConnection()),
    
    // Timeout path: ensure MongoDB closes even if servers timeout
    new Promise<void>(resolve => {
      setTimeout(async () => {
        console.log('Ensuring MongoDB connection is closed before exit');
        await closeMongoConnection();
        resolve();
      }, 6000); // Give a bit more time than the server timeout
    })
  ]).then(() => {
    console.log('Cleanup complete, exiting process');
    process.exit(0);
  });
}

