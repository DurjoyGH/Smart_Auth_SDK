/**
 * Environment detection utilities.
 *
 * All browser API access MUST go through these guards to ensure
 * SSR safety and Node.js compatibility.
 */

/**
 * Check if the current environment is a browser.
 */
export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement === 'function'
  );
}

/**
 * Check if the current environment is Node.js.
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Check if running in SSR mode (Node.js rendering, no real DOM).
 * SSR is detected when we're in Node.js but global window-like objects
 * might exist (e.g., jsdom, happy-dom in testing).
 */
export function isSSR(): boolean {
  if (!isNode()) return false;
  // If navigator.userAgent contains 'Node' or similar, it's SSR
  return typeof window === 'undefined' || typeof document === 'undefined';
}

/**
 * Safe reference to the `window` object.
 * Returns `undefined` if not in a browser environment.
 */
export function safeWindow(): (Window & typeof globalThis) | undefined {
  if (isBrowser()) {
    return window;
  }
  return undefined;
}

/**
 * Safe reference to `document`.
 * Returns `undefined` if not in a browser environment.
 */
export function safeDocument(): Document | undefined {
  if (isBrowser()) {
    return document;
  }
  return undefined;
}

/**
 * Safe reference to `localStorage`.
 * Returns `undefined` if not available.
 */
export function safeLocalStorage(): Storage | undefined {
  try {
    if (isBrowser() && typeof localStorage !== 'undefined') {
      // Test that it actually works (can be disabled in some browsers)
      const testKey = '__smart_auth_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return localStorage;
    }
  } catch {
    // localStorage is not available (e.g., Safari private mode, security restrictions)
  }
  return undefined;
}

/**
 * Safe reference to `sessionStorage`.
 * Returns `undefined` if not available.
 */
export function safeSessionStorage(): Storage | undefined {
  try {
    if (isBrowser() && typeof sessionStorage !== 'undefined') {
      const testKey = '__smart_auth_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return sessionStorage;
    }
  } catch {
    // sessionStorage is not available
  }
  return undefined;
}
