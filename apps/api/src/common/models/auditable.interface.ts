import { Type } from '@sinclair/typebox';

export interface IAuditable {
  _created: Date;
  _createdBy: string;
  _updated: Date;
  _updatedBy: string;
}

/**
 * Schema definition for the IAuditable interface to be used in validation and cleaning
 */
export const AuditableSchema = Type.Object({
  _created: Type.String({ format: 'date-time' }),
  _createdBy: Type.String(),
  _updated: Type.String({ format: 'date-time' }),
  _updatedBy: Type.String(),
});
