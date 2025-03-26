import { Db } from 'mongodb';
import { GenericApiService } from '../../common/services/generic-api.service.js';
import { IProduct, ProductSpec } from './product.model.js';
import { IUserContext } from '../../common/models/user-context.interface.js';
import { BadRequestError } from '../../common/errors/index.js';

export class ProductService extends GenericApiService<IProduct> {
	constructor(db: Db) {
		super(db, 'products', 'product', ProductSpec);
	}

	// Implementation of the getLowInventoryProducts method - just a silly example
	async getLowInventoryProducts(userContext: IUserContext, threshold: number): Promise<IProduct[]> {
		// Basic validation for threshold
		if (typeof threshold !== 'number' || threshold < 0) {
			throw new BadRequestError('Threshold must be a positive number');
		}
		
		const query = this.prepareQuery(userContext, { quantity: { $lt: threshold } });
		return this.find(userContext, query);
	}
}
