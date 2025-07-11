// import {IUser} from '@loomcore/common/models';
// import {IAuthState} from '../models/auth-state.interface'

// type AuthStateObserver = (authState: IAuthState) => void;

// // This is an attempt at a framework-agnostic service usable by React or Angular
// export class AuthStateService {
//   private authState: IAuthState = {
//     isAuthenticated: false
//   };

//   private observers: AuthStateObserver[] = [];

//   /**
//    * Subscribe to auth state changes
//    * @param observer Function to call when auth state changes
//    * @returns Unsubscribe function
//    */
//   public subscribe(observer: AuthStateObserver): () => void {
//     this.observers.push(observer);
    
//     // Immediately emit current state to new subscriber
//     observer(this.authState);
    
//     // Return unsubscribe function
//     return () => {
//       const index = this.observers.indexOf(observer);
//       if (index > -1) {
//         this.observers.splice(index, 1);
//       }
//     };
//   }

//   /**
//    * Get current auth state (read-only)
//    */
//   public get currentAuthState(): Readonly<IAuthState> {
//     return { ...this.authState };
//   }

//   /**
//    * Sign in with access and refresh tokens
//    * @param accessToken JWT access token
//    * @param refreshToken JWT refresh token
//    */
//   public signIn(accessToken: string, refreshToken: string): void {
//     this.updateAuthState({
//       accessToken,
//       refreshToken,
//       isAuthenticated: true,
//       error: undefined
//     });
//   }

//   /**
//    * Sign out and clear all auth state
//    */
//   public signOut(): void {
//     this.updateAuthState({
//       accessToken: undefined,
//       refreshToken: undefined,
//       isAuthenticated: false,
//       error: undefined
//     });
//   }

//   /**
//    * Set an error in the auth state
//    * @param error Error to set
//    */
//   public setError(error: Error): void {
//     this.updateAuthState({
//       ...this.authState,
//       error
//     });
//   }

//   /**
//    * Clear any errors in the auth state
//    */
//   public clearError(): void {
//     this.updateAuthState({
//       ...this.authState,
//       error: undefined
//     });
//   }

//   /**
//    * Check if user is currently authenticated
//    */
//   public isAuthenticated(): boolean {
//     return this.authState.isAuthenticated || false;
//   }

//   /**
//    * Update auth state and notify observers
//    * @param newState New auth state
//    */
//   private updateAuthState(newState: IAuthState): void {
//     this.authState = { ...newState };
//     this.notifyObservers();
//   }

//   /**
//    * Notify all observers of state change
//    */
//   private notifyObservers(): void {
//     this.observers.forEach(observer => {
//       try {
//         observer(this.authState);
//       } catch (error) {
//         console.error('Error in auth state observer:', error);
//       }
//     });
//   }
// }

// // Export a singleton instance for convenience
// export const authStateService = new AuthStateService();




// Example usage in Angular:
/*
export class AppComponent {
  private unsubscribe?: () => void;
  isAuthenticated = false;

  ngOnInit() {
    this.unsubscribe = authService.subscribe((authState) => {
      if (authState.isAuthenticated) {
        // we have an authenticated user
        this.appStore.userAuthenticated();
      } else {
        // handle unplanned logout here
        this.appStore.userLoggedOut();
      }
      this.isAuthenticated = authState.isAuthenticated;
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
*/

// Example usage in React:
/*
import { useEffect, useState } from 'react';
import { authService, IAuthState } from './auth.service';

export const useAuth = () => {
  const [authState, setAuthState] = useState<IAuthState>(authService.currentAuthState);

  useEffect(() => {
    const unsubscribe = authService.subscribe((newAuthState) => {
      setAuthState(newAuthState);
      
      if (newAuthState.isAuthenticated) {
        // we have an authenticated user
        console.log('User authenticated');
      } else {
        // handle unplanned logout here
        console.log('User logged out');
      }
    });

    return unsubscribe;
  }, []);

  return {
    authState,
    isAuthenticated: authState.isAuthenticated,
    signIn: authService.signIn.bind(authService),
    signOut: authService.signOut.bind(authService),
    getUser: authService.getUser.bind(authService)
  };
};
*/