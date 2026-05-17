/**
 * Abstraction for token storage backends.
 *
 * Implementations must be synchronous or return Promises.
 * This interface enables the SDK to work with memory, localStorage,
 * sessionStorage, cookies, or any custom storage mechanism.
 */
export interface StorageAdapter {
  /**
   * Retrieve a value by key.
   * Returns null if the key does not exist.
   */
  get(key: string): string | null | Promise<string | null>;

  /**
   * Store a value by key.
   */
  set(key: string, value: string): void | Promise<void>;

  /**
   * Remove a value by key.
   */
  remove(key: string): void | Promise<void>;

  /**
   * Clear all values managed by this adapter.
   * Optional — not all adapters need to support this.
   */
  clear?(): void | Promise<void>;
}
