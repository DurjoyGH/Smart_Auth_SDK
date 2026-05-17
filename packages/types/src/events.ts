/**
 * All possible auth event types emitted by the SDK.
 */
export type AuthEventType =
  | 'login'
  | 'logout'
  | 'tokenRefreshed'
  | 'sessionExpired'
  | 'authError'
  | 'stateChanged';

/**
 * Event: User successfully logged in.
 */
export interface LoginEvent {
  type: 'login';
  user: Record<string, unknown>;
  accessToken: string;
  timestamp: number;
}

/**
 * Event: User logged out (manually or automatically).
 */
export interface LogoutEvent {
  type: 'logout';
  reason: 'manual' | 'sessionExpired' | 'refreshFailed' | 'tabSync';
  timestamp: number;
}

/**
 * Event: Access token was refreshed.
 */
export interface TokenRefreshedEvent {
  type: 'tokenRefreshed';
  accessToken: string;
  timestamp: number;
}

/**
 * Event: Session has expired.
 */
export interface SessionExpiredEvent {
  type: 'sessionExpired';
  reason: string;
  timestamp: number;
}

/**
 * Event: An auth-related error occurred.
 */
export interface AuthErrorEvent {
  type: 'authError';
  error: Error;
  timestamp: number;
}

/**
 * Event: Auth state has changed.
 */
export interface StateChangedEvent {
  type: 'stateChanged';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  timestamp: number;
}

/**
 * Discriminated union of all auth events.
 */
export type AuthEvent =
  | LoginEvent
  | LogoutEvent
  | TokenRefreshedEvent
  | SessionExpiredEvent
  | AuthErrorEvent
  | StateChangedEvent;

/**
 * Map of event types to their corresponding event payloads.
 * Used for typed event listeners.
 */
export interface AuthEventMap {
  login: LoginEvent;
  logout: LogoutEvent;
  tokenRefreshed: TokenRefreshedEvent;
  sessionExpired: SessionExpiredEvent;
  authError: AuthErrorEvent;
  stateChanged: StateChangedEvent;
}
