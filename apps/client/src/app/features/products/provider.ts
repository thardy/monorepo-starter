import {Provider} from '@angular/core';
import productsRoutes from './products.routes';
import {Route, ROUTES} from '@angular/router';

export function provideProducts(baseRoute: string): Provider[] {
  const routes: Route[] = [
    {
      path: baseRoute,
      children: productsRoutes,
      //canActivate: [AuthGuard]
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
