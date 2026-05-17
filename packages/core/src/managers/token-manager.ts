import type { StorageAdapter, AuthConfig, TokenPayload } from '@smart-auth/types';
import type { Logger } from '@smart-auth/types';
import { decodeToken, getTokenExpiration, isTokenExpired } from '@smart-auth/shared';

/**
 * Manages token storage and retrieval.
 *
 * Responsibilities:
 * - Store/retrieve access and refresh tokens
 * - Decode tokens to extract user info
 * - Check token validity/expiration
 * - Clear tokens on logout
 */
export class TokenManager {
  private config: AuthConfig;
  private storage: StorageAdapter;
  private logger: Logger;

  constructor(config: AuthConfig, storage: StorageAdapter, logger: Logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;
  }

  /**
   * Store the access token.
   */
  async setAccessToken(token: string): Promise<void> {
    this.logger.debug('Storing access token');
    await this.storage.set(this.config.accessTokenKey, token);
  }

  /**
   * Retrieve the access token.
   */
  async getAccessToken(): Promise<string | null> {
    const token = await this.storage.get(this.config.accessTokenKey);
    return token;
  }

  /**
   * Store the refresh token.
   *
   * Note: In production, refresh tokens should be stored in httpOnly cookies
   * set by the server. This method is for cases where the client manages
   * refresh tokens directly.
   */
  async setRefreshToken(token: string): Promise<void> {
    this.logger.debug('Storing refresh token');
    await this.storage.set(this.config.refreshTokenKey, token);
  }

  /**
   * Retrieve the refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    const token = await this.storage.get(this.config.refreshTokenKey);
    return token;
  }

  /**
   * Decode the access token payload.
   * Returns null if no token is stored or token is invalid.
   */
  async decodeAccessToken(): Promise<TokenPayload | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    try {
      return decodeToken(token);
    } catch (error) {
      this.logger.warn('Failed to decode access token', error);
      return null;
    }
  }

  /**
   * Check if the current access token is expired.
   */
  async isAccessTokenExpired(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return true;

    try {
      return isTokenExpired(token, this.config.clockSkewMs);
    } catch {
      return true;
    }
  }

  /**
   * Get the expiration time of the access token in milliseconds (epoch).
   */
  async getAccessTokenExpiration(): Promise<number | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    try {
      return getTokenExpiration(token);
    } catch {
      return null;
    }
  }

  /**
   * Extract user data from the access token payload.
   */
  async extractUser<T = Record<string, unknown>>(): Promise<T | null> {
    const payload = await this.decodeAccessToken();
    if (!payload) return null;

    if (this.config.extractUser) {
      try {
        return this.config.extractUser(payload) as T;
      } catch (error) {
        this.logger.warn('Custom extractUser failed, using default extraction', error);
      }
    }

    // Default extraction: use the entire payload minus standard JWT fields
    const { iat: _iat, exp: _exp, nbf: _nbf, iss: _iss, aud: _aud, jti: _jti, ...userData } = payload;
    if (payload.sub) {
      (userData as Record<string, unknown>).id = payload.sub;
    }
    return userData as T;
  }

  /**
   * Extract roles from the access token.
   */
  async getRoles(): Promise<string[]> {
    const payload = await this.decodeAccessToken();
    if (!payload) return [];

    const roles = payload[this.config.rolesKey];
    if (Array.isArray(roles)) {
      return roles.map(String);
    }
    if (typeof roles === 'string') {
      return [roles];
    }
    return [];
  }

  /**
   * Extract permissions from the access token.
   */
  async getPermissions(): Promise<string[]> {
    const payload = await this.decodeAccessToken();
    if (!payload) return [];

    const permissions = payload[this.config.permissionsKey];
    if (Array.isArray(permissions)) {
      return permissions.map(String);
    }
    if (typeof permissions === 'string') {
      return [permissions];
    }
    return [];
  }

  /**
   * Clear all stored tokens.
   */
  async clearTokens(): Promise<void> {
    this.logger.debug('Clearing all tokens');
    await this.storage.remove(this.config.accessTokenKey);
    await this.storage.remove(this.config.refreshTokenKey);
  }
}
