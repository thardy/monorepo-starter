import { inject } from "@angular/core";
import { signalStoreFeature } from "@ngrx/signals";
import { Events, withEffects } from "@ngrx/signals/events";
import { mapResponse } from "@ngrx/operators";
import { exhaustMap, switchMap, tap } from "rxjs/operators";

import { appComponentEvents, authApiEvents, headerComponentEvents } from "./auth.events";
import { AuthService } from "../services/auth.service";
import { IUserContext } from "@loomcore/common/models";

export function withAuthEffects() {
  return signalStoreFeature(
    withEffects(
      (
        store,
        events = inject(Events),
        authService = inject(AuthService),
      ) => ({
        getUserContextOnAuthentication$: events
          .on(appComponentEvents.userAuthenticatedWithIdentityProvider)
          .pipe(
            exhaustMap(async () => {
              // todo: figure out why a breakpoint here is not firing, even when we watch line 31 of app.component.ts executing "appComponentEvents.userAuthenticatedWithIdentityProvider();"
              console.log("getUserContextOnAuthentication$ fired!!!"); // AI-generated diagnostic
              return authService.getUserContext()
                .then((userContext) => authApiEvents.userLoggedIn(userContext))
                .catch((error) => authApiEvents.getUserContextFailed(error))
            }),
          ),
        logoutUser$: events
          .on(headerComponentEvents.logoutButtonClicked)
          .pipe(
            switchMap(async ({ payload }) => {
              return authService.logout()
                .then(() => authApiEvents.userLoggedOut())
                .catch((error) => authApiEvents.logoutFailed(error))
            }),
          ),
        logError$: events
          .on(authApiEvents.getUserContextFailed, authApiEvents.logoutFailed)
          .pipe(
            tap(({ payload }) => console.error(payload)),
          ),
      }),
    ),
  );
}