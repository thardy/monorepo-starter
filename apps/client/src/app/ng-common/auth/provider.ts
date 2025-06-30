import { withInterceptors } from "@angular/common/http";
import { FactorySansProvider, Provider, ValueSansProvider, importProvidersFrom } from "@angular/core";
import { authRequestInterceptor } from "./interceptors/auth-request.interceptor";

// import {OKTA_CONFIG, OktaAuthConfigService, OktaAuthModule} from '@okta/okta-angular';
// import {OktaAuth} from '@okta/okta-auth-js';

import {BaseClientConfig} from '@app/ng-common/config/models/base-client-config.model';
import {unauthenticatedResponseInterceptor} from '@ng-common/auth/interceptors/unauthenticated-response.interceptor';

/**
 * Identifies a particular kind of `AuthFeature`.
 *
 * @publicApi
 */
export enum AuthFeatureKind {
  AuthConfig,
  // OktaConfiguration,
  // NoAuthInterceptor
}

/**
 * A feature for use when configuring `AuthFeature`.
 *
 * @publicApi
 */
export interface AuthFeature<KindT extends AuthFeatureKind> {
  ɵkind: KindT;
  ɵproviders: Provider[];
}

function makeAuthFeature<KindT extends AuthFeatureKind>(
    kind: KindT, providers: Provider[]): AuthFeature<KindT> {
  return {
    ɵkind: kind,
    ɵproviders: providers,
  };
}

/**
 * Returns the set of dependency-injection providers to enable auth in an application.
 *
 * @usageNotes
 *
 * The function is useful when you want to enable auth in an application
 * bootstrapped using the `bootstrapApplication` function.
 *
 * ```typescript
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideAuth()
 *   ]
 * });
 * ```
 *
 */
export function provideAuth(...features: AuthFeature<AuthFeatureKind>[]): Provider[] {
  // Return a copy to prevent changes to the original array in case any in-place
  // alterations are performed to the `provideAuth` call results in app code.
  const providers: Provider[] = [
    withInterceptors([
      authRequestInterceptor,
      unauthenticatedResponseInterceptor
    ]).ɵproviders,
    // importProvidersFrom(OktaAuthModule.forRoot()) as unknown as Provider[], // importProvidersFrom() is actually EnvironmentProviders
    // {
    //   provide: OKTA_CONFIG,
    //   useFactory: (config: BaseAppSettings) => {
    //     return { oktaAuth: new OktaAuth(config.okta) };
    //   },
    //   deps: [BaseAppSettings]
    // }
  ];

  for (const feature of features) {
    providers.push(...feature.ɵproviders);
  }
  return providers;
}

// example of old consumption
// withOktaConfiguration({
//   useFactory: (config: AppSettings) => config?.okta,
//   deps: [AppSettings],
// })

// export interface AuthConfigValueProvider extends ValueSansProvider {
//   useValue: IAuthConfig;
// }
// export interface AuthConfigFactoryProvider extends FactorySansProvider {
//   useFactory: (...args: any[]) => IAuthConfig
// }
// /**
//  * Uses the provided configuration
//  *
//  * @see {@link provideAuth}
//  * @publicApi
//  */
// export function withAuthConfig(authConfigProvider: AuthConfigValueProvider | AuthConfigFactoryProvider):
//     AuthFeature<AuthFeatureKind.AuthConfig> {
//   return makeAuthFeature(AuthFeatureKind.AuthConfig,  [
//     {
//       provide: AUTH_CONFIG,
//       ...authConfigProvider
//     }
//   ])
// }

// interface OktaAuthOptionsValueProvider extends ValueSansProvider {
//   useValue: OktaAuthOptions;
// }
// interface OktaAuthOptionsFactoryProvider extends FactorySansProvider {
//   useFactory: (...args: any[]) => OktaAuthOptions
// }
// function oktaAuthOptionsProviderToOktaConfigProvider(oktaAuthOptionsProvider: OktaAuthOptionsValueProvider | OktaAuthOptionsFactoryProvider) {
//   const oktaAuthOptionsAsFactoryProvider = oktaAuthOptionsProvider as OktaAuthOptionsFactoryProvider;
//   if (!!oktaAuthOptionsAsFactoryProvider.useFactory) {
//     return {
//       ...oktaAuthOptionsAsFactoryProvider,
//       useFactory: function (...args: any[]) { return { oktaAuth: new OktaAuth(oktaAuthOptionsAsFactoryProvider.useFactory(...args)) }; }
//     } as FactorySansProvider
//   }
//   return {
//     useValue: { oktaAuth: new OktaAuth((oktaAuthOptionsProvider as OktaAuthOptionsValueProvider).useValue) }
//   } as ValueSansProvider;
// }
// /**
//  * Adds Okta as an authentication provider
//  *
//  * @see {@link provideAuth}
//  * @publicApi
//  */
// export function withOktaConfiguration(oktaAuthOptionsProvider: OktaAuthOptionsValueProvider | OktaAuthOptionsFactoryProvider):
//     AuthFeature<AuthFeatureKind.OktaConfiguration> {
//   return makeAuthFeature(AuthFeatureKind.OktaConfiguration,  [
//     importProvidersFrom(OktaAuthModule.forRoot()) as unknown as Provider[], // importProvidersFrom() It's actually EnvironmentProviders
//     {
//       provide: OKTA_CONFIG,
//       ...oktaAuthOptionsProviderToOktaConfigProvider(oktaAuthOptionsProvider)
//     }
//   ])
// }

