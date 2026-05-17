import type { AuthConfig, AuthState, TokenPair } from '@smart-auth/types';
import type { Logger } from '@smart-auth/types';
import { getTokenExpiration, isTokenExpired } from '@smart-auth/shared';
import { TokenManager } from './token-manager';

/**
 * Initial auth state — unauthenticated and loading.
 */
export function createInitialState<T = Record<string, unknown>>(): AuthState<T> {
  return {
    status: 'loading',
    user: null,
    loading: true,
    authenticated: false,
    accessToken: null,
    error: null,
    sessionStartedAt: null,
    accessTokenExpiresAt: null,
  };
}

/**
 * Manages the authentication session lifecycle.
 *
 * Responsibilities:
 * - Login: process token pair, update state
 * - Logout: clear tokens, reset state
 * - Session restore: check for existing tokens on init
 * - State management: maintain reactive auth state
 */
export class SessionManager<T = Record<string, unknown>> {
  private config: AuthConfig;
  private tokenManager: TokenManager;
  private logger: Logger;
  private state: AuthState<T>;
  private listeners = new Set<(state: AuthState<T>) => void>();

  constructor(config: AuthConfig, tokenManager: TokenManager, logger: Logger) {
    this.config = config;
    this.tokenManager = tokenManager;
    this.logger = logger;
    this.state = createInitialState<T>();
  }

  /**
   * Get the current auth state.
   */
  getState(): AuthState<T> {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: (state: AuthState<T>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Process a login with a token pair.
   */
  async login(tokens: TokenPair): Promise<void> {
    this.logger.info('Processing login');

    // Store tokens
    await this.tokenManager.setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) {
      await this.tokenManager.setRefreshToken(tokens.refreshToken);
    }

    // Extract user and expiration
    const user = await this.tokenManager.extractUser<T>();
    const expiresAt = getTokenExpiration(tokens.accessToken);

    this.setState({
      status: 'authenticated',
      user,
      loading: false,
      authenticated: true,
      accessToken: tokens.accessToken,
      error: null,
      sessionStartedAt: Date.now(),
      accessTokenExpiresAt: expiresAt,
    });
  }

  /**
   * Process a token refresh — update state with new token data.
   */
  async handleTokenRefresh(tokens: TokenPair): Promise<void> {
    this.logger.debug('Updating state after token refresh');

    await this.tokenManager.setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) {
      await this.tokenManager.setRefreshToken(tokens.refreshToken);
    }

    const user = await this.tokenManager.extractUser<T>();
    const expiresAt = getTokenExpiration(tokens.accessToken);

    this.setState({
      ...this.state,
      user,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: expiresAt,
      error: null,
    });
  }

  /**
   * Process a logout.
   */
  async logout(): Promise<void> {
    this.logger.info('Processing logout');
    await this.tokenManager.clearTokens();

    this.setState({
      status: 'unauthenticated',
      user: null,
      loading: false,
      authenticated: false,
      accessToken: null,
      error: null,
      sessionStartedAt: null,
      accessTokenExpiresAt: null,
    });
  }

  /**
   * Attempt to restore a session from storage.
   *
   * @returns `true` if a valid session was restored.
   */
  async restoreSession(): Promise<boolean> {
    this.logger.debug('Attempting to restore session');
    this.setState({ ...this.state, loading: true, status: 'loading' });

    try {
      const accessToken = await this.tokenManager.getAccessToken();

      if (!accessToken) {
        this.logger.debug('No stored access token found');
        this.setState({
          ...this.state,
          status: 'unauthenticated',
          loading: false,
        });
        return false;
      }

      // Check if token is still valid
      if (isTokenExpired(accessToken, this.config.clockSkewMs)) {
        this.logger.debug('Stored access token is expired');
        // Don't clear tokens — the refresh manager may be able to refresh
        this.setState({
          ...this.state,
          status: 'unauthenticated',
          loading: false,
          accessToken: null,
        });
        return false;
      }

      // Token is valid — restore session
      const user = await this.tokenManager.extractUser<T>();
      const expiresAt = getTokenExpiration(accessToken);

      this.setState({
        status: 'authenticated',
        user,
        loading: false,
        authenticated: true,
        accessToken,
        error: null,
        sessionStartedAt: Date.now(),
        accessTokenExpiresAt: expiresAt,
      });

      this.logger.info('Session restored successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to restore session', error);
      this.setState({
        status: 'unauthenticated',
        user: null,
        loading: false,
        authenticated: false,
        accessToken: null,
        error: error instanceof Error ? error : new Error('Session restore failed'),
        sessionStartedAt: null,
        accessTokenExpiresAt: null,
      });
      return false;
    }
  }

  /**
   * Set an error state.
   */
  setError(error: Error): void {
    this.setState({
      ...this.state,
      error,
      loading: false,
    });
  }

  /**
   * Set loading state.
   */
  setLoading(loading: boolean): void {
    this.setState({
      ...this.state,
      loading,
      status: loading ? 'loading' : this.state.status,
    });
  }

  /**
   * Update the state and notify listeners.
   */
  private setState(newState: AuthState<T>): void {
    this.state = newState;
    // Notify all subscribers
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (error) {
        this.logger.error('Error in state listener', error);
      }
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.listeners.clear();
  }
}
