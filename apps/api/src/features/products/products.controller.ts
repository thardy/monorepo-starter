import { Application, Request, Response } from 'express';
import { Product, IProduct } from './product.model.js';
import { ProductService } from './product.service.js';
import mongoose from 'mongoose';
import { IUserContext } from '../../common/models/user-context.interface.js';
import { isAuthenticated } from '#root/src/common/middleware/is-authenticated';

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class ProductsController {
  protected slug: string = 'products';
  private productService: ProductService;

  constructor(app: Application) {
    this.productService = new ProductService();
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

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      // Create a simple user context
      const userContext: IUserContext = {
        user: { id: req.user?.id || 'anonymous' }
      };
      
      const products = await this.productService.getAll(userContext);
      res.json(products);
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }

  // GET a single product by ID
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const userContext: IUserContext = {
        user: { id: req.user?.id || 'anonymous' }
      };
      
      try {
        const product = await this.productService.getById(userContext, req.params.id);
        res.json(product);
      } catch (error) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }

  // CREATE a new product
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userContext: IUserContext = {
        user: { id: req.user?.id || 'anonymous' }
      };
      
      const product = await this.productService.create(userContext, req.body);
      res.status(201).json(product);
    } catch (err: any) {
      console.error(err);
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation Error', 
          errors: err.errors 
        });
      }
      
      res.status(500).json({ message: 'Server Error' });
    }
  }

  // PATCH (partial update) a product
  async patch(req: AuthenticatedRequest, res: Response) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const userContext: IUserContext = {
        user: { id: req.user?.id || 'anonymous' }
      };
      
      try {
        const product = await this.productService.partialUpdateById(userContext, req.params.id, req.body);
        res.json(product);
      } catch (error) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }

  // UPDATE (full update) a product
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const userContext: IUserContext = {
        user: { id: req.user?.id || 'anonymous' }
      };
      
      try {
        const product = await this.productService.fullUpdateById(userContext, req.params.id, req.body);
        res.json(product);
      } catch (error) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }

  // DELETE a product
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const userContext: IUserContext = {
        user: { id: req.user?.id || 'anonymous' }
      };
      
      try {
        await this.productService.deleteById(userContext, req.params.id);
        res.status(204).end();
      } catch (error) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }

  // Custom endpoint to get products with low inventory
  async getLowInventory(req: AuthenticatedRequest, res: Response) {
    try {
      const threshold = parseInt(req.params.threshold) || 10;
      
      const userContext: IUserContext = {
        user: { id: req.user?.id || 'anonymous' }
      };
      
      const products = await this.productService.getLowInventoryProducts(userContext, threshold);
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }
}
