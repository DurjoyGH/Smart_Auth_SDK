import { useContext } from 'react';
import { AuthContext } from '../context';
import type { AuthContextValue } from '../context';

/**
 * Primary auth hook — provides the full auth context.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { user, authenticated, login, logout, loading } = useAuth();
 *
 *   if (loading) return <Spinner />;
 *   if (!authenticated) return <LoginForm />;
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user?.name}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth<T = Record<string, unknown>>(): AuthContextValue<T> {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      '[smart-auth] useAuth() must be used within an <AuthProvider>. ' +
      'Make sure your component tree is wrapped with <AuthProvider>.',
    );
  }

  return context as unknown as AuthContextValue<T>;
}
