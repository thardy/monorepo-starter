import { BadRequestError, ServerError, ValidationError } from '../errors/index.js';
import { ObjectId } from 'mongodb';
import { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { ValueError } from '@sinclair/typebox/errors';

/**
 * List of property names that should not be converted to ObjectIds, even if they end with 'Id'
 * These properties are meant to be stored and queried as strings
 */
export const PROPERTIES_THAT_ARE_NOT_OBJECT_IDS = ['orgId'];

// Cache for compiled validators (shared across all uses)
const validatorCache = new Map<string, ReturnType<typeof TypeCompiler.Compile>>();

/**
 * Gets or creates a cached TypeBox validator for a schema
 * @param schema The TypeBox schema to compile
 * @param cacheKey Optional key for caching. If not provided, stringifies the schema
 * @returns A compiled validator for the schema
 */
function getValidator(
  schema: TSchema, 
  cacheKey?: string
): ReturnType<typeof TypeCompiler.Compile> {
  // Generate a cache key if none provided
  const key = cacheKey || JSON.stringify(schema);
  
  // Return cached validator if available
  if (validatorCache.has(key)) {
    return validatorCache.get(key)!;
  }
  
  // Compile and cache the validator
  const validator = TypeCompiler.Compile(schema);
  validatorCache.set(key, validator);
  
  return validator;
}

/**
 * Validates data against a schema using a cached validator
 * @param schema The TypeBox schema to validate against
 * @param data The data to validate
 * @param cacheKey Optional key for caching
 * @returns Validation result with errors if invalid
 */
function validateWithSchema(
  schema: TSchema,
  data: unknown,
  cacheKey?: string
): { valid: boolean; errors?: ValueError[] } {
  const validator = getValidator(schema, cacheKey);
  const valid = validator.Check(data);
  
  if (!valid) {
    return { valid, errors: [...validator.Errors(data)] };
  }
  
  return { valid };
}

/**
 * Centralized validation error handling function
 * @param validationErrors TypeBox validation errors or null
 * @param methodName Name of the method for error context
 * @throws ValidationError if validation errors exist
 */
function handleValidationResult(validationErrors: ValueError[] | null, methodName: string): void {
  // if (validationResult?.error) {
  //   // If error is already a formatted ValidationError
  //   if (validationResult.error instanceof ValidationError) {
  //     throw validationResult.error;
  //   }
  //   // Handle TypeBox validation errors (array of ValueError)
  //   else if (validationResult.error instanceof Array) {
  //     throw new ValidationError(validationResult.error);
  //   }
  //   // Handle other validation errors
  //   else {
  //     throw new BadRequestError(
  //       `Validation error in ${methodName}: ${validationResult.error.message || 'Unknown error'}`
  //     );
  //   }
  
  
  
  if (validationErrors) {
    throw new ValidationError(validationErrors);
  }
}

// function useFriendlyId(doc: any) {
//   if (doc && doc._id) {
//     doc.id = doc._id.toHexString();
//   }
// }

// function removeMongoId(doc: any) {
//   if (doc && doc._id) {
//     delete doc._id;
//   }
// }

function isValidObjectId(id: any) {
  let result = false;
	if (typeof id === 'string' || id instanceof String) {
  	result = id.match(/^[0-9a-fA-F]{24}$/) ? true : false;
  }
	else {
		console.log(`entityUtils.isValidObjectId called with something other than a string. id = ${id}`);
		console.log(`typeof id = ${typeof id}`);
		console.log('id = ', id);
	}
	return result;
}

function convertForeignKeysToObjectIds(doc: any, ignoredProperties: string[] = PROPERTIES_THAT_ARE_NOT_OBJECT_IDS) {
	for (const key of Object.keys(doc)) {
		if (!ignoredProperties.includes(key) && key.endsWith('Id') && doc[key]) {
			// Skip if already an ObjectId instance
			if (doc[key] instanceof ObjectId) {
				continue;
			}
			
			const isValid = isValidObjectId(doc[key]);
			if (!isValid) {
				throw new ServerError(`property - ${key}, with value - ${doc[key]} is not a valid ObjectId string in entityUtils.convertForeignKeysToObjectIds`);
			}
			doc[key] = new ObjectId(doc[key]);
		}
	}
}

/**
 * Checks if the provided entity implements the IAuditable interface by checking for audit properties
 * @param entity The entity to check
 * @returns true if the entity has audit properties (created, createdBy, updated, updatedBy)
 */
function isAuditable(entity: any): boolean {
  return entity !== null && 
    typeof entity === 'object' && 
    (entity.hasOwnProperty('created') || 
     entity.hasOwnProperty('createdBy') || 
     entity.hasOwnProperty('updated') || 
     entity.hasOwnProperty('updatedBy'));
}

export const entityUtils =  {
  handleValidationResult,
  isValidObjectId,
	convertForeignKeysToObjectIds,
  isAuditable,
  PROPERTIES_THAT_ARE_NOT_OBJECT_IDS,
  getValidator,
  validateWithSchema
};
