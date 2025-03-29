import { ObjectId } from "mongodb";
import { Type } from '@sinclair/typebox';

export interface IEntity {
  _id: ObjectId,
}

/**
 * Schema definition for the IEntity interface to be used in validation and cleaning
 */
export const EntitySchema = Type.Object({
  _id: Type.String({ format: 'objectId' })
});



