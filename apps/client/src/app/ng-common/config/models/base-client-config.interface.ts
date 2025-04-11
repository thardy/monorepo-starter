export interface IBaseClientConfig {
  env: string;
  version: string;
  auth: {
    interceptorEnabled: boolean;
    secureUrls: string[];
    unsecureEndpoints: string[];
    redirectUri: string;
    postLogoutRedirectUri: string;
  };
}

// IBaseApiConfig...
// export interface IBaseApiConfig {
//   env?: string;
//   appName: string;
//   hostName: string;
//   mongoDbUrl?: string;
//   databaseName?: string;
//   externalPort?: number;
//   internalPort?: number;
//   corsAllowedOrigins: string[];
//   saltWorkFactor?: number;
//   jobTypes?: string;
//   deployedBranch?: string;
//   apiCommonConfig: IApiCommonConfig;
// }
