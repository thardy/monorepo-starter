import { Provider } from '@angular/core';
import { IdbService } from './idb.service';

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
    IdbService,
  ];

  for (const feature of features) {
    providers.push(...feature.ɵproviders);
  }
  return providers;
}

