import { describe, it, expect } from 'vitest';
import { Type } from '@sinclair/typebox';
import { entityUtils } from '../entity.utils.js';
import { EntitySchema, AuditableSchema } from '../../models/index.js';
import { ObjectId } from 'mongodb';
import { Value } from '@sinclair/typebox/value';

describe('entityUtils', () => {
  describe('clean method', () => {
    // Define a test schema
    const TestSchema = Type.Object({
      name: Type.String(),
      age: Type.Optional(Type.Number()),
      email: Type.Optional(Type.String({ format: 'email' })),
      tags: Type.Optional(Type.Array(Type.String()))
    });
    
    // Create a model spec with the clean method
    const testSpec = entityUtils.getModelSpec(TestSchema, { isAuditable: true });
    
    it('should remove properties not defined in the schema', () => {
      // Arrange
      const entityWithExtraProps = {
        name: 'Test Entity',
        age: 30,
        // Properties not in the schema
        extraProperty: 'This should be removed',
        anotherExtraProperty: 42,
        nestedExtraProperty: { foo: 'bar', baz: 123 }
      };
      
      // Act
      const cleanedEntity = testSpec.clean(entityWithExtraProps);
      
      // Assert
      expect(cleanedEntity).toBeDefined();
      expect(cleanedEntity.name).toBe('Test Entity');
      expect(cleanedEntity.age).toBe(30);
      
      // Extra properties should be removed
      expect((cleanedEntity as any).extraProperty).toBeUndefined();
      expect((cleanedEntity as any).anotherExtraProperty).toBeUndefined();
      expect((cleanedEntity as any).nestedExtraProperty).toBeUndefined();
    });
    
    // Debug test to see what happens to ObjectId instances
    it('should preserve ObjectId instances when cleaning', () => {
      // Create an entity with an ObjectId
      const originalId = new ObjectId();
      const entity = { 
        _id: originalId,
        name: 'Test with ObjectId' 
      };
      
      // Clean the entity using the model spec
      const cleanedEntity = testSpec.clean(entity);
      console.log(`cleanedEntity: ${JSON.stringify(cleanedEntity)}`); // todo: delete me
      
      // Assert that the _id field still contains an ObjectId instance
      expect(cleanedEntity._id).toBeDefined();
      expect(cleanedEntity._id instanceof ObjectId).toBe(true);
      expect(cleanedEntity._id).toBe(originalId); // Same instance
      
      // Make sure we can still use ObjectId methods
      expect(typeof cleanedEntity._id.toString()).toBe('string');
    });
    
    it('should preserve system properties from the EntitySchema', () => {
      // Arrange
      const entityWithSystemProps = {
        name: 'System Props Test',
        // System properties from EntitySchema
        _id: '507f1f77bcf86cd799439011',
        // Extra property not in schema
        notInSchema: 'should be removed'
      };
      
      // Act
      const cleanedEntity = testSpec.clean(entityWithSystemProps);
      
      // Assert
      expect(cleanedEntity).toBeDefined();
      expect(cleanedEntity.name).toBe('System Props Test');
      expect(cleanedEntity._id).toBe('507f1f77bcf86cd799439011');
      
      // Extra property should be removed
      expect((cleanedEntity as any).notInSchema).toBeUndefined();
    });
    
    it('should preserve audit properties from AuditableSchema', () => {
      // Arrange
      const now = new Date();
      const entityWithAuditProps = {
        name: 'Audit Props Test',
        // Audit properties from AuditableSchema
        _created: now,
        _createdBy: 'test-user',
        _updated: now,
        _updatedBy: 'test-user',
        // Extra property not in schema
        extraProp: 'should be removed'
      };
      
      // Act
      const cleanedEntity = testSpec.clean(entityWithAuditProps);
      
      // Assert
      expect(cleanedEntity).toBeDefined();
      expect(cleanedEntity.name).toBe('Audit Props Test');
      expect(cleanedEntity._created).toEqual(now);
      expect(cleanedEntity._createdBy).toBe('test-user');
      expect(cleanedEntity._updated).toEqual(now);
      expect(cleanedEntity._updatedBy).toBe('test-user');
      
      // Extra property should be removed
      expect((cleanedEntity as any).extraProp).toBeUndefined();
    });
    
    it('should handle arrays and nested objects correctly', () => {
      // Arrange
      const entityWithArrays = {
        name: 'Array Test',
        tags: ['tag1', 'tag2', 'tag3'],
        // Each item in the array has extra properties
        complexArray: [
          { validProp: 'value', extraProp: 'should be removed' },
          { anotherExtraProp: 'also removed' }
        ],
        // Extra property not in schema
        extraArray: [1, 2, 3]
      };
      
      // Act
      const cleanedEntity = testSpec.clean(entityWithArrays);
      
      // Assert
      expect(cleanedEntity).toBeDefined();
      expect(cleanedEntity.name).toBe('Array Test');
      expect(cleanedEntity.tags).toEqual(['tag1', 'tag2', 'tag3']);
      
      // Extra properties should be removed
      expect((cleanedEntity as any).complexArray).toBeUndefined();
      expect((cleanedEntity as any).extraArray).toBeUndefined();
    });
    
    it('should handle null values gracefully', () => {
      // Act
      const cleanedNull = testSpec.clean(null);
      
      // Assert
      expect(cleanedNull).toBeNull();
    });
    
    it('should handle undefined values gracefully', () => {
      // Act
      const cleanedUndefined = testSpec.clean(undefined);
      
      // Assert
      expect(cleanedUndefined).toBeUndefined();
    });
  });
}); 