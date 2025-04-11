import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import {inject} from '@angular/core';
import {from as observableFromPromise} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

import {AuthService} from '../services/auth.service';
import {BaseClientConfig} from '@app/ng-common/config/models/base-client-config.interface';

export const authRequestInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('in authRequestInterceptor'); // todo: delete me
  const config = inject(BaseClientConfig);
  if (!config.auth.interceptorEnabled) {
    return next(req);
  }

  const authService = inject(AuthService);

  let modifiedRequest = req;

  if (authService.isCallToSecureApi(req.url)) {
    return observableFromPromise(authService.getAccessToken())
      .pipe(
        mergeMap((token: string) => {
          modifiedRequest = addTokenToRequest(req, token);
          return next(modifiedRequest);
        })
      );
  }

  console.log('calling next with modifiedRequest'); // todo: delete me
  return next(modifiedRequest);
}

function addTokenToRequest(request: HttpRequest<any>, token: string | undefined) {
  // add access token to header
  request = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    }
  });
  return request;
}
