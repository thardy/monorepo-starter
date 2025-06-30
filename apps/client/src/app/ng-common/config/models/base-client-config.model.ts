export class BaseClientConfig {
  appName: string = '';
  env: string = '';
  version: string = '';
  apiUrl: string = '';
  auth: {
    interceptorEnabled: boolean;
    secureUrls: string[];
    unsecureEndpoints: string[];
    redirectUri: string;
    postLogoutRedirectUri: string;
  } = {
    interceptorEnabled: false,
    secureUrls: [],
    unsecureEndpoints: [],
    redirectUri: '',
    postLogoutRedirectUri: '',
  };
}

