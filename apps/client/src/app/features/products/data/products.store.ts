import { signalStore, type } from '@ngrx/signals';
import { entityConfig, setAllEntities, withEntities } from '@ngrx/signals/entities';

import { withRequestStatus } from '@app/ng-common/data/common/with-request-status';
import { IProduct } from '../product.model';
import { withProductsEffects } from './with-products.effects';
import { withProductsReducer } from './with-products.reducer';

export const productConfig = entityConfig({
  entity: type<IProduct>(),
  collection: 'product', // changes store properties from ids, entityMap, and entities to productIds, productEntityMap, and productEntities.
  selectId: (product) => product._id,
});

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withEntities(productConfig),
  withRequestStatus(),
  withProductsReducer(),
  withProductsEffects(),
);