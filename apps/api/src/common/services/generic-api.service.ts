import {Db, Collection, ObjectId, DeleteResult, Document, FindOptions} from 'mongodb';
import moment from 'moment';
import Joi from 'joi';
import _ from 'lodash';
import {BadRequestError, DuplicateKeyError, IdNotFoundError, NotFoundError} from '../errors/index.js';

import {IGenericApiService} from './generic-api-service.interface.js';
import {IAuditable, IUserContext, IEntity, QueryOptions, IPagedResult} from '@meritas-digital/risk-answer-models';
import {entityUtils, apiUtils, dbUtils} from '../utils/index.js';

// todo: Enforce multi-tenancy on everything here
export class GenericApiService<T extends IEntity> implements IGenericApiService<T> {
  protected db: Db;
	/**
	 * This is camel-cased, plural (e.g. 'weatherAlerts')
	 */
	protected pluralResourceName: string;
	/**
	 * This is camel-cased, singular (e.g. 'weatherAlert')
	 */
  protected singularResourceName: string;
  protected collection: Collection;

  constructor(db: Db, pluralResourceName: string, singularResourceName: string) {
    this.db = db;
    this.pluralResourceName = pluralResourceName;
    this.singularResourceName = singularResourceName;
    this.collection = db.collection(pluralResourceName);
  }

  async getAll(userContext: IUserContext): Promise<T[]> {
    const cursor = this.collection.find({});
    const entities = await cursor.toArray();
    // allow derived classes to transform the result
    return this.transformList(entities);
  }

	async get(userContext: IUserContext, queryOptions: QueryOptions = new QueryOptions()): Promise<IPagedResult<T>> {
		// Construct the query object
		// this is supposed to be the fastest way to perform a query AND get the total documents count in MongoDb
		//{ $match: { categoryId: { eq: "6773166188e8d5785a072f8a"} } },
		const match = dbUtils.buildMongoMatchFromQueryOptions(queryOptions);
		const results: any[] = [];
		if (queryOptions.orderBy) {
			results.push({ $sort: { [queryOptions.orderBy]: queryOptions.sortDirection === 'asc' ? 1 : -1 } });
		}
		if (queryOptions.page && queryOptions.pageSize) {
			results.push({ $skip: (queryOptions.page - 1) * queryOptions.pageSize });
			results.push({ $limit: queryOptions.pageSize });
		}

		const pipeline = [
			match,
			{
				$facet: {
					results: results,
					total: [
						{ $count: 'total' }
					]
				}
			}
		];

		let pagedResult: IPagedResult<T> = apiUtils.getPagedResult<T>([], 0, queryOptions);
		const aggregateResult = await this.collection.aggregate(pipeline).next();
		if (aggregateResult) {
			let total = 0;
			if (aggregateResult.total && aggregateResult.total.length > 0) {
				// not sure how to get the aggregate pipeline above to return total as anything but an array
				total = aggregateResult.total[0].total;
			}
			const entities = this.transformList(aggregateResult.results);
			pagedResult = apiUtils.getPagedResult<T>(entities, total, queryOptions);
		}
		return pagedResult;
	}

