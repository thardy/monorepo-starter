import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { tap } from 'rxjs/operators';
import { injectDispatch } from '@ngrx/signals/events';

import { AuthService } from '@ng-common/auth/services/auth.service';
import { appComponentEvents, authApiEvents } from '@ng-common/auth/data/auth.events';
import { HeaderComponent } from './header/header.component';
import { AppStore } from './data/app.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private appStore = inject(AppStore); // This injection initializes the store and its effects
  private readonly dispatch = injectDispatch(appComponentEvents);
  private readonly authApiDispatch = injectDispatch(authApiEvents);
  title = 'client';
  isAuthenticated: boolean = false;

  ngOnInit(): void {
    console.log('AppComponent initialized - AppStore injected:', !!this.appStore); // AI-generated diagnostic
    this.authService.authState$
      .pipe(
        tap((authState) => {
          if (authState.isAuthenticated) {
            // todo: auth - if we want to skip the api call to getUserContext when using our custom Auth, this is where we would
            //  handle that.  We would check for the presence of authState.userContext, and we could pass it as a parameter
            //  to this action.  We would have to edit the effect to conditionally call getUserContext only if the parameter
            //  is null/undefined.  We would also need to add a reducer for userAuthenticatedWithIdentityProvider that
            //  only changed state if the parameter was not null/undefined.  That would allow the store code to remain the same
            //  for custom Auth and Okta or Auth0, but we would skip the getUserContext api call if custom Auth is being used.
            console.log('Dispatching userAuthenticatedWithIdentityProvider event'); // AI-generated diagnostic
            this.dispatch.userAuthenticatedWithIdentityProvider();
          }
          else {
            // handle unplanned logout here
            this.authApiDispatch.userLoggedOut();
          }
          this.isAuthenticated = authState.isAuthenticated;
        })
      )
      .subscribe();
  }
}
