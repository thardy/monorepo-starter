/*--------------------------------------------------------------------------

objectid.ts - MongoDB ObjectId format validator

---------------------------------------------------------------------------*/

/**
 * Validates if a string matches the MongoDB ObjectId format (24 hex characters)
 * @example `507f1f77bcf86cd799439011`
 */
export function IsObjectId(value: string): boolean {
  // ObjectId must be a string of 24 hex characters
  return /^[0-9a-fA-F]{24}$/.test(value);
} 