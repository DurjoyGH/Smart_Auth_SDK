/**
 * @smart-auth/core
 *
 * Core authentication engine for the smart-auth-sdk ecosystem.
 * Framework-agnostic. Works in browser, Node.js, and SSR environments.
 */

// ─── Main Factory ─────────────────────────────────────────────────────────────
export { createAuth } from './create-auth';

// ─── Storage Adapters ─────────────────────────────────────────────────────────
export { MemoryStorage } from './storage/memory-storage';
export { LocalStorageAdapter } from './storage/local-storage-adapter';
export { SessionStorageAdapter } from './storage/session-storage-adapter';
export { CookieStorageAdapter } from './storage/cookie-storage-adapter';
export { createStorageAdapter } from './storage/create-storage-adapter';

// ─── Managers ─────────────────────────────────────────────────────────────────
export { TokenManager } from './managers/token-manager';
export { RefreshManager } from './managers/refresh-manager';
export { SessionManager } from './managers/session-manager';
export { TabSyncManager } from './managers/tab-sync-manager';

// ─── Auth Engine Implementation ───────────────────────────────────────────────
export { AuthEngineImpl } from './engine/auth-engine';

// ─── Re-exports from shared (convenience) ────────────────────────────────────
export {
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  getTokenTimeRemaining,
} from '@smart-auth/shared';
