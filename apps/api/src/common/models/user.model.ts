import { TypeboxIsoDate, TypeboxMoney } from '../validation/typebox-extensions.js';
import {IAuditable} from './auditable.interface.js';
import {IEntity} from './entity.interface.js';
import {Type} from '@sinclair/typebox';
import {entityUtils} from '../utils/entity.utils.js';

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface IUser extends IAuditable, IEntity {
	email?: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	password?: string;
	roles?: Role[];
	_lastLoggedIn?: Date;
	_lastPasswordChange?: Date;
}

// User-specific properties schema
export const UserSchema = Type.Object({
  email: Type.String({
    title: 'Name',
		format: 'email'
  }),
	firstName: Type.Optional(Type.String({
		title: 'First Name'
	})),
	lastName: Type.Optional(Type.String({
		title: 'Last Name'
	})),
	displayName: Type.Optional(Type.String({
		title: 'Display Name'
	})),
	password: Type.String({
		title: 'Password',
		minLength: 6,
		maxLength: 30
	}),
	roles: Type.Array(Type.String({
		title: 'Roles',
		enum: ROLES
	})),
	_lastLoggedIn: TypeboxIsoDate({ title: 'Last Login Date' }),
	_lastPasswordChange: TypeboxIsoDate({ title: 'Last Password Change Date' }),
});

// Public schema (excludes sensitive fields)
const PublicUserSchema = Type.Omit(UserSchema, ['password']);

export const UserSpec = entityUtils.getModelSpec(UserSchema, { isAuditable: true });


// /**
//  * Mutates the passed-in user to remove sensitive information
//  */
// export function cleanUser(user: IUser) {
// 	delete user.password;
// 	// if (user.facebook) {
// 	//   delete user.facebook.token;
// 	// }
// 	// if (user.google) {
// 	//   delete user.google.token;
// 	// }
// }
