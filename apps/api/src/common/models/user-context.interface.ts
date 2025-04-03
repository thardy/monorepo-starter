import {IUser} from './user.model.js';
import { Type } from '@sinclair/typebox';
import { PublicUserSchema } from './user.model.js';
import { entityUtils } from '../utils/entity.utils.js';

export interface IUserContext {
  user: IUser;
	orgId?: string; // todo: if the app is multi-tenant, orgId will be required - figure out how to make this happen
}

export const EmptyUserContext: IUserContext = {
  user: {} as IUser,
  orgId: undefined
}

/**
 * Schema for UserContext that uses PublicUserSchema for user property
 * This ensures we don't expose sensitive user data in API responses
 */
export const UserContextSchema = Type.Object({
  user: PublicUserSchema,
  orgId: Type.Optional(Type.String())
});

/**
 * Model spec for UserContext 
 */
export const UserContextSpec = entityUtils.getModelSpec(UserContextSchema);

