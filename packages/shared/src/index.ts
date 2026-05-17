/**
 * @smart-auth/shared
 *
 * Shared utilities used across the smart-auth-sdk monorepo.
 * Framework-agnostic. No browser-only or Node-only assumptions.
 */

// ─── JWT Utilities ────────────────────────────────────────────────────────────
export { decodeToken, getTokenExpiration, isTokenExpired, getTokenTimeRemaining } from './jwt';

// ─── Environment Detection ───────────────────────────────────────────────────
export {
  isBrowser,
  isNode,
  isSSR,
  safeWindow,
  safeDocument,
  safeLocalStorage,
  safeSessionStorage,
} from './environment';

// ─── Event Emitter ────────────────────────────────────────────────────────────
export { TypedEventEmitter } from './event-emitter';

// ─── Logger ───────────────────────────────────────────────────────────────────
export { createLogger, noopLogger } from './logger';

// ─── Config Resolver ──────────────────────────────────────────────────────────
export { resolveConfig } from './config-resolver';

// ─── Utilities ────────────────────────────────────────────────────────────────
export { sleep, createDeferredPromise, type DeferredPromise } from './utils';
