import {User} from './user.model.js';

export interface IUserContext {
  user: User;
	orgId?: string;
}
