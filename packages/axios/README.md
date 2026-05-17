# @smart-auth/axios

> Axios integration for the [Smart Auth SDK](https://github.com/DurjoyGH/Smart_Auth_SDK) ecosystem.

[![npm](https://img.shields.io/npm/v/@smart-auth/axios?style=flat-square)](https://www.npmjs.com/package/@smart-auth/axios)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What it does

`@smart-auth/axios` adds authentication interceptors to your Axios instance. Every request gets the access token automatically. If a 401 comes back, it silently refreshes the token and retries — your app code never knows the token expired.

## Features

- 🔑 **Auto token injection** — Authorization header added to every request
- 🔄 **Silent 401 refresh** — Expired token? Refreshed and retried automatically
- 🚦 **Request queuing** — Multiple 401s trigger only ONE refresh, others wait
- 🧹 **Cleanup function** — Remove interceptors when done

## Installation

```bash
npm install @smart-auth/axios @smart-auth/core axios
```

## Quick Start

```ts
import axios from 'axios';
import { createAuth } from '@smart-auth/core';
import { createSmartAxios } from '@smart-auth/axios';

const auth = createAuth({
  apiBaseUrl: '/api',
  refresh: { endpoint: '/auth/refresh' },
});

const api = axios.create({ baseURL: '/api' });

// One line — all requests are now authenticated
const cleanup = createSmartAxios({ auth, axios: api });

// Just use axios normally — tokens are handled for you
const { data } = await api.get('/protected-resource');
const users = await api.get('/users');

// Cleanup when done
cleanup();
```

## How it works

1. **Request interceptor** → Reads the access token from the auth engine and attaches it as `Authorization: Bearer <token>`
2. **Response interceptor** → If a 401 is received, it pauses the request, triggers a token refresh, then retries the original request with the new token
3. **Concurrent safety** → If 5 requests all get 401 at once, only 1 refresh happens. The other 4 wait and retry with the new token.

## Part of Smart Auth SDK

| Package                                                                    | Description                 |
| -------------------------------------------------------------------------- | --------------------------- |
| [`@smart-auth/core`](https://www.npmjs.com/package/@smart-auth/core)       | Core auth engine (required) |
| [`@smart-auth/react`](https://www.npmjs.com/package/@smart-auth/react)     | React Provider & hooks      |
| [`@smart-auth/fetch`](https://www.npmjs.com/package/@smart-auth/fetch)     | Fetch wrapper alternative   |
| [`@smart-auth/express`](https://www.npmjs.com/package/@smart-auth/express) | Express middleware          |

## License

MIT © [Durjoy Ghosh](https://github.com/DurjoyGH)
