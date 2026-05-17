/**
 * Configuration for Express authentication middleware.
 *
 * Note: This file avoids importing from 'express' directly
 * to keep @smart-auth/types dependency-free. The express package
 * augments these types with the real Express types.
 */

export interface ExpressAuthConfig {
  /** Secret key used to verify JWTs. */
  secret: string;

  /** JWT signing algorithm. @default 'HS256' */
  algorithm?: string;

  /** Expected issuer claim. */
  issuer?: string;

  /** Expected audience claim. */
  audience?: string | string[];

  /**
   * How to extract the token from the request.
   * @default 'header' (Authorization: Bearer <token>)
   */
  tokenLocation?: 'header' | 'cookie' | 'custom';

  /** Cookie name when tokenLocation is 'cookie'. @default 'smart_auth_access' */
  cookieName?: string;

  /**
   * Custom token extractor function.
   * Receives the Express Request object.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractToken?: (req: any) => string | null;

  /**
   * Clock tolerance in seconds for token verification.
   * @default 5
   */
  clockTolerance?: number;

  /** Field name in the token payload that contains user roles. @default 'roles' */
  rolesKey?: string;

  /** Field name in the token payload that contains permissions. @default 'permissions' */
  permissionsKey?: string;
}

/**
 * Configuration for issuing token pairs.
 */
export interface TokenIssuerConfig {
  /** Secret key for signing access tokens. */
  accessTokenSecret: string;

  /** Secret key for signing refresh tokens. Can differ from access token secret. */
  refreshTokenSecret?: string;

  /** Access token expiration (e.g., '15m', '1h'). @default '15m' */
  accessTokenExpiry?: string | number;

  /** Refresh token expiration (e.g., '7d', '30d'). @default '7d' */
  refreshTokenExpiry?: string | number;

  /** JWT signing algorithm. @default 'HS256' */
  algorithm?: string;

  /** Issuer claim to include in tokens. */
  issuer?: string;

  /** Audience claim to include in tokens. */
  audience?: string | string[];
}

/**
 * Auth data attached to the Express request by verifyAccessToken middleware.
 */
export interface RequestAuthData {
  /** The raw decoded JWT payload. */
  payload: Record<string, unknown>;

  /** User ID extracted from the `sub` claim. */
  userId: string;

  /** User roles extracted from the token. */
  roles: string[];

  /** User permissions extracted from the token. */
  permissions: string[];

  /** The raw access token string. */
  token: string;
}

/**
 * Express Request augmented with auth data.
 * Populated by the verifyAccessToken middleware.
 *
 * This is a generic interface — the express package provides
 * concrete typings that extend Express.Request.
 */
export interface AuthenticatedRequest {
  auth: RequestAuthData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
