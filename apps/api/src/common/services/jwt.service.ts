import jwt from 'jsonwebtoken';

export class JwtService {
  static sign(payload: any, secret: string, options: any): string {
    return jwt.sign(payload, secret, options);
  }

  static verify(token: string, secret: string): any {
    return jwt.verify(token, secret);
  }
}
