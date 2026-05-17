import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type {
  AuthConfigOptions,
  AuthState,
  AuthEngine,
  TokenPair,
  StorageAdapter,
} from '@smart-auth/types';
import { createAuth } from '@smart-auth/core';
import { AuthContext } from './context';
import type { AuthContextValue } from './context';

export interface AuthProviderProps {
  /** Auth configuration options. */
  config?: AuthConfigOptions;

  /** Optional pre-created auth engine instance. */
  engine?: AuthEngine;

  /** Optional custom storage adapter. */
  storage?: StorageAdapter;

  /** Children to render. */
  children: ReactNode;

  /**
   * Fallback UI to show while auth state is loading.
   * @default null
   */
  loadingFallback?: ReactNode;
}

/**
 * AuthProvider — The root provider for smart-auth React integration.
 *
 * Wraps your application and provides auth state to all children
 * via React Context.
 *
 * @example
 * ```tsx
 * import { AuthProvider } from '@smart-auth/react';
 *
 * function App() {
 *   return (
 *     <AuthProvider config={{
 *       apiBaseUrl: '/api',
 *       refresh: { endpoint: '/auth/refresh' },
 *     }}>
 *       <MyApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({
  config = {},
  engine: externalEngine,
  storage,
  children,
  loadingFallback = null,
}: AuthProviderProps) {
  // Create or use the provided engine (stable reference)
  const engineRef = useRef<AuthEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = externalEngine ?? createAuth(config, storage);
  }

  const engine = engineRef.current;

  // Reactive state synced from the engine
  const [state, setState] = useState<AuthState>(() => engine.getState());

  useEffect(() => {
    // Subscribe to state changes from the engine
    const unsubscribe = engine.subscribe((newState) => {
      setState(newState);
    });

    // Sync initial state
    setState(engine.getState());

    return () => {
      unsubscribe();
    };
  }, [engine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only destroy if we created the engine (not externally provided)
      if (!externalEngine && engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [externalEngine]);

  // Memoized callbacks
  const login = useCallback(
    async (tokens: TokenPair) => {
      await engine.login(tokens);
    },
    [engine],
  );

  const logout = useCallback(async () => {
    await engine.logout();
  }, [engine]);

  const getAccessToken = useCallback(async () => {
    return engine.getAccessToken();
  }, [engine]);

  const hasRole = useCallback(
    (role: string | string[]) => {
      return engine.hasRole(role);
    },
    [engine],
  );

  const hasPermission = useCallback(
    (permission: string | string[]) => {
      return engine.hasPermission(permission);
    },
    [engine],
  );

  // Build the context value (memoized to prevent unnecessary re-renders)
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      state,
      engine,
      login,
      logout,
      authenticated: state.authenticated,
      loading: state.loading,
      user: state.user,
      error: state.error,
      getAccessToken,
      hasRole,
      hasPermission,
    }),
    [state, engine, login, logout, getAccessToken, hasRole, hasPermission],
  );

  // Show loading fallback while initializing
  if (state.loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
