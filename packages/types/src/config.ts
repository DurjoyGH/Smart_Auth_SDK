/**
 * Storage backend type for token persistence.
 *
 * - `memory`: In-memory only (cleared on page refresh). Most secure for access tokens.
 * - `localStorage`: Persistent across tabs/sessions. NOT recommended for sensitive tokens.
 * - `sessionStorage`: Cleared when the tab closes.
 * - `cookie`: Uses document.cookie (client-side) or Set-Cookie headers (server-side).
 * - `custom`: User-provided StorageAdapter implementation.
 */
export type StorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'cookie' | 'custom';

/**
 * How tokens are sent to the server.
 *
 * - `header`: Authorization: Bearer <token>
 * - `cookie`: Token sent via httpOnly cookie (set by server).
 */
export type TokenTransport = 'header' | 'cookie';

/**
 * Configuration for the token refresh lifecycle.
 */
export interface RefreshConfig {
  /** Endpoint to call when refreshing tokens. */
  endpoint: string;

  /** HTTP method to use for refresh requests. */
  method?: 'POST' | 'PUT' | 'PATCH';

  /**
   * Time in milliseconds before the access token expires to proactively refresh.
   * Prevents requests from failing due to token expiration during flight.
   * @default 30000 (30 seconds)
   */
  bufferMs?: number;

  /**
   * Maximum number of refresh retry attempts before giving up.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Delay between retry attempts in milliseconds.
   * @default 1000
   */
  retryDelayMs?: number;

  /**
   * Custom function to extract token pair from the refresh response.
   * If not provided, the SDK will attempt to parse the response body
   * looking for common field names.
   */
  extractTokens?: (response: unknown) => { accessToken: string; refreshToken?: string } | null;
}

/**
 * Configuration for cookie-based token storage/transport.
 */
export interface CookieConfig {
  /** Cookie path. @default '/' */
  path?: string;

  /** Cookie domain. */
  domain?: string;

  /** Whether the cookie is httpOnly (server-set only). @default true */
  httpOnly?: boolean;

  /** Whether the cookie requires HTTPS. @default true in production */
  secure?: boolean;

  /** SameSite attribute. @default 'strict' */
  sameSite?: 'strict' | 'lax' | 'none';

  /** Cookie name for access token. @default 'smart_auth_access' */
  accessTokenName?: string;

  /** Cookie name for refresh token. @default 'smart_auth_refresh' */
  refreshTokenName?: string;
}

/**
 * Full configuration options for the auth SDK.
 * All fields are optional with sensible defaults.
 */
export interface AuthConfigOptions {
  /**
   * Base URL for API calls (used by refresh endpoint resolution).
   * @default ''
   */
  apiBaseUrl?: string;

  /**
   * Key used to identify the access token in storage/response payloads.
   * @default 'access_token'
   */
  accessTokenKey?: string;

  /**
   * Key used to identify the refresh token in storage/response payloads.
   * @default 'refresh_token'
   */
  refreshTokenKey?: string;

  /**
   * Whether to automatically refresh tokens before they expire.
   * @default true
   */
  autoRefresh?: boolean;

  /**
   * Storage type for the access token.
   * @default 'memory'
   */
  storage?: StorageType;

  /**
   * How tokens are transported to the server.
   * @default 'header'
   */
  tokenTransport?: TokenTransport;

  /** Refresh configuration. */
  refresh?: RefreshConfig;

  /** Cookie configuration (used when storage or transport is 'cookie'). */
  cookie?: CookieConfig;

  /**
   * Whether to synchronize auth state across browser tabs.
   * @default true
   */
  multiTabSync?: boolean;

  /**
   * Clock skew tolerance in milliseconds for token expiration checks.
   * Compensates for clock differences between client and server.
   * @default 5000 (5 seconds)
   */
  clockSkewMs?: number;

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;

  /**
   * Custom function to extract the user from a decoded access token payload.
   * If not provided, the entire decoded payload is used as the user object.
   */
  extractUser?: <T = Record<string, unknown>>(payload: Record<string, unknown>) => T;

  /**
   * URL to redirect to when a session expires or the user is unauthorized.
   * Used by React ProtectedRoute and useProtectedRoute.
   */
  loginUrl?: string;

  /**
   * URL to redirect to after successful login.
   */
  postLoginUrl?: string;

  /**
   * Roles/permissions field name in the token payload.
   * @default 'roles'
   */
  rolesKey?: string;

  /**
   * Permissions field name in the token payload.
   * @default 'permissions'
   */
  permissionsKey?: string;
}

/**
 * Resolved configuration with all defaults applied.
 * This is what the core engine works with internally.
 */
export interface AuthConfig extends Required<Omit<AuthConfigOptions, 'refresh' | 'cookie' | 'extractUser' | 'loginUrl' | 'postLoginUrl'>> {
  refresh: Required<Omit<RefreshConfig, 'extractTokens'>> & { extractTokens?: RefreshConfig['extractTokens'] };
  cookie: Required<CookieConfig>;
  extractUser?: AuthConfigOptions['extractUser'];
  loginUrl?: string;
  postLoginUrl?: string;
}
