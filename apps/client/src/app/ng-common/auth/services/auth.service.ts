import {BehaviorSubject, defer, firstValueFrom, Observable, of as observableOf, switchMap, throwError as observableThrowError} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import * as _ from 'lodash'
import {IUserContext} from '@loomcore/common/models';
import {HttpService} from '@common/services/http.service';
import {catchError, map, tap} from 'rxjs/operators';
import {AuthTokenCacheService} from './auth-token-cache.service';
import {ILoginResponse} from '@loomcore/common/models';
import {BasicAuthProviderService} from './basic-auth-provider.service';
import {IdentityProviderAuthState} from '../models/identity-provider-auth-state.model';
import {AppSettings} from '@common/models/app-settings.model';
import {ITokenResponse} from '@loomcore/common/models';

@Injectable({providedIn: 'root'})
export class AuthService {
  private config = inject(AppSettings);
  private http = inject(HttpService);
  private authTokenCacheService = inject(AuthTokenCacheService);
  private authProvider = inject(BasicAuthProviderService);
  private baseUrl: string;
  private identityProviderAuthStateSubject: BehaviorSubject<IdentityProviderAuthState>;
  authState$: Observable<IdentityProviderAuthState>;

  constructor() {
    this.baseUrl = `${this.config.apiUrl}/auth`;
    this.identityProviderAuthStateSubject = new BehaviorSubject<IdentityProviderAuthState>(new IdentityProviderAuthState());
    this.authState$ = this.identityProviderAuthStateSubject.asObservable();
  }

  login(email: string, password: string) {
    /**
     * login returns a LoginResponse { tokens: {accessToken, refreshToken}, userContext }, and getUserContext
     * returns just a userContext
     */

    return this.http.post(`${this.baseUrl}/login`, {email: email, password: password})
      .pipe(
        map(response => this.extractLoginResponse(response)),
        switchMap((response) => this.handleLoginResponse(response)),
        catchError(error => this.handleError(error))
      );
    // return this.callLoginApi(email, password).pipe(
    //   switchMap((response) => this.handleLoginResponse(response))
    // );
  }

  handleLoginResponse(loginResponse: ILoginResponse | null) {
    let userContext = null;

    let cachingPromise: Promise<ITokenResponse | null> = Promise.resolve(null);
    if (loginResponse && loginResponse.tokens) {
      userContext = loginResponse.userContext;
      /**
       * Cache the accessToken and refresh token in IndexedDb
       */
      cachingPromise = this.authTokenCacheService.cacheTokens(loginResponse.tokens);
    }
    else {
      // login failed, so make sure we load authState with an empty object
      const emptyAuthState = new IdentityProviderAuthState();
      this.publishIdentityProviderAuthState(emptyAuthState);
    }

    return cachingPromise
      .then((cachingResult) => {
        let authState = null;
        if (cachingResult && loginResponse && loginResponse.tokens && loginResponse.tokens.accessToken) {
          const accessToken = loginResponse.tokens.accessToken;
          authState = new IdentityProviderAuthState({ isAuthenticated: true, accessToken});
          /**
           * update our in-memory authState - we store and are the source of truth for the authState$ just like Okta and Auth0 are
           */
          this.publishIdentityProviderAuthState(authState);
        }
        return authState;
      });
    // .catch((error) => {
    //     console.log(error);
    // });
  }

  // private callLoginApi(email: string, password: string): Observable<any> {
  //   return this.http.post(`${this.baseUrl}/login`, {email: email, password: password})
  //     .pipe(
  //       map(response => this.extractLoginResponse(response)),
  //       catchError(error => this.handleError(error))
  //     );
  // }

  logout() {
    const promise = this.clearClientsideAuth()
      .then((result) => {
        this.navigateToLogin();
      })
      .catch((error) => {
        return this.handleError(error);
      });

    return promise;

    // I had this returning an observable at one point...
    // const observable = defer(() => promise)
    // return observable;
  }

