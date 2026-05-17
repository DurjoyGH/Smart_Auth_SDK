import type { StorageAdapter } from '@smart-auth/types';

/**
 * In-memory storage adapter.
 *
 * This is the most secure storage option for access tokens because
 * the data is never persisted to disk and is cleared on page refresh.
 *
 * Trade-off: tokens are lost on page refresh, requiring a re-authentication
 * or refresh token rotation.
 */
export class MemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();

  get(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
