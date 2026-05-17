# @smart-auth/types

> TypeScript type definitions for the [Smart Auth SDK](https://github.com/DurjoyGH/Smart_Auth_SDK) ecosystem.

[![npm](https://img.shields.io/npm/v/@smart-auth/types?style=flat-square)](https://www.npmjs.com/package/@smart-auth/types)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What it does

`@smart-auth/types` provides all the TypeScript interfaces, error classes, and type definitions shared across the Smart Auth SDK packages. Install this if you need to type your own adapters, plugins, or custom integrations.

## What's included

### Interfaces

- **`AuthConfig`** — Full configuration options
- **`AuthEngine<T>`** — The core auth engine interface
- **`AuthState<T>`** — Authentication state shape
- **`TokenPair`** — Access + refresh token pair
- **`TokenPayload`** — Decoded JWT payload
- **`StorageAdapter`** — Custom storage adapter interface
- **`Logger`** — Logger interface

### Error Classes

- **`AuthError`** — Base error class with status codes and JSON serialization
- **`TokenExpiredError`** — Thrown when a token has expired
- **`RefreshFailedError`** — Thrown when token refresh fails
- **`UnauthorizedError`** — Thrown for 401/403 responses
- **`SessionExpiredError`** — Thrown when the session has expired

### Event Types

- **`AuthEvent`** — Discriminated union of all auth events
- **`AuthEventType`** — Event type literals (`login`, `logout`, `tokenRefreshed`, etc.)

## Installation

```bash
npm install @smart-auth/types
```

## Usage

```ts
import type { AuthConfig, AuthEngine, StorageAdapter, TokenPair } from '@smart-auth/types';
import { AuthError, TokenExpiredError } from '@smart-auth/types';

// Type your custom storage
class MyCustomStorage implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    /* ... */
  }
  async set(key: string, value: string): Promise<void> {
    /* ... */
  }
  async remove(key: string): Promise<void> {
    /* ... */
  }
}

// Catch typed errors
try {
  await auth.refreshToken();
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Handle expired token
  }
}
```

## Part of Smart Auth SDK

This package is automatically installed as a dependency of other Smart Auth SDK packages. You only need to install it directly if you're building custom integrations.

## License

MIT © [Durjoy Ghosh](https://github.com/DurjoyGH)
