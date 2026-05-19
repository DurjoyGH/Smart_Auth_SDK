import type { StorageAdapter, AuthConfig } from '@smart-auth/types';
import { MemoryStorage } from './memory-storage';
import { LocalStorageAdapter } from './local-storage-adapter';
import { SessionStorageAdapter } from './session-storage-adapter';
import { CookieStorageAdapter } from './cookie-storage-adapter';

/**
 * Factory function to create the appropriate storage adapter
 * based on the configuration.
 */
export function createStorageAdapter(config: AuthConfig): StorageAdapter {
  switch (config.storage) {
    case 'memory':
      return new MemoryStorage();
    case 'local':
    case 'localStorage':
      return new LocalStorageAdapter();
    case 'session':
    case 'sessionStorage':
      return new SessionStorageAdapter();
    case 'cookie':
      return new CookieStorageAdapter(config.cookie);
    case 'custom':
      throw new Error(
        '[smart-auth] Storage type "custom" requires a StorageAdapter to be provided ' +
          'via the storage option. Pass a StorageAdapter instance instead of "custom".',
      );
    default: {
      const _exhaustive: never = config.storage;
      throw new Error(
        `[smart-auth] Invalid storage type "${_exhaustive as string}". ` +
          `Valid options: "memory", "local", "localStorage", "session", "sessionStorage", "cookie", "custom".`,
      );
    }
  }
}
