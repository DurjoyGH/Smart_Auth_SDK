/**
 * @smart-auth/express
 *
 * Express middleware and utilities for smart-auth-sdk.
 * Provides token verification, issuance, RBAC, and cookie support.
 */

// ─── Middleware ────────────────────────────────────────────────────────────────
export { verifyAccessToken } from './middleware/verify-access-token';
export { authorize } from './middleware/authorize';

// ─── Token Issuance ───────────────────────────────────────────────────────────
export { createTokenIssuer } from './token-issuer';
export type { TokenIssuer } from './token-issuer';

// ─── Refresh Token Rotation ──────────────────────────────────────────────────
export { createRefreshHandler } from './refresh-handler';
export type { RefreshHandlerConfig, RefreshHandler } from './refresh-handler';

// ─── Cookie Helpers ───────────────────────────────────────────────────────────
export { setTokenCookies, clearTokenCookies } from './cookie-helpers';
export type { CookieOptions } from './cookie-helpers';

// ─── Re-exports for convenience ──────────────────────────────────────────────
export type {
  ExpressAuthConfig,
  TokenIssuerConfig,
  AuthenticatedRequest,
} from '@smart-auth/types';
