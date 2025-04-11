export class Tokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresOn: number | null;

  constructor(options: {
    accessToken?: string | null,
    refreshToken?: string | null,
    expiresOn?: number | null
  } = {}) {
    this.accessToken = options.accessToken ?? null;
    this.refreshToken = options.refreshToken ?? null;
    this.expiresOn = options.expiresOn ?? null;
  }
}
