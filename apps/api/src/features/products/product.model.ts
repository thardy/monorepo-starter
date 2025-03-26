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

// Partial schema for PATCH operations
export const ProductPartialSchema = Type.Partial(ProductSchema);

// Compile validators only once
export const ProductValidator = entityUtils.getValidator(ProductSchema);
export const ProductPartialValidator = entityUtils.getValidator(ProductPartialSchema);

// TypeScript type - this only contains the product properties (name, description, price, quantity). Is this needed?
export type ProductType = Static<typeof ProductSchema>;

// todo: consider moving all validator and schema stuff into a standard interface and have an entity.utils function return it
//  then we could collapse a lot of the above lines into a single line like...
//  expose const validationStuff = entityUtils.getValidationStuff(ProductSchema)
