import { setError, setFulfilled, setPending } from '@app/ng-common/data/common/with-request-status';
import { addEntity, setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { on, withReducer } from '@ngrx/signals/events';
import { productConfig } from './products.store';
import { productEditPageEvents, productListPageEvents, productsApiEvents } from './product.events';
import { IPagedResult } from '@loomcore/common/models';

export function withProductsReducer() {
  return withReducer(
    on(productListPageEvents.opened, productListPageEvents.refreshed, setPending),
    on(productsApiEvents.loadProductsSuccess, ({ payload }) => [
      setAllEntities(payload.entities || [], productConfig),
      setFulfilled(),
      // Update pagination metadata
      {
        pagination: {
          total: payload.total || 0,
          page: payload.page || 1,
          pageSize: payload.pageSize || 100,
          totalPages: payload.totalPages || 0,
        }
      }
    ]),
    on(productsApiEvents.loadProductsFailure, ({ payload }) => setError(payload)),
    // Add missing handlers for create/update operations
    on(productEditPageEvents.createButtonClicked, productEditPageEvents.updateButtonClicked, setPending),
    on(productsApiEvents.createProductSuccess, ({ payload }) => [
      addEntity(payload, productConfig),
      setFulfilled(),
    ]),
    on(productsApiEvents.updateProductSuccess, ({ payload }) => [
      updateEntity({ id: payload._id, changes: payload }, productConfig),
      setFulfilled(),
    ]),
    on(productsApiEvents.createProductFailure, productsApiEvents.updateProductFailure, ({ payload }) => setError(payload)),
  );
}