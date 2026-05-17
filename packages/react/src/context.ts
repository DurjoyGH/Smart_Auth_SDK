import { createContext } from 'react';
import type { AuthState, AuthEngine, TokenPair } from '@smart-auth/types';

/**
 * The value provided by the AuthContext.
 *
 * @template T - User type
 */
export interface AuthContextValue<T = Record<string, unknown>> {
  /** Current auth state. */
  state: AuthState<T>;

  /** The auth engine instance. */
  engine: AuthEngine<T>;

  /** Login with a token pair. */
  login: (tokens: TokenPair) => Promise<void>;

  /** Logout. */
  logout: () => Promise<void>;

  /** Whether the user is authenticated. */
  authenticated: boolean;

  /** Whether the auth system is loading. */
  loading: boolean;

  /** The current user, or null. */
  user: T | null;

  /** Current error, or null. */
  error: Error | null;

  /** Get the current access token. */
  getAccessToken: () => Promise<string | null>;

  /** Check if user has a role. */
  hasRole: (role: string | string[]) => boolean;

  /** Check if user has a permission. */
  hasPermission: (permission: string | string[]) => boolean;
}

/**
 * React Context for auth state.
 * The default value is null — the provider must be mounted.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
AuthContext.displayName = 'SmartAuthContext';
