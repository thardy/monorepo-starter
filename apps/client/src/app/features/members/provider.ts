import { Provider } from '@angular/core';
import membersRoutes from './members.routes';
import { Route, ROUTES } from '@angular/router';
import { BasicAuthGuardService } from '@ng-common/auth/services/basic-auth-guard.service';

export function provideMembers(baseRoute: string): Provider[] {
  const routes: Route[] = [
    {
      path: baseRoute,
      children: membersRoutes,
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