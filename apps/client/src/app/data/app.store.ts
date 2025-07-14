import { signalStore, withState, withHooks } from "@ngrx/signals";
import { AppState } from "./app.state";
import { withAuth } from "@ng-common/auth/data/with-auth.feature";

const initialAppState: AppState = {
}

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppState),
  withAuth(),
  withHooks({
    onInit(store) {
      console.log('appStore.onInit')
    },

    onDestroy(store) {
      console.log('appStore.onDestroy');
    },
  }),
);