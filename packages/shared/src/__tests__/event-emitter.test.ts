import { describe, it, expect, vi } from 'vitest';
import { TypedEventEmitter } from '../event-emitter';

describe('TypedEventEmitter', () => {
  it('should emit and receive events', () => {
    const emitter = new TypedEventEmitter();
    const handler = vi.fn();

    emitter.on('login', handler);
    emitter.emit('login', {
      type: 'login',
      user: { id: '1' },
      accessToken: 'token',
      timestamp: Date.now(),
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'login', user: { id: '1' } }),
    );
  });

  it('should support multiple listeners', () => {
    const emitter = new TypedEventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('logout', handler1);
    emitter.on('logout', handler2);

    emitter.emit('logout', {
      type: 'logout',
      reason: 'manual',
      timestamp: Date.now(),
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe correctly', () => {
    const emitter = new TypedEventEmitter();
    const handler = vi.fn();

    const unsubscribe = emitter.on('login', handler);
    unsubscribe();

    emitter.emit('login', {
      type: 'login',
      user: {},
      accessToken: 'token',
      timestamp: Date.now(),
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support once() listeners', () => {
    const emitter = new TypedEventEmitter();
    const handler = vi.fn();

    emitter.once('tokenRefreshed', handler);

    const event = {
      type: 'tokenRefreshed' as const,
      accessToken: 'new-token',
      timestamp: Date.now(),
    };

    emitter.emit('tokenRefreshed', event);
    emitter.emit('tokenRefreshed', event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not break when a handler throws', () => {
    const emitter = new TypedEventEmitter();
    const errorHandler = vi.fn(() => { throw new Error('Handler error'); });
    const goodHandler = vi.fn();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    emitter.on('login', errorHandler);
    emitter.on('login', goodHandler);

    emitter.emit('login', {
      type: 'login',
      user: {},
      accessToken: 'token',
      timestamp: Date.now(),
    });

    expect(errorHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should correctly report listener count', () => {
    const emitter = new TypedEventEmitter();

    expect(emitter.listenerCount('login')).toBe(0);

    const unsub1 = emitter.on('login', () => {});
    const unsub2 = emitter.on('login', () => {});

    expect(emitter.listenerCount('login')).toBe(2);

    unsub1();
    expect(emitter.listenerCount('login')).toBe(1);

    unsub2();
    expect(emitter.listenerCount('login')).toBe(0);
  });

  it('should clean up with destroy()', () => {
    const emitter = new TypedEventEmitter();
    emitter.on('login', () => {});
    emitter.on('logout', () => {});

    emitter.destroy();

    expect(emitter.listenerCount('login')).toBe(0);
    expect(emitter.listenerCount('logout')).toBe(0);
  });
});
