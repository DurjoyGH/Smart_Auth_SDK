# @smart-auth/shared

> Shared utilities for the [Smart Auth SDK](https://github.com/DurjoyGH/Smart_Auth_SDK) ecosystem.

[![npm](https://img.shields.io/npm/v/@smart-auth/shared?style=flat-square)](https://www.npmjs.com/package/@smart-auth/shared)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What it does

`@smart-auth/shared` provides internal utilities used across Smart Auth SDK packages — JWT decoding, token expiration checks, environment detection, typed event emitter, and a secure logger with sensitive data masking.

> **Note:** This is an internal package. You typically don't need to install it directly — it's automatically included as a dependency of `@smart-auth/core` and `@smart-auth/express`.

## What's included

| Utility                    | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `decodeToken()`            | Decode a JWT payload without verification (client-side safe) |
| `isTokenExpired()`         | Check if a JWT is expired with clock skew support            |
| `getTokenExpiration()`     | Get the expiration timestamp from a JWT                      |
| `getTokenTimeRemaining()`  | Get milliseconds until a token expires                       |
| `TypedEventEmitter`        | Type-safe event emitter for auth events                      |
| `createLogger()`           | Logger with sensitive data masking                           |
| `resolveConfig()`          | Merge user config with sensible defaults                     |
| `isBrowser()` / `isNode()` | Environment detection helpers                                |
| `safeLocalStorage()`       | Safe access to localStorage (handles SSR and private mode)   |

## Installation

```bash
npm install @smart-auth/shared
```

## Part of Smart Auth SDK

| Package                                                                    | Description        |
| -------------------------------------------------------------------------- | ------------------ |
| [`@smart-auth/core`](https://www.npmjs.com/package/@smart-auth/core)       | Core auth engine   |
| [`@smart-auth/react`](https://www.npmjs.com/package/@smart-auth/react)     | React integration  |
| [`@smart-auth/express`](https://www.npmjs.com/package/@smart-auth/express) | Express middleware |

## License

MIT © [Durjoy Ghosh](https://github.com/DurjoyGH)
