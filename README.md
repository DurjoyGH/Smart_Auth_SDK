# smart-auth-sdk

> Production-grade authentication lifecycle management SDK for modern JavaScript and TypeScript applications.

[![npm version](https://img.shields.io/npm/v/@smart-auth/core.svg)](https://www.npmjs.com/package/@smart-auth/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

## Why smart-auth-sdk?

Authentication is more than just signing JWTs. **smart-auth-sdk** is a complete authentication *ecosystem* that handles the entire lifecycle:

- 🔐 **JWT authentication** with automatic token management
- 🔄 **Silent token refresh** with race condition prevention
- 📱 **Multi-tab synchronization** — logout in one tab, logout everywhere
- ⚛️ **React hooks** with reactive auth state
- 🛡️ **Express middleware** with RBAC support
- 🌐 **Axios/fetch interceptors** with automatic retry queues
- 💾 **Secure token storage** — memory, localStorage, cookies, or custom
- 🔒 **Production-grade security** — httpOnly cookies, token rotation, clock skew handling

## Quick Start

### Installation

```bash
# Core (required)
pnpm add @smart-auth/core @smart-auth/types

# React integration
pnpm add @smart-auth/react

# HTTP client integration (choose one or both)
pnpm add @smart-auth/axios
pnpm add @smart-auth/fetch

# Express backend
pnpm add @smart-auth/express
```

### React Frontend

```tsx
import { AuthProvider, useAuth } from '@smart-auth/react';

// 1. Wrap your app
function App() {
  return (
    <AuthProvider config={{
      apiBaseUrl: '/api',
      refresh: { endpoint: '/auth/refresh' },
      autoRefresh: true,
    }}>
      <MyApp />
    </AuthProvider>
  );
}

// 2. Use the hooks
function Dashboard() {
  const { user, authenticated, login, logout, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!authenticated) return <LoginForm />;

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Express Backend

```ts
import express from 'express';
import {
  verifyAccessToken,
  authorize,
  createTokenIssuer,
  createRefreshHandler,
  setTokenCookies,
} from '@smart-auth/express';

const app = express();

const issuer = createTokenIssuer({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
});

// Login
app.post('/auth/login', async (req, res) => {
  const user = await authenticate(req.body);
  const tokens = issuer.issueTokenPair({
    sub: user.id,
    roles: user.roles,
  });
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  res.json({ user, ...tokens });
});

// Protected route
app.get('/api/profile',
  verifyAccessToken({ secret: process.env.JWT_ACCESS_SECRET! }),
  (req, res) => {
    res.json({ userId: req.auth.userId });
  }
);

// Admin-only route
app.delete('/api/users/:id',
  verifyAccessToken({ secret: process.env.JWT_ACCESS_SECRET! }),
  authorize(['admin']),
  (req, res) => { /* ... */ }
);
```

### Axios Integration

```ts
import axios from 'axios';
import { createAuth } from '@smart-auth/core';
import { createSmartAxios } from '@smart-auth/axios';

const auth = createAuth({ apiBaseUrl: '/api' });
const api = axios.create({ baseURL: '/api' });

createSmartAxios({ auth, axios: api });

// All requests are now automatically authenticated
const response = await api.get('/protected');
```

## Packages

| Package | Description | Size |
|---------|------------|------|
| [`@smart-auth/core`](./packages/core) | Core auth engine, token management, storage adapters | ~5KB gzipped |
| [`@smart-auth/react`](./packages/react) | React Provider, hooks, route protection | ~2KB gzipped |
| [`@smart-auth/axios`](./packages/axios) | Axios interceptors with retry queue | ~1KB gzipped |
| [`@smart-auth/fetch`](./packages/fetch) | Enhanced fetch wrapper | ~1KB gzipped |
| [`@smart-auth/express`](./packages/express) | Express middleware, token issuance, RBAC | ~3KB gzipped |
| [`@smart-auth/types`](./packages/types) | TypeScript type definitions | Types only |
| [`@smart-auth/shared`](./packages/shared) | Shared utilities (JWT decode, event emitter) | ~2KB gzipped |

## Architecture

```
┌────────────────────────────────────────────────┐
│                  Your Application                │
├──────────┬───────────┬───────────┬──────────────┤
│  React   │   Axios   │   Fetch   │   Express    │
│  Hooks   │Interceptor│  Wrapper  │  Middleware   │
├──────────┴───────────┴───────────┼──────────────┤
│         @smart-auth/core         │              │
│  ┌──────────────────────────┐    │              │
│  │     Auth Engine          │    │              │
│  │  ┌─────────┬──────────┐  │    │              │
│  │  │ Token   │ Refresh  │  │    │   Express    │
│  │  │ Manager │ Manager  │  │    │   Package    │
│  │  ├─────────┼──────────┤  │    │  (Server)    │
│  │  │ Session │ Tab Sync │  │    │              │
│  │  │ Manager │ Manager  │  │    │              │
│  │  └─────────┴──────────┘  │    │              │
│  └──────────────────────────┘    │              │
├──────────────────────────────────┼──────────────┤
│         @smart-auth/shared       │              │
│   JWT Decode · Events · Logger   │              │
├──────────────────────────────────┴──────────────┤
│              @smart-auth/types                   │
│   Interfaces · Errors · Config Types             │
└──────────────────────────────────────────────────┘
```

## Security

- **Access tokens** default to **memory storage** (most secure)
- **Refresh tokens** should use **httpOnly cookies** set by the server
- Token refresh uses **rotation** — old refresh tokens are invalidated
- **Clock skew tolerance** prevents premature token rejection
- **Sensitive data masking** in all log output
- **CSRF protection** via SameSite cookie attribute

## License

MIT © smart-auth-sdk contributors
