import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from './auth.service';

@Injectable({providedIn: 'root'})
export class BasicAuthGuardService implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  constructor() {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let allow = false;
    // const requiredFeature = route.data ? route.data.feature : null;
    let promise = Promise.resolve(allow);

    if (!this.authService.isAuthenticated()) {
      /**
       * check for logged-in user.  If we already have a token, don't make the user log in again
       */
      promise = this.authService.autoAuthenticateIfPossible()
        .then(() => {
          /**
           * if we weren't logged in before, we might be now (refresh token could have been used)
           */
          if (this.authService.isAuthenticated()) {
            console.log('allow');
            //allow = requiredFeature ? this.authService.isUserAuthorizedForFeature(requiredFeature) : true;
            allow = true;
            // if (!allow) {
            //     this.displayUnauthorizedPopup(requiredFeature);
            // }
          }
          else {
            /**
             * the user is not even logged in - send them to the login page.  this isn't the same as simply not
             * having access to a specific feature.
             */
            console.log('User not logged in...routing to login');
            this.authService.navigateToLogin();
            allow = false;
          }

          return allow;
        })
    }
    else {
      // allow = requiredFeature ? this.authService.isUserAuthorizedForFeature(requiredFeature) : true;
      // if (!allow) {
      //     this.displayUnauthorizedPopup(requiredFeature);
      // }
      allow = true;
      promise = Promise.resolve(allow);
    }

    return promise;
  }
}
