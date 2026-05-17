import type { AuthEngine } from '@smart-auth/types';

export interface SmartFetchConfig {
  /**
   * The auth engine instance.
   */
  auth: AuthEngine;

  /**
   * Base URL to prepend to relative URLs.
   */
  baseUrl?: string;

  /**
   * Header name for the authorization token.
   * @default 'Authorization'
   */
  headerName?: string;

  /**
   * Token prefix.
   * @default 'Bearer'
   */
  tokenPrefix?: string;

  /**
   * HTTP status codes that trigger a refresh.
   * @default [401]
   */
  refreshStatusCodes?: number[];

  /**
   * URLs to exclude from token attachment.
   */
  excludeUrls?: string[];

  /**
   * Custom base fetch function.
   * @default globalThis.fetch
   */
  fetchFn?: typeof fetch;
}

export type SmartFetchFunction = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Create an enhanced fetch function with automatic auth handling.
 *
 * @example
 * ```ts
 * import { createSmartFetch } from '@smart-auth/fetch';
 * import { createAuth } from '@smart-auth/core';
 *
 * const auth = createAuth({ ... });
 * const smartFetch = createSmartFetch({ auth, baseUrl: '/api' });
 *
 * // Automatically authenticated
 * const response = await smartFetch('/protected');
 * const data = await response.json();
 * ```
 */
export function createSmartFetch(config: SmartFetchConfig): SmartFetchFunction {
  const {
    auth,
    baseUrl = '',
    headerName = 'Authorization',
    tokenPrefix = 'Bearer',
    refreshStatusCodes = [401],
    excludeUrls = [],
    fetchFn = globalThis.fetch?.bind(globalThis),
  } = config;

  if (!fetchFn) {
    throw new Error('[smart-auth/fetch] No fetch function available');
  }

  function isExcluded(url: string): boolean {
    return excludeUrls.some((excluded) => url.startsWith(excluded));
  }

  function resolveUrl(input: string | URL | Request): string {
    if (typeof input === 'string') {
      // If it's a relative URL, prepend baseUrl
      if (input.startsWith('/') || !input.includes('://')) {
        return `${baseUrl}${input}`;
      }
      return input;
    }
    if (input instanceof URL) {
      return input.toString();
    }
    return input.url;
  }

  async function smartFetch(
    input: string | URL | Request,
    init?: RequestInit,
    isRetry = false,
  ): Promise<Response> {
    const url = resolveUrl(input);
    const headers = new Headers(init?.headers);

    // Attach token if not excluded
    if (!isExcluded(url)) {
      const token = await auth.getAccessToken();
      if (token) {
        headers.set(headerName, `${tokenPrefix} ${token}`);
      }
    }

    const response = await fetchFn(url, {
      ...init,
      headers,
    });

    // Handle refresh-triggering status codes
    if (
      !isRetry &&
      !isExcluded(url) &&
      refreshStatusCodes.includes(response.status)
    ) {
      try {
        await auth.refreshToken();

        // Retry with new token
        return smartFetch(input, init, true);
      } catch {
        // Refresh failed — return the original response
        return response;
      }
    }

    return response;
  }

  return (input: string | URL | Request, init?: RequestInit) =>
    smartFetch(input, init, false);
}
