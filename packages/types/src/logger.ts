/**
 * Log levels supported by the SDK logger.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Logger interface.
 *
 * The SDK uses this interface internally for all logging.
 * Users can provide a custom implementation to integrate with
 * their own logging infrastructure.
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
