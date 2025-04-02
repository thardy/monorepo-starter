import {Application, Request, Response, NextFunction} from 'express';
import {Db, ObjectId, UpdateResult} from 'mongodb';

import {BadRequestError, NotFoundError, UnauthenticatedError} from '#common/errors/index';
import {isAuthenticated} from '#common/middleware/is-authenticated';
import {passwordUtils, apiUtils} from '#common/utils/index';
import {LoginResponse, IUser, TokenResponse, IUserContext} from '#common/models/index';

import {AuthService} from './auth.service.js';

export class AuthController {
  authService: AuthService;

  constructor(app: Application, db: Db) {
    const authService = new AuthService(db);
    this.authService = authService;

    this.mapRoutes(app);
  }

  mapRoutes(app: Application) {
    app.post(`/api/auth/login`, this.login.bind(this), this.afterAuth.bind(this));
    // todo: as soon as we get mongoDb initialization working, lock this (register) behind isAuthenticated
    app.post(`/api/auth/register`, this.registerUser.bind(this));
    app.get(`/api/auth/refresh`, this.requestTokenUsingRefreshToken.bind(this));
    app.get(`/api/auth/get-user-context`, isAuthenticated, this.getUserContext.bind(this));
	  app.patch(`/api/auth/change-password`, isAuthenticated, this.changePassword.bind(this));
	  app.post(`/api/auth/forgot-password`, this.forgotPassword.bind(this));
		app.post(`/api/auth/reset-password`, this.resetPassword.bind(this));
  }

  async login(req: Request, res: Response, next: NextFunction) {
    //console.log(`entering login()`); // todo: delete me
		const { email, password } = req.body;
    res.set('Content-Type', 'application/json');

		const lowerCaseEmail = email.toLowerCase();
    const user = await this.authService.getUserByEmail(lowerCaseEmail);
    if (!user) {
      throw new BadRequestError('Invalid Credentials');
    }

    const passwordsMatch = await passwordUtils.comparePasswords(user.password!, password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid Credentials');
    }

	  // Now that we have compared the password, let's clean the user, so we don't send the password anywhere
    //cleanUser(user); // todo: consider finding a Typebox way to make sure this happens (encode?) apiUtils.apiResponse!!!! and a PublicUser schema!!!

    // todo: find a way to make auth multi-tenant aware. Be able to flip it on and off without hardcoding one way or the other
    const userContext = { user: user, orgId: user.orgId };
    //const userContext = { user: user };
		const deviceId = this.authService.getAndSetDeviceIdCookie(req, res);
		//console.log(`In authController. deviceId: ${deviceId}`); // todo: delete me
    const loginResponse = await this.authService.logUserIn(userContext, deviceId);
		//console.log(`loginResponse: ${JSON.stringify(loginResponse)}`); // todo: delete me

		// const status = 200;
		// const apiResponse = apiUtils.apiResponse<LoginResponse>(status, loginResponse);
    // return res.status(status).json(apiResponse);
	  return apiUtils.apiResponse<LoginResponse | null>(res, 200, {data: loginResponse});
  }

  async registerUser(req: Request, res: Response) {
    const userContext = req.userContext;
    console.log(`userContext: ${JSON.stringify(userContext)}`); // todo: delete me
    const body = req.body;

    // we're not handling errors here anymore because createUser throws errors and middleware handles them
    const user = await this.authService.createUser(userContext!, body);

    //return res.status(201).json(apiResponse);
    return apiUtils.apiResponse<IUser>(res, 201, {data: user});
  }

  async requestTokenUsingRefreshToken(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.query.refreshToken;
    const deviceId = this.authService.getDeviceIdFromCookie(req);
		console.log(`deviceId: ${deviceId}`); // todo: delete me
    let tokens: TokenResponse | null = null;

    if (refreshToken && typeof refreshToken === 'string') {
      tokens = await this.authService.requestTokenUsingRefreshToken(refreshToken, deviceId);
    }

    if (tokens) {
      //return res.status(200).json(tokens);
	    return apiUtils.apiResponse<TokenResponse>(res, 200, {data: tokens});
    }
    else {
			throw new UnauthenticatedError();
    }
  }

  async getUserContext(req: Request, res: Response, next: NextFunction) {
    const userContext = req.userContext;
    const clientUserContext = {user: userContext!.user};
    //return res.status(200).json(clientUserContext);
	  return apiUtils.apiResponse<IUserContext>(res, 200, {data: clientUserContext});
  }

  afterAuth(req: Request, res: Response, loginResponse: any) {
    console.log('in afterAuth');
  }

	async changePassword(req: Request, res: Response) {
		const userContext = req.userContext!;
		const body = req.body;

		const updateResult = await this.authService.changeLoggedInUsersPassword(userContext, body);
		//return res.status(200).json(user);
		return apiUtils.apiResponse<UpdateResult>(res, 200, {data: updateResult});
	}

	async forgotPassword(req: Request, res: Response) {
		const email = req.body?.email;

		const user = await this.authService.getUserByEmail(email);
		if (user) {
			// only try to send an email if we have a user with this email
			await this.authService.sendResetPasswordEmail(email);
		}

		return apiUtils.apiResponse<any>(res, 200);
	}

	async resetPassword(req: Request, res: Response) {
		const { email, token, password } = req.body;

		if (!email || !token || !password) {
			throw new BadRequestError('Missing required fields: email, token, and password are required.');
		}

		const response = await this.authService.resetPassword(email, token, password);
		return apiUtils.apiResponse<any>(res, 200, {data: response});
	}



}
