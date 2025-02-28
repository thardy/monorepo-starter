import {DeleteResult, Document, FindOptions} from 'mongodb';
import {IUserContext, IEntity, QueryOptions, IPagedResult} from '@meritas-digital/risk-answer-models';

export interface IGenericApiService<T extends IEntity> {
  getAll(userContext: IUserContext): Promise<T[]>;
	get(userContext: IUserContext, queryOptions: QueryOptions): Promise<IPagedResult<T>>;
  getById(userContext: IUserContext, id: string): Promise<T>;
	getCount(userContext: IUserContext): Promise<number>;
	create(userContext: IUserContext, item: T): Promise<T>;
  fullUpdateById(userContext: IUserContext, id: string, item: T): Promise<any>;
	partialUpdateById(userContext: IUserContext, id: string, item: T): Promise<any>;
  partialUpdateByIdWithoutBeforeAndAfter(userContext: IUserContext, id: string, item: T): Promise<any>;
  update(userContext: IUserContext, queryObject: any, item: T): Promise<any>;
  deleteById(userContext: IUserContext, id: string): Promise<DeleteResult>;
  find(userContext: IUserContext, mongoQueryObject: any, options?: FindOptions<Document> | undefined): Promise<T[]>;
  findOne(userContext: IUserContext, mongoQueryObject: any, options?: FindOptions<Document> | undefined): Promise<T>;
}
