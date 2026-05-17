import type { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '@smart-auth/types';

/**
 * Role-based authorization middleware.
 *
 * Must be used AFTER verifyAccessToken middleware.
 * Checks if the authenticated user has at least one of the required roles.
 *
 * @example
 * ```ts
 * import { verifyAccessToken, authorize } from '@smart-auth/express';
 *
 * // Only admins
 * app.get('/admin',
 *   verifyAccessToken({ secret }),
 *   authorize(['admin']),
 *   (req, res) => { ... }
 * );
 *
 * // Admins or moderators
 * app.delete('/post/:id',
 *   verifyAccessToken({ secret }),
 *   authorize(['admin', 'moderator']),
 *   (req, res) => { ... }
 * );
 * ```
 *
 * @param requiredRoles - Array of roles. User must have at least ONE.
 * @param options - Additional authorization options.
 */
export function authorize(
  requiredRoles: string[],
  options?: {
    /** Check permissions instead of (or in addition to) roles. */
    permissions?: string[];
    /** Whether ALL roles/permissions are required (AND) vs ANY (OR). @default 'any' */
    mode?: 'any' | 'all';
    /** Custom error message. */
    message?: string;
  },
) {
  const { permissions: requiredPermissions = [], mode = 'any', message } = options ?? {};

  return (req: Request, res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authData = (req as any).auth;

    if (!authData) {
      const error = new UnauthorizedError(
        'Authorization check requires authentication. Use verifyAccessToken middleware first.',
      );
      res.status(401).json(error.toJSON());
      return;
    }

    const userRoles: string[] = authData.roles ?? [];
    const userPermissions: string[] = authData.permissions ?? [];

    let rolesSatisfied = true;
    let permissionsSatisfied = true;

    // Check roles
    if (requiredRoles.length > 0) {
      if (mode === 'all') {
        rolesSatisfied = requiredRoles.every((role) => userRoles.includes(role));
      } else {
        rolesSatisfied = requiredRoles.some((role) => userRoles.includes(role));
      }
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      if (mode === 'all') {
        permissionsSatisfied = requiredPermissions.every((perm) =>
          userPermissions.includes(perm),
        );
      } else {
        permissionsSatisfied = requiredPermissions.some((perm) =>
          userPermissions.includes(perm),
        );
      }
    }

    // Determine authorization:
    // - If both roles and permissions are specified, 'any' = either passes, 'all' = both pass
    // - If only roles specified, only roles matter
    // - If only permissions specified, only permissions matter
    const hasRoleRequirements = requiredRoles.length > 0;
    const hasPermissionRequirements = requiredPermissions.length > 0;

    let authorized: boolean;
    if (hasRoleRequirements && hasPermissionRequirements) {
      authorized = mode === 'all'
        ? rolesSatisfied && permissionsSatisfied
        : rolesSatisfied || permissionsSatisfied;
    } else if (hasRoleRequirements) {
      authorized = rolesSatisfied;
    } else if (hasPermissionRequirements) {
      authorized = permissionsSatisfied;
    } else {
      // No requirements specified — allow access
      authorized = true;
    }

    if (!authorized) {
      const error = new UnauthorizedError(
        message ?? 'Insufficient permissions',
        403,
      );
      res.status(403).json(error.toJSON());
      return;
    }

    next();
  };
}
