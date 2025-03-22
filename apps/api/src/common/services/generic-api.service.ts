import mongoose, { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import moment from 'moment';
import _ from 'lodash';
import { BadRequestError, DuplicateKeyError, IdNotFoundError, NotFoundError } from '../errors/index.js';

import { IGenericApiService } from './generic-api-service.interface.js';
import { IAuditable } from '../models/auditable.interface.js';
import { IUserContext } from '../models/user-context.interface.js';
import { IEntity } from '../models/entity.interface.js';
import { QueryOptions, Filter } from '../models/query-options.model.js';
import { IPagedResult } from '../models/paged-result.interface.js';

import { entityUtils, apiUtils, dbUtils } from '../utils/index.js';

export class GenericApiService<T extends Document & IEntity> {
  protected model: Model<T>;
  protected pluralResourceName: string;
  protected singularResourceName: string;

  constructor(model: Model<T>, pluralResourceName: string, singularResourceName: string) {
    this.model = model;
    this.pluralResourceName = pluralResourceName;
    this.singularResourceName = singularResourceName;
  }

  /**
   * Get all documents of this type
   */
  async getAll(userContext: IUserContext): Promise<T[]> {
    // Apply query preparation hook
    const query = this.prepareQuery(userContext, {});
    
    const entities = await this.model.find(query);
    // allow derived classes to transform the result
    return this.transformList(entities);
  }

  /**
   * Get a paginated list of documents
   */
  async get(userContext: IUserContext, queryOptions: QueryOptions = new QueryOptions()): Promise<IPagedResult<T>> {
    // Apply query options preparation hook
    const preparedOptions = this.prepareQueryOptions(userContext, queryOptions);
    
    // Apply query preparation hook for the base query
    const baseQuery = this.prepareQuery(userContext, {});
    let query = this.model.find(baseQuery);
    
    // Apply filtering
    if (preparedOptions.filters) {
      // Convert our custom filter format to Mongoose query using dbUtils
      const mongooseQuery = dbUtils.buildMongooseQueryFromFilters(preparedOptions.filters);
      query = query.find(mongooseQuery);
    }
    
    // Get total count for pagination
    const total = await this.model.countDocuments(query.getFilter());
    
    // Apply sorting
    if (preparedOptions.orderBy) {
      const sortDirection = preparedOptions.sortDirection === 'asc' ? 1 : -1;
      query = query.sort({ [preparedOptions.orderBy]: sortDirection });
    }
    
    // Apply pagination
    if (preparedOptions.page && preparedOptions.pageSize) {
      const skip = (preparedOptions.page - 1) * preparedOptions.pageSize;
      query = query.skip(skip).limit(preparedOptions.pageSize);
    }
    
    const entities = await query.exec();
    const transformedEntities = this.transformList(entities);
    
    return apiUtils.getPagedResult<T>(transformedEntities, total, preparedOptions);
  }

  /**
   * Get a document by ID
   */
  async getById(userContext: IUserContext, id: string): Promise<T> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }

    // Apply query preparation hook
    const baseQuery = { _id: new mongoose.Types.ObjectId(id) };
    const query = this.prepareQuery(userContext, baseQuery);

    const entity = await this.model.findOne(query);

    if (!entity) {
      throw new IdNotFoundError();
    }

    // allow derived classes to transform the result
    return this.transformSingle(entity);
  }

  /**
   * Get count of documents
   */
  async getCount(userContext: IUserContext): Promise<number> {
    // Apply query preparation hook
    const query = this.prepareQuery(userContext, {});
    
    return await this.model.countDocuments(query);
  }

  /**
   * Create a new document
   */
  async create(userContext: IUserContext, entity: Partial<T>): Promise<T> {
    try {
      // Pre-create hooks
      await this.onBeforeCreate(userContext, entity);
      
      // Create the document
      const createdEntity = await this.model.create(entity);
      
      // Post-create hooks
      await this.onAfterCreate(userContext, createdEntity);
      
      return this.transformSingle(createdEntity);
    } catch (err: any) {
      console.log(`error in GenericApiService.create - ${err.message}`);
      if (err.code === 11000) { // this is the MongoDB error code for duplicate key
        throw new DuplicateKeyError(`${this.singularResourceName} already exists`);
      }
      throw new BadRequestError(`Error creating ${this.singularResourceName}`);
    }
  }

  /**
   * Full update (replace) of a document by ID - prefer partialUpdatedById over this due to performance
   * Consider removing this method completely - is it ever used?
   */
  async fullUpdateById(userContext: IUserContext, id: string, entity: Partial<T>): Promise<T> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }

    const baseQuery = { _id: new mongoose.Types.ObjectId(id) };
    const query = this.prepareQuery(userContext, baseQuery);

    const existingEntity = await this.model.findOne(query);
    if (!existingEntity) {
      throw new IdNotFoundError();
    }

    // Preserve system properties that should not be updated
    const auditPropertiesToKeep = {
      _created: existingEntity.get('_created'),
      _createdBy: existingEntity.get('_createdBy')
    };

    // Apply onBeforeUpdate hook which uses prepareEntity
    const preparedEntity = await this.onBeforeUpdate(userContext, entity);
    
    // Merge audit properties back into the prepared entity
    Object.assign(preparedEntity, auditPropertiesToKeep);
    
    // Use MongoDB native replaceOne instead of Mongoose's findOneAndReplace
    const result = await this.model.collection.replaceOne(query, preparedEntity);
    
    if (result.matchedCount === 0) {
      throw new IdNotFoundError();
    }
    await this.onAfterUpdate(userContext, preparedEntity);
    
    // Fetch the updated document to return
    const updatedEntity = await this.model.findOne(query);
    
    if (!updatedEntity) {
      throw new IdNotFoundError();
    }
    
    return this.transformSingle(updatedEntity);
  }

  /**
   * Partial update of a document by ID
   */
  async partialUpdateById(userContext: IUserContext, id: string, entity: Partial<T>): Promise<T> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }

    // Apply onBeforeUpdate hook which uses prepareEntity
    const preparedEntity = await this.onBeforeUpdate(userContext, entity);
    
    // Apply query preparation hook
    const baseQuery = { _id: id };
    const query = this.prepareQuery(userContext, baseQuery);
    
    const updatedEntity = await this.model.findByIdAndUpdate(
      id,
      { $set: preparedEntity },
      { new: true, runValidators: true }
    );

    if (!updatedEntity) {
      throw new IdNotFoundError();
    }
    
    await this.onAfterUpdate(userContext, updatedEntity);

    return this.transformSingle(updatedEntity);
  }

  /**
   * Delete a document by ID
   */
  async deleteById(userContext: IUserContext, id: string): Promise<{ acknowledged: boolean, deletedCount: number }> {
    if (!entityUtils.isValidObjectId(id)) {
      throw new BadRequestError('id is not a valid ObjectId');
    }

    // Apply query preparation hook
    const baseQuery = { _id: id };
    const query = this.prepareQuery(userContext, baseQuery);

    await this.onBeforeDelete(userContext, query);
    
    const deleteResult = await this.model.deleteOne(query);

    if (deleteResult.deletedCount <= 0) {
      throw new IdNotFoundError();
    }

    await this.onAfterDelete(userContext, query);

    return { 
      acknowledged: true,
      deletedCount: deleteResult.deletedCount
    };
  }

  /**
   * Find documents matching a query
   */
  async find(userContext: IUserContext, query: FilterQuery<T>): Promise<T[]> {
    // Apply query preparation hook
    const preparedQuery = this.prepareQuery(userContext, query);
    
    const entities = await this.model.find(preparedQuery);
    return this.transformList(entities);
  }

  /**
   * Find a single document matching a query
   */
  async findOne(userContext: IUserContext, query: FilterQuery<T>): Promise<T> {
    // Apply query preparation hook
    const preparedQuery = this.prepareQuery(userContext, query);
    
    const entity = await this.model.findOne(preparedQuery);
    
    if (!entity) {
      throw new NotFoundError(`${this.singularResourceName} not found`);
    }
    
    return this.transformSingle(entity);
  }

  /**
   * Add audit information for create operations
   */
  auditForCreate(userContext: IUserContext | undefined, doc: IAuditable) {
    const now = moment().utc().toDate();
    const userId = userContext?.user?._id ?? 'system';
    doc._created = now;
    doc._createdBy = userId;
    doc._updated = now;
    doc._updatedBy = userId;
  }

  /**
   * Add audit information for update operations
   */
  auditForUpdate(userContext: IUserContext | undefined, doc: IAuditable) {
    const userId = userContext?.user?.id ?? 'system';
    doc._updated = moment().utc().toDate();
    doc._updatedBy = userId;
  }

  /**
   * Hook called before a document is created
   */
  async onBeforeCreate(userContext: IUserContext | undefined, doc: any) {
    // Use prepareEntity with isCreate=true
    return this.preparePayload(userContext, doc, true);
  }

  /**
   * Hook called after a document is created
   */
  async onAfterCreate(userContext: IUserContext | undefined, doc: any) {
    return doc;
  }

  /**
   * Hook called before a document is updated
   */
  async onBeforeUpdate(userContext: IUserContext | undefined, doc: any) {
    // Use prepareEntity with isCreate=false
    return this.preparePayload(userContext, doc, false);
  }

  /**
   * Hook called after a document is updated
   */
  async onAfterUpdate(userContext: IUserContext | undefined, doc: any) {
    return doc;
  }

  /**
   * Hook called before a document is deleted
   */
  async onBeforeDelete(userContext: IUserContext, queryObject: any) {
    return queryObject;
  }

  /**
   * Hook called after a document is deleted
   */
  async onAfterDelete(userContext: IUserContext, queryObject: any) {
    return queryObject;
  }

  /**
   * Transform a list of documents
   */
  transformList(list: T[]): T[] {
    if (!list) return [];

    return list.map(item => this.transformSingle(item));
  }

  /**
   * Transform a single document
   */
  transformSingle(single: T): T {
    if (!single) return single;
    
    // Convert Mongoose document to plain object if needed
    // const doc = single.toObject ? single.toObject() : single;
    
    return single as T;
  }

  /**
   * Prepares an entity before database operations.
   * This is a hook method that can be overridden by derived classes to modify entities.
   * @param userContext The user context for the operation
   * @param entity The original entity object or array of entities
   * @param isCreate Whether this is for a create operation (true) or update operation (false)
   * @returns The potentially modified entity or array of entities
   */
  protected preparePayload<E extends T | T[] | Partial<T> | Partial<T>[]>(userContext: IUserContext | undefined, entity: E, isCreate: boolean = false): E {
    let result: E;

    if (Array.isArray(entity)) {
      // Handle array of entities
      result = entity.map(item => this.prepareEntity(userContext, item, isCreate)) as E;
    } else {
      // Handle single entity
      result = this.prepareEntity(userContext, entity as T, isCreate) as E;
    }

    return result;
  }

  /**
   * Prepares a single entity before database operations.
   * This contains the core logic for entity preparation that's applied to each entity.
   * @param userContext The user context for the operation
   * @param entity The original entity object
   * @param isCreate Whether this is for a create operation (true) or update operation (false)
   * @returns The potentially modified entity
   */
  protected prepareEntity(userContext: IUserContext | undefined, entity: T | Partial<T>, isCreate: boolean): T | Partial<T> {
    // Clone the entity to avoid modifying the original
    const preparedEntity = _.clone(entity);

    // Strip out any system properties sent by the client
    this.stripSenderProvidedSystemProperties(preparedEntity);

    // Apply appropriate auditing based on operation type if the entity is auditable
    if (isCreate) {
      this.auditForCreate(userContext, preparedEntity as IAuditable);
    } else {
      this.auditForUpdate(userContext, preparedEntity as IAuditable);
    }

    return preparedEntity;
  }

  /**
   * Prepares a query object before executing database operations.
   * This is a hook method that can be overridden by derived classes to modify queries (e.g. add tenantId).
   * @param userContext The user context for the operation
   * @param query The original query object
   * @returns The potentially modified query object
   */
  protected prepareQuery(userContext: IUserContext | undefined, query: any): any {
    // By default, just return the original query
    // Derived classes can override to add tenant isolation, etc.
    return query;
  }

  /**
   * Prepares query options before executing database operations.
   * This is a hook method that can be overridden by derived classes to modify query options.
   * @param userContext The user context for the operation
   * @param queryOptions The original query options
   * @returns The potentially modified query options
   */
  protected prepareQueryOptions(userContext: IUserContext | undefined, queryOptions: QueryOptions): QueryOptions {
    // By default, just return the original query options
    // Derived classes can override to add filters, etc.
    return queryOptions;
  }

  /**
   * Remove system properties that should not be provided by clients
   */
  private stripSenderProvidedSystemProperties(doc: any) {
    // we don't allow users to provide/overwrite any system properties
    if (doc._created) {
      delete doc._created;
    }
    if (doc._createdBy) {
      delete doc._createdBy;
    }
    if (doc._updated) {
      delete doc._updated;
    }
    if (doc._updatedBy) {
      delete doc._updatedBy;
    }
  }
}
