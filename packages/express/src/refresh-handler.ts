import type { Request, Response, NextFunction } from 'express';
import type { TokenPair } from '@smart-auth/types';
import { UnauthorizedError } from '@smart-auth/types';
import type { TokenIssuer } from './token-issuer';

/**
 * Configuration for the refresh token handler.
 */
export interface RefreshHandlerConfig {
  /** The token issuer instance. */
  issuer: TokenIssuer;

  /**
   * How to extract the refresh token from the request.
   * @default 'body' (looks in req.body.refresh_token)
   */
  tokenLocation?: 'body' | 'cookie' | 'custom';

  /** Field name in the request body for the refresh token. @default 'refresh_token' */
  bodyField?: string;

  /** Cookie name for the refresh token. @default 'smart_auth_refresh' */
  cookieName?: string;

  /** Custom extractor function. */
  extractToken?: (req: Request) => string | null;

  /**
   * Optional blacklist checker.
   * Return true if the token/jti is blacklisted (revoked).
   */
  isBlacklisted?: (token: string, jti?: string) => boolean | Promise<boolean>;

  /**
   * Optional callback to blacklist the old refresh token after rotation.
   * Called with the old refresh token and its JTI.
   */
  onRotate?: (oldToken: string, oldJti?: string) => void | Promise<void>;

  /**
   * Optional callback to load user data for the new token.
   * If provided, the returned data is merged into the new token payload.
   */
  loadUser?: (userId: string) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

/**
 * Refresh handler interface.
 */
export interface RefreshHandler {
  /** Express middleware for handling refresh requests. */
  middleware: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Create a refresh token rotation handler.
 *
 * @example
 * ```ts
 * import { createTokenIssuer, createRefreshHandler } from '@smart-auth/express';
 *
 * const issuer = createTokenIssuer({ ... });
 * const refreshHandler = createRefreshHandler({
 *   issuer,
 *   tokenLocation: 'body',
 *   isBlacklisted: async (token, jti) => {
 *     return await redisClient.exists(`blacklist:${jti}`);
 *   },
 *   onRotate: async (oldToken, oldJti) => {
 *     await redisClient.set(`blacklist:${oldJti}`, '1', 'EX', 604800);
 *   },
 * });
 *
 * app.post('/auth/refresh', refreshHandler.middleware);
 * ```
 */
export function createRefreshHandler(config: RefreshHandlerConfig): RefreshHandler {
  const {
    issuer,
    tokenLocation = 'body',
    bodyField = 'refresh_token',
    cookieName = 'smart_auth_refresh',
    extractToken: customExtractor,
    isBlacklisted,
    onRotate,
    loadUser,
  } = config;

  const middleware = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Extract refresh token
    let refreshToken: string | null = null;

    if (customExtractor) {
      refreshToken = customExtractor(req);
    } else if (tokenLocation === 'body') {
      refreshToken = req.body?.[bodyField] ?? null;
    } else if (tokenLocation === 'cookie') {
      refreshToken = req.cookies?.[cookieName] ?? null;
    }

    if (!refreshToken) {
      const error = new UnauthorizedError('No refresh token provided');
      res.status(401).json(error.toJSON());
      return;
    }

    // Verify the refresh token
    const decoded = issuer.verifyRefreshToken(refreshToken);
    if (!decoded) {
      const error = new UnauthorizedError('Invalid or expired refresh token');
      res.status(401).json(error.toJSON());
      return;
    }

    // Check blacklist
    if (isBlacklisted) {
      const jti = decoded.jti as string | undefined;
      const blacklisted = await isBlacklisted(refreshToken, jti);
      if (blacklisted) {
        const error = new UnauthorizedError('Refresh token has been revoked');
        res.status(401).json(error.toJSON());
        return;
      }
    }

    // Build new token payload
    const userId = decoded.sub as string;
    let newPayload: Record<string, unknown> = { sub: userId };

    // Load fresh user data if available
    if (loadUser && userId) {
      try {
        const userData = await loadUser(userId);
        newPayload = { ...newPayload, ...userData };
      } catch (error) {
        console.error('[smart-auth/express] Failed to load user data during refresh:', error);
      }
    }

    // Rotate: blacklist old token
    if (onRotate) {
      const oldJti = decoded.jti as string | undefined;
      await onRotate(refreshToken, oldJti);
    }

    // Issue new token pair
    const newTokens: TokenPair = issuer.issueTokenPair(newPayload);

    res.json({
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
    });
  };

  return { middleware };
}
