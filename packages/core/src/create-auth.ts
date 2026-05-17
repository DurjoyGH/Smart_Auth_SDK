import type { AuthConfigOptions, AuthEngine, StorageAdapter } from '@smart-auth/types';
import { resolveConfig, createLogger } from '@smart-auth/shared';
import { createStorageAdapter } from './storage/create-storage-adapter';
import { AuthEngineImpl } from './engine/auth-engine';

/**
 * Create a new auth engine instance.
 *
 * This is the main entry point for the SDK.
 *
 * @example
 * ```ts
 * const auth = createAuth({
 *   apiBaseUrl: '/api',
 *   refresh: { endpoint: '/auth/refresh' },
 *   autoRefresh: true,
 *   storage: 'memory',
 * });
 *
 * // Login
 * await auth.login({ accessToken, refreshToken });
 *
 * // Get state
 * const state = auth.getState();
 *
 * // Subscribe to changes
 * const unsubscribe = auth.subscribe((state) => {
 *   console.log('Auth state changed:', state);
 * });
 *
 * // Listen to events
 * auth.on('logout', (event) => {
 *   console.log('Logged out:', event.reason);
 * });
 * ```
 *
 * @param options - Configuration options. All have sensible defaults.
 * @param customStorage - Optional custom storage adapter (when storage type is 'custom').
 * @param fetchFn - Optional custom fetch function (for testing or custom HTTP clients).
 */
export function createAuth<T = Record<string, unknown>>(
  options: AuthConfigOptions = {},
  customStorage?: StorageAdapter,
  fetchFn?: typeof fetch,
): AuthEngine<T> {
  // Resolve config with defaults
  const config = resolveConfig(options);

  // Create logger
  const logger = createLogger(config.debug, config.debug ? 'debug' : 'warn');

  logger.debug('Creating auth engine with config', {
    apiBaseUrl: config.apiBaseUrl,
    storage: config.storage,
    tokenTransport: config.tokenTransport,
    autoRefresh: config.autoRefresh,
    multiTabSync: config.multiTabSync,
  });

  // Create storage adapter
  const storage = customStorage ?? createStorageAdapter(config);

  // Create and return the engine
  const engine = new AuthEngineImpl<T>(config, storage, logger, fetchFn);

  // Automatically restore session on creation
  engine.restoreSession().catch((error) => {
    logger.warn('Auto session restore failed', error);
  });

  return engine;
}