  autoAuthenticateIfPossible() {
    // returns a promise containing a live accessToken, or null.
    let promise: Promise<string | null> = Promise.resolve(null);
    console.log('Attempting to auto-authenticate...');

    /**
     * Figure out if we currently have an authorized user logged in
     */
    if (this.isAuthenticated()) {
      /**
       * we know we are logged in, so just grab the authState from our identityProviderAuthStateSubject and get the accessToken
       */
      const authState = this.cloneAuthState();
      promise = Promise.resolve(authState.accessToken);
    }
    else {
      /**
       * We don't know if we are logged in - perhaps the user just hit F5, but we may have a live token cached.
       * Check for existing token.  If we don't have a live token cached, there's no need to ask the server - we know we are not authenticated
       */
      promise = this.getAccessToken()
        .then((accessToken: string) => {
          let accessTokenPromise: Promise<string | null> = Promise.resolve(null);
          if (accessToken) {
            /**
             * we have a live token (jwt), make sure it is persisted to our identityProviderAuthStateSubject and return it
             */
            console.log('...live token found');
            accessTokenPromise = Promise.resolve(accessToken);
          }
          // else {
          //   /**
          //    * see if we can silently get a token, using our refreshToken, if we have one.
          //    */
          //   console.log('calling acquireTokenSilent from autoAuthenticateIfPossible()'); // todo: delete me
          //   accessTokenPromise = this.acquireTokenSilent();
          // }

          return accessTokenPromise;
        })
        .then((accessToken: string | null) => {
          if ((accessToken)) {
            const authState = new IdentityProviderAuthState({ isAuthenticated: true, accessToken});
            /** this will cause us to change authState within the authService.  The containing app should respond to that
             *  change and retrieve the userContext from the server.
             */
            this.publishIdentityProviderAuthState(authState);
          }
          return accessToken;
        });
    }

    return promise;


    // ****promise version****
    // let userPromise = Promise.resolve(null);
    //
    // // Figure out if we currently have an authorized user logged in
    // if (this.isAuthenticated()) {
    //   // we know we are logged in, so just grab the user from our userSubject
    //   const user = this.cloneCurrentUser();
    //   userPromise = Promise.resolve(user);
    // }
    // else {
    //   // todo: I don't know the impact of using await here.  test to make sure this is ok
    //   // We don't know if we are logged in - perhaps the user just hit F5, but we may have a live token cached.
    //   // Check for existing token.  If we don't have a live token cached, there's no need to ask the server - we know we are not authenticated
    //   const liveToken = await this.getAccessToken();
    //
    //   if (liveToken) {
    //     // we have a live token (jwt), get the currently authenticated user from the server
    //     userPromise = this.getAuthenticatedUserContextFromServer();
    //   }
    //   else {
    //     // we don't have a live token
    //     this.navigateToLogin();
    //     userPromise = Promise.resolve(null);
    //   }
    // }
    //
    // return userPromise;
  }

  // getAuthenticatedUserContextFromServer() {
  //     return this.http.get(`${this.baseUrl}/getusercontext`)
  //         .pipe(
  //             map(response => this.extractUserContext(response)),
  //             tap((userContext: UserContext) => {
  //                 this.store.dispatch(new LoadUserContextSuccess(userContext));
  //                 this.updateAuthState(userContext);
  //             }),
  //             catchError((error: any) => {
  //                 this.store.dispatch(new LoadUserContextFailure(error));
  //                 return this.handleError(error);
  //             })
  //         ).toPromise();
  //
  //     // .pipe(
  //     //     map(response => <UserContext>this.extractAnyData(response)),
  //     //     tap(userContext => {
  //     //             this.store.dispatch(new LoginUserSuccess(userContext));
  //     //             this.dataStore.userContext = userContext;
  //     //             // subscribers get copies of the user, not the user itself, so any changes they make do not propagate back
  //     //             this._currentUserContext.next(Object.assign({}, this.dataStore.userContext));
  //     //         }
  //     //     ),
  //     //     catchError(error => this.handleError(error))
  //     // );
  //
  // }

