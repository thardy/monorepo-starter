import {IAuditable} from './auditable.interface.js';
import {IEntity} from './entity.interface.js';
import { ObjectId } from 'mongoose';

export const ROLES = ["user", "editor", "admin", "developer"] as const;
export type Role = (typeof ROLES)[number];

export interface IUser extends IAuditable, IEntity {
	email?: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	lastLoggedIn?: Date;
	lastPasswordChange?: Date;
	password?: string
	created?: Date;
	createdBy?: string;
	updated?: Date;
	updatedBy?: string;
	role?: Role;
}

// todo: Mongoosify this

// export class User implements IUser {
// 	_id: ObjectId;
// 	email?: string;
// 	firstName?: string;
// 	lastName?: string;
// 	displayName?: string;
// 	lastLoggedIn?: Date;
// 	lastPasswordChange?: Date;
// 	password?: string;
// 	created?: Date;
// 	createdBy?: string;
// 	updated?: Date;
// 	updatedBy?: string;
// 	role?: Role;

// 	constructor(options: IUser = {}) {
// 		this.id = options.id ?? undefined;
// 		this.orgId = options.orgId ?? undefined;
// 		this.email = options.email ?? undefined;
// 		this.firstName = options.firstName ?? '';
// 		this.lastName = options.lastName ?? '';
// 		this.displayName = options.displayName ?? '';
// 		this.lastLoggedIn = options.lastLoggedIn ?? undefined;
// 		this.lastPasswordChange = options.lastPasswordChange ?? undefined;
// 		this.password = options.password ?? '';
// 		this.role = options.role ?? "user";
// 	}

// 	static emptyUserContext = {user: new User()};

// 	static passwordValidationSchema = Joi.string()
// 		.trim()
// 		.required()
// 		.min(4)
// 		.max(30);

// 	static validationSchema = Joi.object().keys({
// 		// orgId: Joi.string()
// 		//   .required(),
// 		email: Joi.string()
// 			.email()
// 			.required()
// 			.allow('admin'),
// 		orgId: Joi.string(),
// 		firstName: Joi.string()
// 			.label('First Name'),
// 		lastName: Joi.string()
// 			.label('Last Name'),
// 		password: User.passwordValidationSchema,
// 		role: Joi.string()
// 	});

// 	/**
// 	 * Mutates the passed-in user to remove sensitive information
// 	 */
// 	static cleanUser(user: User) {
// 		delete user.password;
// 		// if (user.facebook) {
// 		//   delete user.facebook.token;
// 		// }
// 		// if (user.google) {
// 		//   delete user.google.token;
// 		// }
// 	}

// }
