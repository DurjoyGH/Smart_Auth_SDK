# @smart-auth/fetch

> Fetch API wrapper for the [Smart Auth SDK](https://github.com/DurjoyGH/Smart_Auth_SDK) ecosystem.

[![npm](https://img.shields.io/npm/v/@smart-auth/fetch?style=flat-square)](https://www.npmjs.com/package/@smart-auth/fetch)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What it does

`@smart-auth/fetch` wraps the native `fetch()` API with automatic authentication. Your access token is injected into every request. If a 401 comes back, it silently refreshes and retries. Zero config, zero boilerplate.

## Features

- 🔑 **Auto token injection** — Authorization header added to every request
- 🔄 **Silent 401 refresh** — Expired token? Refreshed and retried automatically
- 🌐 **Base URL support** — Prefix all requests with a base URL
- 📦 **Lightweight** — ~1KB, wraps native fetch, no dependencies

## Installation

```bash
npm install @smart-auth/fetch @smart-auth/core
```

## Quick Start

```ts
import { createAuth } from '@smart-auth/core';
import { createSmartFetch } from '@smart-auth/fetch';

const auth = createAuth({
  apiBaseUrl: '/api',
  refresh: { endpoint: '/auth/refresh' },
});

const smartFetch = createSmartFetch({ auth, baseUrl: '/api' });

// Use like normal fetch — auth is automatic
const response = await smartFetch('/users');
const users = await response.json();

// POST requests work too
const newUser = await smartFetch('/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' }),
});
```

## Part of Smart Auth SDK

| Package                                                                    | Description                    |
| -------------------------------------------------------------------------- | ------------------------------ |
| [`@smart-auth/core`](https://www.npmjs.com/package/@smart-auth/core)       | Core auth engine (required)    |
| [`@smart-auth/react`](https://www.npmjs.com/package/@smart-auth/react)     | React Provider & hooks         |
| [`@smart-auth/axios`](https://www.npmjs.com/package/@smart-auth/axios)     | Axios interceptors alternative |
| [`@smart-auth/express`](https://www.npmjs.com/package/@smart-auth/express) | Express middleware             |

## License

MIT © [Durjoy Ghosh](https://github.com/DurjoyGH)
