import { Type, Kind, TSchema, NumberOptions, ValueGuard } from '@sinclair/typebox';
import { TypeRegistry } from '@sinclair/typebox';
import { Decimal as _Decimal } from 'decimal.js';
import { Value } from '@sinclair/typebox/value';

// -----------------------------------------------------------------
// Type: Decimal - A custom type for handling decimal numbers with precise validation
// -----------------------------------------------------------------
export interface TDecimal extends TSchema, NumberOptions {
  [Kind]: 'Decimal'
  type: 'number',
  static: number
}

/**
 * Creates a TypeBox schema for decimal values with proper validation
 * Uses decimal.js for precise decimal calculations to avoid floating-point issues
 * @param options Additional options for the number schema (title, description, etc.)
 * @returns A TypeBox schema configured for decimal values
 */
export function Decimal(options: NumberOptions = {}): TDecimal {
  return { ...options, [Kind]: 'Decimal', type: 'number' } as TDecimal;
}

// Register the custom type with TypeBox's validation system
TypeRegistry.Set<TDecimal>('Decimal', (schema: TDecimal, value: unknown) => {
  return (
    (ValueGuard.IsNumber(value)) &&
    (ValueGuard.IsNumber(schema.multipleOf) ? new _Decimal(value).mod(new _Decimal(schema.multipleOf)).equals(0) : true) &&
    (ValueGuard.IsNumber(schema.exclusiveMaximum) ? value < schema.exclusiveMaximum : true) &&
    (ValueGuard.IsNumber(schema.exclusiveMinimum) ? value > schema.exclusiveMinimum : true) &&
    (ValueGuard.IsNumber(schema.maximum) ? value <= schema.maximum : true) &&
    (ValueGuard.IsNumber(schema.minimum) ? value >= schema.minimum : true)
  );
});

// -----------------------------------------------------------------
// Convenience Types
// -----------------------------------------------------------------

/**
 * Convenience function for creating a money/currency field
 * Defaults to 2 decimal places (cents)
 * @param options Additional options for the number schema
 * @returns A TypeBox schema for monetary values
 */
export function Money(options: NumberOptions = {}): TDecimal {
  return Decimal({
    multipleOf: 0.01,
    ...options
  });
}

/**
 * Convenience function for creating a percentage field
 * @param options Additional options for the number schema
 * @returns A TypeBox schema for percentage values
 */
export function Percentage(options: NumberOptions = {}): TDecimal {
  return Decimal({
    minimum: 0,
    maximum: 100,
    ...options
  });
}

/**
 * Unit test function to verify our Money type is working correctly
 * This can be called during development to test the implementation
 */
// todo: move this into an actual test file following our testing patterns - in a __tests__ folder using vitest, etc, etc
export function testMoneyType(): void {
  const schema = Type.Object({
    price: Money({ minimum: 0 })
  });

  // Test valid case
  const valid = Value.Check(schema, { price: 39.99 });
  console.log('39.99 is valid:', valid);

  // Test another valid case
  const valid2 = Value.Check(schema, { price: 100.00 });
  console.log('100.00 is valid:', valid2);

  // Test invalid case (price not multiple of 0.01)
  const invalid = Value.Check(schema, { price: 39.999 });
  console.log('39.999 is valid:', invalid);

  // Test validation errors
  if (!invalid) {
    const errors = [...Value.Errors(schema, { price: 39.999 })];
    console.log('Validation errors:', errors);
  }
}

// Uncomment to run the test during development
// testMoneyType(); 