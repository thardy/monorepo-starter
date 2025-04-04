import {Application, NextFunction, Request, Response} from 'express';
import {Db} from 'mongodb';

import {IOrganization} from '#common/models/index';
import {ApiController} from '#common/controllers/api.controller';
import {isAuthenticated} from '#common/middleware/index';
import {apiUtils} from '#common/utils/index';
import {OrganizationService} from '#features/organizations/organization.service';
import {BadRequestError, IdNotFoundError} from '#common/errors/index';

/**
 * OrganizationsController is unique, just like its service, because Organizations are not multi-tenant
 * entities, requiring an orgId in addition to its primary key id. The primary key is the orgId.
 */
export class OrganizationsController extends ApiController<IOrganization> {
	orgService: OrganizationService;

	constructor(app: Application, db: Db) {
		const orgService = new OrganizationService(db);
		super('organizations', app, orgService);
		this.orgService = orgService;
	}

	override mapRoutes(app: Application) {
		super.mapRoutes(app); // map the base ApiController routes

		app.get(`/api/${this.slug}/get-by-name/:name`, isAuthenticated, this.getByName.bind(this));
		app.get(`/api/${this.slug}/get-by-code/:code`, isAuthenticated, this.getByCode.bind(this));
	}

	async getByName(req: Request, res: Response, next: NextFunction) {
		console.log('in OrganizationController.getByName');
		let name = req.params?.name;
		try {
			res.set('Content-Type', 'application/json');
			const entity = await this.orgService.findOne(req.userContext!, { name: { $regex: new RegExp(`^${name}$`, 'i') } });
			if (!entity) throw new BadRequestError('Name not found');

			return apiUtils.apiResponse<IOrganization>(res, 200, {data: entity});
		}
		catch (err: any) {
			next(err);
			return;
		}
	}

	async getByCode(req: Request, res: Response, next: NextFunction) {
		let code = req.params?.code;
		try {
			res.set('Content-Type', 'application/json');
			const entity = await this.orgService.findOne(req.userContext!, {code: code});
			if (!entity) throw new BadRequestError('Code not found');

			return apiUtils.apiResponse<IOrganization>(res, 200, {data: entity});
		}
		catch (err: any) {
			next(err);
			return;
		}
	}

}
