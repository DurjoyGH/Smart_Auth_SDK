import type { StorageAdapter } from '@smart-auth/types';
import { safeLocalStorage } from '@smart-auth/shared';

/**
 * localStorage adapter.
 *
 * WARNING: localStorage is accessible to any JavaScript running on the page.
 * Do NOT use this for refresh tokens in production.
 * Use only for non-sensitive data like user preferences or access tokens
 * when the risk model accepts it.
 *
 * Falls back to in-memory storage if localStorage is not available (SSR, privacy mode).
 */
export class LocalStorageAdapter implements StorageAdapter {
  private fallback = new Map<string, string>();
  private storage: Storage | undefined;

  constructor() {
    this.storage = safeLocalStorage();
  }

  get(key: string): string | null {
    if (this.storage) {
      return this.storage.getItem(key);
    }
    return this.fallback.get(key) ?? null;
  }

  set(key: string, value: string): void {
    if (this.storage) {
      this.storage.setItem(key, value);
    } else {
      this.fallback.set(key, value);
    }
  }

  remove(key: string): void {
    if (this.storage) {
      this.storage.removeItem(key);
    } else {
      this.fallback.delete(key);
    }
  }

  clear(): void {
    if (this.storage) {
      // Only clear our keys, not all of localStorage
      // This is a conscious choice — we don't know which keys are ours
      // Callers should use remove() for specific keys
      this.storage.clear();
    } else {
      this.fallback.clear();
    }
  }
}
