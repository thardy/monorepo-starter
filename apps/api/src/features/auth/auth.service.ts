import {Db, InsertOneResult, AnyError, ObjectId, Collection} from 'mongodb';
import {Request, Response} from 'express';
import moment from 'moment';
import crypto from 'crypto';

import {BadRequestError, DuplicateKeyError} from '#common/errors/index';
import {JwtService, EmailService, GenericApiService} from '#common/services/index';
import {IUserContext, IUser, LoginResponse, TokenResponse} from '#common/models/index';
import {conversionUtils, entityUtils, passwordUtils} from '#common/utils/index';

import config from '#server/config/config';
import {PasswordResetTokenService} from '#features/auth/password-reset-token.service';

export class AuthService extends GenericApiService<IUser> {
	private refreshTokensCollection: Collection;
	private passwordResetTokenService: PasswordResetTokenService;
	private emailService: EmailService;

	constructor(db: Db) {
		super(db, 'users', 'user');

		this.refreshTokensCollection = db.collection('refreshTokens');
		this.passwordResetTokenService = new PasswordResetTokenService(db);
		this.emailService = new EmailService();
	}

	async logUserIn(userContext: IUserContext, deviceId: string) {
		const payload = userContext;
		const accessToken = this.generateJwt(payload);
		// upon login, we want to create a new refreshToken with a full expiresOn expiration
		const refreshTokenObject = await this.createNewRefreshToken(userContext.user._id!.toString(), deviceId);
		const accessTokenExpiresOn = this.getExpiresOnFromSeconds(config.auth.jwtExpirationInSeconds);

		let loginResponse = null;
		if (refreshTokenObject) {
			const tokenResponse = new TokenResponse({
				accessToken,
				refreshToken: refreshTokenObject.token,
				expiresOn: accessTokenExpiresOn
			});


			// todo: save new lastLoggedIn date (non-blocking) - use an event or async call that we don't wait for
			//this.authService.updateLastLoggedIn(user);
			this.transformSingle(userContext.user);
			loginResponse = new LoginResponse({tokens: tokenResponse, userContext });
		}

		return loginResponse;
	}

	getUserById(id: string) {
		if (!entityUtils.isValidObjectId(id)) {
			return Promise.reject(new TypeError('id is not a valid ObjectId'));
		}

		// todo: remove all these direct collection calls and use the GenericApiService methods instead!!!!!
		return this.collection.findOne({_id: new ObjectId(id)})
			.then((doc) => {
				return doc;
			});
	}

	getUserByEmail(email: string): Promise<IUser> {
		return this.collection.findOne({email: email})
			.then((user: any) => {
				return user;
			});
	}

	async createUser(userContext: IUserContext, user: IUser): Promise<IUser> {
		// You currently don't have to be logged-in to create a user - we'll need to vette exactly what you do need based on the scenario.
		// todo: validate that the user.orgId exists - think through the whole user creation process
		//  I think a user either has to be created by someone with the authorization to do so, or they need to be
		//  joining an org that has open registration, or else they have some sort of invite to join an org,
		//  or initialSetup is occurring.
		const validationResult = this.validate(user);
		entityUtils.handleValidationResult(validationResult, 'AuthService.createUser');

		conversionUtils.convertISOStringDateTimesToJSDates(user);
		// lowercase the email
		user.email = user.email!.toLowerCase();

		const hash = await passwordUtils.hashPassword(user.password!);
		user.password = hash;

		/**
		 * Need to set default roles if new user created without a role.
		 */
		if (!user.roles) {
			user.roles = ["user"];
		}

		await this.onBeforeCreate(userContext, user);

		try {
			const insertResult = await this.collection.insertOne(user);

			if (insertResult.insertedId) {
				this.transformSingle(user);
			}
		} catch (err: any) {
			if (err.code === 11000) {
				throw new DuplicateKeyError('User already exists');
			}
			throw new BadRequestError('Error creating user');
		}
		
		await this.onAfterCreate(userContext, user);
		
		return user; // ignore the result of onAfterCreate and return what the original call returned
	}

	async requestTokenUsingRefreshToken(refreshToken: string, deviceId: string): Promise<TokenResponse | null> {
		// refreshToken - { token, deviceId, userId, expiresOn, created, createdBy, createdByIp, revoked?, revokedBy? }
		//  not using revoked and revokedBy currently - I'm just deleting refreshTokens by userId and deviceId (there can be only one!!)
		let userId = null;

		// look for this particular refreshToken in our database. refreshTokens are assigned to deviceIds,
		//  so they can only be retrieved together.
		const activeRefreshToken = await this.getActiveRefreshToken(refreshToken, deviceId);
		console.log(`activeRefreshToken: ${activeRefreshToken}`); // todo: delete me
		let newTokens = null;
		if (activeRefreshToken) {
			userId = activeRefreshToken.userId;

			if (userId) {
				// we found an activeRefreshToken, and we know what user it was assigned to
				//  - create a new refreshToken and persist it to the database
				// upon refresh, we want to create a new refreshToken maintaining the existing expiresOn expiration
				//newRefreshTokenPromise = this.createNewRefreshToken(userId, deviceId, activeRefreshToken.expiresOn);
				newTokens = await this.createNewTokens(userId, deviceId, activeRefreshToken.expiresOn);
			}
		}

		return newTokens;
	}

