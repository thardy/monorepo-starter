// import mongoose, { Schema, Document, Types, ObjectId } from 'mongoose';
import { Type, Static } from '@sinclair/typebox';
import { IAuditable } from '#root/src/common/models/auditable.interface';
import { IEntity } from '#root/src/common/models/entity.interface';
import { entityUtils } from '#root/src/common/utils/entity.utils';

// TypeScript interface
export interface IProduct extends IEntity, IAuditable {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

// todo: test this and figure out how TypeBox default errors look, then customize accordingly (we might just want to use title
//  like we used label in Joi and get rid of errorMessage)
// Product-specific properties schema
const ProductSchema = Type.Object({
  name: Type.String({
    errorMessage: 'Product name is required',
    title: 'Name'
  }),
  description: Type.Optional(Type.String({
    title: 'Description'
  })),
  price: Type.Number({
    minimum: 0,
    multipleOf: 0.01,
    //errorMessage: 'Price must be a positive number',
    title: 'Price'
  }),
  quantity: Type.Number({
    minimum: 10,
    multipleOf: 5,
    //errorMessage: 'Quantity must be a positive integer',
    title: 'Quantity'
  })
});

console.log(`ProductSchema in json-schema format:: ${JSON.stringify(ProductSchema, null, 2)}`); // todo: delete me


// Full product schema with entity and auditable fields
// export const ProductSchema = Type.Intersect([
//   EntitySchema,
//   AuditableSchema,
//   ProductPropertiesSchema
// ]);

// todo: refactor as much of this out as possible - if possible.
// Partial schema for PATCH operations
export const ProductPartialSchema = Type.Partial(ProductSchema);

// Compile validators with meaningful cache keys
export const ProductValidator = entityUtils.getValidator(ProductSchema, 'ProductSchema');
export const ProductPartialValidator = entityUtils.getValidator(ProductPartialSchema, 'ProductPartialSchema');

// TypeScript type
export type ProductType = Static<typeof ProductSchema>;

// export interface IProductDoc extends IProduct, Document<ObjectId> { }

// const productSchema = new Schema<IProductDoc>({
//   name: { type: String, required: true },
//   description: { type: String, required: false },
//   price: { type: Number, required: true },
//   quantity: { type: Number, required: true },
//   // Add auditable fields from IAuditable interface - Mongoose will only persist fields that are explicitly defined in the schema,
//   //  extending an interface is not enough.
//   _created: { type: Date },
//   _createdBy: { type: String },
//   _updated: { type: Date },
//   _updatedBy: { type: String }
// });

// export const Product = mongoose.model<IProductDoc>('product', productSchema, 'products');



// todo: Do this stuff above!!!!
// // Define the interface for a Project document
// export interface IProject extends Document {
//     user: mongoose.Schema.Types.ObjectId; // Reference to the user
//     title: string;
//     company?: string; // Optional
//     description?: string; // Optional
//     startDate?: Date | string | null;  // Allow Date, string, or null
//     endDate?: Date | string | null;  // Allow Date, string, or null
//     createdAt: Date;
//     updatedAt: Date;
// }

// const projectSchema: Schema = new Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User', // Assuming you have a User model
//         required: true,
//     },
//     title: {
//         type: String,
//         required: true,
//     },
//     company: {
//         type: String,
//     },
//     description: {
//         type: String,
//     },
//     startDate: {
//         type: Schema.Types.Mixed,  // Use Mixed type
//         validate: [
//             {
//                 validator: (v: any) => {
//                     if (v === null || v === undefined) {
//                         return true; // Allow null/undefined
//                     }
//                     return (typeof v === 'string' || v instanceof Date); // Accept string or Date
//                 },
//                 message: 'startDate must be a string or a Date',
//             }
//         ],
//         transform: (v: any) => {
//             if (typeof v === 'string') {
//                 return new Date(v); // Convert string to Date
//             }
//             return v; // Return as is if it's already a Date
//         }
//     },
//     endDate: {
//         type: Schema.Types.Mixed,  // Use Mixed type
//         validate: [
//             {
//                 validator: (v: any) => {
//                     if (v === null || v === undefined) {
//                         return true; // Allow null/undefined
//                     }
//                     return (typeof v === 'string' || v instanceof Date); // Accept string or Date
//                 },
//                 message: 'endDate must be a string or a Date',
//             }
//         ],
//         transform: (v: any) => {
//             if (typeof v === 'string') {
//                 return new Date(v); // Convert string to Date
//             }
//             return v; // Return as is if it's already a Date
//         }
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
//     updatedAt: {
//         type: Date,
//         default: Date.now,
//     },
// });

// export default mongoose.model<IProject>('Project', projectSchema);