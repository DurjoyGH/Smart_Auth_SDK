import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthEngine } from '@smart-auth/types';
import { createDeferredPromise } from '@smart-auth/shared';
import type { DeferredPromise } from '@smart-auth/shared';

export interface SmartAxiosConfig {
  /**
   * The auth engine instance (from createAuth).
   */
  auth: AuthEngine;

  /**
   * The axios instance to attach interceptors to.
   */
  axios: AxiosInstance;

  /**
   * Header name for the authorization token.
   * @default 'Authorization'
   */
  headerName?: string;

  /**
   * Token prefix in the header value.
   * @default 'Bearer'
   */
  tokenPrefix?: string;

  /**
   * HTTP status codes that should trigger a token refresh.
   * @default [401]
   */
  refreshStatusCodes?: number[];

  /**
   * URLs that should NOT have the token attached (e.g., login, register).
   * Supports string prefixes.
   */
  excludeUrls?: string[];

  /**
   * Maximum number of queued requests during a token refresh.
   * @default 100
   */
  maxQueueSize?: number;
}

interface QueuedRequest {
  config: InternalAxiosRequestConfig;
  deferred: DeferredPromise<InternalAxiosRequestConfig>;
}

/**
 * Attach smart auth interceptors to an axios instance.
 *
 * Features:
 * 1. Request interceptor: Attaches the access token to every request.
 * 2. Response interceptor: On 401, triggers a token refresh and retries the request.
 * 3. Queue management: Multiple concurrent 401s result in only ONE refresh.
 *    All failed requests are queued and retried after the refresh succeeds.
 *
 * @example
 * ```ts
 * import axios from 'axios';
 * import { createSmartAxios } from '@smart-auth/axios';
 * import { createAuth } from '@smart-auth/core';
 *
 * const auth = createAuth({ ... });
 * const api = axios.create({ baseURL: '/api' });
 *
 * createSmartAxios({ auth, axios: api });
 *
 * // Now all requests through `api` are automatically authenticated
 * const response = await api.get('/protected');
 * ```
 *
 * @returns A cleanup function that removes the interceptors.
 */
export function createSmartAxios(config: SmartAxiosConfig): () => void {
  const {
    auth,
    axios: axiosInstance,
    headerName = 'Authorization',
    tokenPrefix = 'Bearer',
    refreshStatusCodes = [401],
    excludeUrls = [],
    maxQueueSize = 100,
  } = config;

  let isRefreshing = false;
  const requestQueue: QueuedRequest[] = [];

  /**
   * Check if a URL should be excluded from token attachment.
   */
  function isExcluded(url?: string): boolean {
    if (!url) return false;
    return excludeUrls.some((excluded) => url.startsWith(excluded));
  }

  /**
   * Attach the access token to a request config.
   */
  async function attachToken(
    requestConfig: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    if (isExcluded(requestConfig.url)) {
      return requestConfig;
    }

    const token = await auth.getAccessToken();
    if (token) {
      requestConfig.headers.set(headerName, `${tokenPrefix} ${token}`);
    }

    return requestConfig;
  }

  /**
   * Process all queued requests after a successful refresh.
   */
  async function processQueue(): Promise<void> {
    while (requestQueue.length > 0) {
      const item = requestQueue.shift();
      if (!item) break;

      try {
        const updatedConfig = await attachToken(item.config);
        item.deferred.resolve(updatedConfig);
      } catch (error) {
        item.deferred.reject(error);
      }
    }
  }

  /**
   * Reject all queued requests after a failed refresh.
   */
  function rejectQueue(error: Error): void {
    while (requestQueue.length > 0) {
      const item = requestQueue.shift();
      item?.deferred.reject(error);
    }
  }

  // ─── Request Interceptor ────────────────────────────────────────────────

  const requestInterceptorId = axiosInstance.interceptors.request.use(
    async (requestConfig) => {
      // If a refresh is in progress and this isn't an excluded URL,
      // wait for the refresh to complete
      if (isRefreshing && !isExcluded(requestConfig.url)) {
        if (requestQueue.length >= maxQueueSize) {
          throw new Error('[smart-auth] Request queue overflow during token refresh');
        }

        const deferred = createDeferredPromise<InternalAxiosRequestConfig>();
        requestQueue.push({ config: requestConfig, deferred });
        return deferred.promise;
      }

      return attachToken(requestConfig);
    },
    (error) => Promise.reject(error),
  );

  // ─── Response Interceptor ───────────────────────────────────────────────

  const responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;

      if (
        !originalRequest ||
        !error.response ||
        !refreshStatusCodes.includes(error.response.status) ||
        isExcluded(originalRequest.url)
      ) {
        return Promise.reject(error);
      }

      // Prevent infinite retry loops — mark the request
      const retryFlag = '_smartAuthRetried';
      if ((originalRequest as unknown as Record<string, unknown>)[retryFlag]) {
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          await auth.refreshToken();
          isRefreshing = false;

          // Process all queued requests
          await processQueue();

          // Retry the original request with the new token
          (originalRequest as unknown as Record<string, unknown>)[retryFlag] = true;
          const updatedConfig = await attachToken(originalRequest);
          return axiosInstance(updatedConfig);
        } catch (refreshError) {
          isRefreshing = false;
          rejectQueue(refreshError instanceof Error ? refreshError : new Error('Refresh failed'));
          return Promise.reject(refreshError);
        }
      } else {
        // A refresh is already in progress — queue this request
        if (requestQueue.length >= maxQueueSize) {
          return Promise.reject(new Error('[smart-auth] Request queue overflow'));
        }

        const deferred = createDeferredPromise<InternalAxiosRequestConfig>();
        requestQueue.push({ config: originalRequest, deferred });

        const updatedConfig = await deferred.promise;
        (originalRequest as unknown as Record<string, unknown>)[retryFlag] = true;
        return axiosInstance(updatedConfig);
      }
    },
  );

  // ─── Cleanup Function ──────────────────────────────────────────────────

  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptorId);
    axiosInstance.interceptors.response.eject(responseInterceptorId);
    rejectQueue(new Error('Interceptors removed'));
  };
}
