# @smart-auth/express

> Express middleware for the [Smart Auth SDK](https://github.com/DurjoyGH/Smart_Auth_SDK) ecosystem.

[![npm](https://img.shields.io/npm/v/@smart-auth/express?style=flat-square)](https://www.npmjs.com/package/@smart-auth/express)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What it does

`@smart-auth/express` provides everything you need for JWT authentication on your Express backend — verify tokens, issue token pairs, handle refresh rotation, and enforce role-based access control. One import, full auth backend.

## Features

- 🔐 **verifyAccessToken()** — Middleware that validates JWTs and attaches user data to `req.auth`
- 🎫 **createTokenIssuer()** — Issue access + refresh token pairs with configurable expiry
- 🔄 **createRefreshHandler()** — Refresh token rotation with user data reload
- 🛡️ **authorize()** — Role-based access control (RBAC) with permissions support
- 🍪 **Cookie helpers** — `setTokenCookies()` / `clearTokenCookies()` with secure defaults
- 📦 **Zero browser code** — Server-only, no client bundle pollution

## Installation

```bash
npm install @smart-auth/express
```

## Quick Start

```ts
import express from 'express';
import {
  createTokenIssuer,
  verifyAccessToken,
  authorize,
  createRefreshHandler,
} from '@smart-auth/express';

const app = express();
app.use(express.json());

// Setup token issuer
const issuer = createTokenIssuer({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
});

// Login
app.post('/auth/login', async (req, res) => {
  const user = await authenticate(req.body); // your logic
  const tokens = issuer.issueTokenPair({
    sub: user.id,
    email: user.email,
    roles: user.roles,
  });
  res.json({ ...tokens, user });
});

// Protected route
app.get(
  '/api/profile',
  verifyAccessToken({ secret: process.env.JWT_ACCESS_SECRET! }),
  (req, res) => {
    res.json({ userId: req.auth.userId });
  },
);

// Admin-only route (RBAC)
app.delete(
  '/api/users/:id',
  verifyAccessToken({ secret: process.env.JWT_ACCESS_SECRET! }),
  authorize(['admin']),
  (req, res) => {
    // Only admins reach here
  },
);

// Refresh endpoint
const refreshHandler = createRefreshHandler({ issuer });
app.post('/auth/refresh', refreshHandler.middleware);
```

## Part of Smart Auth SDK

| Package                                                                | Description                 |
| ---------------------------------------------------------------------- | --------------------------- |
| [`@smart-auth/core`](https://www.npmjs.com/package/@smart-auth/core)   | Core auth engine (frontend) |
| [`@smart-auth/react`](https://www.npmjs.com/package/@smart-auth/react) | React Provider & hooks      |
| [`@smart-auth/axios`](https://www.npmjs.com/package/@smart-auth/axios) | Axios interceptors          |
| [`@smart-auth/fetch`](https://www.npmjs.com/package/@smart-auth/fetch) | Fetch wrapper               |

## License

MIT © [Durjoy Ghosh](https://github.com/DurjoyGH)
