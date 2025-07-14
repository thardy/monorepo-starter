import { computed } from '@angular/core';
import { signalStoreFeature, withComputed, withState } from '@ngrx/signals';

export type RequestStatusState = { 
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  loaded: boolean;
};

export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({ 
      loading: false,
      saving: false,
      deleting: false,
      loaded: false
    }),
    withComputed(({ loading, saving, deleting, loaded }) => ({
      // Boolean signals are exposed directly
      loading: loading,
      saving: saving,
      deleting: deleting,
      loaded: loaded,
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
