import { signalStoreFeature, type } from '@ngrx/signals';
import { entityConfig, withEntities } from '@ngrx/signals/entities';
import { InjectionToken } from '@angular/core';
import { withRequestStatus } from './with-request-status.feature';
import { withPagination } from './with-pagination.feature';
import { withCrudReducer } from './with-crud-reducer.feature';
import { withCrudEffects } from './with-crud-effects.feature';
import { createCrudEvents } from './crud-events.factory';

export interface CrudConfig<T> {
  entityName: string;
  collection: string;
  selectId: (entity: T) => string;
  serviceToken: InjectionToken<any>;
  pageSize?: number;
  enableErrorLogging?: boolean;
}

export function withCrud<T>(config: CrudConfig<T>) {
  const events = createCrudEvents<T>(config.entityName);
  
  const entityConf = entityConfig({
    entity: type<T>(),
    collection: config.collection,
    selectId: config.selectId,
  });

  return signalStoreFeature(
    withEntities(entityConf),
    withRequestStatus(),
    withPagination(config.pageSize || 10),
    withCrudReducer<T>({
      events,
      entityConfig: entityConf,
      selectId: config.selectId,
    }),
    withCrudEffects<T>({
      events,
      serviceToken: config.serviceToken,
      enableErrorLogging: config.enableErrorLogging || false,
    })
  );
} 