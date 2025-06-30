import { setError, setFulfilled, setPending } from '@app/ng-common/data/common/with-request-status';
import { setAllEntities } from '@ngrx/signals/entities';
import { on, withReducer } from '@ngrx/signals/events';
import { productConfig } from './products.store';
import { productListPageEvents, productsApiEvents } from './product.events';

export function withProductsReducer() {
  return withReducer(
    on(productListPageEvents.opened, productListPageEvents.refreshed, setPending),
    on(productsApiEvents.loadProductsSuccess, ({ payload }) => [
      setAllEntities(payload, productConfig),
      setFulfilled(),
    ]),
    on(productsApiEvents.loadProductsFailure, ({ payload }) => setError(payload)),
  );
}