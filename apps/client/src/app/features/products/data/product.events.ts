import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { IProduct } from '../product.model';

export const productListPageEvents = eventGroup({
  source: 'ProductList Page',
  events: {
    opened: type<void>(),
    refreshed: type<void>(),
    deleteButtonClicked: type<string>(),
  },
});

export const productEditPageEvents = eventGroup({
  source: 'ProductEdit Page',
  events: {
    opened: type<void>(),
    refreshed: type<void>(),
    createButtonClicked: type<IProduct>(),
    updateButtonClicked: type<IProduct>(),
    deleteButtonClicked: type<string>(),
  },
});

export const productsApiEvents = eventGroup({
  source: 'Products API',
  events: {
    loadProductsSuccess: type<IProduct[]>(),
    loadProductsFailure: type<string>(),
    createProductSuccess: type<IProduct>(),
    createProductFailure: type<string>(),
    updateProductSuccess: type<IProduct>(),
    updateProductFailure: type<string>(),
    deleteProductSuccess: type<string>(),
    deleteProductFailure: type<string>(),
  },
});
