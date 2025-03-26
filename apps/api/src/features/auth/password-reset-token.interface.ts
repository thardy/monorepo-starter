import {IEntity} from '#common/models/index';

export interface IPasswordResetToken extends IEntity {
	email: string;
	token: string;
	expiresOn: number;
	created: Date;
}
