import { setLoading, setSaving, setDeleting, setLoaded, setIdBeingProcessed } from './with-request-status.feature';
import { addEntity, setAllEntities, updateEntity, removeEntity } from '@ngrx/signals/entities';
import { on, withReducer } from '@ngrx/signals/events';
import { setTotal, incrementPaginationTotal, decrementPaginationTotal } from './with-pagination.feature';

export interface CrudReducerConfig {
  events: {
    listPageEvents: any;
    editPageEvents: any;
    apiEvents: any;
  };
  entityConfig: any;
  selectId: (entity: any) => string;
}

export function withCrudReducer<T>(config: CrudReducerConfig) {
  return withReducer(
    // Loading operations
    on(config.events.listPageEvents.opened, config.events.listPageEvents.refreshed, () => setLoading(true)),
    on(config.events.apiEvents.loadAllSuccess, ({ payload }, state) => [
      setAllEntities(payload || [], config.entityConfig),
      setTotal(payload?.length || 0),
      setLoading(false),
      setLoaded(true),
    ]),
    on(config.events.apiEvents.loadAllFailure, () => [
      setLoading(false),
      setLoaded(false),
    ]),
    
    // Saving operations
    on(config.events.editPageEvents.createButtonClicked, () => setSaving(true)),
    on(config.events.editPageEvents.updateButtonClicked, ({ payload }) => [
      setSaving(true),
      setIdBeingProcessed(config.selectId(payload))
    ]),
    on(config.events.apiEvents.createSuccess, ({ payload }, state) => [
      addEntity(payload, config.entityConfig),
      incrementPaginationTotal(state),
      setSaving(false),
    ]),
    on(config.events.apiEvents.updateSuccess, ({ payload }) => [
      updateEntity({ id: config.selectId(payload), changes: payload }, config.entityConfig),
      setSaving(false),
      setIdBeingProcessed(null),
    ]),
    on(config.events.apiEvents.createFailure, config.events.apiEvents.updateFailure, () => [
      setSaving(false),
      setIdBeingProcessed(null),
    ]),
    
    // Deleting operations
    on(config.events.editPageEvents.deleteButtonClicked, config.events.listPageEvents.deleteButtonClicked, ({ payload }) => [
      setDeleting(true),
      setIdBeingProcessed(payload)
    ]),
    on(config.events.apiEvents.deleteSuccess, ({ payload }, state) => [
      removeEntity(payload, config.entityConfig),
      decrementPaginationTotal(state),
      setDeleting(false),
      setIdBeingProcessed(null),
    ]),
    on(config.events.apiEvents.deleteFailure, () => [
      setDeleting(false),
      setIdBeingProcessed(null),
    ]),
  );
} 