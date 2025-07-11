import { signalStore, type, withState, withComputed } from '@ngrx/signals';
import { entityConfig, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { computed } from '@angular/core';

import { withRequestStatus } from '@app/ng-common/data/common/with-request-status';
import { IProduct } from '../product.model';
import { withProductsEffects } from './with-products.effects';
import { withProductsReducer } from './with-products.reducer';
import { IPagedResult } from '@loomcore/common/models';

export const productConfig = entityConfig({
  entity: type<IProduct>(),
  collection: 'product', // changes store properties from ids, entityMap, and entities to productIds, productEntityMap, and productEntities.
  selectId: (product) => product._id,
});

// Define pagination state
export interface ProductPaginationState {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const initialPaginationState: ProductPaginationState = {
  total: 0,
  page: 1,
  pageSize: 100,
  totalPages: 0,
};

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withEntities(productConfig),
  withRequestStatus(),
  withState({ pagination: initialPaginationState }),
  withComputed(({ pagination }) => ({
    // Pagination computed properties
    currentPage: computed(() => pagination().page),
    totalItems: computed(() => pagination().total),
    itemsPerPage: computed(() => pagination().pageSize),
    totalPages: computed(() => pagination().totalPages),
    hasNextPage: computed(() => pagination().page < pagination().totalPages),
    hasPreviousPage: computed(() => pagination().page > 1),
  })),
  withProductsReducer(),
  withProductsEffects(),
);