import { Db } from 'mongodb';
import {Application} from 'express';
import fs from 'fs';
import path from 'path';
import { IBaseApiConfig } from '@loomcore/api/models';

import {AuthController, OrganizationsController, UsersController} from '@loomcore/api/controllers';
import {ProductsController} from '#features/products/products.controller';
// *** end of imports [buildit marker] ***

const getPackageJsonPath = (config: IBaseApiConfig) => {
	const isTest = config.env === 'test';
	const currentDir = path.dirname(new URL(import.meta.url).pathname);
	// In test environment, use path from project root, otherwise use path relative to this file
	const pathToPackageJson = isTest ? path.join(process.cwd(), './apps/api/package.json') : path.join(currentDir, '../../../package.json');
	
	return pathToPackageJson;
};

export function setupRoutes(app: Application, db: Db, config: IBaseApiConfig): void {
	// add endpoint for k8s health check
	app.get(`/api/health`, async (req: any, res: any) => { res.status(200).send('OK'); })

	// add endpoint for version check
	//app.get('/api/diagnostics', isAuthenticated, (req, res) => {
	app.get('/api/diagnostics', (req, res) => {
		try {
			const packageJsonPath = getPackageJsonPath(config);
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
			res.send({ 
				version: packageJson.version,
				//deployedBranch: config.deployedBranch || 'unknown'
			});
		} 
		catch (err) {
			console.error('Error reading package.json:', err);
			res.status(500).send('Error reading package.json');
		}
	});

	// exception test endpoint - only for debugging
	// app.get(`/api/throw`, async (req: any, res: any) => {
	// 	console.log('in /api/throw');
	// 	throw new ServerError('**** Manually throwing an Exception for test purposes ****');
	// });

	// each controller has a 'mapRoutes' function that adds its routes to the express app
	const authController = new AuthController(app, db);
	const organizationsController = new OrganizationsController(app, db);
	const productsController = new ProductsController(app, db);
	const usersController = new UsersController(app, db);
	// *** end of routes [buildit marker] ***
};


