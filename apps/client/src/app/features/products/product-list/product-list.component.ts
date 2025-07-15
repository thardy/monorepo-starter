import {Component, computed, effect, inject, OnDestroy, OnInit, Signal} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Observable, Subject, takeUntil} from 'rxjs';
import {finalize, tap} from 'rxjs/operators';

import {BaseComponent} from '@common/components/base.component';
import {ProductsStore} from '@features/products/data/products.store';
//import {AppStore} from '@app/store/app.store';
import {ProductEditComponent} from '@features/products/product-edit/product-edit.component';
import {IProduct} from '@features/products/product.model';
import {EntityId} from '@ngrx/signals/entities';
import { listPageEvents } from '../data/product.events';
import { injectDispatch } from '@ngrx/signals/events';
import { AsyncButtonDirective } from '@common/directives/async-button.directive';

@Component({
  standalone: true,
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  imports: [RouterModule, ProductEditComponent, AsyncButtonDirective],
  providers: [ProductsStore]
})
export class ProductListComponent extends BaseComponent {
  private productsStore = inject(ProductsStore);
  readonly dispatch = injectDispatch(listPageEvents);
  
  // private appStore = inject(AppStore);
  // user = this.appStore.user;
  products = this.productsStore.productEntities;
  loaded = this.productsStore.loaded;
  loading = this.productsStore.loading;
  
  // Use regular pagination that trusts database total
  pagination = this.productsStore.pagination;

  productUx = new Map<EntityId, { deleting: boolean }>();
  editing = false;
  adding = false;
  //deleting = false;
  selectedProduct: IProduct | null = null;

  constructor() {
    super();

    // effect(() => {
    //   const currentUser = this.user();
    //   console.log(currentUser);
    // });

    this.dispatch.opened();
  }

  isProductDeleting(productId: string): Signal<boolean> {
    return computed(() => {
      return productId === this.productsStore.idBeingProcessed() && this.productsStore.deleting();
    });
  }

  onEdit(product: IProduct) {
    this.selectedProduct = product;
    this.editing = true;
    this.adding = false;
  }

  onAdd() {
    this.selectedProduct = null;
    this.adding = true;
    this.editing = false;
  }

  onDelete(product: IProduct) {
    this.dispatch.deleteButtonClicked(product._id);
  }

  onFormClosed() {
    this.selectedProduct = null;
    this.editing = false;
    this.adding = false;
  }

  initUxProperties(products: IProduct[]) {
    // add a ux properties object for each product
    if (products && products.length > 0) {
      products.forEach((product) => {
        this.productUx.set(product._id, {deleting: false});
      });
    }
  }
}
