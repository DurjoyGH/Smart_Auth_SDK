/**
 * @smart-auth/axios
 *
 * Automatic axios integration for smart-auth-sdk.
 * Attaches access tokens, handles 401 responses, and retries failed requests.
 */

export { createSmartAxios } from './create-smart-axios';
export type { SmartAxiosConfig } from './create-smart-axios';
