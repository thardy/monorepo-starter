import { signalStoreFeature } from "@ngrx/signals";
import { withCrudReducer } from "@ng-common/data/with-crud-reducer.feature";
import { productConfig } from './products.store';
import { productEvents } from './product.events';
import { IProduct } from '../product.model';

export function withProductsReducer() {
  return signalStoreFeature(
    withCrudReducer<IProduct>({
      events: productEvents,
      entityConfig: productConfig,
      selectId: (product) => product._id,
    }),
    // Additional product-specific reducers can be added here alongside the generic CRUD reducers
  );
}