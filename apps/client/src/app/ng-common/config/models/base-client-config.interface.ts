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

