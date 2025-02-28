export interface IApiConfig {
  env: string;
  hostName: string;
  mongoUri: string;
  databaseName: string;
  port: number;
  jwtSecret: string;
  corsAllowedOrigins: string[];
}
