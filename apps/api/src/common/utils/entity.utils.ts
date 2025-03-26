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

/**
 * Compiles a TypeBox schema into a validator
 * @param schema The TypeBox schema to compile
 * @returns A compiled validator for the schema
 */
function getValidator(schema: TSchema): ReturnType<typeof TypeCompiler.Compile> {
  return TypeCompiler.Compile(schema);
}

/**
 * Validates data against a validator
 * @param validator The compiled TypeBox validator
 * @param data The data to validate
 * @returns Validation result with errors if invalid
 */
function validate(
  validator: ReturnType<typeof TypeCompiler.Compile>,
  data: unknown
): ValueError[] | null {
  const valid = validator.Check(data);
  
  if (!valid) {
    return [...validator.Errors(data)];
  }
  
  return null;
}

/**
 * Centralized validation error handling function
 * @param validationErrors TypeBox validation errors or null
 * @param methodName Name of the method for error context
 * @throws ValidationError if validation errors exist
 */
function handleValidationResult(validationErrors: ValueError[] | null, methodName: string): void {
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
  validate
};
