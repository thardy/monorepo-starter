import { BasicAuthGuardService } from '@ng-common/auth/services/basic-auth-guard.service';
import { ProductListComponent } from './product-list/product-list.component';

export default [
  { path: '', component: ProductListComponent, canActivate: [BasicAuthGuardService] },
  
];
