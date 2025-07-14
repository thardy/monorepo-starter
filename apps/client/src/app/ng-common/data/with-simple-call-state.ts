import {
  patchState, SignalStoreFeature,
  signalStoreFeature, withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {Signal} from '@angular/core';

// untested - trying to get named state properties - try again after my base Signal experience is greater
// export type SimpleCallStateSlice = {
//   loading: boolean,
//   loaded: boolean,
// }
// export type NamedSimpleCallStateSlice<EntityName extends string> = {
//   [K in EntityName as `${K}Loading`]: boolean;
// } & {
//   [K in EntityName as `${K}Loaded`]: boolean;
// };
//
// export type NamedSimpleCallStateSignals<Prop extends string> = {
//   [K in Prop as `${K}Loading`]: Signal<boolean>;
// } & {
//   [K in Prop as `${K}Loaded`]: Signal<boolean>;
// };
//
// export type CallStateSignals = {
//   loading: Signal<boolean>;
//   loaded: Signal<boolean>;
// }
//
// export function getCallStateKeys(config?: { entityName?: string }) {
//   const prop = config?.entityName;
//   return {
//     loadingKey: prop ? `${config.entityName}Loading` : 'loading',
//     loadedKey: prop ? `${config.entityName}Loaded` : 'loaded',
//   };
// }
//
// export function withSimpleCallState<EntityName extends string>(config: {
//   collection: EntityName;
// }): SignalStoreFeature<
//   { state: {}, signals: {}, methods: {} },
//   {
//     state: NamedSimpleCallStateSlice<EntityName>,
//     signals: NamedSimpleCallStateSignals<EntityName>,
//     methods: {}
//   }
// >;
// export function withCallState(): SignalStoreFeature<
//   { state: {}, signals: {}, methods: {} },
//   {
//     state: SimpleCallStateSlice,
//     signals: CallStateSignals,
//     methods: {}
//   }
// >;
// export function withSimpleCallState<EntityName extends string>(config?: {
//   entityName: EntityName;
// }): SignalStoreFeature {
//   const { loadedKey, loadingKey } =
//     getCallStateKeys(config);
//
//   return signalStoreFeature(
//     withState({
//       [loadingKey]: false,
//       [loadedKey]: false
//     }),
//     withComputed((state: Record<string, Signal<unknown>>) => {
//       const loading = state[loadingKey] as Signal<boolean>;
//       const loaded = state[loadedKey] as Signal<boolean>;
//
//       return {
//         [loadingKey]: loading,
//         [loadedKey]: loaded,
//       }
//     }),
//     withMethods((state) => ({
//       setLoading<Prop extends string>(prop: Prop, value: boolean) {
//         patchState(state, { [`${prop}Loading`]: value });
//       },
//       setLoaded<Prop extends string>(prop: Prop, value: boolean) {
//         patchState(state, { [`${prop}Loaded`]: value });
//       },
//     })),
//   );
// }

// simple, unnamed way
export const withSimpleCallState = () =>
  signalStoreFeature(
    withState({
      loading: false,
      loaded: false,
    }),
    withMethods((state) => ({
      setLoading(value: boolean) {
        patchState(state, { loading: value });
      },
      setLoaded(value: boolean) {
        patchState(state, { loaded: value });
      },
    })),
  );
