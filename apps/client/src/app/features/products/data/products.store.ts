import { signalStore, type } from '@ngrx/signals';
import { entityConfig, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

import { withRequestStatus } from '@ng-common/data/with-request-status.feature';
import { withPagination } from '@ng-common/data/with-pagination.feature';
import { IProduct } from '../product.model';
import { withProductsEffects } from './with-products.effects';
import { withProductsReducer } from './with-products.reducer';
import { IPagedResult } from '@loomcore/common/models';

export const productConfig = entityConfig({
  entity: type<IProduct>(),
  collection: 'product', // changes store properties from ids, entityMap, and entities to productIds, productEntityMap, and productEntities.
  selectId: (product) => product._id,
});

// todo: consider altering the crud refactoring the ai comes up with. I think I want to boilerplate the files for easy extension or composition.
//  i.e. have a with-products.effects.ts that just starts with withCrudEffects in it, but allows for easy addition of other effects.
export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withEntities(productConfig),
  withRequestStatus(),
  withPagination(3),
  withProductsReducer(),
  withProductsEffects(),
  withDevtools('ProductsStore')
);