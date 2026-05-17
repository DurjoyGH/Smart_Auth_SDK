/**
 * Error classes for the smart-auth-sdk.
 *
 * All errors extend the base `AuthError` class and include:
 * - A human-readable message
 * - An error code for programmatic handling
 * - Optional cause for error chaining
 * - JSON serialization support
 */

/**
 * Base error class for all auth-related errors.
 */
export class AuthError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code: string = 'AUTH_ERROR', cause?: Error) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.timestamp = Date.now();

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    if (cause) {
      this.cause = cause;
    }
  }

  /**
   * Serialize the error for logging or network transmission.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Thrown when an access token has expired and cannot be used.
 */
export class TokenExpiredError extends AuthError {
  public readonly expiredAt: number;

  constructor(message: string = 'Access token has expired', expiredAt?: number) {
    super(message, 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt ?? Date.now();
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      expiredAt: this.expiredAt,
    };
  }
}

/**
 * Thrown when a token refresh attempt fails.
 */
export class RefreshFailedError extends AuthError {
  public readonly attempt: number;
  public readonly maxRetries: number;

  constructor(
    message: string = 'Token refresh failed',
    attempt: number = 0,
    maxRetries: number = 0,
    cause?: Error,
  ) {
    super(message, 'REFRESH_FAILED', cause);
    this.name = 'RefreshFailedError';
    this.attempt = attempt;
    this.maxRetries = maxRetries;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      attempt: this.attempt,
      maxRetries: this.maxRetries,
    };
  }
}

/**
 * Thrown when a request is made without proper authentication.
 */
export class UnauthorizedError extends AuthError {
  public readonly statusCode: number;

  constructor(message: string = 'Unauthorized', statusCode: number = 401) {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
    this.statusCode = statusCode;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
    };
  }
}

/**
 * Thrown when a session has expired and cannot be restored.
 */
export class SessionExpiredError extends AuthError {
  constructor(message: string = 'Session has expired') {
    super(message, 'SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Thrown when a token cannot be decoded or is malformed.
 */
export class InvalidTokenError extends AuthError {
  constructor(message: string = 'Invalid or malformed token') {
    super(message, 'INVALID_TOKEN');
    this.name = 'InvalidTokenError';
  }
}
