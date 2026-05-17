<p align="center">
  <img src="https://img.shields.io/badge/%F0%9F%94%90-Smart_Auth_SDK-blueviolet?style=for-the-badge&labelColor=1a1a2e" alt="Smart Auth SDK" />
</p>

<h3 align="center">Production-Grade Authentication Lifecycle Management</h3>

<p align="center">
  <em>A complete auth ecosystem for modern JavaScript &amp; TypeScript applications.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@smart-auth/core"><img src="https://img.shields.io/npm/v/@smart-auth/core.svg?style=flat-square&color=cb3837" alt="npm version" /></a>
  <a href="https://github.com/DurjoyGH/Smart_Auth_SDK/actions"><img src="https://img.shields.io/github/actions/workflow/status/DurjoyGH/Smart_Auth_SDK/ci.yml?branch=main&style=flat-square&label=CI" alt="CI" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.4+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/tree--shakeable-yes-brightgreen?style=flat-square" alt="Tree Shakeable" /></a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-packages">Packages</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-security">Security</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## The Problem

Authentication is never "just a JWT". Every real-world app ends up writing the same boilerplate:

- Token refresh logic with race conditions
- 401 interceptors that queue and retry requests
- Multi-tab session synchronization
- Secure storage with SSR compatibility
- Protected route wrappers
- Role-based access control

**smart-auth-sdk** solves all of this in one modular, type-safe, framework-agnostic SDK.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Lifecycle** | Automatic token management, expiration detection, proactive refresh |
| 🔄 **Silent Refresh** | Concurrent-safe token refresh with request queuing — only one refresh call, ever |
| 📱 **Multi-Tab Sync** | BroadcastChannel + storage event fallback — logout in one tab, logout everywhere |
| ⚛️ **React Integration** | Provider, hooks (`useAuth`, `useUser`, `usePermissions`), route guards |
| 🛡️ **Express Middleware** | JWT verification, RBAC authorization, token issuance, refresh rotation |
| 🌐 **HTTP Interceptors** | Axios and fetch wrappers with automatic token attachment and 401 retry |
| 💾 **Storage Adapters** | Memory (default), localStorage, sessionStorage, cookies, or custom |
| 🔒 **Security-First** | httpOnly cookies, token rotation, clock skew handling, sensitive data masking |
| 📦 **Modular** | Install only what you need — tree-shakeable, zero cross-package bloat |
| 🧩 **TypeScript** | Full type safety with generic user types and strict interfaces |

## 📦 Packages

