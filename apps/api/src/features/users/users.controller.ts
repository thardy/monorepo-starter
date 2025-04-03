import {Db} from 'mongodb';
import {Application, NextFunction, Request, Response} from 'express';

import {IUser, UserSpec, PublicUserSchema} from '#common/models/index';
import {ApiController} from '#common/controllers/index';
import {isAuthenticated} from '#common/middleware/index';
import {UserService} from './user.service.js';
import {apiUtils} from '#common/utils/index';


export class UsersController extends ApiController<IUser> {
  private userService: UserService;

  constructor(app: Application, db: Db) {
    const userService = new UserService(db);
    super('users', app, userService, 'user', UserSpec);

    this.userService = userService;
  }

  override mapRoutes(app: Application) {
    //super.mapRoutes(app); // map the base ApiController routes

	  // overriding the base routes to remove PUT - can't full update a user
	  app.get(`/api/${this.slug}`, isAuthenticated, this.get.bind(this));
	  app.get(`/api/${this.slug}/all`, isAuthenticated, this.getAll.bind(this));
	  app.get(`/api/${this.slug}/find`, isAuthenticated, this.get.bind(this));
	  app.get(`/api/${this.slug}/count`, isAuthenticated, this.getCount.bind(this));
	  app.get(`/api/${this.slug}/:id`, isAuthenticated, this.getById.bind(this));
	  app.post(`/api/${this.slug}`, isAuthenticated, this.create.bind(this));
	  app.patch(`/api/${this.slug}/:id`, isAuthenticated, this.partialUpdateById.bind(this));
	  app.delete(`/api/${this.slug}/:id`, isAuthenticated, this.deleteById.bind(this));
  }
  
  // Override API methods to use PublicUserSchema 
  override async getAll(req: Request, res: Response, next: NextFunction) {
    res.set('Content-Type', 'application/json');
    const entities = await this.service.getAll(req.userContext!);
    return apiUtils.apiResponse<IUser[]>(res, 200, {data: entities}, this.modelSpec, PublicUserSchema);
  }

  override async get(req: Request, res: Response, next: NextFunction) {
    res.set('Content-Type', 'application/json');
    const queryOptions = apiUtils.getQueryOptionsFromRequest(req);
    const pagedResult = await this.service.get(req.userContext!, queryOptions);
    return apiUtils.apiResponse(res, 200, {data: pagedResult}, this.modelSpec, PublicUserSchema);
  }

  override async getById(req: Request, res: Response, next: NextFunction) {
    let id = req.params?.id;
    res.set('Content-Type', 'application/json');
    const entity = await this.service.getById(req.userContext!, id);
    return apiUtils.apiResponse<IUser>(res, 200, {data: entity}, this.modelSpec, PublicUserSchema);
  }

  override async create(req: Request, res: Response, next: NextFunction) {
    res.set('Content-Type', 'application/json');
    const entity = await this.service.create(req.userContext!, req.body);
    return apiUtils.apiResponse<IUser>(res, 201, {data: entity || undefined}, this.modelSpec, PublicUserSchema);
  }

  override async partialUpdateById(req: Request, res: Response, next: NextFunction) {
    res.set('Content-Type', 'application/json');
    const updateResult = await this.service.partialUpdateById(req.userContext!, req.params.id, req.body);
    return apiUtils.apiResponse<IUser>(res, 200, {data: updateResult}, this.modelSpec, PublicUserSchema);
  }
}
