/**
 * @smart-auth/fetch
 *
 * Enhanced fetch wrapper for smart-auth-sdk.
 * Provides automatic token attachment, refresh on 401, and retry queue.
 */

export { createSmartFetch } from './create-smart-fetch';
export type { SmartFetchConfig, SmartFetchFunction } from './create-smart-fetch';
