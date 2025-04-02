// import mongoose, { Schema, Document, Types, ObjectId } from 'mongoose';
import { Type, Static } from '@sinclair/typebox';
import { IAuditable } from '#root/src/common/models/auditable.interface';
import { IEntity } from '#common/models/index';
import { entityUtils } from '#common/utils/index';
import { TypeboxMoney } from '#common/validation/index';
import { TypeboxIsoDate } from '#common/validation/index';

// TypeScript interface - this contains the product properties (name, description, price, quantity) and the entity and auditable properties
export interface IProduct extends IEntity, IAuditable {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  someDate: Date;
}

// Product-specific properties schema
export const ProductSchema = Type.Object({
  name: Type.String({
    title: 'Name'
  }),
  description: Type.Optional(Type.String({
    title: 'Description'
  })),
  price: TypeboxMoney({
    minimum: 0,
    title: 'Price'
  }),
  quantity: Type.Number({
    minimum: 0,
    title: 'Quantity'
  }),
  someDate: TypeboxIsoDate
});

export const ProductSpec = entityUtils.getModelSpec(ProductSchema, { isAuditable: true });

// // TypeScript type - this only contains the product properties (name, description, price, quantity). Is this needed?
// export type ProductType = Static<typeof ProductSchema>;




