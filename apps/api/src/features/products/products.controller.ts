import { Db } from 'mongodb';
import { Application, Request, Response, NextFunction } from 'express';

import { ProductService } from './product.service.js';
import { isAuthenticated } from '@loomcore/api/middleware';
import { apiUtils } from '@loomcore/api/utils';
import { ApiController } from '@loomcore/api/controllers';
import { IProduct } from './product.model.js';
import { ProductSpec } from './product.model.js';

export class ProductsController extends ApiController<IProduct> {
  private productService: ProductService;

  constructor(app: Application, db: Db) {
    const productService = new ProductService(db);
    // Pass the modelSpec to the parent controller
    super('products', app, productService, 'product', ProductSpec);
    this.productService = productService;
    
    // Add custom routes
    //this.mapCustomRoutes(app);
  }

}
