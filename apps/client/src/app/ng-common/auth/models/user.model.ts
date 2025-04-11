import {IEntity} from '@common/models/entity.interface';

export const ROLES = ["user", "editor", "admin", "developer"] as const;
export type Role = (typeof ROLES)[number];

export class IUser implements IEntity {
  id?: string;
  //orgId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  lastLoggedIn?: Date;
  password?: string
  created?: Date;
  createdBy?: string;
  updated?: Date;
  updatedBy?: string;
  role?: Role;
}

export class User implements IUser {
  id?: string;
  //orgId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  lastLoggedIn?: Date;
  password?: string;
  created?: Date;
  createdBy?: string;
  updated?: Date;
  updatedBy?: string;
  role?: Role;

  constructor(options: IUser = {}) {
    this.id = options.id ?? undefined;
    //this.orgId = options.orgId ?? undefined;
    this.email = options.email ?? undefined;
    this.firstName = options.firstName ?? '';
    this.lastName = options.lastName ?? '';
    this.displayName = options.displayName ?? '';
    this.lastLoggedIn = options.lastLoggedIn ?? undefined;
    this.password = options.password ?? '';
    this.role = options.role ?? "user";
  }

}
