import type { StorageAdapter } from '@smart-auth/types';
import { safeSessionStorage } from '@smart-auth/shared';

/**
 * sessionStorage adapter.
 *
 * Data is cleared when the tab is closed.
 * Falls back to in-memory storage if sessionStorage is not available.
 */
export class SessionStorageAdapter implements StorageAdapter {
  private fallback = new Map<string, string>();
  private storage: Storage | undefined;

  constructor() {
    this.storage = safeSessionStorage();
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
      this.storage.clear();
    } else {
      this.fallback.clear();
    }
  }
}
