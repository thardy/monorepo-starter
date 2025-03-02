import {IUser} from './user.model.js';
import {ITokenResponse} from './token-response.model.js';

export interface ILoginResponse {
  tokens?: ITokenResponse;
  userContext?: {
    user: IUser;
  };
}

export class LoginResponse implements ILoginResponse {
  tokens?: ITokenResponse;
  userContext?: { // note that this userContext has a fully populated org property
    user: IUser;
  };

  constructor(options: ILoginResponse = {}) {
    this.tokens = options.tokens ?? undefined;
    this.userContext = options.userContext ?? undefined;
  }
}
