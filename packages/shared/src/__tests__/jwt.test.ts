import { describe, it, expect } from 'vitest';
import { decodeToken, getTokenExpiration, isTokenExpired, getTokenTimeRemaining } from '../jwt';

// Helper: create a JWT with a given payload (unsigned — just base64 encoding)
function createTestJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'test-signature';
  return `${header}.${body}.${signature}`;
}

describe('JWT Utilities', () => {
  describe('decodeToken', () => {
    it('should decode a valid JWT payload', () => {
      const payload = { sub: 'user-123', email: 'test@example.com', exp: 9999999999 };
      const token = createTestJwt(payload);
      const decoded = decodeToken(token);

      expect(decoded.sub).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw on a token with fewer than 3 segments', () => {
      expect(() => decodeToken('not.a-valid-token')).toThrow('Token does not have 3 segments');
    });

    it('should throw on a token with invalid base64', () => {
      expect(() => decodeToken('header.!!!invalid!!!.signature')).toThrow();
    });

    it('should handle tokens with special characters in payload', () => {
      const payload = { sub: 'user-123', name: 'John Doe <admin>' };
      const token = createTestJwt(payload);
      const decoded = decodeToken(token);

      expect(decoded.name).toBe('John Doe <admin>');
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration in milliseconds', () => {
      const expSeconds = 1700000000;
      const token = createTestJwt({ exp: expSeconds });
      const expMs = getTokenExpiration(token);

      expect(expMs).toBe(expSeconds * 1000);
    });

    it('should return null if no exp claim', () => {
      const token = createTestJwt({ sub: 'user-123' });
      const expMs = getTokenExpiration(token);

      expect(expMs).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired tokens', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createTestJwt({ exp: pastExp });

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return false for valid tokens', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = createTestJwt({ exp: futureExp });

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should handle clock skew', () => {
      // Token expires in 3 seconds
      const exp = Math.floor(Date.now() / 1000) + 3;
      const token = createTestJwt({ exp });

      // Without skew: not expired
      expect(isTokenExpired(token, 0)).toBe(false);

      // With 5 second skew: considered expired (3 < 5)
      expect(isTokenExpired(token, 5000)).toBe(true);
    });

    it('should return false for tokens without exp claim', () => {
      const token = createTestJwt({ sub: 'user-123' });
      expect(isTokenExpired(token)).toBe(false);
    });
  });

  describe('getTokenTimeRemaining', () => {
    it('should return positive value for valid tokens', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = createTestJwt({ exp: futureExp });
      const remaining = getTokenTimeRemaining(token);

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(3600 * 1000);
    });

    it('should return 0 for expired tokens', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const token = createTestJwt({ exp: pastExp });

      expect(getTokenTimeRemaining(token)).toBe(0);
    });

    it('should return Infinity for tokens without exp', () => {
      const token = createTestJwt({ sub: 'user-123' });
      expect(getTokenTimeRemaining(token)).toBe(Infinity);
    });
  });
});
