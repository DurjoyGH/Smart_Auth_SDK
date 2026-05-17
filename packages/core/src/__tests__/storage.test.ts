import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../storage/memory-storage';
import { LocalStorageAdapter } from '../storage/local-storage-adapter';
import { SessionStorageAdapter } from '../storage/session-storage-adapter';
import { CookieStorageAdapter } from '../storage/cookie-storage-adapter';

describe('Storage Adapters', () => {
  describe('MemoryStorage', () => {
    it('should store and retrieve values', () => {
      const storage = new MemoryStorage();
      storage.set('key', 'value');
      expect(storage.get('key')).toBe('value');
    });

    it('should return null for missing keys', () => {
      const storage = new MemoryStorage();
      expect(storage.get('nonexistent')).toBeNull();
    });

    it('should remove values', () => {
      const storage = new MemoryStorage();
      storage.set('key', 'value');
      storage.remove('key');
      expect(storage.get('key')).toBeNull();
    });

    it('should clear all values', () => {
      const storage = new MemoryStorage();
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.clear();
      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key2')).toBeNull();
    });

    it('should overwrite existing values', () => {
      const storage = new MemoryStorage();
      storage.set('key', 'original');
      storage.set('key', 'updated');
      expect(storage.get('key')).toBe('updated');
    });
  });

  describe('LocalStorageAdapter (in Node.js - fallback mode)', () => {
    it('should use fallback map when localStorage is not available', () => {
      const storage = new LocalStorageAdapter();
      storage.set('key', 'value');
      expect(storage.get('key')).toBe('value');
    });

    it('should remove values from fallback', () => {
      const storage = new LocalStorageAdapter();
      storage.set('key', 'value');
      storage.remove('key');
      expect(storage.get('key')).toBeNull();
    });
  });

  describe('SessionStorageAdapter (in Node.js - fallback mode)', () => {
    it('should use fallback map when sessionStorage is not available', () => {
      const storage = new SessionStorageAdapter();
      storage.set('key', 'value');
      expect(storage.get('key')).toBe('value');
    });
  });

  describe('CookieStorageAdapter (in Node.js - fallback mode)', () => {
    it('should use fallback map when not in browser', () => {
      const storage = new CookieStorageAdapter();
      storage.set('key', 'value');
      expect(storage.get('key')).toBe('value');
    });

    it('should remove values from fallback', () => {
      const storage = new CookieStorageAdapter();
      storage.set('key', 'value');
      storage.remove('key');
      expect(storage.get('key')).toBeNull();
    });
  });
});
