import { IEntity, EntitySchema } from "./entity.interface.js";
import { Type } from '@sinclair/typebox';

export interface IMultiTenantEntity extends IEntity {
  _orgId: string;
}

/**
 * Schema definition for the IMultiTenantEntity interface to be used in validation and cleaning
 */
export const MultiTenantEntitySchema = Type.Intersect([
  EntitySchema,
  Type.Object({
    _orgId: Type.String()
  })
]);