| Package | Description | Size |
|---------|-------------|:----:|
| [`@smart-auth/core`](./packages/core) | Auth engine, token manager, storage adapters, multi-tab sync | ![core size](https://img.shields.io/bundlephobia/minzip/@smart-auth/core?style=flat-square&label=) |
| [`@smart-auth/react`](./packages/react) | React Provider, hooks, `ProtectedRoute`, `GuestRoute` | ![react size](https://img.shields.io/bundlephobia/minzip/@smart-auth/react?style=flat-square&label=) |
| [`@smart-auth/axios`](./packages/axios) | Axios interceptors with concurrent refresh queue | ![axios size](https://img.shields.io/bundlephobia/minzip/@smart-auth/axios?style=flat-square&label=) |
| [`@smart-auth/fetch`](./packages/fetch) | Enhanced fetch wrapper with auto-refresh | ![fetch size](https://img.shields.io/bundlephobia/minzip/@smart-auth/fetch?style=flat-square&label=) |
| [`@smart-auth/express`](./packages/express) | Express middleware — JWT verify, RBAC, token issuance | ![express size](https://img.shields.io/bundlephobia/minzip/@smart-auth/express?style=flat-square&label=) |
| [`@smart-auth/types`](./packages/types) | Shared TypeScript interfaces and error classes | Types only |
| [`@smart-auth/shared`](./packages/shared) | Internal utilities — JWT decode, event emitter, logger | Internal |

## 🚀 Quick Start

### Installation

```bash
# Core (required)
npm install @smart-auth/core

# React integration
npm install @smart-auth/react

# HTTP interceptors (pick one or both)
npm install @smart-auth/axios    # for Axios
npm install @smart-auth/fetch    # for fetch API

# Express backend
npm install @smart-auth/express
```

### React App

```tsx
import { AuthProvider, useAuth, ProtectedRoute } from '@smart-auth/react';

function App() {
  return (
    <AuthProvider config={{
      apiBaseUrl: '/api',
      refresh: { endpoint: '/auth/refresh' },
      autoRefresh: true,
    }}>
      <Router>
        <Route path="/dashboard" element={
          <ProtectedRoute fallback={<Navigate to="/login" />}>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Router>
    </AuthProvider>
  );
}

function Dashboard() {
  const { user, logout, loading } = useAuth();

  if (loading) return <Spinner />;

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}
```

### Express API

```ts
import express from 'express';
import {
  createTokenIssuer,
  verifyAccessToken,
  authorize,
  createRefreshHandler,
} from '@smart-auth/express';

const app = express();

// Create a token issuer
const issuer = createTokenIssuer({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const user = await authenticate(req.body); // your logic
  const tokens = issuer.issueTokenPair({
    sub: user.id,
    email: user.email,
    roles: user.roles,
  });
  res.json({ user, ...tokens });
});

// Protect any route with one middleware
app.get('/api/profile',
  verifyAccessToken({ secret: process.env.JWT_ACCESS_SECRET! }),
  (req, res) => {
    res.json({ userId: (req as any).auth.userId });
  }
);

// Role-based access control
app.delete('/api/users/:id',
  verifyAccessToken({ secret: process.env.JWT_ACCESS_SECRET! }),
  authorize(['admin']),
  (req, res) => {
    // Only admins reach here
  }
);

// Refresh token rotation
const refreshHandler = createRefreshHandler({ issuer });
app.post('/auth/refresh', refreshHandler.middleware);
```

### Axios Interceptors

```ts
import axios from 'axios';
import { createAuth } from '@smart-auth/core';
import { createSmartAxios } from '@smart-auth/axios';

const auth = createAuth({
  apiBaseUrl: '/api',
  refresh: { endpoint: '/auth/refresh' },
});

const api = axios.create({ baseURL: '/api' });

// Attach interceptors — tokens are injected automatically
const cleanup = createSmartAxios({ auth, axios: api });

// Every request is now authenticated. 401s trigger silent refresh.
const { data } = await api.get('/protected-resource');
```

### Fetch Wrapper

```ts
import { createAuth } from '@smart-auth/core';
import { createSmartFetch } from '@smart-auth/fetch';

const auth = createAuth({ apiBaseUrl: '/api' });
const smartFetch = createSmartFetch({ auth, baseUrl: '/api' });

// Automatic token injection + 401 refresh retry
const response = await smartFetch('/protected-resource');
const data = await response.json();
```

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Your Application                      │
├────────────┬────────────┬────────────┬───────────────────┤
│   React    │   Axios    │   Fetch    │     Express       │
│   Hooks &  │ Interceptor│  Wrapper   │    Middleware      │
│   Guards   │  + Queue   │            │    + RBAC          │
├────────────┴────────────┴────────────┼───────────────────┤
│           @smart-auth/core           │                   │
│  ┌────────────────────────────────┐  │                   │
│  │         Auth Engine            │  │                   │
│  │  ┌────────────┬─────────────┐  │  │   @smart-auth/    │
│  │  │   Token    │   Refresh   │  │  │     express       │
│  │  │  Manager   │   Manager   │  │  │                   │
│  │  ├────────────┼─────────────┤  │  │  Token Issuer     │
│  │  │  Session   │  Multi-Tab  │  │  │  JWT Verify       │
│  │  │  Manager   │    Sync     │  │  │  RBAC Authorize   │
│  │  └────────────┴─────────────┘  │  │  Cookie Helpers   │
│  └────────────────────────────────┘  │                   │
├──────────────────────────────────────┼───────────────────┤
│          @smart-auth/shared          │                   │
│    JWT Decode · Events · Logger      │                   │
├──────────────────────────────────────┴───────────────────┤
│                   @smart-auth/types                      │
│         Interfaces · Errors · Config Types               │
└──────────────────────────────────────────────────────────┘
```

> **Note:** `@smart-auth/express` does **not** depend on `@smart-auth/core`. The backend package shares only types and utilities — no browser code leaks into your server bundle.

## 🔒 Security

| Practice | Implementation |
|----------|---------------|
| **Default to memory storage** | Access tokens are stored in-memory by default (XSS-resistant) |
| **httpOnly cookies** | Refresh tokens should use httpOnly cookies set by the server |
| **Token rotation** | Old refresh tokens are invalidated on each refresh |
| **Clock skew tolerance** | Configurable buffer prevents premature token rejection |
| **Data masking** | Sensitive data (tokens, secrets) is masked in all log output |
| **CSRF protection** | SameSite cookie attribute, configurable per environment |
| **Concurrent refresh safety** | Only one refresh request fires, all others queue and await |

## 🧪 Testing

```bash
# Run all unit tests (58 tests across 3 packages)
pnpm test

# Run the fullstack integration demo
cd examples/fullstack-demo && pnpm dev
```

## 🤝 Contributing

Contributions are welcome! This is a pnpm monorepo managed with [Turborepo](https://turbo.build/).

```bash
# Clone and install
git clone https://github.com/DurjoyGH/Smart_Auth_SDK.git
cd Smart_Auth_SDK
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run the demo
cd examples/fullstack-demo && pnpm dev
```

### Project Structure

```
smart-auth-sdk/
├── packages/
│   ├── types/          # Shared interfaces and error classes
│   ├── shared/         # Internal utilities (JWT, events, logger)
│   ├── core/           # Auth engine (browser + SSR)
│   ├── react/          # React Provider, hooks, route guards
│   ├── axios/          # Axios interceptors
│   ├── fetch/          # Fetch wrapper
│   └── express/        # Express middleware (server-only)
├── examples/
│   └── fullstack-demo/ # Working Express + frontend demo
├── docs/               # Guides and API documentation
└── .github/workflows/  # CI/CD with GitHub Actions
```

## 📄 License

[MIT](./LICENSE) © [Durjoy Ghosh](https://github.com/DurjoyGH)
