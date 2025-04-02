import {IAuditable} from './auditable.interface.js';
import {IEntity} from './entity.interface.js';

export interface IOrganization extends IAuditable, IEntity {
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  isMetaOrg?: boolean;
  authToken?: string;
}

// export class Organization implements IOrganization {
//   _id: ObjectId;
//   name?: string;
//   code?: string;
//   description?: string;
//   status?: number;
//   isMetaOrg?: boolean;
//   authToken?: string;
//   _created: Date;
//   _createdBy: string;
//   _updated: Date;
//   _updatedBy: string;
  

//   constructor(options: Partial<IOrganization> = {}) {
//     this._id = options._id ?? new ObjectId();
//     this.name = options.name ?? undefined;
//     this.code = options.code ?? undefined;
//     this.description = options.description ?? undefined;
//     this.status = options.status ?? 1;
//     this.isMetaOrg = options.isMetaOrg ?? false;
//     this.authToken = options.authToken ?? undefined;
//     this._created = options._created ?? new Date();
//     this._createdBy = options._createdBy ?? 'system';
//     this._updated = options._updated ?? new Date();
//     this._updatedBy = options._updatedBy ?? 'system';
    
//   }

//   // static validationSchema = Joi.object().keys({
//   //   id: Joi.string(),
//   //   name: Joi.string()
//   //     .required(),
//   //   code: Joi.string()
//   //     .required(),
//   //   description: Joi.string().allow(''),
//   //   status: Joi.number(), // todo: add a reference to all possible statuses
//   //   isMetaOrg: Joi.boolean(),
//   //   authToken: Joi.string(),
//   // });

// }
