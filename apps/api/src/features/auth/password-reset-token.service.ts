import {Db, ObjectId} from 'mongodb';
import crypto from 'crypto';
import moment from 'moment';
import {GenericApiService} from '@meritas-digital/api-common/services';
import {User} from '@meritas-digital/risk-answer-models';
import {IPasswordResetToken} from './password-reset-token.interface.js';

export class PasswordResetTokenService extends GenericApiService<IPasswordResetToken> {
	constructor(db: Db) {
		super(db, 'passwordResetTokens', 'passwordResetToken');
	}

	async createPasswordResetToken(email: string, expiresOn: number): Promise<IPasswordResetToken> {

		await this.collection.deleteMany({email});

		const passwordResetToken: IPasswordResetToken = {
			email,
			token: crypto.randomBytes(40).toString('hex'),
			expiresOn: expiresOn,
			created: moment().utc().toDate()
		};

		const userContext = User.emptyUserContext;
		return super.create(userContext, passwordResetToken);
	}

	async getByEmail(email: string): Promise<IPasswordResetToken> {
		const entity = await this.collection.findOne({email});
		return this.transformSingle(entity);
	}
}
