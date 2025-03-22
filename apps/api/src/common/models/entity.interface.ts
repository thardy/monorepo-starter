import { ObjectId } from "mongoose";

export interface IEntity {
  _id: ObjectId,
}

// export const EntityValidationSchema = Joi.object().keys({
// 	id: Joi.string(),
// 	orgId: Joi.string(),
// });

