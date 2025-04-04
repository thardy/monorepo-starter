export interface IApiCommonConfig {
  clientSecret: string;
  /**
   * Global configuration for the app. These values should be hardcoded and not changed 
   * from environment to environment..
   */
  app: {
    multiTenant: boolean;
  },
  email: {
    sendGridApiKey?: string;
    fromAddress?: string;
  };
}