  // consider moving this out into a different service, one that does everything not included in actual authentication and will need
  //  to be called regardless of which identity provider is used (Okta, Auth0, our BasicAuth, etc).
  getUserContext() {
    return firstValueFrom( // convert observable to promise
      this.http.get(`${this.baseUrl}/get-user-context`)
        .pipe(
          map(response => this.extractUserContext(response)),
          // catchError((error: any) => {
          //     return this.handleError(error);
          // })
        )
    );
  }

  isAuthenticated() {
    const authState = this.cloneAuthState();
    return Boolean(authState && authState.isAuthenticated);
  }

  async clearClientsideAuth(clearCachedTokens = true) {
    /**
     * Send out cleared authState to all subscribers
     */
    this.publishIdentityProviderAuthState(new IdentityProviderAuthState());

    if (clearCachedTokens) {
      /**
       * clear token cache
       */
      await this.authTokenCacheService.clearCachedTokens();
    }
  }

  getCachedRefreshToken() {
    /**
     * get tokenResponse from cache
     */
    return this.authTokenCacheService.getCachedTokens()
      .then((tokenResponse: any) => {
        /**
         * returns null if we don't have a refreshToken cached
         */
        let refreshToken = null;
        if (tokenResponse) {
          refreshToken = tokenResponse.refreshToken;
        }
        return Promise.resolve(refreshToken);
      });
  }

  // updateAuthState(authState: IdentityProviderAuthState, persistLastUser = true) {
  //     let observable: any = observableOf(null);
  //
  //     if (authState) {
  //         this.publishIdentityProviderAuthState(authState);
  //
  //         observable = observableOf(authState);
  //         // if (userContext.preferences && userContext.preferences.defaultHomePage) {
  //         //     const currentUrl = window.location.href;
  //         //
  //         //     // don't navigate if we are already on the same page (I don't like having a refresh wipe out my search params in the querystring)
  //         //     if (!currentUrl.startsWith(environment.clientUrl.substring(0, environment.clientUrl.length) + '#' + userContext.preferences.defaultHomePage)) {
  //         //         this.router.navigate([userContext.preferences.defaultHomePage]);
  //         //     }
  //         // }
  //
  //         // if (persistLastUser) {
  //         //     this.offlineInfoService.save(OfflineInfoKeys.lastUser, userContext);
  //         // }
  //     }
  //
  //     return observable;
  // }

  // this should only be called from UserPreferenceService when prefs are saved
  // updatePreferencesOnCurrentUser(preferences: UserPreferences) {
  //     const userContext = this.cloneContext();
  //     userContext.preferences = preferences;
  //     this.publishUserContext(userContext);
  // }

  isCallToSecureApi(url: string) {
    const allowedInsecurePaths = [
      'auth/login',
      'auth/logout',
      'auth/register',
      'auth/request-token-using-auth-code',
      'auth/refresh',
      'setup/initial-setup',
      'setup/setup-state'
    ];
    const allowedInsecureUrls = allowedInsecurePaths.map((path) => {
      return `${this.config.apiUrl}/${path}`;
    });
    // add unsecure paths from config
    allowedInsecureUrls.push(...this.config.auth.unsecureEndpoints);

    const isAllowedInsecureUrl = this.urlIsInPathList(url, allowedInsecureUrls);
    const isProtectedApiUrl = !isAllowedInsecureUrl;
    return isProtectedApiUrl;
  }

  urlIsInPathList(url: string, allowedInsecurePathList: string[]) {
    let urlIsInList;

    if (url.startsWith(this.config.apiUrl)) {
      for (let i = 0; i < allowedInsecurePathList.length; i++) {
        if (url.startsWith(allowedInsecurePathList[i])) {
          urlIsInList = true;
          break;
        }
      }
    }

    return urlIsInList;
  }

