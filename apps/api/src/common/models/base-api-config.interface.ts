import {IApiCommonConfig} from './api-common-config.interface.js';

export interface IBaseApiConfig {
  mongoDbUrl?: string;
  databaseName?: string;
  externalPort?: number;
  internalPort?: number;
  corsAllowedOrigins: string[];
  saltWorkFactor?: number;
  jobTypes?: string;
  deployedBranch?: string;
  api: IApiCommonConfig;
}