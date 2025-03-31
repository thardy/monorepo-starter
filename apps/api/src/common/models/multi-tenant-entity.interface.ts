import { TypeboxObjectId } from "../validation/typebox-setup.js";
import { IEntity } from "./entity.interface.js";
import { Type } from '@sinclair/typebox';

export interface IMultiTenantEntity extends IEntity {
  _orgId: string;
}

/**
 * Schema definition for the IMultiTenantEntity interface to be used in validation and cleaning
 */
export const MultiTenantEntitySchema = Type.Object({
  _id: TypeboxObjectId,
  _orgId: Type.String(),
});