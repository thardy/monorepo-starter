import {APP_INITIALIZER, FactorySansProvider, Provider, Type} from '@angular/core';
import {BaseClientConfig} from './models/base-client-config.model';
import {ConfigService} from './services/config.service';

/**
 * Identifies a particular kind of `ConfigFeature`.
 *
 * @publicApi
 */
export enum ConfigFeatureKind {
  ForRoot
}

/**
 * A feature for use when configuring `ConfigFeature`.
 *
 * @publicApi
 */
export interface ConfigFeature<KindT extends ConfigFeatureKind> {
  ɵkind: KindT;
  ɵproviders: Provider[];
}

function makeConfigFeature<KindT extends ConfigFeatureKind>(
  kind: KindT, providers: Provider[]): ConfigFeature<KindT> {
  return {
    ɵkind: kind,
    ɵproviders: providers,
  };
}

/**
 * Returns the set of providers to enable ConfigService in an application.
 * As a parameter, it uses a configUrl which will be used to retrieve the json file
 * before app bootstrap.
 *
 * @see {@link forRoot}
  */
export function provideConfig(...features: ConfigFeature<ConfigFeatureKind>[]): Provider[] {
  const providers: Provider[] = [
    {
      provide: ConfigService,
      useFactory: () => ConfigService.getInstance()
    }
  ];

  for (const feature of features) {
    providers.push(...feature.ɵproviders);
  }
  return providers;
}

/**
 * Loads the configuration from the provided `configUrl` when the app is initialized
 *
 * @see {@link provideConfig}
 * @publicApi
 */
export function forRoot(configPath: string, configType: Type<any>) {
  return makeConfigFeature(ConfigFeatureKind.ForRoot, [
    {
      provide: APP_INITIALIZER,
      useFactory: (configService: ConfigService) => {
        return () => configService.loadHostConfig(configPath);
      },
      deps: [ConfigService],
      multi: true
    },
    {
      provide: BaseClientConfig,
      useFactory: (configService: ConfigService) => {
        return configService.getHostClientConfig();
      },
      deps: [ConfigService],
    },
    {
      provide: configType,
      useFactory: (configService: ConfigService) => {
        return configService.getHostClientConfig();
      },
      deps: [ConfigService],
    },
  ])
}

interface StringFactoryProvider extends FactorySansProvider {
  useFactory: (...args: any[]) => string
}

