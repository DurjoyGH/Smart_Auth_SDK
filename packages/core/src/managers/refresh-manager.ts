import type { AuthConfig, TokenPair } from '@smart-auth/types';
import type { Logger } from '@smart-auth/types';
import { RefreshFailedError, SessionExpiredError } from '@smart-auth/types';
import { createDeferredPromise, sleep, getTokenTimeRemaining } from '@smart-auth/shared';
import type { DeferredPromise } from '@smart-auth/shared';
import { TokenManager } from './token-manager';

/**
 * Manages the token refresh lifecycle with concurrency control.
 *
 * Key guarantees:
 * 1. Only ONE refresh request happens at a time, even with concurrent callers.
 * 2. All callers waiting for a refresh get the same result.
 * 3. Failed refreshes are retried up to maxRetries times.
 * 4. If all retries fail, all waiting callers are rejected.
 * 5. Infinite refresh loops are prevented via attempt tracking.
 * 6. The refresh timer is reset after each successful refresh.
 */
export class RefreshManager {
  private config: AuthConfig;
  private tokenManager: TokenManager;
  private logger: Logger;

  /** The in-flight refresh promise. Null when no refresh is in progress. */
  private refreshPromise: DeferredPromise<TokenPair> | null = null;

  /** Whether a refresh is currently in progress. */
  private isRefreshing = false;

  /** Timer ID for the proactive refresh timer. */
  private refreshTimerId: ReturnType<typeof setTimeout> | null = null;

  /** Callback to invoke when tokens are refreshed. */
  private onRefreshSuccess?: (tokens: TokenPair) => Promise<void>;

  /** Callback to invoke when refresh fails permanently. */
  private onRefreshFailure?: (error: Error) => Promise<void>;

  /** Custom fetch function for the refresh request. */
  private fetchFn: typeof fetch;

  constructor(
    config: AuthConfig,
    tokenManager: TokenManager,
    logger: Logger,
    options?: {
      onRefreshSuccess?: (tokens: TokenPair) => Promise<void>;
      onRefreshFailure?: (error: Error) => Promise<void>;
      fetchFn?: typeof fetch;
    },
  ) {
    this.config = config;
    this.tokenManager = tokenManager;
    this.logger = logger;
    this.onRefreshSuccess = options?.onRefreshSuccess;
    this.onRefreshFailure = options?.onRefreshFailure;
    this.fetchFn = options?.fetchFn ?? globalThis.fetch?.bind(globalThis);
  }

