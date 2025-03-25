import { Type } from '@sinclair/typebox';
import { ObjectId } from 'mongodb';
import { DefaultErrorFunction, SetErrorFunction } from '@sinclair/typebox/errors';

// Custom objectId validator function
export const isValidObjectId = (value: string): boolean => {
  try {
    return ObjectId.isValid(value) && 
           new ObjectId(value).toString() === value;
  } 
  catch {
    return false;
  }
};

// Can be used to add custom validations when creating schemas
// e.g., Type.String({ format: 'objectId' })
Type.Unsafe({ kind: 'ObjectIdString', type: 'string', format: 'objectId' });

// Initialize function to be called on application startup
export const initializeTypeBox = () => {
  // Configure TypeBox error messages
  SetErrorFunction((e) => {
    // First check for custom errorMessage in the schema
    if (e.schema.errorMessage && typeof e.schema.errorMessage === 'string') {
      return e.schema.errorMessage;
    }
    
    // Fall back to default error message
    return DefaultErrorFunction(e);
  });
  
  console.log('TypeBox custom validations initialized');
}; 