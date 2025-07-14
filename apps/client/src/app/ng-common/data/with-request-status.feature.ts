import { computed } from '@angular/core';
import { signalStoreFeature, withComputed, withState } from '@ngrx/signals';

export type RequestStatusState = { 
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  loaded: boolean;
  idBeingProcessed: string | null;
};

export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({ 
      loading: false,
      saving: false,
      deleting: false,
      loaded: false,
      idBeingProcessed: null
    }),
    withComputed(({ loading, saving, deleting, loaded, idBeingProcessed }) => ({
      // Boolean signals are exposed directly
      loading: loading,
      saving: saving,
      deleting: deleting,
      loaded: loaded,
      // ID of the entity being processed
      idBeingProcessed: idBeingProcessed,
      // pending is computed as true if any of the other states are true
      pending: computed(() => loading() || saving() || deleting()),
    }))
  );
}

export function setLoading(loading: boolean): Partial<RequestStatusState> {
  return { loading };
}

export function setSaving(saving: boolean): Partial<RequestStatusState> {
  return { saving };
}

export function setDeleting(deleting: boolean): Partial<RequestStatusState> {
  return { deleting };
}

export function setLoaded(loaded: boolean): Partial<RequestStatusState> {
  return { loaded };
}

export function setIdBeingProcessed(id: string | null): Partial<RequestStatusState> {
  return { idBeingProcessed: id };
}
