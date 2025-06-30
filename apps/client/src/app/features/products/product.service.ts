import {GenericApiService} from '@common/services/generic-api.service';
import {IProduct} from './product.model';
import {inject, Injectable} from '@angular/core';
import {HttpService} from '@common/services/http.service';
import {AppSettings} from '@common/models/app-settings.model';

@Injectable({ providedIn: 'root' })
export class ProductService extends GenericApiService<IProduct>{
  constructor() {
    super('products');
  }

  // override createModel(data: any): IProduct {
  //   return data as IProduct;
  // }
  
}
