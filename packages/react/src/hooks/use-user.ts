import { useAuth } from './use-auth';

/**
 * Hook to access only the current user.
 *
 * @example
 * ```tsx
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * function Profile() {
 *   const user = useUser<User>();
 *   if (!user) return <p>Not logged in</p>;
 *   return <p>{user.name} ({user.email})</p>;
 * }
 * ```
 */
export function useUser<T = Record<string, unknown>>(): T | null {
  const { user } = useAuth<T>();
  return user;
}
