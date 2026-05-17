import type { ReactNode } from 'react';
import { useAuth } from '../hooks/use-auth';

interface GuestRouteProps {
  /** Content to render when NOT authenticated. */
  children: ReactNode;

  /** Fallback to show while loading. */
  loadingFallback?: ReactNode;

  /** URL to redirect to when the user IS authenticated. */
  redirectTo?: string;

  /** Custom redirect function. */
  onRedirect?: (url: string) => void;
}

/**
 * Route component that only renders for unauthenticated users.
 *
 * Useful for login/register pages that should redirect
 * authenticated users away.
 *
 * @example
 * ```tsx
 * <GuestRoute redirectTo="/dashboard">
 *   <LoginPage />
 * </GuestRoute>
 * ```
 */
export function GuestRoute({
  children,
  loadingFallback = null,
  redirectTo,
  onRedirect,
}: GuestRouteProps) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (authenticated) {
    if (redirectTo) {
      if (onRedirect) {
        onRedirect(redirectTo);
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
    return null;
  }

  return <>{children}</>;
}
