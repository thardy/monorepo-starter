import { vi } from 'vitest';
import { IApiConfig } from '#server/config/api-config.interface';

const testConfig: IApiConfig = {
  env: 'test',
  hostName: 'localhost',
  appName: 'test-app',
  clientSecret: 'test-secret',
  mongoDbUrl: '',
  databaseName: 'test-db',
  externalPort: 4000,
  internalPort: 8083,
  corsAllowedOrigins: ['*'],
  saltWorkFactor: 10,
  jobTypes: '',
  deployedBranch: '',
  debug: {
    showErrors: false,
  },
  app: { isMultiTenant: false },
  auth: {
    jwtExpirationInSeconds: 3600,
    refreshTokenExpirationInDays: 7,
    deviceIdCookieMaxAgeInDays: 730,
    passwordResetTokenExpirationInMinutes: 20,
  },
  email: {
    sendGridApiKey: 'SG.WeDontHaveAKeyYet',
    fromAddress: undefined,
  },
  
};

vi.mock('#server/config/config', () => ({
  default: testConfig,
})); 