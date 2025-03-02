import {Application, NextFunction, Request, Response} from 'express';
import {IGenericApiService} from '../services/index.js';
import {IEntity} from '#common/models/entity.interface';
import {IPagedResult} from '#common/models/paged-result.interface';

import {isAuthenticated} from '../middleware/index.js';
import {apiUtils} from '../utils/index.js';
import {DeleteResult, UpdateResult} from 'mongodb';

export abstract class ApiController<T extends IEntity> {
  protected app: Application;
  protected service: IGenericApiService<T>;
  protected slug: string;
	protected apiResourceName: string;

  protected constructor(slug: string, app: Application, service: IGenericApiService<T>, resourceName: string = '') {
	  this.slug = slug;
	  this.app = app;
    this.service = service;
		this.apiResourceName = resourceName;

    this.mapRoutes(app);
  }

  mapRoutes(app: Application) {
		// Map routes
    // have to bind "this" because when express calls the function we tell it to here, it won't have any context and "this" will be undefined in our functions
    app.get(`/api/${this.slug}`, isAuthenticated, this.get.bind(this));
	  app.get(`/api/${this.slug}/all`, isAuthenticated, this.getAll.bind(this));
	  app.get(`/api/${this.slug}/count`, isAuthenticated, this.getCount.bind(this));
	  app.get(`/api/${this.slug}/:id`, isAuthenticated, this.getById.bind(this));
	  app.post(`/api/${this.slug}`, isAuthenticated, this.create.bind(this));
	  app.put(`/api/${this.slug}/:id`, isAuthenticated, this.fullUpdateById.bind(this));
		app.patch(`/api/${this.slug}/:id`, isAuthenticated, this.partialUpdateById.bind(this));
    app.delete(`/api/${this.slug}/:id`, isAuthenticated, this.deleteById.bind(this));
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      res.set('Content-Type', 'application/json');
      const entities = await this.service.getAll(req.userContext!);
	    return apiUtils.apiResponse<T[]>(res, 200, {data: entities});
    }
    catch (error) {
      next(error);
      return;
    }
  }

	async get(req: Request, res: Response, next: NextFunction) {
		try {
			res.set('Content-Type', 'application/json');
			const queryOptions = apiUtils.getQueryOptionsFromRequest(req)

			const pagedResult = await this.service.get(req.userContext!, queryOptions);
			return apiUtils.apiResponse<IPagedResult<T>>(res, 200, { data: pagedResult });
		}
		catch (error) {
			next(error);
			return;
		}
	}

  async getById(req: Request, res: Response, next: NextFunction) {
    let id = req.params?.id;
    try {
      res.set('Content-Type', 'application/json');
      const entity = await this.service.getById(req.userContext!, id);

      return apiUtils.apiResponse<T>(res, 200, {data: entity});
    }
    catch (err: any) {
      next(err);
      return;
    }
  }

	async getCount(req: Request, res: Response, next: NextFunction) {
		try {
			res.set('Content-Type', 'application/json');
			const count = await this.service.getCount(req.userContext!); // result is in the form { count: number }
			return apiUtils.apiResponse<number>(res, 200, {data: count});
		}
		catch (error) {
			next(error);
			return;
		}
	}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.set('Content-Type', 'application/json');
      const entity = await this.service.create(req.userContext!, req.body);
      return apiUtils.apiResponse<T>(res, 201, {data: entity});
    } 
    catch (error) {
      next(error);
			return;
    }
  }

  async fullUpdateById(req: Request, res: Response, next: NextFunction) {
    try {
      res.set('Content-Type', 'application/json');
      const updateResult = await this.service.fullUpdateById(req.userContext!, req.params.id, req.body);
      return apiUtils.apiResponse<UpdateResult>(res, 200, {data: updateResult});
    } 
    catch (error) {
      next(error);
			return;
    }
  }

	async partialUpdateById(req: Request, res: Response, next: NextFunction) {
		try {
			res.set('Content-Type', 'application/json');
			const updateResult = await this.service.partialUpdateById(req.userContext!, req.params.id, req.body);
			return apiUtils.apiResponse<UpdateResult>(res, 200, {data: updateResult});
		} 
    catch (error) {
			next(error);
			return;
		}
	}

  async deleteById(req: Request, res: Response, next: NextFunction) {
    try {
      res.set('Content-Type', 'application/json');
      const deleteResult = await this.service.deleteById(req.userContext!, req.params.id);
      return apiUtils.apiResponse<DeleteResult>(res, 200, {data: deleteResult});
    } 
    catch (error) {
      next(error);
			return;
    }
  }
}
