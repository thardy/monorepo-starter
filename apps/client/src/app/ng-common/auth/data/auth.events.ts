import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { IUserContext } from '@loomcore/common/models';

export const appComponentEvents = eventGroup({
  source: 'AppComponent',
  events: {
    userAuthenticatedWithIdentityProvider: type<void>(),
    userLoggedOut: type<void>(),
  },
});

export const headerComponentEvents = eventGroup({
  source: 'Header',
  events: {
    logoutButtonClicked: type<void>(),
  },
});

// Login page events are not handled through NgRx to keep the entire login/logout flow
//  framework-agnostic. The goal is to have login/logout work in Angular or React at some point soon.
//  The moment NgRx finds out about state changes is through a userAuthenticatedWithIdentityProvider 
//  event or a userLoggedOut event.

export const authApiEvents = eventGroup({
  source: 'Auth API',
  events: {
    userLoggedIn: type<IUserContext | null>(),
    userLoggedOut: type<void>(),
    getUserContextFailed: type<Error>(),
    logoutFailed: type<Error>(),
  },
});
