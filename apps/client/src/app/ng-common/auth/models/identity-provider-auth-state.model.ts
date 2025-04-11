export class IdentityProviderAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;

  constructor(options: {
    isAuthenticated?: boolean,
    accessToken?: string,
  } = {}) {
    this.isAuthenticated = options.isAuthenticated ?? false;
    this.accessToken = options.accessToken ?? null;
  }
}
