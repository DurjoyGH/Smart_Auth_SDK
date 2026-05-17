import type { Logger } from '@smart-auth/types';
import { isBrowser, safeWindow } from '@smart-auth/shared';

/**
 * Message types for multi-tab synchronization.
 */
interface TabSyncMessage {
  type: 'LOGOUT' | 'LOGIN' | 'TOKEN_REFRESHED';
  timestamp: number;
  /** Unique tab identifier to prevent self-processing. */
  tabId: string;
}

/**
 * Manages multi-tab session synchronization.
 *
 * Uses BroadcastChannel API (modern browsers) with a fallback
 * to localStorage storage events (older browsers).
 *
 * Key behaviors:
 * - When one tab logs out, all other tabs also log out.
 * - When one tab refreshes a token, other tabs are notified.
 * - Messages from the same tab are ignored (no echo).
 */
export class TabSyncManager {
  private logger: Logger;
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private channelName: string;
  private useFallback = false;

  private onLogout?: () => void;
  private onLogin?: () => void;
  private onTokenRefreshed?: () => void;

  private storageHandler: ((event: StorageEvent) => void) | null = null;

  constructor(
    logger: Logger,
    options?: {
      channelName?: string;
      onLogout?: () => void;
      onLogin?: () => void;
      onTokenRefreshed?: () => void;
    },
  ) {
    this.logger = logger;
    this.channelName = options?.channelName ?? 'smart-auth-sync';
    this.tabId = this.generateTabId();
    this.onLogout = options?.onLogout;
    this.onLogin = options?.onLogin;
    this.onTokenRefreshed = options?.onTokenRefreshed;
  }

  /**
   * Initialize multi-tab sync.
   * Should be called after the auth engine is set up.
   */
  init(): void {
    if (!isBrowser()) {
      this.logger.debug('Not in browser, skipping tab sync initialization');
      return;
    }

    // Try BroadcastChannel first
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event: MessageEvent<TabSyncMessage>) => {
          this.handleMessage(event.data);
        };
        this.logger.debug('Tab sync initialized with BroadcastChannel');
        return;
      }
    } catch (error) {
      this.logger.warn('BroadcastChannel not available, falling back to storage events');
    }

    // Fallback to storage events
    this.useFallback = true;
    const win = safeWindow();
    if (win) {
      this.storageHandler = (event: StorageEvent) => {
        if (event.key === this.channelName && event.newValue) {
          try {
            const message = JSON.parse(event.newValue) as TabSyncMessage;
            this.handleMessage(message);
          } catch {
            // Ignore malformed messages
          }
        }
      };
      win.addEventListener('storage', this.storageHandler);
      this.logger.debug('Tab sync initialized with storage event fallback');
    }
  }

  /**
   * Broadcast a logout to other tabs.
   */
  broadcastLogout(): void {
    this.broadcast({ type: 'LOGOUT', timestamp: Date.now(), tabId: this.tabId });
  }

  /**
   * Broadcast a login to other tabs.
   */
  broadcastLogin(): void {
    this.broadcast({ type: 'LOGIN', timestamp: Date.now(), tabId: this.tabId });
  }

  /**
   * Broadcast that tokens were refreshed.
   */
  broadcastTokenRefreshed(): void {
    this.broadcast({ type: 'TOKEN_REFRESHED', timestamp: Date.now(), tabId: this.tabId });
  }

  /**
   * Handle an incoming message from another tab.
   */
  private handleMessage(message: TabSyncMessage): void {
    // Ignore messages from this tab
    if (message.tabId === this.tabId) {
      return;
    }

    this.logger.debug(`Received tab sync message: ${message.type}`);

    switch (message.type) {
      case 'LOGOUT':
        this.onLogout?.();
        break;
      case 'LOGIN':
        this.onLogin?.();
        break;
      case 'TOKEN_REFRESHED':
        this.onTokenRefreshed?.();
        break;
    }
  }

  /**
   * Send a message to other tabs.
   */
  private broadcast(message: TabSyncMessage): void {
    if (!isBrowser()) return;

    try {
      if (this.channel && !this.useFallback) {
        this.channel.postMessage(message);
      } else if (this.useFallback) {
        const win = safeWindow();
        if (win) {
          // localStorage write triggers storage events in other tabs
          localStorage.setItem(this.channelName, JSON.stringify(message));
          // Clean up immediately — we only need the event, not the data
          localStorage.removeItem(this.channelName);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to broadcast tab sync message', error);
    }
  }

  /**
   * Generate a unique tab identifier.
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.storageHandler) {
      const win = safeWindow();
      if (win) {
        win.removeEventListener('storage', this.storageHandler);
      }
      this.storageHandler = null;
    }
  }
}
