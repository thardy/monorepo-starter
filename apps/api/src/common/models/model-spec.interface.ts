import { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

/**
 * Interface representing a complete model specification with schema and validators
 */
export interface IModelSpec<T extends TSchema = TSchema> {
  /**
   * The primary TypeBox schema for validating complete documents
   */
  schema: T;
  
  /**
   * Partial version of the schema for validating update operations
   */
  partialSchema: T;
  
  /**
   * Full version of the schema for validating complete documents
   */
  fullSchema: T;

  /**
   * Compiled validator for the primary schema
   */
  validator: ReturnType<typeof TypeCompiler.Compile>;
  
  /**
   * Compiled validator for the partial schema
   */
  partialValidator: ReturnType<typeof TypeCompiler.Compile>;
  
  /**
   * Compiled validator for the full schema
   */
  fullValidator: ReturnType<typeof TypeCompiler.Compile>;
} 