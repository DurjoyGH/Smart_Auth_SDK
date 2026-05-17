/**
 * @smart-auth/types
 *
 * Core TypeScript type definitions for the smart-auth-sdk ecosystem.
 * This package contains all shared interfaces, types, and error classes
 * used across the monorepo.
 */

// ─── Configuration ────────────────────────────────────────────────────────────
export type {
  AuthConfig,
  AuthConfigOptions,
  TokenTransport,
  StorageType,
  RefreshConfig,
  CookieConfig,
} from './config';

// ─── Auth State ───────────────────────────────────────────────────────────────
export type { AuthState, AuthStatus } from './state';

// ─── User ─────────────────────────────────────────────────────────────────────
export type { AuthUser, TokenPayload, TokenPair } from './user';

// ─── Events ───────────────────────────────────────────────────────────────────
export type {
  AuthEvent,
  AuthEventMap,
  AuthEventType,
  LoginEvent,
  LogoutEvent,
  TokenRefreshedEvent,
  SessionExpiredEvent,
  AuthErrorEvent,
} from './events';

// ─── Storage ──────────────────────────────────────────────────────────────────
export type { StorageAdapter } from './storage';

// ─── Logger ───────────────────────────────────────────────────────────────────
export type { Logger, LogLevel } from './logger';

// ─── Errors ───────────────────────────────────────────────────────────────────
export {
  AuthError,
  TokenExpiredError,
  RefreshFailedError,
  UnauthorizedError,
  SessionExpiredError,
  InvalidTokenError,
} from './errors';

// ─── Middleware (Express) ─────────────────────────────────────────────────────
export type {
  ExpressAuthConfig,
  TokenIssuerConfig,
  AuthenticatedRequest,
  RequestAuthData,
} from './middleware';

// ─── Auth Engine Interface ────────────────────────────────────────────────────
export type { AuthEngine } from './engine';
