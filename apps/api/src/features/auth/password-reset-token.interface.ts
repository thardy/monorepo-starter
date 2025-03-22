import {IEntity} from '@meritas-digital/risk-answer-models';

export interface IPasswordResetToken extends IEntity {
	email: string;
	token: string;
	expiresOn: number;
	created: Date;
}
