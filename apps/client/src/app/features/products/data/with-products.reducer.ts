import { setLoading, setSaving, setDeleting, setLoaded, setIdBeingProcessed } from '@ng-common/data/with-request-status.feature';
import { addEntity, setAllEntities, updateEntity, removeEntity, EntityState } from '@ngrx/signals/entities';
import { on, withReducer } from '@ngrx/signals/events';
import { productConfig } from './products.store';
import { productEditPageEvents, productListPageEvents, productsApiEvents } from './product.events';
import { IProduct } from '../product.model';
import { setTotal, incrementPaginationTotal, decrementPaginationTotal } from '@ng-common/data/with-pagination.feature';

export function withProductsReducer() {
  return withReducer(
    // Loading operations
    on(productListPageEvents.opened, productListPageEvents.refreshed, () => setLoading(true)),
    on(productsApiEvents.loadAllProductsSuccess, ({ payload }, state) => [
      setAllEntities(payload || [], productConfig),
      setTotal(payload?.length || 0),
      setLoading(false),
      setLoaded(true),
    ]),
    on(productsApiEvents.loadProductsFailure, () => [
      setLoading(false),
      setLoaded(false),
    ]),
    
    on(productEditPageEvents.createButtonClicked, () => setSaving(true)),
    on(productEditPageEvents.updateButtonClicked, ({ payload }) => [
      setSaving(true),
      setIdBeingProcessed(payload._id)
    ]),
    on(productsApiEvents.createProductSuccess, ({ payload }, state) => [
      addEntity(payload, productConfig),
      incrementPaginationTotal(state),
      setSaving(false),
    ]),
    on(productsApiEvents.updateProductSuccess, ({ payload }) => [
      updateEntity({ id: payload._id, changes: payload }, productConfig),
      setSaving(false),
      setIdBeingProcessed(null),
    ]),
    on(productsApiEvents.createProductFailure, productsApiEvents.updateProductFailure, () => [
      setSaving(false),
      setIdBeingProcessed(null),
    ]),
    
    // Deleting operations - manually adjust pagination for local operations
    on(productEditPageEvents.deleteButtonClicked, productListPageEvents.deleteButtonClicked, ({ payload }) => [
      setDeleting(true),
      setIdBeingProcessed(payload)
    ]),
    on(productsApiEvents.deleteProductSuccess, ({ payload }, state) => [
      removeEntity(payload, productConfig),
      decrementPaginationTotal(state),
      setDeleting(false),
      setIdBeingProcessed(null),
    ]),
    on(productsApiEvents.deleteProductFailure, () => [
      setDeleting(false),
      setIdBeingProcessed(null),
    ]),
  );
}