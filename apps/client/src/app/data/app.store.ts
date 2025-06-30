import { signalStore, withState, withHooks } from "@ngrx/signals";
import { AppState } from "./app.state";
import { withAuthentication } from "@app/ng-common/data/authentication/with-authentication";

const initialAppState: AppState = {
}

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppState),
  withAuthentication(),
  withHooks({
    onInit(store) {
      console.log('appStore.onInit')
    },

    onDestroy(store) {
      console.log('appStore.onDestroy');
    },
  }),
);