import { IEntity } from "./entity.interface.js";

export interface IMultiTenantEntity extends IEntity {
  _orgId?: string;
}