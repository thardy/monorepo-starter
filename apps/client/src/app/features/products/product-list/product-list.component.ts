import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Observable, Subject, takeUntil} from 'rxjs';
import {finalize, tap} from 'rxjs/operators';

import {BaseComponent} from '@common/components/base.component';
import {ProductsStore} from '@features/products/data/products.store';
//import {AppStore} from '@app/store/app.store';
import {ProductEditComponent} from '@features/products/product-edit/product-edit.component';
import {AsyncButtonDirective} from '@common/directives';
import {IProduct} from '@features/products/product.model';
import {EntityId} from '@ngrx/signals/entities';
import { productListPageEvents } from '../data/product.events';
import { injectDispatch } from '@ngrx/signals/events';

@Component({
  standalone: true,
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  imports: [RouterModule, AsyncButtonDirective, ProductEditComponent],
  providers: [ProductsStore]
})
export class ProductListComponent extends BaseComponent {
  private productsStore = inject(ProductsStore);
  readonly dispatch = injectDispatch(productListPageEvents);
  
  // private appStore = inject(AppStore);
  // user = this.appStore.user;
  products = this.productsStore.productEntities;
  loaded = this.productsStore.isFulfilled;
  loading = this.productsStore.isPending;
  // itemDeleting = this.productStore.itemDeleting;
  // itemDeleted = this.productStore.itemDeleted;
  // deleting = this.productsStore.deleting;

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
      const products = this.products() as IProduct[];
      //this.initUxProperties(products);
      console.log(`products changed and we now have ${products.length} total products!!!`);
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

  // ngOnInit() {
  //   // this page currently refreshes the products every time this component is opened. You can handle that however you like - you could
  //   //  check what is currently in the store first and maybe have a refresh button on the page to force a reload.
  //   this.productsStore.loadAll();
  // }

  onEdit(product: IProduct) {
    this.selectedProduct = product;
    this.editing = true;
  }

  onAdd() {
    this.adding = true;
  }

  onDelete(product: IProduct) {
    // don't allow any other deletions if we are currently deleting something
    // if (this.deleting) {
    //   return;
    // }
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