  navigateToLogin() {
    console.log('Navigating to login page');
    window.location.href = `/login`;
  }

  acquireTokenSilent(): Promise<string | null> {
    console.log('...attempting to acquire token silently');
    return this.getCachedRefreshToken()
      .then((refreshToken: string) => {
        let promise: Promise<ITokenResponse | null> = Promise.resolve(null);
        if (refreshToken) {
          console.log('...refreshToken found.  Attempting to get new token using refreshToken');
          promise = this.authProvider.requestTokenUsingRefreshToken(refreshToken);
        } else {
          console.log('No refreshToken found. Routing to login');
          this.navigateToLogin();
        }
        return promise;
      })
      .then((tokenResponse: ITokenResponse | null) => {
        let promise: Promise<ITokenResponse | null> = Promise.resolve(null);
        if (tokenResponse && tokenResponse.accessToken) {
          /**
           * cache the tokenResponse (contains both the accessToken and the refreshToken)
           */
          promise = this.authTokenCacheService.cacheTokens(tokenResponse);
          // this.router.navigateByUrl('dashboard');
        }
        return promise;
      })
      .then((tokenResponse: ITokenResponse | null) => {
        let token = null;
        if (tokenResponse) {
          token = tokenResponse.accessToken;
          // this.router.navigateByUrl('dashboard');
        }
        return Promise.resolve(token);
      })
      .catch((error: any) => {
        this.clearClientsideAuth(false);
        return Promise.resolve(null);
      });
  }

  getAccessToken() {
    /**
     * get tokens from cache - this only returns a token if it hasn't expired
     */
    return this.authTokenCacheService.getCachedTokens()
      .then((tokenResponse: any) => {
        /**
         * returns null if we don't have a live token cached
         */
        let accessToken = null;

        /**
         * check to see if cached accessToken is live (not expired)
         */
        if (tokenResponse && tokenResponse.accessToken) {
          const now = Date.now();
          /**
           * milliseconds since Jan 1, 1970 UTC
           */
          const expiresOn = tokenResponse.expiresOn;

          // Only check expiration if expiresOn is set, otherwise assume token is live
          const isLive = expiresOn ? expiresOn > now : true;
          if (isLive) {
            accessToken = tokenResponse.accessToken;
          }
        }

        // If we don't have a live token, try to get one using our refreshToken
        let result;
        if (!accessToken) {
          console.log('calling acquireTokenSilent from getAccessToken()');
          result = this.acquireTokenSilent();
        } 
        else {
          result = Promise.resolve(accessToken);
        }

        return result;
      });
  }

  private extractLoginResponse(response: any): ILoginResponse | null {
    let loginResponse = null;
    const data = response?.data;
    if (data) {
      if (data.userContext && data.userContext.preferences) {
        const preferences = JSON.parse(data.userContext.preferences);
        data.userContext.preferences = preferences;
      }

      loginResponse = data as ILoginResponse;
    }
    return loginResponse;
  }

  private extractUserContext(response: any): IUserContext | null {
    let result = null;
    if (response?.data) {
      result = response.data as IUserContext;
    }
    return result;
  }

  handleError(error: any) {
    console.log(error);
    return observableThrowError(() => error ?? 'Server error');
  }

  /**
   * We call clone here whenever we need to grab the current value of the BehaviorSubject, make a change, and send out that change.
   * We do this to grab a copy, make a change to the copy, and send that out.  We want to treat the value as immutable.  We never change
   * a value we've already published.
   * @private any
   */
  private cloneAuthState() {
    return _.cloneDeep(this.identityProviderAuthStateSubject.getValue());
  }

  private publishIdentityProviderAuthState(authState: IdentityProviderAuthState) {
    // next updates the current value in the BehaviorSubject and emits it to all subscribers
    this.identityProviderAuthStateSubject.next(authState);
  }

}


