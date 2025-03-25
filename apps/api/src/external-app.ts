import { Db } from 'mongodb';
import express, {Application, NextFunction, Request, Response} from 'express';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import bodyParser from 'body-parser';
import {NotFoundError} from '#common/errors/index';
import {errorHandler} from '#common/middleware/index';
import cors from 'cors';

import routes from '#server/routes/routes';
import config from '#server/config/config';

const externalApp: Application = express();

function setupExternalExpress(db: Db) {
  // Add early request logging before any middleware
  externalApp.use((req, res, next) => {
    if (req.path !== '/api/health' && process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] INCOMING REQUEST: ${req.method} ${req.path}`);
    }
    next();
  });

  externalApp.use(bodyParser.json());
  externalApp.use(cookieParser());
	//externalApp.use(cors());
	externalApp.use(cors({
		origin: config.corsAllowedOrigins,
		credentials: true
	}));

  routes(externalApp, db); // routes calls every controller to map its own routes

  externalApp.all('*', async (req, res) => {
    throw new NotFoundError(`Requested path, ${req.path}, Not Found`);
  });

  externalApp.use(errorHandler);
}

export { externalApp, setupExternalExpress };

