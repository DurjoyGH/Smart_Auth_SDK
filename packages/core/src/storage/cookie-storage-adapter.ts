import type { StorageAdapter, CookieConfig } from '@smart-auth/types';
import { isBrowser } from '@smart-auth/shared';

/**
 * Cookie storage adapter (client-side document.cookie).
 *
 * Note: This CANNOT set httpOnly cookies — those must be set by the server.
 * This adapter is for client-readable cookies only.
 *
 * For httpOnly cookie transport, the server sets the cookie via Set-Cookie
 * headers and the browser sends them automatically. The SDK doesn't need
 * to read/write them directly.
 */
export class CookieStorageAdapter implements StorageAdapter {
  private config: Required<CookieConfig>;
  private fallback = new Map<string, string>();

  constructor(config: Partial<CookieConfig> = {}) {
    this.config = {
      path: config.path ?? '/',
      domain: config.domain ?? '',
      httpOnly: false, // Client-side cookies can't be httpOnly
      secure: config.secure ?? false,
      sameSite: config.sameSite ?? 'strict',
      accessTokenName: config.accessTokenName ?? 'smart_auth_access',
      refreshTokenName: config.refreshTokenName ?? 'smart_auth_refresh',
    };
  }

  get(key: string): string | null {
    if (!isBrowser()) {
      return this.fallback.get(key) ?? null;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name === key) {
        const value = valueParts.join('=');
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    return null;
  }

  set(key: string, value: string): void {
    if (!isBrowser()) {
      this.fallback.set(key, value);
      return;
    }

    let cookie = `${key}=${encodeURIComponent(value)}`;
    cookie += `; path=${this.config.path}`;

    if (this.config.domain) {
      cookie += `; domain=${this.config.domain}`;
    }

    if (this.config.secure) {
      cookie += '; secure';
    }

    cookie += `; samesite=${this.config.sameSite}`;

    document.cookie = cookie;
  }

  remove(key: string): void {
    if (!isBrowser()) {
      this.fallback.delete(key);
      return;
    }

    // Set cookie with expired date to delete it
    let cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    cookie += `; path=${this.config.path}`;

    if (this.config.domain) {
      cookie += `; domain=${this.config.domain}`;
    }

    document.cookie = cookie;
  }

  clear(): void {
    if (!isBrowser()) {
      this.fallback.clear();
      return;
    }

    // Remove known auth cookies
    this.remove(this.config.accessTokenName);
    this.remove(this.config.refreshTokenName);
  }
}
