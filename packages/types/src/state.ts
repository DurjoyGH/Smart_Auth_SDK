/**
 * Authentication status enum.
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Represents the current authentication state.
 *
 * @template T - The user type. Defaults to Record<string, unknown>.
 */
export interface AuthState<T = Record<string, unknown>> {
  /** Current authentication status. */
  status: AuthStatus;

  /** The authenticated user, or null if not authenticated. */
  user: T | null;

  /** Whether the auth system is currently loading (initial check, refreshing, etc.). */
  loading: boolean;

  /** Whether the user is authenticated. */
  authenticated: boolean;

  /** The current access token, or null. */
  accessToken: string | null;

  /** Last error that occurred during auth operations. */
  error: Error | null;

  /** Timestamp of when the current session was established. */
  sessionStartedAt: number | null;

  /** Timestamp of when the access token expires (epoch ms). */
  accessTokenExpiresAt: number | null;
}
