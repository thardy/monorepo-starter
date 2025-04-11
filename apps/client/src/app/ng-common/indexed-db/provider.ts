import {APP_INITIALIZER, Provider} from '@angular/core';
import {IdbService} from './idb.service';

/**
 * Identifies a particular kind of `IndexedDbFeature`.
 *
 * @publicApi
 */
export enum IndexedDbFeatureKind {
  IndexedDbConfig,
}

/**
 * A feature for use when configuring `IndexedDbFeature`.
 *
 * @publicApi
 */
export interface IndexedDbFeature<KindT extends IndexedDbFeatureKind> {
  ɵkind: KindT;
  ɵproviders: Provider[];
}

export function provideIndexedDb(...features: IndexedDbFeature<IndexedDbFeatureKind>[]): Provider[] {
  // Return a copy to prevent changes to the original array in case any in-place
  // alterations are performed to the `provideIndexedDb` call results in app code.
  const providers: Provider[] = [
    {
      provide: APP_INITIALIZER,
      useFactory: idbProviderFactory,
      deps: [IdbService],
      multi: true
    },
  ];

  for (const feature of features) {
    providers.push(...feature.ɵproviders);
  }
  return providers;
}

export function idbProviderFactory(provider: IdbService) {
  // this is the sequence of events we need to complete before initializing the application.
  //  these things need to happen before ANYTHING else in order to guarantee smooth operation.
  return async () => {
    await provider.connectToIDB();
    // if we have a service that needs to use idb before anything else happens, initialize it here (and add as
    //  a parameter to this factory function as well as to "deps" in the provider above).
    console.log(`Connected to indexed-db`);
  };
}

