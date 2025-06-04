import {IApiConfig} from './api-config.interface.js';

const loadConfig = (): IApiConfig => {
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? JSON.parse(process.env.CORS_ALLOWED_ORIGINS) : [];

  return {
    appName: process.env.APP_NAME ?? 'Monorepo Starter',
    env: process.env.NODE_ENV ?? 'local',
    hostName: process.env.HOST_NAME ?? '',
    clientSecret: process.env.CLIENT_SECRET!,
    mongoDbUrl: process.env.MONGODB_URL,
    databaseName: process.env.DATABASE_NAME,
    externalPort: parseInt(process.env.EXTERNAL_PORT ?? '4000', 10),
    internalPort: parseInt(process.env.INTERNAL_PORT ?? '8083', 10),
    corsAllowedOrigins,
    saltWorkFactor: parseInt(process.env.SALT_WORK_FACTOR ?? '10', 10),
    jobTypes: process.env.JOB_TYPES,
    deployedBranch: process.env.DEPLOYED_BRANCH,
    debug: {
      showErrors: process.env.DEBUG_SHOW_ERRORS === 'true'
    },
    app: {
      // all of these app configs should be hardcoded here and not changed from environment to environment
      multiTenant: true
    },
    auth: {
      jwtExpirationInSeconds: parseInt(process.env.JWT_EXPIRATION_SECONDS ?? '3600', 10),
      refreshTokenExpirationInDays: parseInt(process.env.REFRESH_EXPIRATION_DAYS ?? '7', 10),
      deviceIdCookieMaxAgeInDays: parseInt(process.env.DEVICEID_MAX_AGE_DAYS ?? '730', 10),
      passwordResetTokenExpirationInMinutes: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES ?? '20', 10),
    },
    email: {
      sendGridApiKey: process.env.EMAIL_SENDGRID_API_KEY,
      fromAddress: process.env.EMAIL_FROM_ADDRESS,
    }
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
