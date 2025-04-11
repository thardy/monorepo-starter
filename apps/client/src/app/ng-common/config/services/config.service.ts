import {IBaseClientConfig} from '../models/base-client-config.interface';

export async function loadConfigForRemote(appName: string, configPath: string): Promise<any> {
  return await ConfigService.getInstance().loadRemoteConfig(appName, configPath);
}

export async function loadHostConfig(): Promise<void> {
  return await ConfigService.getInstance().loadHostConfig();
}

export class ConfigService {
  private remoteConfigs = new Map<string, any>();
  private hostConfig: any;
  private static instance: ConfigService;

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      console.log('New instance of ConfigService created: ' + Date.now());
      ConfigService.instance = new ConfigService();
    }

    return ConfigService.instance;
  }

  private constructor() {}

  public getRemoteClientConfigs<T>(appName: string): T {
    return this.remoteConfigs.get(appName) as T;
  }

  public getHostClientConfig(): IBaseClientConfig {
    return this.hostConfig;
  }


  public async loadHostConfig(): Promise<any> {
    const config = await this.loadConfigFromEnv();

    this.hostConfig = config;
  }

  public async loadRemoteConfig(remoteName: string, configPath: string): Promise<any> {
    const config = await this.loadConfigFromFile(remoteName, configPath);

    // add the secureApis from the remote to the host/shell's secureApis array - The shell's secureApis config
    //  is what is used by the AuthIntercepter to add tokens to api calls.
    if (config && config.secureApis && Array.isArray(config.secureApis) && config.secureApis.length > 0) {
      if (!this.hostConfig.secureApis) {
        this.hostConfig.secureApis = [];
      }
      const mergedArrays = this.concatArraysDistinct(this.hostConfig.secureApis, config.secureApis);
      this.hostConfig.secureApis = mergedArrays;
    }

    this.remoteConfigs.set(remoteName, config);
  }

  private async loadConfigFromFile(appName: string, configPath: string): Promise<any> {
    const appUrl = appName ? this.hostConfig.remotes[appName] : '';
    const configUrl = `${appUrl}${configPath}`;
    const response = await fetch(configUrl);

    if (response.ok) {
      const config = await response.json();

      return config;
    }
    else {
      throw new Error(`Unable to load manifest.json file for application ${appName}: ${configUrl}`);
    }
  }

  private concatArraysDistinct<T>(array1: T[], array2: T[]) {
    let array3 = this.arrayDistinct(array1.concat(array2));
    return array3;
  }

// removes duplicates from an array of any type
  private arrayDistinct(array: any[]) {
    let a = array.concat();
    for (let i= 0; i < a.length; ++i) {
      for (let j= i + 1; j < a.length; ++j) {
        if (a[i] === a[j])
          a.splice(j--, 1);
      }
    }

    return a;
  }

  // Helper function to parse potential array strings from environment variables
  private parseArrayFromEnv(envValue: string | undefined): string[] {
    if (!envValue) return [];
    
    // Check if it looks like a JSON array
    if (envValue.trim().startsWith('[')) {
      try {
        return JSON.parse(envValue);
      } catch (e) {
        console.warn('Failed to parse JSON array from env variable:', e);
        return [];
      }
    }
    
    // Otherwise split by comma
    return envValue.split(',').map(item => item.trim()).filter(Boolean);
  }

  // Convert string to boolean
  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false;
    return value.toLowerCase() === 'true';
  }

  // Convert string to number
  private parseNumber(value: string | undefined, defaultValue: number = 0): number {
    if (!value) return defaultValue;
    const parsedValue = Number(value);
    return isNaN(parsedValue) ? defaultValue : parsedValue;
  }

  private async loadConfigFromEnv(): Promise<IBaseClientConfig> {
    // Get version from environment variable
    const version = process.env['VERSION'] || '';

    return {
      env: process.env['NODE_ENV'] || 'dev',
      version: version,
      auth: {
        interceptorEnabled: this.parseBoolean(process.env['INTERCEPTOR_ENABLED']) || true,
        secureUrls: this.parseArrayFromEnv(process.env['SECURE_URLS']),
        unsecureEndpoints: this.parseArrayFromEnv(process.env['UNSECURE_ENDPOINTS']),
        redirectUri: process.env['REDIRECT_URI'] || '',
        postLogoutRedirectUri: process.env['POST_LOGOUT_REDIRECT_URI'] || '',
      }
    };
  }

}
