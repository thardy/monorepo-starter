import {finalize} from 'rxjs/operators';
import {takeUntil} from 'rxjs';
import {Component, computed, effect, EventEmitter, inject, input, Input, Output} from '@angular/core';
import {BaseComponent} from '@common/components/base.component';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AsyncButtonDirective, AutofocusDirective} from '@common/directives';
import {ProductService} from '../product.service';
import {IProduct} from '../product.model';
import {ProductsStore} from '../data/products.store';
import { editPageEvents } from '../data/product.events';
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
  readonly dispatch = injectDispatch(editPageEvents);

  product = input<IProduct | null>(null);
  mode = input.required<'create' | 'update'>();
  @Output() formClosed = new EventEmitter();
  form: FormGroup;
  saving = this.productsStore.saving;
  
  private previousSaving = false;
  
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

    // Simple form closing - when saving goes from true to false, close the form
    effect(() => {
      const currentSaving = this.saving();
      console.log(`previousSaving = ${this.previousSaving} currentSaving = ${currentSaving}`); // todo: delete me
      
      if (this.previousSaving && !currentSaving) {
        console.log('about to emitformClosed'); // todo: delete me
        // Saving just completed
        this.formClosed.emit();
      }
      
      this.previousSaving = currentSaving;
    });

    effect(() => {
      const product = this.product();
      if (product) {
        this.form.patchValue(product);
      } else {
        this.form.reset();
      }
    });
  }

  onCancel() {
    this.formClosed.emit();
  }

  onSave() {
    const formValue = this.form.value;
    const product: IProduct = {
      ...(this.product() || {}),
      ...formValue,
      price: Number(formValue.price),
      quantity: Number(formValue.quantity),
      someDate: formValue.someDate ? new Date(formValue.someDate).toISOString() : null,
    } as IProduct;

    if (this.mode() === 'create') {
      this.dispatch.createButtonClicked(product);
    } else if (this.mode() === 'update') {
      this.dispatch.updateButtonClicked(product);
    }
  }
}
