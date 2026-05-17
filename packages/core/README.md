# @smart-auth/core

> Core authentication engine for the [Smart Auth SDK](https://github.com/DurjoyGH/Smart_Auth_SDK) ecosystem.

[![npm](https://img.shields.io/npm/v/@smart-auth/core?style=flat-square)](https://www.npmjs.com/package/@smart-auth/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What it does

`@smart-auth/core` is the brain of Smart Auth SDK. It manages the entire authentication lifecycle — from storing tokens to silently refreshing them before they expire, synchronizing sessions across browser tabs, and emitting events your app can react to.

**You don't need to think about auth plumbing. This package handles it.**

## Features

- 🔐 **Token Management** — Securely store and retrieve access/refresh tokens
- 🔄 **Silent Refresh** — Automatically refresh tokens before they expire
- 🚦 **Concurrent Safety** — Only one refresh request fires, all others queue and wait
- 📱 **Multi-Tab Sync** — Login/logout in one tab syncs to all tabs instantly
- 💾 **Storage Adapters** — Memory (default), localStorage, sessionStorage, cookies, or custom
- 📡 **Event System** — Subscribe to login, logout, token refresh, and error events
- 🧩 **Framework Agnostic** — Works in browsers, Node.js, and SSR environments

## Installation

```bash
npm install @smart-auth/core
```

## Quick Start

```ts
import { createAuth } from '@smart-auth/core';

const auth = createAuth({
  apiBaseUrl: '/api',
  refresh: {
    endpoint: '/auth/refresh',
  },
  autoRefresh: true,
  multiTabSync: true,
});

// Login with tokens from your API
await auth.login({
  accessToken: 'eyJhbGci...',
  refreshToken: 'eyJhbGci...',
});

// Check auth state
const state = auth.getState();
console.log(state.authenticated); // true
console.log(state.user); // decoded user from JWT

// Get the current access token (auto-refreshes if needed)
const token = await auth.getAccessToken();

// Subscribe to state changes
const unsubscribe = auth.subscribe((state) => {
  console.log('Auth changed:', state.authenticated);
});

// Listen to specific events
auth.on('logout', (event) => {
  console.log('Logged out:', event.reason);
});

// Logout
await auth.logout();
```

## Storage Options

```ts
// Memory (default — most secure, no XSS risk)
createAuth({ storage: 'memory' });

// localStorage (persists across tabs/refreshes)
createAuth({ storage: 'local' });

// sessionStorage (cleared when tab closes)
createAuth({ storage: 'session' });

// Cookies
createAuth({ storage: 'cookie' });
```

## Part of Smart Auth SDK

This is the core package. For framework integrations, see:

| Package                                                                    | Description                             |
| -------------------------------------------------------------------------- | --------------------------------------- |
| [`@smart-auth/react`](https://www.npmjs.com/package/@smart-auth/react)     | React Provider, hooks, protected routes |
| [`@smart-auth/axios`](https://www.npmjs.com/package/@smart-auth/axios)     | Axios interceptors with retry queue     |
| [`@smart-auth/fetch`](https://www.npmjs.com/package/@smart-auth/fetch)     | Fetch wrapper with auto-refresh         |
| [`@smart-auth/express`](https://www.npmjs.com/package/@smart-auth/express) | Express middleware, JWT verify, RBAC    |

## License

MIT © [Durjoy Ghosh](https://github.com/DurjoyGH)