  /**
   * Request a token refresh.
   *
   * If a refresh is already in progress, the caller joins the existing
   * refresh promise (they'll get the same result).
   *
   * If no refresh is in progress, a new refresh is initiated.
   */
  async refresh(): Promise<TokenPair> {
    // If a refresh is already in progress, join it
    if (this.isRefreshing && this.refreshPromise) {
      this.logger.debug('Refresh already in progress, joining existing request');
      return this.refreshPromise.promise;
    }

    // Start a new refresh
    this.isRefreshing = true;
    this.refreshPromise = createDeferredPromise<TokenPair>();

    try {
      const tokens = await this.executeRefreshWithRetry();
      this.refreshPromise.resolve(tokens);

      if (this.onRefreshSuccess) {
        await this.onRefreshSuccess(tokens);
      }

      return tokens;
    } catch (error) {
      const refreshError =
        error instanceof Error ? error : new RefreshFailedError('Unknown refresh error');

      this.refreshPromise.reject(refreshError);

      if (this.onRefreshFailure) {
        await this.onRefreshFailure(refreshError);
      }

      throw refreshError;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Execute the refresh request with retry logic.
   */
  private async executeRefreshWithRetry(): Promise<TokenPair> {
    const { maxRetries, retryDelayMs } = this.config.refresh;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Refresh attempt ${attempt}/${maxRetries}`);
        const tokens = await this.executeRefreshRequest();
        this.logger.info('Token refresh successful');
        return tokens;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        if (isLastAttempt) {
          this.logger.error(`All ${maxRetries} refresh attempts failed`);
          throw new RefreshFailedError(
            `Token refresh failed after ${maxRetries} attempts: ${errorMsg}`,
            attempt,
            maxRetries,
            error instanceof Error ? error : undefined,
          );
        }

        this.logger.warn(`Refresh attempt ${attempt} failed: ${errorMsg}. Retrying...`);
        await sleep(retryDelayMs);
      }
    }

    // This should be unreachable, but TypeScript needs it
    throw new RefreshFailedError('Refresh failed', 0, maxRetries);
  }

  /**
   * Execute a single refresh HTTP request.
   */
  private async executeRefreshRequest(): Promise<TokenPair> {
    const refreshToken = await this.tokenManager.getRefreshToken();
    const url = `${this.config.apiBaseUrl}${this.config.refresh.endpoint}`;
    const method = this.config.refresh.method;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const body: Record<string, unknown> = {};

    // If using header transport, include refresh token in body
    if (this.config.tokenTransport === 'header' && refreshToken) {
      body[this.config.refreshTokenKey] = refreshToken;
    }
    // If using cookie transport, the cookie is sent automatically

    if (!this.fetchFn) {
      throw new RefreshFailedError(
        'No fetch function available. Ensure you are running in an environment ' +
        'with fetch support or provide a custom fetch function.',
      );
    }

    const response = await this.fetchFn(url, {
      method,
      headers,
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      credentials: this.config.tokenTransport === 'cookie' ? 'include' : 'same-origin',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new SessionExpiredError(
          'Refresh token has been revoked or expired',
        );
      }
      throw new RefreshFailedError(
        `Refresh request failed with status ${response.status}`,
      );
    }

    const data = await response.json();

    // Use custom extractor if provided
    if (this.config.refresh.extractTokens) {
      const extracted = this.config.refresh.extractTokens(data);
      if (!extracted) {
        throw new RefreshFailedError('Custom token extractor returned null');
      }
      return {
        accessToken: extracted.accessToken,
        refreshToken: extracted.refreshToken,
      };
    }

    // Default extraction: look for common field names
    const accessToken =
      data[this.config.accessTokenKey] ??
      data.accessToken ??
      data.access_token ??
      data.token;

    const newRefreshToken =
      data[this.config.refreshTokenKey] ??
      data.refreshToken ??
      data.refresh_token;

    if (!accessToken || typeof accessToken !== 'string') {
      throw new RefreshFailedError(
        'Could not extract access token from refresh response',
      );
    }

    return {
      accessToken,
      refreshToken: typeof newRefreshToken === 'string' ? newRefreshToken : undefined,
    };
  }

  /**
   * Schedule a proactive token refresh.
   *
   * Called after login or after a successful refresh to set up
   * the next refresh before the token expires.
   */
  scheduleRefresh(onRefreshNeeded: () => Promise<void>): void {
    this.clearRefreshTimer();

    if (!this.config.autoRefresh) {
      this.logger.debug('Auto-refresh is disabled');
      return;
    }

    // Calculate when to refresh
    this.tokenManager.getAccessToken().then((token) => {
      if (!token) return;

      try {
        const remaining = getTokenTimeRemaining(token, this.config.clockSkewMs);

        if (remaining === Infinity) {
          this.logger.debug('Token has no expiration, skipping auto-refresh');
          return;
        }

        if (remaining <= 0) {
          this.logger.debug('Token already expired, triggering immediate refresh');
          onRefreshNeeded();
          return;
        }

        // Refresh `bufferMs` before expiration
        const delay = Math.max(0, remaining - this.config.refresh.bufferMs);
        this.logger.debug(`Scheduling token refresh in ${Math.round(delay / 1000)}s`);

        this.refreshTimerId = setTimeout(() => {
          onRefreshNeeded();
        }, delay);
      } catch (error) {
        this.logger.warn('Failed to schedule refresh', error);
      }
    });
  }

  /**
   * Clear the proactive refresh timer.
   */
  clearRefreshTimer(): void {
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  /**
   * Whether a refresh is currently in progress.
   */
  get refreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.clearRefreshTimer();
    this.isRefreshing = false;
    if (this.refreshPromise) {
      this.refreshPromise.reject(new Error('RefreshManager destroyed'));
      this.refreshPromise = null;
    }
  }
}
