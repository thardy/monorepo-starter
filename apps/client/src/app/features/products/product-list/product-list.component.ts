import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Observable, Subject, takeUntil} from 'rxjs';
import {finalize, tap} from 'rxjs/operators';

import {BaseComponent} from '@common/components/base.component';
import {ProductsStore} from '@features/products/data/products.store';
//import {AppStore} from '@app/store/app.store';
import {ProductEditComponent} from '@features/products/product-edit/product-edit.component';
import {IProduct} from '@features/products/product.model';
import {EntityId} from '@ngrx/signals/entities';
import { productListPageEvents } from '../data/product.events';
import { injectDispatch } from '@ngrx/signals/events';

@Component({
  standalone: true,
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  imports: [RouterModule, ProductEditComponent],
  providers: [ProductsStore]
})
export class ProductListComponent extends BaseComponent {
  private productsStore = inject(ProductsStore);
  readonly dispatch = injectDispatch(productListPageEvents);
  
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
    //   this.deleting = true;
    //   this.memberUx.set(this.itemDeleting(), { deleting: true }); // itemDeleting is the id of the item that is currently being deleted
    //   // todo: implement and test the above. If it works and I like it, consider using the same mechanism for saving in the edit component.
    // });
    //
    // effect(() => {
    //   this.deleting = false;
    //   this.memberUx.set(this.itemDeleted(), { deleting: false }); // itemDeleting is the id of the item that was just deleted
    // });

    effect(() => {
      const pagination = this.pagination();
      console.log(`Pagination - Total: ${pagination.total}, Page: ${pagination.page}, Page Size: ${pagination.pageSize}`); // AI-generated diagnostic
    });

    effect(() => {
      const products = this.products() as IProduct[];
      console.log(`products changed and we now have ${products.length} products in current page (total: ${this.pagination().total})!!!`); // AI-generated diagnostic
    });

    effect(() => {
      const loaded = this.loaded();
      console.log(`loaded = ${loaded}`);
    });

    // effect(() => {
    //   const currentUser = this.user();
    //   console.log(currentUser);
    // });

    this.dispatch.opened();
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
