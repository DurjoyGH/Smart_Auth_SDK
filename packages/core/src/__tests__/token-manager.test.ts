import { describe, it, expect, beforeEach } from 'vitest';
import { TokenManager } from '../managers/token-manager';
import { MemoryStorage } from '../storage/memory-storage';
import { resolveConfig, noopLogger } from '@smart-auth/shared';

// Helper: create a JWT with a given payload
function createTestJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'test-signature';
  return `${header}.${body}.${signature}`;
}

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    const config = resolveConfig();
    tokenManager = new TokenManager(config, storage, noopLogger);
  });

  it('should store and retrieve access tokens', async () => {
    const token = createTestJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 });
    await tokenManager.setAccessToken(token);
    const retrieved = await tokenManager.getAccessToken();
    expect(retrieved).toBe(token);
  });

  it('should store and retrieve refresh tokens', async () => {
    await tokenManager.setRefreshToken('refresh-123');
    const retrieved = await tokenManager.getRefreshToken();
    expect(retrieved).toBe('refresh-123');
  });

  it('should decode access tokens', async () => {
    const token = createTestJwt({ sub: 'user-1', email: 'test@test.com' });
    await tokenManager.setAccessToken(token);
    const decoded = await tokenManager.decodeAccessToken();
    expect(decoded?.sub).toBe('user-1');
    expect(decoded?.email).toBe('test@test.com');
  });

  it('should extract user from token', async () => {
    const token = createTestJwt({
      sub: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    await tokenManager.setAccessToken(token);

    const user = await tokenManager.extractUser();
    expect(user).toBeDefined();
    expect((user as Record<string, unknown>).id).toBe('user-1');
    expect((user as Record<string, unknown>).name).toBe('John Doe');
    expect((user as Record<string, unknown>).email).toBe('john@example.com');
  });

  it('should detect expired tokens', async () => {
    const expiredToken = createTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    await tokenManager.setAccessToken(expiredToken);
    expect(await tokenManager.isAccessTokenExpired()).toBe(true);
  });

  it('should detect valid tokens', async () => {
    const validToken = createTestJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    await tokenManager.setAccessToken(validToken);
    expect(await tokenManager.isAccessTokenExpired()).toBe(false);
  });

  it('should extract roles from token', async () => {
    const token = createTestJwt({ roles: ['admin', 'user'], exp: Math.floor(Date.now() / 1000) + 3600 });
    await tokenManager.setAccessToken(token);
    const roles = await tokenManager.getRoles();
    expect(roles).toEqual(['admin', 'user']);
  });

  it('should handle missing roles', async () => {
    const token = createTestJwt({ sub: 'user-1' });
    await tokenManager.setAccessToken(token);
    const roles = await tokenManager.getRoles();
    expect(roles).toEqual([]);
  });

  it('should clear all tokens', async () => {
    await tokenManager.setAccessToken('access');
    await tokenManager.setRefreshToken('refresh');
    await tokenManager.clearTokens();

    expect(await tokenManager.getAccessToken()).toBeNull();
    expect(await tokenManager.getRefreshToken()).toBeNull();
  });
});
