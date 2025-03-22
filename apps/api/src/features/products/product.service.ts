import { GenericApiService } from '../../common/services/generic-api.service.js';
import { Product, IProduct, IProductDoc } from './product.model.js';
import { IUserContext } from '../../common/models/user-context.interface.js';
import { Document } from 'mongoose';
import { IEntity } from '../../common/models/entity.interface.js';

// Define a type that ensures id property is required to satisfy IEntity constraint
// type ProductDocument = IProduct & Document & IEntity;

/**
 * Service for handling product operations
 */
export class ProductService extends GenericApiService<IProductDoc> {
	constructor() {
		// Pass the Mongoose model and resource names to the generic service
		super(Product as any, 'products', 'product');
	}

	/**
	 * Override transformSingle to ensure id property is set properly
	 */
	override transformSingle(single: any): IProductDoc {
		const transformed = super.transformSingle(single);
		
		// Ensure the id property is set (required by IEntity)
		if (transformed._id && !transformed.id) {
			transformed.id = transformed._id.toString();
		}
		
		return transformed as IProductDoc;
	}

	/**
	 * Override hook method to add additional logic before creating a product
	 */
	override async onBeforeCreate(userContext: IUserContext | undefined, doc: any) {
		// First call the parent implementation to handle standard behavior
		await super.onBeforeCreate(userContext, doc);
		
		// Add any product-specific logic
		// For example, set default values or validate product-specific rules
		if (!doc.quantity || doc.quantity < 0) {
			doc.quantity = 0;
		}
		
		return doc;
	}
}
