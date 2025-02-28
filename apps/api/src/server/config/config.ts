import {IApiConfig} from '../../common/models/api-config.interface.js';

const loadConfig = (): IApiConfig => {
  /**
   * Assume all environment variables are strings
   */
  return {
    env: process.env.NODE_ENV ?? 'local',
    hostName: process.env.HOST_NAME ?? '',
    mongoUri: process.env.MONGO_URI ?? '',
    databaseName: process.env.MONGO_DB_NAME ?? '' ,
    port: parseInt(process.env.PORT ?? '5001', 10),
    jwtSecret: process.env.JWT_SECRET ?? 'fallback_secret',
    corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? [],
  };
};

// Initialize config
let config: IApiConfig;

try {
  config = loadConfig();
} catch (err) {
  throw err;
}

export default config;
