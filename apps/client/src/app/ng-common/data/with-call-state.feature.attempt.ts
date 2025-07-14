import { Signal, computed } from '@angular/core';
import {
  SignalStoreFeature,
  signalStoreFeature,
  withComputed,
  withState,
} from '@ngrx/signals';

export type CallState = 'init' | 'loading' | 'loaded' | { error: string };

export type NamedCallStateSlice<EntityName extends string> = {
  [K in EntityName as `${K}CallState`]: CallState;
};

export type CallStateSlice = {
  callState: CallState
}

export type NamedCallStateSignals<Prop extends string> = {
  [K in Prop as `${K}Loading`]: Signal<boolean>;
} & {
  [K in Prop as `${K}Loaded`]: Signal<boolean>;
} & {
  [K in Prop as `${K}Error`]: Signal<string | null>;
};

export type CallStateSignals = {
  loading: Signal<boolean>;
  loaded: Signal<boolean>;
  error: Signal<string | null>
}

export function getCallStateKeys(config?: { entityName?: string }) {
  const prop = config?.entityName;
  return {
    callStateKey: prop ?  `${config.entityName}CallState` : 'callState',
    loadingKey: prop ? `${config.entityName}Loading` : 'loading',
    loadedKey: prop ? `${config.entityName}Loaded` : 'loaded',
    errorKey: prop ? `${config.entityName}Error` : 'error',
  };
}

export function withCallState<EntityName extends string>(config: {
  entityName: EntityName;
}): SignalStoreFeature<
  { state: {}, signals: {}, methods: {} },
  {
    state: NamedCallStateSlice<EntityName>,
    signals: NamedCallStateSignals<EntityName>,
    methods: {}
  }
>;
export function withCallState(): SignalStoreFeature<
  { state: {}, signals: {}, methods: {} },
  {
    state: CallStateSlice,
    signals: CallStateSignals,
    methods: {}
  }
>;
export function withCallState<EntityName extends string>(config?: {
  entityName: EntityName;
}): SignalStoreFeature {
  const { callStateKey, errorKey, loadedKey, loadingKey } =
    getCallStateKeys(config);

  return signalStoreFeature(
    withState({ [callStateKey]: 'init' }),
    withComputed((state: Record<string, Signal<unknown>>) => {

      const callState = state[callStateKey] as Signal<CallState>;

      return {
        [loadingKey]: computed(() => callState() === 'loading'),
        [loadedKey]: computed(() => callState() === 'loaded'),
        [errorKey]: computed(() => {
          const v = callState();
          return typeof v === 'object' ? v.error : null;
        })
      }
    })
  );
}

export function setLoading<Prop extends string>(
  prop?: Prop
): NamedCallStateSlice<Prop> | CallStateSlice {
  if (prop) {
    return { [`${prop}CallState`]: 'loading' } as NamedCallStateSlice<Prop>;
  }

  return { callState: 'loading' };
}

export function setLoaded<Prop extends string>(
  prop?: Prop
): NamedCallStateSlice<Prop> | CallStateSlice {

  if (prop) {
    return { [`${prop}CallState`]: 'loaded' } as NamedCallStateSlice<Prop>;
  }
  else {
    return { callState: 'loaded' };

  }
}

export function setError<Prop extends string>(
  error: string,
  prop?: Prop,
): NamedCallStateSlice<Prop> | CallStateSlice {

  if (prop) {
    return { [`${prop}CallState`]: { error } } as NamedCallStateSlice<Prop>;
  }
  else {
    return { callState: { error } };
  }
}
