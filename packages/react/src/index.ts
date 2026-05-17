/**
 * @smart-auth/react
 *
 * React integration for smart-auth-sdk.
 * Provides context provider, hooks, and route protection components.
 */

// ─── Provider ─────────────────────────────────────────────────────────────────
export { AuthProvider } from './provider';
export type { AuthProviderProps } from './provider';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAuth } from './hooks/use-auth';
export { useUser } from './hooks/use-user';
export { useProtectedRoute } from './hooks/use-protected-route';
export { usePermissions } from './hooks/use-permissions';

// ─── Route Components ─────────────────────────────────────────────────────────
export { ProtectedRoute } from './components/protected-route';
export { GuestRoute } from './components/guest-route';

// ─── Context (for advanced usage) ─────────────────────────────────────────────
export { AuthContext } from './context';
export type { AuthContextValue } from './context';
