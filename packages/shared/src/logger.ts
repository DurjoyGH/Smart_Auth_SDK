import type { Logger, LogLevel } from '@smart-auth/types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * Patterns that indicate sensitive data that should NEVER be logged.
 */
const SENSITIVE_PATTERNS = [
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWT tokens
  /Bearer\s+\S+/gi, // Authorization headers
  /password['":\s]*['"]?[^'",\s}]+/gi, // Password fields
  /secret['":\s]*['"]?[^'",\s}]+/gi, // Secret fields
  /refresh.?token['":\s]*['"]?[^'",\s}]+/gi, // Refresh tokens
];

/**
 * Mask sensitive data in log messages.
 */
function maskSensitive(input: string): string {
  let result = input;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

/**
 * Format args for logging, masking any sensitive data.
 */
function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === 'string') {
      return maskSensitive(arg);
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return maskSensitive(JSON.stringify(arg));
      } catch {
        return arg;
      }
    }
    return arg;
  });
}

/**
 * Create a logger instance.
 *
 * @param enabled - Whether logging is enabled.
 * @param level - Minimum log level.
 * @param prefix - Log message prefix.
 */
export function createLogger(
  enabled: boolean = false,
  level: LogLevel = 'warn',
  prefix: string = '[smart-auth]',
): Logger {
  if (!enabled) {
    return noopLogger;
  }

  const minLevel = LOG_LEVELS[level];

  return {
    debug(message: string, ...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.debug) {
        console.debug(`${prefix} ${maskSensitive(message)}`, ...formatArgs(args));
      }
    },
    info(message: string, ...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.info) {
        console.info(`${prefix} ${maskSensitive(message)}`, ...formatArgs(args));
      }
    },
    warn(message: string, ...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.warn) {
        console.warn(`${prefix} ${maskSensitive(message)}`, ...formatArgs(args));
      }
    },
    error(message: string, ...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.error) {
        console.error(`${prefix} ${maskSensitive(message)}`, ...formatArgs(args));
      }
    },
  };
}

/**
 * No-op logger that silently discards all log messages.
 */
export const noopLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};
