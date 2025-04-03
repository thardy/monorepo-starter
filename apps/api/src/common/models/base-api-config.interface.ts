import {IApiCommonConfig} from './api-common-config.interface.js';

export interface IBaseApiConfig {
  env?: string;
  appName: string;
  hostName: string;
  mongoDbUrl?: string;
  databaseName?: string;
  externalPort?: number;
  internalPort?: number;
  corsAllowedOrigins: string[];
  saltWorkFactor?: number;
  jobTypes?: string;
  deployedBranch?: string;
  auth: {
    jwtExpirationInSeconds: number;
    refreshTokenExpirationInDays: number;
    deviceIdCookieMaxAgeInDays: number;
    passwordResetTokenExpirationInMinutes: number;
  };
  apiCommonConfig: IApiCommonConfig;
}