import { Db } from 'mongodb';
import { GenericApiService } from '../../common/services/generic-api.service.js';
import { IProduct, ProductSpec } from './product.model.js';

export class ProductService extends GenericApiService<IProduct> {
	constructor(db: Db) {
		super(db, 'products', 'product', ProductSpec);
	}
}
