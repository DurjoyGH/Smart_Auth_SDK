import type { TokenPayload } from '@smart-auth/types';
import { InvalidTokenError } from '@smart-auth/types';

/**
 * Decode a JWT without verification (client-side only).
 *
 * This performs base64url decoding of the payload segment.
 * It does NOT verify the signature — that's the server's job.
 *
 * @param token - The JWT string to decode.
 * @returns The decoded payload.
 * @throws {InvalidTokenError} If the token is malformed.
 */
export function decodeToken(token: string): TokenPayload {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new InvalidTokenError('Token does not have 3 segments');
    }

    const payload = parts[1];
    if (!payload) {
      throw new InvalidTokenError('Token payload segment is empty');
    }

    // Base64url decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

    let jsonStr: string;

    // Use atob in browser, Buffer in Node.js
    if (typeof atob === 'function') {
      jsonStr = atob(base64);
    } else if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    } else {
      throw new InvalidTokenError('No base64 decode function available');
    }

    const decoded = JSON.parse(jsonStr) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      throw error;
    }
    throw new InvalidTokenError(
      `Failed to decode token: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Extract the expiration timestamp from a JWT.
 *
 * @param token - The JWT string.
 * @returns Expiration time in milliseconds (epoch), or null if no `exp` claim.
 */
export function getTokenExpiration(token: string): number | null {
  const payload = decodeToken(token);
  if (typeof payload.exp !== 'number') {
    return null;
  }
  // JWT `exp` is in seconds; convert to milliseconds
  return payload.exp * 1000;
}

/**
 * Check if a JWT has expired.
 *
 * @param token - The JWT string.
 * @param clockSkewMs - Tolerance for clock differences (ms). @default 0
 * @returns `true` if the token is expired.
 * @throws {TokenExpiredError} If throwOnExpired is true and the token is expired.
 */
export function isTokenExpired(token: string, clockSkewMs: number = 0): boolean {
  const expMs = getTokenExpiration(token);
  if (expMs === null) {
    // No expiration claim — treat as non-expiring
    return false;
  }
  return Date.now() >= expMs - clockSkewMs;
}

/**
 * Get the remaining time before a JWT expires.
 *
 * @param token - The JWT string.
 * @param clockSkewMs - Clock skew tolerance in ms.
 * @returns Remaining time in milliseconds, or 0 if expired. Returns Infinity if no exp claim.
 */
export function getTokenTimeRemaining(token: string, clockSkewMs: number = 0): number {
  const expMs = getTokenExpiration(token);
  if (expMs === null) {
    return Infinity;
  }
  const remaining = expMs - clockSkewMs - Date.now();
  return Math.max(0, remaining);
}
