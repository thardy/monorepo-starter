import { BadRequestError, ServerError, ValidationError } from '../errors/index.js';
import { ObjectId } from 'mongodb';
import { TSchema, Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { ValueError, ValueErrorType } from '@sinclair/typebox/errors';
import { EntitySchema, AuditableSchema, MultiTenantEntitySchema, IAuditable, IModelSpec } from '../models/index.js';

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
  const validator = TypeCompiler.Compile(schema);
  // console.log(JSON.stringify(schema, null, 2)); // uncomment to see the actual json-schema for each model 
  return validator;
}

/**
 * Creates an object with schema and validators - everything needed for validation
 * @param schema The original TypeBox schema
 * @param options Configuration options (e.g., { isAuditable: true, isMultiTenant: true })
 * @returns Object containing schema, partialSchema, fullSchema, validator, partialValidator, and fullValidator
 */
function getModelSpec<T extends TSchema>(
  schema: T, 
  options: { isAuditable?: boolean; isMultiTenant?: boolean } = {}
): IModelSpec {
  const partialSchema = Type.Partial(schema);
  
  // Create array of schemas to include in the full schema
  const schemasToIntersect = [];
  schemasToIntersect.push(schema);
  schemasToIntersect.push(EntitySchema);
  
  if (options.isAuditable) {
    schemasToIntersect.push(AuditableSchema);
  }
  
  if (options.isMultiTenant) {
    schemasToIntersect.push(MultiTenantEntitySchema);
  }
  
  // Create the full schema using Type.Intersect
  const fullSchema = Type.Intersect(schemasToIntersect);
  const fullPartialSchema = Type.Partial(fullSchema);
  
  // Create validators for all schemas
  const validator = getValidator(schema);
  const partialValidator = getValidator(partialSchema);
  const fullValidator = getValidator(fullSchema);
  const fullPartialValidator = getValidator(fullPartialSchema);
  
  return {
    schema,
    partialSchema,
    fullSchema,
    fullPartialSchema,
    validator,
    partialValidator,
    fullValidator,
    fullPartialValidator,
    isAuditable: !!options.isAuditable,
    isMultiTenant: !!options.isMultiTenant
  };
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
    const errors = [...validator.Errors(data)];
    
    // Debug logging for multipleOf errors
    errors.forEach(error => {
      console.log('Validation error:', error);
      // Log more details about the error
      if (error.schema && error.schema.multipleOf) {
        console.log('MultipleOf validation error details:');
        console.log('- Value:', error.value);
        console.log('- Schema:', error.schema);
        console.log('- Path:', error.path);
        // Check mathematical test
        if (typeof error.value === 'number' && typeof error.schema.multipleOf === 'number') {
          console.log('- Modulo result:', error.value % error.schema.multipleOf);
          console.log('- Division result:', error.value / error.schema.multipleOf);
          console.log('- Is integer check:', Number.isInteger(error.value / error.schema.multipleOf));
        }
      }
    });
    
    return errors;
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
 * @returns true if the entity has audit properties (_created, _createdBy, _updated, _updatedBy)
 */
function isAuditable(entity: any): entity is IAuditable {
  return entity !== null && 
    typeof entity === 'object' && 
    (entity.hasOwnProperty('_created') || 
     entity.hasOwnProperty('_createdBy') || 
     entity.hasOwnProperty('_updated') || 
     entity.hasOwnProperty('_updatedBy'));
}

/**
 * Helper function to fix floating-point precision issues with decimal numbers
 * @param value The number to check
 * @param multipleOf The value to check if value is a multiple of
 * @param precision The decimal precision (number of decimal places)
 * @returns true if value is a multiple of multipleOf within the given precision
 */
function isDecimalMultipleOf(value: number, multipleOf: number, precision: number = 2): boolean {
  // Scale both numbers by multiplying by 10^precision to work with integers
  const scale = Math.pow(10, precision);
  const scaledValue = Math.round(value * scale);
  const scaledMultipleOf = Math.round(multipleOf * scale);
  
  // Now we can check if the scaled value is a multiple of the scaled multipleOf
  return scaledValue % scaledMultipleOf === 0;
}

export const entityUtils =  {
  handleValidationResult,
  isValidObjectId,
	convertForeignKeysToObjectIds,
  isAuditable,
  PROPERTIES_THAT_ARE_NOT_OBJECT_IDS,
  getValidator,
  getModelSpec,
  validate,
  isDecimalMultipleOf
};
