import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AuthError,
  TokenExpiredError,
  RefreshFailedError,
  UnauthorizedError,
  SessionExpiredError,
  InvalidTokenError,
} from '../errors';

describe('Error Classes', () => {
  describe('AuthError', () => {
    it('should have correct name and code', () => {
      const error = new AuthError('Test error', 'TEST_CODE');
      expect(error.name).toBe('AuthError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test error');
    });

    it('should be serializable', () => {
      const error = new AuthError('Test error', 'TEST_CODE');
      const json = error.toJSON();
      expect(json.name).toBe('AuthError');
      expect(json.code).toBe('TEST_CODE');
      expect(json.message).toBe('Test error');
      expect(json.timestamp).toBeDefined();
    });

    it('should be an instance of Error', () => {
      const error = new AuthError('Test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AuthError).toBe(true);
    });

    it('should support error chaining', () => {
      const cause = new Error('root cause');
      const error = new AuthError('Wrapper', 'WRAPPER', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('TokenExpiredError', () => {
    it('should have TOKEN_EXPIRED code', () => {
      const error = new TokenExpiredError();
      expect(error.code).toBe('TOKEN_EXPIRED');
      expect(error.name).toBe('TokenExpiredError');
      expect(error.expiredAt).toBeDefined();
    });

    it('should include expiredAt in JSON', () => {
      const error = new TokenExpiredError('Expired', 1700000000);
      const json = error.toJSON();
      expect(json.expiredAt).toBe(1700000000);
    });
  });

  describe('RefreshFailedError', () => {
    it('should include attempt and maxRetries', () => {
      const error = new RefreshFailedError('Failed', 3, 3);
      expect(error.code).toBe('REFRESH_FAILED');
      expect(error.attempt).toBe(3);
      expect(error.maxRetries).toBe(3);
    });
  });

  describe('UnauthorizedError', () => {
    it('should default to 401 status code', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });

    it('should support custom status codes', () => {
      const error = new UnauthorizedError('Forbidden', 403);
      expect(error.statusCode).toBe(403);
    });
  });

  describe('SessionExpiredError', () => {
    it('should have SESSION_EXPIRED code', () => {
      const error = new SessionExpiredError();
      expect(error.code).toBe('SESSION_EXPIRED');
    });
  });

  describe('InvalidTokenError', () => {
    it('should have INVALID_TOKEN code', () => {
      const error = new InvalidTokenError();
      expect(error.code).toBe('INVALID_TOKEN');
    });
  });
});
