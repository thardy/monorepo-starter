import { HttpInterceptorFn } from '@angular/common/http';
import { delay } from 'rxjs/operators';

export const delayInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    delay(2000) // Add 2-second delay for testing loading spinners
  );
}; 