import {User} from './user.model';

export interface IUserContext {
  user: User;
  isAuthenticated: boolean;
  //preferences: UserPreferences;
}

export class UserContext implements IUserContext {
  user: User;
  isAuthenticated: boolean;
  //preferences: UserPreferences;

  constructor(options: {
    user?: User,
    isAuthenticated?: boolean,
    //preferences?: UserPreferences,
  } = {}) {
    this.user = options.user ?? new User();
    this.isAuthenticated = options.isAuthenticated ?? false;
    //this.preferences = options && options.preferences ? new UserPreferences(options.preferences) : new UserPreferences();
  }

  serialize() {
    return {
      user: { ...this.user },
      isAuthenticated: this.isAuthenticated
    };
  }

}
