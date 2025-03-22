import mongoose, { Schema, Document, Types, ObjectId } from 'mongoose';
import { IAuditable } from '#root/src/common/models/auditable.interface';
import { IEntity } from '#root/src/common/models/entity.interface';

export interface IProduct extends IEntity, IAuditable {// extends Document, IAuditable {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface IProductDoc extends IProduct, Document<ObjectId> { }

const productSchema = new Schema<IProductDoc>({
  name: { type: String, required: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  // Add auditable fields from IAuditable interface - Mongoose will only persist fields that are explicitly defined in the schema,
  //  extending an interface is not enough.
  _created: { type: Date },
  _createdBy: { type: String },
  _updated: { type: Date },
  _updatedBy: { type: String }
});

export const Product = mongoose.model<IProductDoc>('product', productSchema, 'products');



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