import type { AuthState } from './state';
import type { AuthEvent, AuthEventType, AuthEventMap } from './events';
import type { TokenPair } from './user';

/**
 * Core auth engine interface.
 *
 * This is the main contract that the core package implements
 * and that framework integrations (React, Axios, etc.) consume.
 *
 * @template T - User type
 */
export interface AuthEngine<T = Record<string, unknown>> {
  /**
   * Get the current auth state snapshot.
   */
  getState(): AuthState<T>;

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: (state: AuthState<T>) => void): () => void;

  /**
   * Log in with a token pair.
   * Decodes the access token, sets up refresh timers, and emits login event.
   */
  login(tokens: TokenPair): Promise<void>;

  /**
   * Log out and clear all auth data.
   * @param reason - Why the logout occurred.
   */
  logout(reason?: 'manual' | 'sessionExpired' | 'refreshFailed' | 'tabSync'): Promise<void>;

  /**
   * Attempt to restore a session from storage.
   * Called on initialization to check for existing tokens.
   */
  restoreSession(): Promise<boolean>;

  /**
   * Get the current access token.
   * Returns null if not authenticated or token has expired.
   * May trigger a refresh if the token is about to expire.
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Manually trigger a token refresh.
   */
  refreshToken(): Promise<TokenPair>;

  /**
   * Check if the user has specific roles.
   */
  hasRole(role: string | string[]): boolean;

  /**
   * Check if the user has specific permissions.
   */
  hasPermission(permission: string | string[]): boolean;

  /**
   * Listen to a specific auth event.
   */
  on<K extends AuthEventType>(event: K, handler: (payload: AuthEventMap[K]) => void): () => void;

  /**
   * Emit an auth event (used internally and by adapters).
   */
  emit(event: AuthEvent): void;

  /**
   * Clean up all timers, listeners, and resources.
   */
  destroy(): void;
}
