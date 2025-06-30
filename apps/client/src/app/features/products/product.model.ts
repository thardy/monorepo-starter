import { Type, Static } from '@sinclair/typebox';
import { IAuditable, IEntity, } from '@loomcore/common/models';
import { entityUtils } from '@loomcore/common/utils';
import { TypeboxMoney } from '@loomcore/common/validation';
import { TypeboxIsoDate } from '@loomcore/common/validation';

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
  someDate: TypeboxIsoDate()
});

export const ProductSpec = entityUtils.getModelSpec(ProductSchema, { isAuditable: true });