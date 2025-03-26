// import mongoose, { Schema, Document, Types, ObjectId } from 'mongoose';
import { Type, Static } from '@sinclair/typebox';
import { IAuditable } from '#root/src/common/models/auditable.interface';
import { IEntity } from '#root/src/common/models/entity.interface';
import { entityUtils } from '#root/src/common/utils/entity.utils';

// TypeScript interface - this contains the product properties (name, description, price, quantity) and the entity and auditable properties
export interface IProduct extends IEntity, IAuditable {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

// Product-specific properties schema
export const ProductSchema = Type.Object({
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

export const ProductSpec = entityUtils.getModelSpec(ProductSchema);

// // TypeScript type - this only contains the product properties (name, description, price, quantity). Is this needed?
// export type ProductType = Static<typeof ProductSchema>;