	async changeLoggedInUsersPassword(userContext: IUserContext, body: any) {
		const validationResult = User.passwordValidationSchema.validate(body.password, {abortEarly: false});
		entityUtils.handleValidationResult(validationResult, 'AuthService.changePassword');

		const queryObject = {_id: new ObjectId(userContext.user._id!)};
		const result = await this.changePassword(userContext, queryObject, body.password);
		return result;
	}

	async changePassword(userContext: IUserContext, queryObject: any, password: string) {
		// queryObject will either be {_id: someUserId} for loggedInUser change or {email: someEmail} from forgotPassword
		const hashedPassword = await passwordUtils.hashPassword(password);
		const updates = { password: hashedPassword, lastPasswordChange: moment().utc().toDate() };

		await this.onBeforeUpdate(userContext, updates);
		
		const mongoUpdateResult = await this.collection.updateOne(queryObject, {$set: updates});

		if (mongoUpdateResult?.modifiedCount > 0) {
			// only call onAfterUpdate if something was updated
			await this.onAfterUpdate(userContext, updates);
		}

		return mongoUpdateResult;
	}

	async createNewTokens(userId: string, deviceId: string, refreshTokenExpiresOn: number) {
		let createdRefreshTokenObject: any = null;

		const newRefreshToken = await this.createNewRefreshToken(userId, deviceId, refreshTokenExpiresOn);
		let user = null;
		if (newRefreshToken) {
			// we created a brand new refreshToken - now get the user object associated with this refreshToken
			createdRefreshTokenObject = newRefreshToken;
			user = await this.getUserById(userId);
		}

		//  return the new refreshToken and accessToken in a tokenResponse (just like we did in login)
		let tokenResponse = null;
		if (user && createdRefreshTokenObject) {
			// todo: there's a really good chance this will introduce a bug where selectedOrgContext is lost when using refreshToken
			//  to get a new accessToken because we are hard-coding it to the user's org right here.
			//  We'll need to find a way to have the client tell us what the selectedOrg should be when they
			//  call requestTokenUsingRefreshToken() - AND we'll need to VALIDATE that they can select that org
			//  if (selectedOrgId !== user.orgId) then user.isMetaAdmin must be true.
			const payload = {
				user: user, 
				orgId: user.orgId ? String(user.orgId) : undefined
			};  // orgId is the selectedOrg (the org of the user for any non-metaAdmins)
			const accessToken = this.generateJwt(payload);
			const accessTokenExpiresOn = this.getExpiresOnFromSeconds(config.auth.jwtExpirationInSeconds);
			tokenResponse = new TokenResponse({
				accessToken,
				refreshToken: createdRefreshTokenObject.token,
				expiresOn: accessTokenExpiresOn
			});
		}
		return tokenResponse;
	}

	async getActiveRefreshToken(refreshToken: string, deviceId: string) {
		const refreshTokenResult = await this.refreshTokensCollection.findOne({token: refreshToken, deviceId: deviceId});
		let activeRefreshToken = null;

		if (refreshTokenResult) {
			// validate that the refreshToken has not expired
			const now = Date.now();
			const notExpired = refreshTokenResult.expiresOn > now;
			if (notExpired) {
				activeRefreshToken = refreshTokenResult;
			}
		}

		return activeRefreshToken;
	}

	async createNewRefreshToken(userId: string, deviceId: string, existingExpiresOn: number | null = null) {
		// if existingExpiresOn is provided, use it, otherwise we start over.  The expiresOn on the refreshToken basically represents
		//  how often the user must log in.  If we are refreshing from an existing token, we should maintain the existing expiresOn.
		const expiresOn = existingExpiresOn ? existingExpiresOn : this.getExpiresOnFromDays(config.auth.refreshTokenExpirationInDays);

		const newRefreshToken = {
			token: this.generateRefreshToken(),
			deviceId,
			userId,
			expiresOn: expiresOn,
			created: moment().utc().toDate(),
			createdBy: userId
		};

		// delete all other refreshTokens with the same deviceId
		//  todo: At some point, we will need to have a scheduled service go through and delete all expired refreshTokens because
		//   many will probably just expire without ever having anyone re-login on that device.
		const deleteResult = await this.deleteRefreshTokensForDevice(deviceId)
		const insertResult = await this.refreshTokensCollection.insertOne(newRefreshToken);
		let tokenResult = null;
		if (insertResult.insertedId) {  // presence of an insertedId means the insert was successful
			tokenResult = newRefreshToken;
		}
		return tokenResult;
	}

