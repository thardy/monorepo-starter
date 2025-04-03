import {IEntity, IAuditable} from '#common/models/index';
import { entityUtils } from '#root/src/common/utils/index';
import { Type } from '@sinclair/typebox';

export interface IPasswordResetToken extends IEntity, IAuditable {
	email: string;
	token: string;
	expiresOn: number;
}

// PasswordResetToken-specific properties schema
export const PasswordResetTokenSchema = Type.Object({
  email: Type.String({
    title: 'Email',
		format: 'email'
  }),
  token: Type.String({
    title: 'Token'
  }),
  expiresOn: Type.Number({
    title: 'Expires On'
  })
});

export const PasswordResetTokenSpec = entityUtils.getModelSpec(PasswordResetTokenSchema, { isAuditable: true });
