import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { withNoXsrfProtection, withInterceptors } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { forRoot, provideConfig } from '@ng-common/config/provider';
import { AppSettings } from '@common/models/app-settings.model';
import { provideAuth } from '@ng-common/auth/provider';
import { provideProducts } from '@features/products/provider';
import { provideIndexedDb } from '@ng-common/indexed-db/provider';
import { delayInterceptor } from '@app/common/interceptors/delay.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(
      withNoXsrfProtection(),
      withInterceptors([delayInterceptor]) // todo: comment this out to get rid of our two second delay on all api calls
    ),
    provideConfig(forRoot('/config/config.json', AppSettings)),
    provideAuth(),
    provideIndexedDb(),
    provideProducts('products'),
  ]
};
