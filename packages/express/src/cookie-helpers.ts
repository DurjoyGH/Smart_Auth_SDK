import type { Response } from 'express';

/**
 * Cookie options for setting auth cookies.
 */
export interface CookieOptions {
  /** Cookie path. @default '/' */
  path?: string;

  /** Cookie domain. */
  domain?: string;

  /** Whether the cookie is httpOnly. @default true */
  httpOnly?: boolean;

  /** Whether the cookie requires HTTPS. @default true in production */
  secure?: boolean;

  /** SameSite attribute. @default 'strict' */
  sameSite?: 'strict' | 'lax' | 'none';

  /** Access token cookie max age in milliseconds. @default 15 * 60 * 1000 (15 min) */
  accessTokenMaxAge?: number;

  /** Refresh token cookie max age in milliseconds. @default 7 * 24 * 60 * 60 * 1000 (7 days) */
  refreshTokenMaxAge?: number;

  /** Access token cookie name. @default 'smart_auth_access' */
  accessTokenName?: string;

  /** Refresh token cookie name. @default 'smart_auth_refresh' */
  refreshTokenName?: string;
}

const isProduction = process.env['NODE_ENV'] === 'production';

/**
 * Set auth cookies on the response.
 *
 * @example
 * ```ts
 * import { setTokenCookies } from '@smart-auth/express';
 *
 * app.post('/auth/login', (req, res) => {
 *   const tokens = issuer.issueTokenPair({ sub: user.id });
 *   setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
 *   res.json({ success: true });
 * });
 * ```
 */
export function setTokenCookies(
  res: Response,
  accessToken: string,
  refreshToken?: string,
  options: CookieOptions = {},
): void {
  const {
    path = '/',
    domain,
    httpOnly = true,
    secure = isProduction,
    sameSite = 'strict',
    accessTokenMaxAge = 15 * 60 * 1000, // 15 minutes
    refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
    accessTokenName = 'smart_auth_access',
    refreshTokenName = 'smart_auth_refresh',
  } = options;

  const baseCookieOptions: Record<string, unknown> = {
    path,
    httpOnly,
    secure,
    sameSite,
  };

  if (domain) {
    baseCookieOptions['domain'] = domain;
  }

  // Set access token cookie
  res.cookie(accessTokenName, accessToken, {
    ...baseCookieOptions,
    maxAge: accessTokenMaxAge,
  });

  // Set refresh token cookie (if provided)
  if (refreshToken) {
    res.cookie(refreshTokenName, refreshToken, {
      ...baseCookieOptions,
      maxAge: refreshTokenMaxAge,
      // Refresh token path can be restricted to the refresh endpoint
      path: '/auth/refresh',
    });
  }
}

/**
 * Clear auth cookies from the response.
 *
 * @example
 * ```ts
 * app.post('/auth/logout', (req, res) => {
 *   clearTokenCookies(res);
 *   res.json({ success: true });
 * });
 * ```
 */
export function clearTokenCookies(
  res: Response,
  options: CookieOptions = {},
): void {
  const {
    path = '/',
    domain,
    accessTokenName = 'smart_auth_access',
    refreshTokenName = 'smart_auth_refresh',
  } = options;

  const clearOptions: Record<string, unknown> = { path };
  if (domain) clearOptions['domain'] = domain;

  res.clearCookie(accessTokenName, clearOptions);
  res.clearCookie(refreshTokenName, { ...clearOptions, path: '/auth/refresh' });
}
