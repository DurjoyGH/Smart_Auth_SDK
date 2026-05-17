import jwt from 'jsonwebtoken';
import type { TokenIssuerConfig, TokenPair } from '@smart-auth/types';

/**
 * Token issuer interface — creates signed access and refresh tokens.
 */
export interface TokenIssuer {
  /**
   * Issue an access/refresh token pair.
   *
   * @param payload - Claims to include in the tokens.
   * @returns A token pair with access and refresh tokens.
   */
  issueTokenPair(payload: Record<string, unknown>): TokenPair;

  /**
   * Issue only an access token.
   */
  issueAccessToken(payload: Record<string, unknown>): string;

  /**
   * Issue only a refresh token.
   */
  issueRefreshToken(payload: Record<string, unknown>): string;

  /**
   * Verify and decode a refresh token.
   *
   * @returns The decoded payload, or null if invalid.
   */
  verifyRefreshToken(token: string): Record<string, unknown> | null;
}

/**
 * Create a token issuer instance.
 *
 * @example
 * ```ts
 * import { createTokenIssuer } from '@smart-auth/express';
 *
 * const issuer = createTokenIssuer({
 *   accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
 *   refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
 *   accessTokenExpiry: '15m',
 *   refreshTokenExpiry: '7d',
 * });
 *
 * // In login handler:
 * app.post('/auth/login', (req, res) => {
 *   const user = await authenticate(req.body);
 *   const tokens = issuer.issueTokenPair({
 *     sub: user.id,
 *     email: user.email,
 *     roles: user.roles,
 *   });
 *   res.json(tokens);
 * });
 * ```
 */
export function createTokenIssuer(config: TokenIssuerConfig): TokenIssuer {
  const {
    accessTokenSecret,
    refreshTokenSecret = accessTokenSecret,
    accessTokenExpiry = '15m',
    refreshTokenExpiry = '7d',
    algorithm = 'HS256',
    issuer,
    audience,
  } = config;

  const signOptions: jwt.SignOptions = {
    algorithm: algorithm as jwt.Algorithm,
  };

  if (issuer) signOptions.issuer = issuer;
  if (audience) signOptions.audience = audience;

  return {
    issueTokenPair(payload: Record<string, unknown>): TokenPair {
      const accessToken = this.issueAccessToken(payload);
      const refreshToken = this.issueRefreshToken(payload);
      return { accessToken, refreshToken };
    },

    issueAccessToken(payload: Record<string, unknown>): string {
      return jwt.sign(payload, accessTokenSecret, {
        ...signOptions,
        expiresIn: accessTokenExpiry as number,
      });
    },

    issueRefreshToken(payload: Record<string, unknown>): string {
      // Refresh tokens typically contain minimal claims
      const refreshPayload = {
        sub: payload.sub,
        type: 'refresh',
      };

      return jwt.sign(refreshPayload, refreshTokenSecret, {
        ...signOptions,
        expiresIn: refreshTokenExpiry as number,
      });
    },

    verifyRefreshToken(token: string): Record<string, unknown> | null {
      try {
        const decoded = jwt.verify(token, refreshTokenSecret, {
          algorithms: [algorithm as jwt.Algorithm],
          clockTolerance: 5,
        });

        if (typeof decoded === 'string') {
          return null;
        }

        return decoded as Record<string, unknown>;
      } catch {
        return null;
      }
    },
  };
}
