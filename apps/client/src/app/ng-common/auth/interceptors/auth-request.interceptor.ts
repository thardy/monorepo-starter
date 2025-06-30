import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import {inject} from '@angular/core';
import {from as observableFromPromise} from 'rxjs';
//import {defer} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

import {AuthService} from '../services/auth.service';
import {BaseClientConfig} from '../../config/models/base-client-config.model';

export const authRequestInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(BaseClientConfig);
  if (!config.auth.interceptorEnabled) {
    return next(req);
  }

  const authService = inject(AuthService);

  let modifiedRequest = req;

  if (authService.isCallToSecureApi(req.url)) {
    return observableFromPromise(authService.getAccessToken())
    //return defer(() => authService.getAccessToken())
      .pipe(
        mergeMap((token: string) => {
          modifiedRequest = addTokenToRequest(req, token);
          return next(modifiedRequest);
        })
      );
  }

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
