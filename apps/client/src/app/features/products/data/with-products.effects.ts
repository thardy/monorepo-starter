import { inject } from "@angular/core";
import { signalStoreFeature } from "@ngrx/signals";
import { Events, withEffects } from "@ngrx/signals/events";
import { mapResponse } from "@ngrx/operators";
import { exhaustMap, tap } from "rxjs/operators";

import { productsApiEvents } from "./product.events";
import { ProductService } from "../product.service";
import { IProduct } from "../product.model";
import { productEditPageEvents, productListPageEvents } from "./product.events";

export function withProductsEffects() {
  return signalStoreFeature(
    withEffects(
      // todo: refactor to reusable, generic with-crud.effects.ts
      // todo: THEN implement the k8s for client
      // todo: THEN figure out how to modularize and reuse all the k8s and github actions stuff
      (
        store,
        events = inject(Events),
        productService = inject(ProductService),
      ) => ({
        loadProducts$: events
          .on(productListPageEvents.opened, productListPageEvents.refreshed)
          .pipe(
            exhaustMap(() =>
              productService.getAll().pipe(
                tap(() => console.log('Service observable created')),
                //filter((products): products is IProduct[] => !!products), // this can be used if getAll returns IProduct[] | undefined
                mapResponse({
                  next: (products: IProduct[]) => productsApiEvents.loadProductsSuccess(products),
                  error: (error: { message: string }) =>
                    productsApiEvents.loadProductsFailure(error.message),
                }),
              ),
            ),
          ),
        createProduct$: events
          .on(productEditPageEvents.createButtonClicked)
          .pipe(
            exhaustMap(({ payload }) =>
              productService.createAsPromise(payload)
                .then((product) => productsApiEvents.createProductSuccess(product))
                .catch((error) => productsApiEvents.createProductFailure(error.message))
              ),
          ),
        updateProduct$: events
          .on(productEditPageEvents.updateButtonClicked)
          .pipe(
            exhaustMap(({ payload }) =>
              productService.updateAsPromise(payload._id, payload)
                .then((product) => productsApiEvents.updateProductSuccess(product))
                .catch((error) => productsApiEvents.updateProductFailure(error.message))
              ),
          ),
        deleteProduct$: events
          .on(productEditPageEvents.deleteButtonClicked)
          .pipe(
            exhaustMap(({ payload }) =>
              productService.deleteAsPromise(payload)
                .then((deleteResult) => productsApiEvents.deleteProductSuccess("deleted")) // todo: fix this once we figure out what is coming back
                .catch((error) => productsApiEvents.deleteProductFailure(error.message))
              ),
          ),
        logError$: events
          .on(productsApiEvents.loadProductsFailure)
          .pipe(tap(({ payload }) => console.log(payload))),
      }),
    ),
  );
}