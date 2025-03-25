import { Db } from 'mongodb';
import { Application, Request, Response, NextFunction } from 'express';

import { ProductService } from './product.service.js';
// import mongoose from 'mongoose';
import { IUserContext } from '#common/models/user-context.interface';
import { isAuthenticated } from '#common/middleware/is-authenticated';
import { entityUtils } from '#common/utils/entity.utils';
import { BadRequestError, NotFoundError } from '#common/errors/index';
import { apiUtils } from '#common/utils/index';

// Extend Express Request type to include user property
// todo: move this to a global location (wherever I extend third party types)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class ProductsController {
  protected slug: string = 'products';
  private productService: ProductService;

  constructor(app: Application, db: Db) {
    this.productService = new ProductService(db);
    this.mapRoutes(app);
  }

  mapRoutes(app: Application) {
    app.get(`/api/${this.slug}`, this.getAll.bind(this));
    app.get(`/api/${this.slug}/:id`, this.getById.bind(this));
    app.post(`/api/${this.slug}`, this.create.bind(this));
    app.put(`/api/${this.slug}/:id`, this.update.bind(this));
    app.patch(`/api/${this.slug}/:id`, this.patch.bind(this));
    app.delete(`/api/${this.slug}/:id`, this.delete.bind(this));
    
    // Custom routes
    app.get(`/api/${this.slug}/low-inventory/:threshold`, this.getLowInventory.bind(this));
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Create a simple user context
    const userContext: IUserContext = {
      user: { id: req.user?.id || 'anonymous' }
    };
    
    const products = await this.productService.getAll(userContext);
    return apiUtils.apiResponse(res, 200, { data: products });
  }

  // GET a single product by ID
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const userContext: IUserContext = {
      user: { id: req.user?.id || 'anonymous' }
    };
    
    const product = await this.productService.getById(userContext, req.params.id);
    return apiUtils.apiResponse(res, 200, { data: product });
  }

  // CREATE a new product
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const userContext: IUserContext = {
      user: { id: req.user?.id || 'anonymous' }
    };
    
    const product = await this.productService.create(userContext, req.body);
    return apiUtils.apiResponse(res, 201, { data: product });
  }

  // PATCH (partial update) a product
  async patch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const userContext: IUserContext = {
      user: { id: req.user?.id || 'anonymous' }
    };
    
    const product = await this.productService.partialUpdateById(userContext, req.params.id, req.body);
    return apiUtils.apiResponse(res, 200, { data: product });
  }

  // UPDATE (full update) a product
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const userContext: IUserContext = {
      user: { id: req.user?.id || 'anonymous' }
    };
    
    const product = await this.productService.fullUpdateById(userContext, req.params.id, req.body);
    return apiUtils.apiResponse(res, 200, { data: product });
  }

  // DELETE a product
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const userContext: IUserContext = {
      user: { id: req.user?.id || 'anonymous' }
    };
    
    await this.productService.deleteById(userContext, req.params.id);
    return apiUtils.apiResponse(res, 204, {});
  }

  // Custom endpoint to get products with low inventory
  async getLowInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const threshold = parseInt(req.params.threshold) || 10;
    
    const userContext: IUserContext = {
      user: { id: req.user?.id || 'anonymous' }
    };
    
    const products = await this.productService.getLowInventoryProducts(userContext, threshold);
    return apiUtils.apiResponse(res, 200, { data: products });
  }
}
