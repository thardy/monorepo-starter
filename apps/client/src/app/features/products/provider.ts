import {Provider} from '@angular/core';
import productsRoutes from './products.routes';
import {Route, ROUTES} from '@angular/router';
import { BasicAuthGuardService } from '@app/ng-common/auth/services/basic-auth-guard.service';

export function provideProducts(baseRoute: string): Provider[] {
  const routes: Route[] = [
    {
      path: baseRoute,
      children: productsRoutes,
      canActivate: [BasicAuthGuardService]
    },
  ];

  return [
    {
      provide: ROUTES,
      useValue: routes,
      multi: true,
    },
  ];
}
