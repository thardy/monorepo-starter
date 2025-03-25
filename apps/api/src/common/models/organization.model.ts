import {IAuditable} from './auditable.interface.js';

export interface IOrganization extends IAuditable {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  isMetaOrg?: boolean;
  authToken?: string;
}

export class Organization implements IOrganization {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  isMetaOrg?: boolean;
  authToken?: string;

  constructor(options: IOrganization = {}) {
    this.id = options.id ?? undefined;
    this.name = options.name ?? undefined;
    this.code = options.code ?? undefined;
    this.description = options.description ?? undefined;
    this.status = options.status ?? 1;
    this.isMetaOrg = options.isMetaOrg ?? false;
    this.authToken = options.authToken ?? undefined;
  }

  // static validationSchema = Joi.object().keys({
  //   id: Joi.string(),
  //   name: Joi.string()
  //     .required(),
  //   code: Joi.string()
  //     .required(),
  //   description: Joi.string().allow(''),
  //   status: Joi.number(), // todo: add a reference to all possible statuses
  //   isMetaOrg: Joi.boolean(),
  //   authToken: Joi.string(),
  // });

}
