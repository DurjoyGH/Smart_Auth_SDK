/**
 * Standard JWT payload fields.
 * Extended by user-specific claims.
 */
export interface TokenPayload {
  /** Subject (usually user ID). */
  sub?: string;

  /** Issued at timestamp (epoch seconds). */
  iat?: number;

  /** Expiration timestamp (epoch seconds). */
  exp?: number;

  /** Not before timestamp (epoch seconds). */
  nbf?: number;

  /** Issuer. */
  iss?: string;

  /** Audience. */
  aud?: string | string[];

  /** JWT ID. */
  jti?: string;

  /** Any additional claims. */
  [key: string]: unknown;
}

/**
 * Generic user type extracted from a JWT or API response.
 *
 * @template T - Custom user fields.
 */
export type AuthUser<T = Record<string, unknown>> = T & {
  /** User identifier (extracted from `sub` claim or custom). */
  id?: string;
};

/**
 * A pair of access and refresh tokens returned from login/refresh endpoints.
 */
export interface TokenPair {
  /** The short-lived access token (JWT). */
  accessToken: string;

  /** The long-lived refresh token (opaque or JWT). */
  refreshToken?: string;
}
