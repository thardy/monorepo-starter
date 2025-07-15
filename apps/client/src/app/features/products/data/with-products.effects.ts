import { inject, InjectionToken } from "@angular/core";
import { signalStoreFeature } from "@ngrx/signals";
import { withCrudEffects } from "@ng-common/data/with-crud-effects.feature";
import { productEvents } from "./product.events";
import { ProductService } from "../product.service";
import { IProduct } from "../product.model";

// Create injection token for the ProductService
const PRODUCT_SERVICE = new InjectionToken<ProductService>('ProductService', {
  providedIn: 'root',
  factory: () => inject(ProductService),
});

export function withProductsEffects() {
  return signalStoreFeature(
    withCrudEffects<IProduct>({
      events: productEvents,
      serviceToken: PRODUCT_SERVICE,
      enableErrorLogging: true,
    }),
    // Additional product-specific effects can be added here alongside the generic CRUD effects
  );
}