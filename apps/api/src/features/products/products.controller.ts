import {Application, Request, Response} from 'express';

//import {ApiController} from '#common/controllers/api.controller';
import {ProductService} from './product.service.js';
import {IProduct, Product} from './product.model.js';

export class ProductsController {
	//productService: ProductService;

	constructor(app: Application) {
		//const productService = new ProductService();
		//this.productService = productService;
    this.mapRoutes(app);
	}

	mapRoutes(app: Application) {
    console.log('mapping products routes');
    //app.get(`/api/${this.slug}`, isAuthenticated, this.get.bind(this));
		app.get('/api/products', this.getAllProducts.bind(this));
	}

  async getAllProducts(req: Request, res: Response) {
    try {
        const products: IProduct[] = await Product.find({}); // Type assertion and optional chaining
        res.json(products);
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
}
}
