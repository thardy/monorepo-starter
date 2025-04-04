import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { IUserContext } from '../../models/user-context.model.js';
import { JwtService } from '../../services/jwt.service.js';

/**
 * Utility class for common test functions that don't depend on external modules
 */
export class CommonTestUtils {
  private static JWT_SECRET = 'test-secret';
  private static testUserId = new ObjectId().toString();
  private static testOrgId = '67e8e19b149f740323af93d7';
  private static testUserEmail = 'test@example.com';

  /**
   * Get a valid JWT token for testing authentication
   * Uses the same JWT service that the real application uses
   * @returns JWT token string in Bearer format
   */
  static getAuthToken(): string {
    const payload = { 
      user: { 
        _id: this.testUserId,
        email: this.testUserEmail
      }, 
      _orgId: this.testOrgId 
    };
    
    // Use JwtService to sign the token - this is what the real app uses
    const token = JwtService.sign(
      payload, 
      this.JWT_SECRET, 
      { expiresIn: 3600 }
    );
    
    return `Bearer ${token}`;
  }

  /**
   * Get the test user ID
   * @returns User ID string
   */
  static getUserId(): string {
    return this.testUserId;
  }

  /**
   * Get the test organization ID
   * @returns Organization ID string
   */
  static getOrgId(): string {
    return this.testOrgId;
  }

  /**
   * Get a user context object for testing
   * @returns User context object
   */
  static getUserContext(): IUserContext {
    return {
      user: {
        _id: new ObjectId(this.testUserId),
        email: this.testUserEmail,
        _created: new Date(),
        _createdBy: 'system',
        _updated: new Date(),
        _updatedBy: 'system'
      },
      _orgId: this.testOrgId
    } as IUserContext;
  }

  /**
   * Verify a JWT token
   * @param token JWT token string
   * @returns Decoded payload
   */
  static verifyToken(token: string): any {
    return JwtService.verify(token, this.JWT_SECRET);
  }

  /**
   * Configure JWT service to use test secret
   * This should be called before tests that use authentication
   */
  static configureJwtSecret(): void {
    // Configure the application to use our test secret
    // This should be done in a setup function before tests
    const originalJwtVerify = jwt.verify;
    
    // Patch jwt.verify to use our test secret
    (jwt.verify as any) = function(token: string, secret: string, options?: jwt.VerifyOptions): any {
      return originalJwtVerify(token, CommonTestUtils.JWT_SECRET, options);
    };
  }
} 