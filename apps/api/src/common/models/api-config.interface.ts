export interface IApiConfig {
  env: string;
  hostName: string;
  mongoUri: string;
  databaseName: string;
  externalPort: number;
  jwtSecret: string;
  corsAllowedOrigins: string[];
}
