import {inject} from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';
import {IUser} from '@loomcore/common/models';
import {AuthService} from '@ng-common/auth/services/auth.service';
import {withSimpleCallState} from '../common/with-simple-call-state';
//import {withCallState} from '../common/call-state.feature';

class AuthState {
  user: IUser | undefined;
}

const initialAuthState: AuthState = {
  user: undefined
}

/**
 * Adds auth state to your store.
 *   State:
 *     user: User
 *
 *   Methods:
 *     userAuthenticated(),
 *     logout(),
 *     userLoggedOut()
 *
 * @publicApi
 */
export const withAuthentication = () =>
  signalStoreFeature(
    withState(initialAuthState),
    withSimpleCallState(),
    // withCallState({
    //   entityName: 'user'
    // }),

    // withComputed((state) => {
    //   return {
    //     someComputedProperty: computed(() => {
    //       let somethingComputed = state.somethingOnTheState();
    //       somethingComputed = somethingComputed*2;
    //       return { somethingComputed }
    //     }),
    //   };
    // }),
    withMethods((state) => {
      const authService = inject(AuthService);

      async function userAuthenticated() {
        const userContext = await authService.getUserContext();
        const user = userContext?.user;
        patchState(state, { user: user ? { ...user } : undefined });
      }

      async function logout() {
        await authService.logout();
        userLoggedOut();

        // authService.logout()
        //   .pipe(
        //     tap((user) => {
        //       userLoggedOut();
        //     }),
        //     catchError((error) => {
        //       return handleAppStoreError(error);
        //     })
        //   );
      }

      function  userLoggedOut() {
        patchState(state, { user: undefined });
      }

      return { userAuthenticated, logout, userLoggedOut };
    }),
  );




