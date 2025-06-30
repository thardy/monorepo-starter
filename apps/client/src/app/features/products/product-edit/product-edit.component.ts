import {finalize} from 'rxjs/operators';
import {takeUntil} from 'rxjs';
import {Component, effect, EventEmitter, inject, input, Input, Output} from '@angular/core';
import {BaseComponent} from '@common/components/base.component';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AsyncButtonDirective, AutofocusDirective} from '@common/directives';
import {ProductService} from '../product.service';
import {IProduct} from '../product.model';
import {ProductsStore} from '../data/products.store';
import { productEditPageEvents } from '../data/product.events';
import { injectDispatch } from '@ngrx/signals/events';

@Component({
  selector: 'product-edit',
  standalone: true,
  templateUrl: './product-edit.component.html',
  imports: [
    AsyncButtonDirective,
    AutofocusDirective,
    ReactiveFormsModule,
  ],
})
export class ProductEditComponent extends BaseComponent {
  productsStore = inject(ProductsStore);
  readonly dispatch = injectDispatch(productEditPageEvents);

  product = input<IProduct | null>(null);
  mode = input.required<'create' | 'update'>();
  @Output() formClosed = new EventEmitter();
  form: FormGroup;
  saving = this.productsStore.isPending;
  saveButtonClicked = false;
  
  constructor(private fb: FormBuilder) {
    super();

    const formControls = {
      name: ['', Validators.required],
      description: [''],
      price: [0, Validators.required],
      quantity: [0, Validators.required],
      someDate: [new Date(), Validators.required],
    };

    this.form = this.fb.group(formControls);

    effect(() => {
      const saving = this.saving();
      if (this.saveButtonClicked && saving === false) {
        this.formClosed.emit(); // we are done saving - close this form
      }
    });

    effect(() => {
      const product = this.product();
      if (product) {
        this.form.patchValue(product);
      } else {
        this.form.reset();
      }
      console.log('the selectedProduct changed');
    });
  }

  onCancel() {
    this.formClosed.emit();
  }

  onSave() {
    this.saveButtonClicked = true;
    const formValue = this.form.value;
    const product: IProduct = {
      ...(this.product() || {}),
      ...formValue,
    } as IProduct;

    if (this.mode() === 'create') {
      this.dispatch.createButtonClicked(product);
    } else if (this.mode() === 'update') {
      this.dispatch.updateButtonClicked(product);
    }
  }

}
