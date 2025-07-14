import { Db } from 'mongodb';
import { GenericApiService } from '@loomcore/api/services';
import { IProduct, ProductSpec } from './product.model.js';
import { IPagedResult, IUserContext, QueryOptions } from '@loomcore/common/models';

export class ProductService extends GenericApiService<IProduct> {
	constructor(db: Db) {
		super(db, 'products', 'product', ProductSpec);
	}
}