	async sendResetPasswordEmail(emailAddress: string) {
		// create passwordResetToken
		const expiresOn = this.getExpiresOnFromMinutes(config.auth.passwordResetTokenExpirationInMinutes);
		const passwordResetToken = await this.passwordResetTokenService.createPasswordResetToken(emailAddress, expiresOn);

		// create reset password link
		const httpOrHttps = config.env === 'local' ? 'http' : 'https';
		const urlEncodedEmail = encodeURIComponent(emailAddress);
		const clientUrl = config.hostName
		const resetPasswordLink = `${httpOrHttps}://${clientUrl}/reset-password/${passwordResetToken.token}/${urlEncodedEmail}`;

		const htmlEmailBody = `<strong><a href="${resetPasswordLink}">Reset Password</a></strong>`;
		await this.emailService.sendHtmlEmail(emailAddress, 'Reset Password for Risk Answers', htmlEmailBody);
	}

	async resetPassword(email: string, passwordResetToken: string, password: string) {
		// fetch passwordResetToken
		const retrievedPasswordResetToken = await this.passwordResetTokenService.getByEmail(email);
		// Validate they sent the same token that we have saved for this email (there can only be one) and that it hasn't expired
		if (retrievedPasswordResetToken.token !== passwordResetToken || retrievedPasswordResetToken.expiresOn < Date.now()) {
			throw new BadRequestError('Invalid password reset token');
		}

		// update user password
		const result = await this.changePassword(User.emptyUserContext, {email}, password);
		console.log(`password changed using forgot-password for email: ${email}`);

		// delete passwordResetToken
		await this.passwordResetTokenService.deleteById(User.emptyUserContext, retrievedPasswordResetToken._id!);
		console.log(`passwordResetToken deleted for email: ${email}`);

		return result;
	}

	deleteRefreshTokensForDevice(deviceId: string) {
		return this.refreshTokensCollection.deleteMany({deviceId: deviceId});
	}

	generateJwt(payload: any) {
		// Ensure orgId is a string before signing to prevent type inconsistencies when deserializing
		if (payload.orgId !== undefined) {
			payload.orgId = String(payload.orgId);
		}
		
		// generate the jwt (uses jsonwebtoken library)
		const jwtExpiryConfig = config.auth.jwtExpirationInSeconds;
		const jwtExpirationInSeconds = (typeof jwtExpiryConfig === 'string') ? parseInt(jwtExpiryConfig) : jwtExpiryConfig;

		const accessToken = JwtService.sign(
			payload,
			// todo: fix this - either add it back or come up with a better way to handle passing config to api-common
			//config.apiCommonConfig.clientSecret,
			'secret',
			{
				expiresIn: jwtExpirationInSeconds
			}
		);
		return accessToken;
	};

	generateRefreshToken() {
		return crypto.randomBytes(40).toString('hex');
	}

	generateDeviceId() {
		return crypto.randomBytes(40).toString('hex');
	}

	getAndSetDeviceIdCookie(req: Request, res: Response) {
		let isNewDeviceId = false;
		let deviceId = '';
		const deviceIdFromCookie = this.getDeviceIdFromCookie(req);

		if (deviceIdFromCookie) {
			deviceId = deviceIdFromCookie;
		} else {
			deviceId = this.generateDeviceId();
			isNewDeviceId = true;
			// todo: send out an email telling the user that there was a login from a new device
			//const htmlEmailBody = `There has been a login from a new device. If this was not you, please reset your password immediately.`;
			//this.emailService.sendHtmlEmail(emailAddress, 'Reset Password for Risk Answers', htmlEmailBody);
		}

		if (isNewDeviceId) {
			// save deviceId as cookie on response
			const cookieOptions: any = {
				maxAge: config.auth.deviceIdCookieMaxAgeInDays * 24 * 60 * 60 * 1000,
				httpOnly: true
			};
			if (config.env === 'local' || config.env === 'dev') {
				console.log('setting deviceId cookieOptions sameSite=none and secure=true');
				cookieOptions['sameSite'] = 'none'; // CANNOT be 'none' unless using secure (have to use https)
				cookieOptions['secure'] = true;
			}

			// save deviceId as cookie on response
			res.cookie('deviceId', deviceId, cookieOptions);
		}

		return deviceId;
	}

	getDeviceIdFromCookie(req: Request) {
		console.log(`req.cookies: ${JSON.stringify(req.cookies)}`); // todo: delete me
		return req.cookies['deviceId'];
	}

	getExpiresOnFromSeconds(expiresInSeconds: number) {
		// exactly when the token expires (in milliseconds since Jan 1, 1970 UTC)
		return Date.now() + expiresInSeconds * 1000;
	}

	getExpiresOnFromMinutes(expiresInMinutes: number) {
		// exactly when the token expires (in milliseconds since Jan 1, 1970 UTC)
		return Date.now() + expiresInMinutes * 60 * 1000
	}

	getExpiresOnFromDays(expiresInDays: number) {
		// exactly when the token expires (in milliseconds since Jan 1, 1970 UTC)
		return Date.now() + expiresInDays * 24 * 60 * 60 * 1000
	}
	
	override transformList(users: IUser[]) {
		return super.transformList(users);
	}

	override transformSingle(user: IUser) {
		super.transformSingle(user);
		return user;
	}

}
