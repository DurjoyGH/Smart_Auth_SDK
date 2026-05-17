import { useEffect } from 'react';
import { useAuth } from './use-auth';

interface UseProtectedRouteOptions {
  /**
   * URL to redirect to if not authenticated.
   * Falls back to the config's loginUrl.
   */
  redirectTo?: string;

  /**
   * Required roles to access the route.
   */
  roles?: string[];

  /**
   * Required permissions to access the route.
   */
  permissions?: string[];

  /**
   * Custom redirect function (e.g., for React Router's navigate).
   * If not provided, falls back to window.location.
   */
  onRedirect?: (url: string) => void;
}

interface UseProtectedRouteResult {
  /** Whether the user is authorized to view this route. */
  authorized: boolean;

  /** Whether the auth state is still loading. */
  loading: boolean;

  /** The current user. */
  user: Record<string, unknown> | null;
}

/**
 * Hook for protecting routes.
 *
 * Redirects unauthenticated users to the login page.
 * Optionally checks for required roles or permissions.
 *
 * @example
 * ```tsx
 * function AdminPage() {
 *   const { authorized, loading } = useProtectedRoute({
 *     roles: ['admin'],
 *     redirectTo: '/login',
 *   });
 *
 *   if (loading) return <Spinner />;
 *   if (!authorized) return null; // Will redirect
 *
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useProtectedRoute(options: UseProtectedRouteOptions = {}): UseProtectedRouteResult {
  const { authenticated, loading, user, hasRole, hasPermission } = useAuth();
  const { redirectTo = '/login', roles, permissions, onRedirect } = options;

  const hasRequiredRoles = roles ? hasRole(roles) : true;
  const hasRequiredPermissions = permissions ? hasPermission(permissions) : true;
  const authorized = authenticated && hasRequiredRoles && hasRequiredPermissions;

  useEffect(() => {
    if (loading) return;

    if (!authorized) {
      if (onRedirect) {
        onRedirect(redirectTo);
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [authorized, loading, redirectTo, onRedirect]);

  return { authorized, loading, user };
}
