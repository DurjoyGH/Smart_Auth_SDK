import type {
  AuthConfig,
  AuthState,
  AuthEngine,
  AuthEvent,
  AuthEventType,
  AuthEventMap,
  TokenPair,
  StorageAdapter,
} from '@smart-auth/types';
import type { Logger } from '@smart-auth/types';
import { SessionExpiredError } from '@smart-auth/types';
import { TypedEventEmitter, getTokenTimeRemaining } from '@smart-auth/shared';
import { TokenManager } from '../managers/token-manager';
import { RefreshManager } from '../managers/refresh-manager';
import { SessionManager } from '../managers/session-manager';
import { TabSyncManager } from '../managers/tab-sync-manager';

/**
 * The core auth engine implementation.
 *
 * This is the single source of truth for authentication state.
 * It orchestrates all managers and exposes the public AuthEngine interface.
 *
 * @template T - User type
 */
export class AuthEngineImpl<T = Record<string, unknown>> implements AuthEngine<T> {
  private config: AuthConfig;
  private logger: Logger;
  private emitter: TypedEventEmitter;
  private tokenManager: TokenManager;
  private refreshManager: RefreshManager;
  private sessionManager: SessionManager<T>;
  private tabSyncManager: TabSyncManager | null = null;

  /** Cached roles and permissions to avoid async calls in sync methods. */
  private cachedRoles: string[] = [];
  private cachedPermissions: string[] = [];

  private destroyed = false;

  constructor(
    config: AuthConfig,
    storage: StorageAdapter,
    logger: Logger,
    fetchFn?: typeof fetch,
  ) {
    this.config = config;
    this.logger = logger;
    this.emitter = new TypedEventEmitter();

    // Initialize managers
    this.tokenManager = new TokenManager(config, storage, logger);

    this.sessionManager = new SessionManager<T>(config, this.tokenManager, logger);

    this.refreshManager = new RefreshManager(config, this.tokenManager, logger, {
      onRefreshSuccess: async (tokens) => {
        await this.handleRefreshSuccess(tokens);
      },
      onRefreshFailure: async (error) => {
        await this.handleRefreshFailure(error);
      },
      fetchFn,
    });

    // Initialize tab sync if enabled and in browser
    if (config.multiTabSync) {
      this.tabSyncManager = new TabSyncManager(logger, {
        onLogout: () => {
          this.logout('tabSync');
        },
        onLogin: () => {
          this.sessionManager.restoreSession().then(() => {
            this.updateRolesCache();
          });
        },
        onTokenRefreshed: () => {
          this.sessionManager.restoreSession().then(() => {
            this.updateRolesCache();
          });
        },
      });
      this.tabSyncManager.init();
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  getState(): AuthState<T> {
    return this.sessionManager.getState();
  }

  subscribe(listener: (state: AuthState<T>) => void): () => void {
    return this.sessionManager.subscribe(listener);
  }

  async login(tokens: TokenPair): Promise<void> {
    this.assertNotDestroyed();
    this.logger.info('Login initiated');

    await this.sessionManager.login(tokens);
    await this.updateRolesCache();

    // Schedule proactive refresh
    this.refreshManager.scheduleRefresh(async () => {
      try {
        await this.refreshToken();
      } catch {
        // Error is handled by refreshManager callbacks
      }
    });

    // Broadcast to other tabs
    this.tabSyncManager?.broadcastLogin();

    // Emit event
    this.emit({
      type: 'login',
      user: (this.getState().user ?? {}) as Record<string, unknown>,
      accessToken: tokens.accessToken,
      timestamp: Date.now(),
    });
  }

  async logout(reason: 'manual' | 'sessionExpired' | 'refreshFailed' | 'tabSync' = 'manual'): Promise<void> {
    this.logger.info(`Logout initiated (reason: ${reason})`);

    // Clear refresh timer
    this.refreshManager.clearRefreshTimer();

    // Clear session
    await this.sessionManager.logout();

    // Clear caches
    this.cachedRoles = [];
    this.cachedPermissions = [];

    // Broadcast to other tabs (unless this came from tab sync)
    if (reason !== 'tabSync') {
      this.tabSyncManager?.broadcastLogout();
    }

    // Emit events
    this.emit({
      type: 'logout',
      reason,
      timestamp: Date.now(),
    });

    if (reason === 'sessionExpired' || reason === 'refreshFailed') {
      this.emit({
        type: 'sessionExpired',
        reason,
        timestamp: Date.now(),
      });
    }
  }

  async restoreSession(): Promise<boolean> {
    this.assertNotDestroyed();
    this.logger.debug('Restoring session');

    const restored = await this.sessionManager.restoreSession();

    if (restored) {
      await this.updateRolesCache();

      // Schedule proactive refresh for the restored session
      this.refreshManager.scheduleRefresh(async () => {
        try {
          await this.refreshToken();
        } catch {
          // Handled by callbacks
        }
      });
    } else {
      // Try to refresh if we have a refresh token
      const refreshToken = await this.tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          this.logger.debug('Access token expired, attempting refresh');
          await this.refreshToken();
          return true;
        } catch {
          this.logger.debug('Refresh during restore failed');
          await this.logout('sessionExpired');
          return false;
        }
      }
    }

    return restored;
  }

