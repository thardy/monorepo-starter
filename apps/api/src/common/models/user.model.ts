import { TypeboxIsoDate, TypeboxMoney } from '../validation/typebox-extensions.js';
import {IAuditable} from './auditable.interface.js';
import {IEntity} from './entity.interface.js';
import {Type} from '@sinclair/typebox';
import {entityUtils} from '../utils/entity.utils.js';
import { TypeCompiler } from '@sinclair/typebox/compiler';

export interface IUser extends IAuditable, IEntity {
	email?: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	password?: string;
	roles?: string[];
	_lastLoggedIn?: Date;
	_lastPasswordChange?: Date;
}

export const UserPasswordSchema = Type.Object({
	password: Type.String({
		title: 'Password',
		minLength: 6,
		maxLength: 30
	}),
});

// Create a validator for just the password schema
export const passwordValidator = TypeCompiler.Compile(UserPasswordSchema);

// User-specific properties schema
export const UserSchema = Type.Object({
  email: Type.String({
    title: 'Email',
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
	// Add password using the same type definition from UserPasswordSchema
	password: Type.Optional(UserPasswordSchema.properties.password),
	roles: Type.Array(Type.String({
		title: 'Roles',
		// We are going to allow defining roles in the database - they won't be hard-coded here
	})),
	_lastLoggedIn: TypeboxIsoDate({ title: 'Last Login Date' }),
	_lastPasswordChange: TypeboxIsoDate({ title: 'Last Password Change Date' }),
});

// Public schema (excludes sensitive fields)
export const PublicUserSchema = Type.Omit(UserSchema, ['password']);

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
