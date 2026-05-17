import type { ReactNode } from 'react';
import { useAuth } from '../hooks/use-auth';

interface ProtectedRouteProps {
  /** Content to render when authorized. */
  children: ReactNode;

  /** Fallback to show while loading. */
  loadingFallback?: ReactNode;

  /**
   * Content to show when unauthorized.
   * If not provided, nothing is rendered (use with redirect).
   */
  unauthorizedFallback?: ReactNode;

  /** Required roles. */
  roles?: string[];

  /** Required permissions. */
  permissions?: string[];

  /** URL to redirect to when unauthorized. */
  redirectTo?: string;

  /** Custom redirect function. */
  onRedirect?: (url: string) => void;
}

/**
 * Component for protecting routes.
 *
 * @example
 * ```tsx
 * <ProtectedRoute
 *   loadingFallback={<Spinner />}
 *   redirectTo="/login"
 * >
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 *
 * @example With role-based access:
 * ```tsx
 * <ProtectedRoute roles={['admin']} redirectTo="/unauthorized">
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  loadingFallback = null,
  unauthorizedFallback = null,
  roles,
  permissions,
  redirectTo,
  onRedirect,
}: ProtectedRouteProps) {
  const { authenticated, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!authenticated) {
    if (redirectTo) {
      if (onRedirect) {
        onRedirect(redirectTo);
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return null;
    }
    return <>{unauthorizedFallback}</>;
  }

  // Check roles
  if (roles && roles.length > 0 && !hasRole(roles)) {
    if (redirectTo) {
      if (onRedirect) {
        onRedirect(redirectTo);
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return null;
    }
    return <>{unauthorizedFallback}</>;
  }

  // Check permissions
  if (permissions && permissions.length > 0 && !hasPermission(permissions)) {
    if (redirectTo) {
      if (onRedirect) {
        onRedirect(redirectTo);
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return null;
    }
    return <>{unauthorizedFallback}</>;
  }

  return <>{children}</>;
}