  async getAccessToken(): Promise<string | null> {
    this.assertNotDestroyed();

    const token = await this.tokenManager.getAccessToken();
    if (!token) return null;

    // Check if token is about to expire and proactively refresh
    const remaining = getTokenTimeRemaining(token, this.config.clockSkewMs);
    if (remaining <= this.config.refresh.bufferMs && this.config.autoRefresh) {
      try {
        const refreshed = await this.refreshToken();
        return refreshed.accessToken;
      } catch {
        // Return existing token if refresh fails — it might still be valid
        return token;
      }
    }

    return token;
  }

  async refreshToken(): Promise<TokenPair> {
    this.assertNotDestroyed();
    return this.refreshManager.refresh();
  }

  hasRole(role: string | string[]): boolean {
    const roles = Array.isArray(role) ? role : [role];
    return roles.some((r) => this.cachedRoles.includes(r));
  }

  hasPermission(permission: string | string[]): boolean {
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some((p) => this.cachedPermissions.includes(p));
  }

  on<K extends AuthEventType>(event: K, handler: (payload: AuthEventMap[K]) => void): () => void {
    return this.emitter.on(event, handler);
  }

  emit(event: AuthEvent): void {
    this.emitter.emit(event.type, event as AuthEventMap[typeof event.type]);

    // Also emit stateChanged for any state-mutating event
    if (event.type !== 'stateChanged' && event.type !== 'authError') {
      this.emitter.emit('stateChanged', {
        type: 'stateChanged',
        state: this.getState(),
        timestamp: Date.now(),
      });
    }
  }

  destroy(): void {
    this.logger.debug('Destroying auth engine');
    this.destroyed = true;
    this.refreshManager.destroy();
    this.sessionManager.destroy();
    this.tabSyncManager?.destroy();
    this.emitter.destroy();
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────

  /**
   * Handle successful token refresh.
   */
  private async handleRefreshSuccess(tokens: TokenPair): Promise<void> {
    await this.sessionManager.handleTokenRefresh(tokens);
    await this.updateRolesCache();

    // Reschedule the next refresh
    this.refreshManager.scheduleRefresh(async () => {
      try {
        await this.refreshToken();
      } catch {
        // Handled by callbacks
      }
    });

    // Broadcast to other tabs
    this.tabSyncManager?.broadcastTokenRefreshed();

    this.emit({
      type: 'tokenRefreshed',
      accessToken: tokens.accessToken,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle refresh failure.
   */
  private async handleRefreshFailure(error: Error): Promise<void> {
    this.logger.error('Token refresh failed permanently', error);

    this.emit({
      type: 'authError',
      error,
      timestamp: Date.now(),
    });

    // If the refresh token itself is expired/revoked, log out
    if (error instanceof SessionExpiredError) {
      await this.logout('sessionExpired');
    } else {
      await this.logout('refreshFailed');
    }
  }

  /**
   * Update the cached roles and permissions from the current token.
   */
  private async updateRolesCache(): Promise<void> {
    this.cachedRoles = await this.tokenManager.getRoles();
    this.cachedPermissions = await this.tokenManager.getPermissions();
  }

  /**
   * Assert the engine hasn't been destroyed.
   */
  private assertNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error('[smart-auth] Auth engine has been destroyed. Create a new instance.');
    }
  }
}
