import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from '../managers/session-manager';
import { TokenManager } from '../managers/token-manager';
import { MemoryStorage } from '../storage/memory-storage';
import { resolveConfig, noopLogger } from '@smart-auth/shared';

function createTestJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.test-sig`;
}

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let tokenManager: TokenManager;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    const config = resolveConfig();
    tokenManager = new TokenManager(config, storage, noopLogger);
    sessionManager = new SessionManager(config, tokenManager, noopLogger);
  });

  it('should start with loading state', () => {
    const state = sessionManager.getState();
    expect(state.status).toBe('loading');
    expect(state.loading).toBe(true);
    expect(state.authenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should process login correctly', async () => {
    const token = createTestJwt({
      sub: 'user-1',
      name: 'John',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await sessionManager.login({ accessToken: token, refreshToken: 'refresh-token' });

    const state = sessionManager.getState();
    expect(state.status).toBe('authenticated');
    expect(state.authenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.user).toBeDefined();
    expect(state.accessToken).toBe(token);
    expect(state.sessionStartedAt).toBeDefined();
  });

  it('should process logout correctly', async () => {
    const token = createTestJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 });
    await sessionManager.login({ accessToken: token });
    await sessionManager.logout();

    const state = sessionManager.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.authenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('should notify subscribers on state changes', async () => {
    const listener = vi.fn();
    sessionManager.subscribe(listener);

    const token = createTestJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 });
    await sessionManager.login({ accessToken: token });

    expect(listener).toHaveBeenCalled();
    const lastCall = listener.mock.calls[listener.mock.calls.length - 1]![0];
    expect(lastCall.authenticated).toBe(true);
  });

  it('should unsubscribe correctly', async () => {
    const listener = vi.fn();
    const unsub = sessionManager.subscribe(listener);
    unsub();

    const token = createTestJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 });
    await sessionManager.login({ accessToken: token });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should restore a valid session', async () => {
    const token = createTestJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 });
    storage.set('access_token', token);

    const restored = await sessionManager.restoreSession();

    expect(restored).toBe(true);
    expect(sessionManager.getState().authenticated).toBe(true);
  });

  it('should not restore an expired session', async () => {
    const token = createTestJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 3600 });
    storage.set('access_token', token);

    const restored = await sessionManager.restoreSession();

    expect(restored).toBe(false);
    expect(sessionManager.getState().authenticated).toBe(false);
  });

  it('should not restore when no token exists', async () => {
    const restored = await sessionManager.restoreSession();

    expect(restored).toBe(false);
    expect(sessionManager.getState().status).toBe('unauthenticated');
  });
});
