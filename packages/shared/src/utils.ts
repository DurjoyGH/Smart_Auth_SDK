/**
 * General-purpose utilities.
 */

/**
 * A deferred promise — a Promise whose resolve/reject can be called externally.
 * Essential for the refresh queue pattern.
 */
export interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Create a deferred promise.
 */
export function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Sleep for a given number of milliseconds.
 * Useful for retry delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
