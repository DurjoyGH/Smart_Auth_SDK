import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { ExpressAuthConfig } from '@smart-auth/types';
import { UnauthorizedError } from '@smart-auth/types';
import type { RequestAuthData } from '@smart-auth/types';

/**
 * Middleware to verify JWT access tokens.
 *
 * Extracts the token from the Authorization header (or cookie),
 * verifies it using the provided secret, and attaches the decoded
 * payload to `req.auth`.
 *
 * @example
 * ```ts
 * import { verifyAccessToken } from '@smart-auth/express';
 *
 * // Protect all routes
 * app.use(verifyAccessToken({ secret: process.env.JWT_SECRET }));
 *
 * // Protect specific routes
 * app.get('/protected', verifyAccessToken({ secret: process.env.JWT_SECRET }), (req, res) => {
 *   res.json({ userId: (req as any).auth.userId });
 * });
 * ```
 */
export function verifyAccessToken(config: ExpressAuthConfig) {
  const {
    secret,
    algorithm = 'HS256',
    issuer,
    audience,
    tokenLocation = 'header',
    cookieName = 'smart_auth_access',
    extractToken: customExtractor,
    clockTolerance = 5,
    rolesKey = 'roles',
    permissionsKey = 'permissions',
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    let token: string | null = null;

    // Extract token based on location
    if (customExtractor) {
      token = customExtractor(req);
    } else if (tokenLocation === 'header') {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    } else if (tokenLocation === 'cookie') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      token = (req as any).cookies?.[cookieName] ?? null;
    }

    if (!token) {
      const error = new UnauthorizedError('No authentication token provided');
      res.status(401).json(error.toJSON());
      return;
    }

    try {
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: [algorithm as jwt.Algorithm],
        clockTolerance,
      };

      if (issuer) verifyOptions.issuer = issuer;
      if (audience) {
        verifyOptions.audience = audience as string;
      }

      const decoded = jwt.verify(token, secret, verifyOptions);

      if (typeof decoded === 'string') {
        const error = new UnauthorizedError('Invalid token format');
        res.status(401).json(error.toJSON());
        return;
      }

      const payload = decoded as Record<string, unknown>;

      // Extract roles and permissions
      const roles = extractArrayField(payload, rolesKey);
      const permissions = extractArrayField(payload, permissionsKey);

      // Attach auth data to request
      const authData: RequestAuthData = {
        payload,
        userId: (payload.sub as string) ?? '',
        roles,
        permissions,
        token,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).auth = authData;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        const authError = new UnauthorizedError('Token has expired', 401);
        res.status(401).json(authError.toJSON());
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        const authError = new UnauthorizedError('Invalid token', 401);
        res.status(401).json(authError.toJSON());
        return;
      }

      const authError = new UnauthorizedError('Authentication failed', 401);
      res.status(401).json(authError.toJSON());
    }
  };
}

/**
 * Extract an array field from a JWT payload, handling both string and array values.
 */
function extractArrayField(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    return [value];
  }
  return [];
}
