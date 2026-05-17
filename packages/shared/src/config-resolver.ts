import type { AuthConfig, AuthConfigOptions } from '@smart-auth/types';

/**
 * Resolve a partial user config into a fully resolved config
 * with all defaults applied.
 */
export function resolveConfig(options: AuthConfigOptions = {}): AuthConfig {
  const isProduction = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';

  return {
    apiBaseUrl: options.apiBaseUrl ?? '',
    accessTokenKey: options.accessTokenKey ?? 'access_token',
    refreshTokenKey: options.refreshTokenKey ?? 'refresh_token',
    autoRefresh: options.autoRefresh ?? true,
    storage: options.storage ?? 'memory',
    tokenTransport: options.tokenTransport ?? 'header',
    multiTabSync: options.multiTabSync ?? true,
    clockSkewMs: options.clockSkewMs ?? 5000,
    debug: options.debug ?? false,
    rolesKey: options.rolesKey ?? 'roles',
    permissionsKey: options.permissionsKey ?? 'permissions',
    extractUser: options.extractUser,
    loginUrl: options.loginUrl,
    postLoginUrl: options.postLoginUrl,
    refresh: {
      endpoint: options.refresh?.endpoint ?? '/auth/refresh',
      method: options.refresh?.method ?? 'POST',
      bufferMs: options.refresh?.bufferMs ?? 30_000,
      maxRetries: options.refresh?.maxRetries ?? 3,
      retryDelayMs: options.refresh?.retryDelayMs ?? 1000,
      extractTokens: options.refresh?.extractTokens,
    },
    cookie: {
      path: options.cookie?.path ?? '/',
      domain: options.cookie?.domain ?? '',
      httpOnly: options.cookie?.httpOnly ?? true,
      secure: options.cookie?.secure ?? isProduction,
      sameSite: options.cookie?.sameSite ?? 'strict',
      accessTokenName: options.cookie?.accessTokenName ?? 'smart_auth_access',
      refreshTokenName: options.cookie?.refreshTokenName ?? 'smart_auth_refresh',
    },
  };
}
