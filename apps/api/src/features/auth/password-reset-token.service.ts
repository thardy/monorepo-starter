import {Db, ObjectId} from 'mongodb';
import crypto from 'crypto';
import moment from 'moment';
import {GenericApiService} from '#common/services/index';
import {EmptyUserContext} from '#common/models/index';
import {IPasswordResetToken, PasswordResetTokenSpec} from './password-reset-token.interface.js';

export class PasswordResetTokenService extends GenericApiService<IPasswordResetToken> {
	constructor(db: Db) {
		super(db, 'passwordResetTokens', 'passwordResetToken', PasswordResetTokenSpec);
	}

	async createPasswordResetToken(email: string, expiresOn: number): Promise<IPasswordResetToken | null> {

		await this.collection.deleteMany({email});

		const passwordResetToken: Partial<IPasswordResetToken> = {
			email,
			token: crypto.randomBytes(40).toString('hex'),
			expiresOn: expiresOn,
		};

		return super.create(EmptyUserContext, passwordResetToken);
	}

	async getByEmail(email: string): Promise<IPasswordResetToken | null> {
		return  await super.findOne(EmptyUserContext, {email});
	}
}
