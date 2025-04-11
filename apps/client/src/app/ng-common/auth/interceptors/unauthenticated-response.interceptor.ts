import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';

import {BaseClientConfig} from '@app/ng-common/config/models/base-client-config.interface';
import {AuthService} from '../services/auth.service';
import {catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

export const unauthenticatedResponseInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('in unauthenticatedResponseInterceptor'); // todo: delete me
  const config = inject(BaseClientConfig);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('in catchError of unauthenticatedResponseInterceptor'); // todo: delete me
      if (error.status === 401) {
        console.log(`Unauthenticated request made to a secure api without a valid token... logging out.`);
        authService.clearClientsideAuth();
        authService.navigateToLogin();
        // You might want to return an error or throw an error to be caught by the calling code
        return throwError(() => new Error('Unauthenticated. Please log in.'));
      }
      else if (error.status === 403) {
        console.log(`Unauthorized request made to a secure api.`);
      }
      console.log('returning error in unauthenticatedResponseInterceptor'); // todo: delete me
      // For other errors, throw it so it can be handled by error handling mechanisms
      return throwError(() => error);
    })
  );
};

