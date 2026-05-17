import { useMemo } from 'react';
import { useAuth } from './use-auth';

interface UsePermissionsResult {
  /** All roles the user has. */
  roles: string[];

  /** All permissions the user has. */
  permissions: string[];

  /** Check if the user has a specific role. */
  hasRole: (role: string | string[]) => boolean;

  /** Check if the user has a specific permission. */
  hasPermission: (permission: string | string[]) => boolean;

  /** Whether the user is authenticated. */
  authenticated: boolean;
}

/**
 * Hook for role-based and permission-based access control.
 *
 * @example
 * ```tsx
 * function Navigation() {
 *   const { hasRole, hasPermission } = usePermissions();
 *
 *   return (
 *     <nav>
 *       <Link to="/">Home</Link>
 *       {hasRole('admin') && <Link to="/admin">Admin</Link>}
 *       {hasPermission('posts:write') && <Link to="/new-post">New Post</Link>}
 *     </nav>
 *   );
 * }
 * ```
 */
export function usePermissions(): UsePermissionsResult {
  const { state, hasRole, hasPermission, authenticated } = useAuth();

  // Extract roles and permissions from state
  const rolesAndPermissions = useMemo(() => {
    if (!state.user || typeof state.user !== 'object') {
      return { roles: [] as string[], permissions: [] as string[] };
    }

    const user = state.user as Record<string, unknown>;
    const roles = Array.isArray(user['roles'])
      ? (user['roles'] as string[])
      : [];
    const permissions = Array.isArray(user['permissions'])
      ? (user['permissions'] as string[])
      : [];

    return { roles, permissions };
  }, [state.user]);

  return {
    ...rolesAndPermissions,
    hasRole,
    hasPermission,
    authenticated,
  };
}
