# @smart-auth/react

> React integration for the [Smart Auth SDK](https://github.com/DurjoyGH/Smart_Auth_SDK) ecosystem.

[![npm](https://img.shields.io/npm/v/@smart-auth/react?style=flat-square)](https://www.npmjs.com/package/@smart-auth/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What it does

`@smart-auth/react` gives you a complete auth UI layer — wrap your app with `<AuthProvider>`, use the `useAuth()` hook, and protect routes. Authentication state is reactive and automatically syncs across components.

## Features

- ⚛️ **AuthProvider** — Context provider that manages auth lifecycle
- 🪝 **useAuth()** — Access `user`, `authenticated`, `login`, `logout`, `loading`
- 🔒 **ProtectedRoute** — Renders children only when authenticated
- 🚪 **GuestRoute** — Renders children only when NOT authenticated
- 👤 **useUser\<T\>()** — Typed user data from the JWT
- 🛡️ **usePermissions()** — Role and permission checks for conditional UI
- 📱 **Multi-tab sync** — Logout in one tab → logged out everywhere
- 🌐 **SSR safe** — No direct `window` access

## Installation

```bash
npm install @smart-auth/react @smart-auth/core
```

## Quick Start

```tsx
import { AuthProvider, useAuth, ProtectedRoute } from '@smart-auth/react';

// 1. Wrap your app
function App() {
  return (
    <AuthProvider
      config={{
        apiBaseUrl: '/api',
        refresh: { endpoint: '/auth/refresh' },
        autoRefresh: true,
      }}
    >
      <Router>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute fallback={<Navigate to="/login" />}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Router>
    </AuthProvider>
  );
}

// 2. Use the hook
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

### Role-Based UI

```tsx
import { usePermissions } from '@smart-auth/react';

function AdminPanel() {
  const { hasRole, hasPermission } = usePermissions();

  return (
    <div>
      {hasRole('admin') && <AdminDashboard />}
      {hasPermission('posts:write') && <CreatePostButton />}
    </div>
  );
}
```

## Part of Smart Auth SDK

| Package                                                                    | Description                 |
| -------------------------------------------------------------------------- | --------------------------- |
| [`@smart-auth/core`](https://www.npmjs.com/package/@smart-auth/core)       | Core auth engine (required) |
| [`@smart-auth/axios`](https://www.npmjs.com/package/@smart-auth/axios)     | Axios interceptors          |
| [`@smart-auth/fetch`](https://www.npmjs.com/package/@smart-auth/fetch)     | Fetch wrapper               |
| [`@smart-auth/express`](https://www.npmjs.com/package/@smart-auth/express) | Express middleware          |

## License

MIT © [Durjoy Ghosh](https://github.com/DurjoyGH)
