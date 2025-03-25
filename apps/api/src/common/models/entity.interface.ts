import { ObjectId } from "mongodb";

export interface IEntity {
  _id: ObjectId,
}

// export const EntitySchema = Type.Object({
//   _id: Type.String({
//     format: 'objectId',
//     errorMessage: 'Invalid ID format'
//   })
// });



