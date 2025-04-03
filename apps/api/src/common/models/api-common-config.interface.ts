export interface IApiCommonConfig {
  clientSecret: string;
  email: {
    sendGridApiKey?: string;
    fromAddress?: string;
  };
}