import { inject, InjectionToken } from "@angular/core";
import { signalStoreFeature } from "@ngrx/signals";
import { Events, withEffects } from "@ngrx/signals/events";
import { exhaustMap, tap } from "rxjs/operators";
import { GenericApiService } from "@common/services/generic-api.service";

export interface CrudEffectsConfig<T> {
  events: {
    listPageEvents: any;
    editPageEvents: any; 
    apiEvents: any;
  };
  serviceToken: InjectionToken<GenericApiService<T>>;
  enableErrorLogging?: boolean;
}

export function withCrudEffects<T>(config: CrudEffectsConfig<T>) {
  return signalStoreFeature(
    withEffects(
      (
        store,
        events = inject(Events),
        service = inject(config.serviceToken),
      ) => {
        const effects: any = {
          loadEntities$: events
            .on(config.events.listPageEvents.opened, config.events.listPageEvents.refreshed)
            .pipe(
              exhaustMap(() =>
                service.getAllAsPromise()
                  .then((entities) => config.events.apiEvents.loadAllSuccess(entities))
                  .catch((error) => config.events.apiEvents.loadAllFailure(error.message))
              ),
            ),
          createEntity$: events
            .on(config.events.editPageEvents.createButtonClicked)
            .pipe(
              exhaustMap(({ payload }) =>
                service.createAsPromise(payload)
                  .then((entity) => config.events.apiEvents.createSuccess(entity))
                  .catch((error) => config.events.apiEvents.createFailure(error.message))
              ),
            ),
          updateEntity$: events
            .on(config.events.editPageEvents.updateButtonClicked)
            .pipe(
              exhaustMap(({ payload }) =>
                service.updateAsPromise((payload as any)._id, payload)
                  .then((entity) => config.events.apiEvents.updateSuccess(entity))
                  .catch((error) => config.events.apiEvents.updateFailure(error.message))
              ),
            ),
          deleteEntity$: events
            .on(config.events.editPageEvents.deleteButtonClicked, config.events.listPageEvents.deleteButtonClicked)
            .pipe(
              exhaustMap(({ payload }) =>
                service.deleteAsPromise(payload)
                  .then(() => config.events.apiEvents.deleteSuccess(payload))
                  .catch((error) => config.events.apiEvents.deleteFailure(error.message))
              ),
            ),
        };

        if (config.enableErrorLogging !== false) {
          effects.logError$ = events
            .on(
              config.events.apiEvents.loadAllFailure,
              config.events.apiEvents.deleteFailure,
              config.events.apiEvents.createFailure,
              config.events.apiEvents.updateFailure,
            )
            .pipe(tap(({ payload }) => console.log(payload))); // todo: replace with decent logging
        }

        return effects;
      },
    ),
  );
} 