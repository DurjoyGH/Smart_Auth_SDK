import type { AuthEventType, AuthEventMap } from '@smart-auth/types';

type EventHandler<T> = (payload: T) => void;

/**
 * Strongly typed event emitter for auth events.
 *
 * Uses the AuthEventMap to enforce correct event types at compile time.
 * No external dependencies.
 */
export class TypedEventEmitter {
  private listeners = new Map<string, Set<EventHandler<unknown>>>();

  /**
   * Subscribe to an event.
   * @returns An unsubscribe function.
   */
  on<K extends AuthEventType>(
    event: K,
    handler: EventHandler<AuthEventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;
    handlers.add(handler as EventHandler<unknown>);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler<unknown>);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event, but only trigger once.
   * @returns An unsubscribe function (can cancel before it fires).
   */
  once<K extends AuthEventType>(
    event: K,
    handler: EventHandler<AuthEventMap[K]>,
  ): () => void {
    const unsubscribe = this.on(event, ((payload: AuthEventMap[K]) => {
      unsubscribe();
      handler(payload);
    }) as EventHandler<AuthEventMap[K]>);
    return unsubscribe;
  }

  /**
   * Emit an event to all subscribed listeners.
   */
  emit<K extends AuthEventType>(event: K, payload: AuthEventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    // Iterate over a copy to allow handlers to unsubscribe during iteration
    for (const handler of [...handlers]) {
      try {
        handler(payload);
      } catch (error) {
        // Don't let a failing handler break other handlers
        console.error(`[smart-auth] Error in event handler for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all events.
   */
  off(event?: AuthEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount(event: AuthEventType): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Remove all listeners and clean up.
   */
  destroy(): void {
    this.listeners.clear();
  }
}
