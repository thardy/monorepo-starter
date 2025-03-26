import {IUser} from './user.model.js';

export interface IUserContext {
  user: IUser;
	orgId?: string;
}

export const EmptyUserContext: IUserContext = {
  user: {} as IUser,
  orgId: undefined
}