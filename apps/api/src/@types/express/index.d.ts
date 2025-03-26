import {IUserContext} from '#common/models/index';

declare global{
  namespace Express {
    interface Request {
      userContext?: IUserContext,
    }
  }
}
