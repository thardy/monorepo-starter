import {inject} from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';
import {IUserContext} from '@loomcore/common/models';
import {AuthService} from '@ng-common/auth/services/auth.service';
import {withSimpleCallState} from '../../data/with-simple-call-state';
import { withAuthReducer } from './with-auth.reducer';
import { withAuthEffects } from './with-auth.effects';
import { withRequestStatus } from '../../data/with-request-status.feature';
//import {withCallState} from '../common/call-state.feature';

class AuthState {
  auth?: IUserContext;
}

const initialAuthState: AuthState = {
  auth: undefined
}

/**
 * Adds auth state to your store.
 *   State:
 *     auth: IUserContext
 *
 *   Methods:
 *     userAuthenticated(),
 *     logout(),
 *     userLoggedOut()
 *
 * @publicApi
 */
export const withAuth = () =>
  signalStoreFeature(
    withState(initialAuthState),
    withRequestStatus(),
    withAuthReducer(),
    withAuthEffects(),
    // withComputed((state) => {
    //   return {
    //     someComputedProperty: computed(() => {
    //       let somethingComputed = state.somethingOnTheState();
    //       somethingComputed = somethingComputed*2;
    //       return { somethingComputed }
    //     }),
    //   };
    // }),
    // withMethods((state) => {
    //   const authService = inject(AuthService);

    //   async function userAuthenticated() {
    //     const userContext = await authService.getUserContext();
    //     patchState(state, { auth: userContext ? { ...userContext } : undefined });
    //   }

    //   async function logout() {
    //     await authService.logout();
    //     userLoggedOut();
        
    //   }

    //   function  userLoggedOut() {
    //     patchState(state, { auth: undefined });
    //   }

    //   return { userAuthenticated, logout, userLoggedOut };
    // }),
  );




