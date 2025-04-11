import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { withNoXsrfProtection } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { forRoot, provideConfig } from '@ng-common/config/provider';
import { AppSettings } from './common/models/app-settings.model';
import { provideAuth } from './ng-common/auth/provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withNoXsrfProtection()),
    provideConfig(forRoot(AppSettings)),
    provideAuth(),
  ]
};
