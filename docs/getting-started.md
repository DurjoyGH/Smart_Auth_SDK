# Getting Started

## Installation

Install the packages you need:

```bash
# Core (always required)
pnpm add @smart-auth/core @smart-auth/types

# For React apps
pnpm add @smart-auth/react

# For Axios HTTP client
pnpm add @smart-auth/axios

# For native fetch
pnpm add @smart-auth/fetch

# For Express backend
pnpm add @smart-auth/express
```

## React Setup

### 1. Create the AuthProvider

```tsx
// src/App.tsx
import { AuthProvider } from '@smart-auth/react';

const authConfig = {
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api',
  refresh: {
    endpoint: '/auth/refresh',
    bufferMs: 30000, // Refresh 30s before expiry
    maxRetries: 3,
  },
  autoRefresh: true,
  storage: 'memory', // Most secure
  tokenTransport: 'header',
  multiTabSync: true,
  debug: import.meta.env.DEV,
};

function App() {
  return (
    <AuthProvider
      config={authConfig}
      loadingFallback={<FullPageSpinner />}
    >
      <Router />
    </AuthProvider>
  );
}
```

### 2. Login Flow

```tsx
// src/pages/Login.tsx
import { useAuth } from '@smart-auth/react';

function LoginPage() {
  const { login } = useAuth();

  async function handleLogin(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Pass tokens to the auth engine
    await login({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
  }

  return <LoginForm onSubmit={handleLogin} />;
}
```

### 3. Protected Routes

```tsx
// src/Router.tsx
import { ProtectedRoute, GuestRoute } from '@smart-auth/react';

function Router() {
  return (
    <Routes>
      {/* Only visible when NOT logged in */}
      <Route path="/login" element={
        <GuestRoute redirectTo="/dashboard">
          <LoginPage />
        </GuestRoute>
      } />

      {/* Only visible when logged in */}
      <Route path="/dashboard" element={
        <ProtectedRoute redirectTo="/login" loadingFallback={<Spinner />}>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Admin only */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']} redirectTo="/unauthorized">
          <AdminPanel />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

### 4. Using Auth State

```tsx
import { useAuth, useUser, usePermissions } from '@smart-auth/react';

function Header() {
  const { authenticated, logout } = useAuth();
  const user = useUser<{ name: string; avatar: string }>();
  const { hasRole } = usePermissions();

  if (!authenticated) return null;

  return (
    <header>
      <span>{user?.name}</span>
      {hasRole('admin') && <AdminBadge />}
      <button onClick={logout}>Logout</button>
    </header>
  );
}
```

## Express Setup

### 1. Token Issuance

```ts
import {
  createTokenIssuer,
  createRefreshHandler,
  verifyAccessToken,
  authorize,
  setTokenCookies,
  clearTokenCookies,
} from '@smart-auth/express';

const issuer = createTokenIssuer({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'my-app',
});
```

### 2. Auth Routes

```ts
// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const tokens = issuer.issueTokenPair({
    sub: user.id,
    email: user.email,
    roles: user.roles,
  });

  // Option A: Return tokens in response body
  res.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    user,
  });

  // Option B: Set httpOnly cookies
  // setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  // res.json({ user });
});

// Refresh
const refreshHandler = createRefreshHandler({
  issuer,
  tokenLocation: 'body',
  loadUser: async (userId) => {
    const user = await db.users.findById(userId);
    return { email: user.email, roles: user.roles };
  },
});

app.post('/api/auth/refresh', refreshHandler.middleware);

// Logout
app.post('/api/auth/logout', (req, res) => {
  clearTokenCookies(res);
  res.json({ success: true });
});
```

### 3. Protected Routes

```ts
const authMiddleware = verifyAccessToken({
  secret: process.env.JWT_ACCESS_SECRET!,
});

// All routes under /api need auth
app.use('/api', authMiddleware);

// Admin-only route
app.delete('/api/users/:id',
  authorize(['admin']),
  async (req, res) => {
    // req.auth.userId, req.auth.roles available
    await db.users.delete(req.params.id);
    res.json({ deleted: true });
  }
);
```

## Axios Setup

```ts
import axios from 'axios';
import { createAuth } from '@smart-auth/core';
import { createSmartAxios } from '@smart-auth/axios';

const auth = createAuth({
  apiBaseUrl: '/api',
  refresh: { endpoint: '/auth/refresh' },
});

const api = axios.create({ baseURL: '/api' });

// Attach interceptors
const cleanup = createSmartAxios({
  auth,
  axios: api,
  excludeUrls: ['/auth/login', '/auth/register'],
});

// All requests now include auth headers automatically
// 401 responses trigger auto-refresh and retry
const { data } = await api.get('/protected');
```

## SSR Considerations

The SDK is SSR-safe by default:
- All browser APIs (`window`, `document`, `localStorage`) are safely guarded
- The memory storage adapter works everywhere
- React hooks handle server rendering gracefully

For Next.js, ensure the AuthProvider is in a client component:

```tsx
'use client';
import { AuthProvider } from '@smart-auth/react';
```