  async getById(userContext: IUserContext, id: string): Promise<T> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }

    const entity = await this.collection.findOne({_id: new ObjectId(id)});

    if (!entity) {
      throw new IdNotFoundError();
    }

    // allow derived classes to transform the result
    return this.transformSingle(entity);
  }

	async getCount(userContext: IUserContext): Promise<number> {
		const count = await this.collection.estimatedDocumentCount();
		return count;
	}

  async create(userContext: IUserContext, entity: T): Promise<T> {
    const validationResult = this.validate(entity);
    entityUtils.handleValidationResult(validationResult, 'GenericApiService.create'); // throws on error

    try {
      const result = await this.onBeforeCreate(userContext, entity);
      const insertResult = await this.collection.insertOne(entity);
      if (insertResult.insertedId) {
        // mongoDb mutates the entity passed into insertOne to have an _id property - we rename it to "id" in transformSingle
        this.transformSingle(entity);
      }
      const afterCreateResult = await this.onAfterCreate(userContext, entity);
      return entity;
    }
    catch (err: any) {
      console.log(`error in GenericApiService.create - ${err.message}`);
      if (err.code === 11000) { // this is the MongoDb error code for duplicate key
        throw new DuplicateKeyError(`${this.singularResourceName} already exists`);
      }
      throw new BadRequestError(`Error creating ${this.singularResourceName}`);
    }
  }

	async fullUpdateById(userContext: IUserContext, id: string, entity: T): Promise<T> {
		// this is not the most performant function - In order to protect system properties (like created). it retrieves the
		//  existing entity, updates using the supplied entity, then retrieves the entity again. We could avoid the final
		//  fetch if we manually crafted the returned entity, but that seems presumptuous, especially
		//  as the update process gets more complex. PREFER using partialUpdateById.
		if (!entityUtils.isValidObjectId(id)) {
			throw new BadRequestError('id is not a valid ObjectId');
		}

		const existingEntity = await this.collection.findOne({ _id: new ObjectId(id) });
		if (!existingEntity) {
			throw new IdNotFoundError();
		}

		// Preserve system properties that should not be updated
		const auditProperties = {
			created: existingEntity.created,
			createdBy: existingEntity.createdBy,
		};

		let clone = _.clone(entity);
		delete clone.id;    // id is our friendly, server-only property (not in db). Mongo uses _id, and we don't want to add id to mongo

		let queryObject = {_id: new ObjectId(id)};

		await this.onBeforeUpdate(userContext, clone);
		// Merge audit properties back into the clone
		Object.assign(clone, auditProperties);
    const mongoUpdateResult = await this.collection.replaceOne(queryObject, clone);

		if (mongoUpdateResult?.matchedCount <= 0) {
			throw new IdNotFoundError();
		}
		await this.onAfterUpdate(userContext, clone);

		// return the updated entity
		const updatedEntity = await this.collection.findOne({_id: new ObjectId(id)});
		// allow derived classes to transform the result
		return this.transformSingle(updatedEntity);
	}

  async partialUpdateById(userContext: IUserContext, id: string, entity: T): Promise<T> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }

    let clone = _.clone(entity);
    delete clone.id;    // id is our friendly, server-only property (not in db). Mongo uses _id, and we don't want to add id to mongo

    let queryObject = {_id: new ObjectId(id)};

    await this.onBeforeUpdate(userContext, clone);
    const mongoUpdateResult = await this.collection.updateOne(queryObject, {$set: clone});

    if (mongoUpdateResult?.matchedCount <= 0) {
			throw new IdNotFoundError();
    }
	  await this.onAfterUpdate(userContext, clone);

		// return the updated entity
		const updatedEntity = await this.collection.findOne({_id: new ObjectId(id)});
	  // allow derived classes to transform the result
	  return this.transformSingle(updatedEntity);
  }

  async partialUpdateByIdWithoutBeforeAndAfter(userContext: IUserContext, id: string, entity: T): Promise<T> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }

    let clone = _.clone(entity);
    delete clone.id;    // id is our friendly, server-only property (not in db). Mongo uses _id, and we don't want to add id to mongo

    let queryObject = { _id: new ObjectId(id) };
    // $set causes mongo to only update the properties provided, without it, it will delete any properties not provided
    const mongoUpdateResult = await this.collection.updateOne(queryObject, {$set: clone});

	  if (mongoUpdateResult?.matchedCount <= 0) {
		  throw new IdNotFoundError();
	  }

		// return the updated entity
	  const updatedEntity = await this.collection.findOne({_id: new ObjectId(id)});
	  // allow derived classes to transform the result
	  return this.transformSingle(updatedEntity);
  }

  async update(userContext: IUserContext, queryObject: any, entity: T): Promise<T[]> {
    let clone = _.clone(entity);
    delete clone.id;    // id is our friendly, server-only property (not in db). Mongo uses _id, and we don't want to add id to mongo

    await this.onBeforeUpdate(userContext, clone);
    // $set causes mongo to only update the properties provided, without it, it will delete any properties not provided
    const mongoUpdateResult = await this.collection.updateMany(queryObject, {$set: clone});

	  if (mongoUpdateResult?.matchedCount <= 0) {
		  throw new NotFoundError('No records found matching update query');
	  }
    await this.onAfterUpdate(userContext, clone);

	  // return the updated entities
		const updatedEntities = await this.collection.find(queryObject).toArray();
	  // allow derived classes to transform the result
	  return this.transformList(updatedEntities);
  }

  async deleteById(userContext: IUserContext, id: string): Promise<DeleteResult> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }
    let queryObject = { _id: new ObjectId(id) };

    await this.onBeforeDelete(userContext, queryObject);
    const deleteResult = await this.collection.deleteOne(queryObject);

    // The deleteOne command returns the following:
    // { acknowledged: true, deletedCount: 1 }
    if (deleteResult.deletedCount <= 0) {
      throw new IdNotFoundError();
    }

    await this.onAfterDelete(userContext, queryObject);

    return deleteResult; // ignore the result of onAfter and return what the deleteOne call returned
  }

  async find(userContext: IUserContext, mongoQueryObject: any, options?: FindOptions<Document> | undefined): Promise<T[]> {
    const cursor = this.collection.find(mongoQueryObject, options);
    const entities = await cursor.toArray();

    // allow derived classes to transform the result
    return this.transformList(entities);
  }

  async findOne(userContext: IUserContext, mongoQueryObject: any, options?: FindOptions<Document> | undefined): Promise<T> {
    const entity = await this.collection.findOne(mongoQueryObject, options);
    
    // allow derived classes to transform the result
    return this.transformSingle(entity);
  }

  validate(doc: any): Joi.ValidationResult<any> {
    return {
      error: undefined,
      value: undefined
    };
  }

  auditForCreate(userContext: IUserContext | undefined, doc: IAuditable) {
    const now = moment().utc().toDate();
    // const userId = current.context && current.context.current && current.context.current.user ? current.context.user.email : 'system';
    const userId = userContext?.user?.id ?? 'system';
    doc.created = now;
    doc.createdBy = userId;
    doc.updated = now;
    doc.updatedBy = userId;
  }

  auditForUpdate(userContext: IUserContext | undefined, doc: IAuditable) {
    const userId = userContext?.user?.id ?? 'system';
    doc.updated = moment().utc().toDate();
    doc.updatedBy = userId;
  }

	// todo: consider changing onBeforeCreate to be a single hook before create - it's currently entity-specific - called for every entity,
	//  and perhaps call either transformSingle or transformList inside? YES - I like this idea.
  onBeforeCreate(userContext: IUserContext | undefined, doc: any) {
	  this.stripSenderProvidedSystemProperties(doc);
		this.auditForCreate(userContext, doc);
	  entityUtils.convertForeignKeysToObjectIds(doc);
	  return Promise.resolve(doc);
  }

  onAfterCreate(userContext: IUserContext | undefined, doc: any) {
    return Promise.resolve(doc);
  }

  onBeforeUpdate(userContext: IUserContext | undefined, doc: any) {
    this.stripSenderProvidedSystemProperties(doc);
		this.auditForUpdate(userContext, doc);
	  entityUtils.convertForeignKeysToObjectIds(doc);
	  return Promise.resolve(doc);
  }

  onAfterUpdate(userContext: IUserContext | undefined, doc: any) {
    return Promise.resolve(doc);
  }

  onBeforeDelete(userContext: IUserContext, queryObject: any) {
    return Promise.resolve(queryObject);
  }

  onAfterDelete(userContext: IUserContext, queryObject: any) {
    return Promise.resolve(queryObject);
  }

  transformList(list: any[]) {
	  if (!list) return [];

    list.forEach((item) => {
			this.transformSingle(item);
	  });
    return list;
  }

  transformSingle(single: any) {
	  entityUtils.useFriendlyId(single);
		entityUtils.removeMongoId(single);
    return single;
  }

	private stripSenderProvidedSystemProperties(doc: any) {
		// we don't allow users to provide/overwrite any system properties
		if (doc.created) {
			delete doc.created;
		}
		if (doc.createdBy) {
			delete doc.createdBy;
		}
		if (doc.updated) {
			delete doc.updated;
		}
		if (doc.updatedBy) {
			delete doc.updatedBy;
		}
	}
}
