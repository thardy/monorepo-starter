
import { on, withReducer } from '@ngrx/signals/events';
import { authApiEvents } from './auth.events';

export function withAuthReducer() {
  return withReducer(
    on(authApiEvents.userLoggedIn, ({payload}) => ({ auth: payload ? { ...payload } : undefined })),
    on(authApiEvents.userLoggedOut, () => ({ auth: undefined })),
  );
}
