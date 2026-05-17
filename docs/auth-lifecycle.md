# Authentication Lifecycle Guide

## How Token Refresh Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Request 1  │     │   Request 2  │     │   Request 3  │
│  (401 Error) │     │  (401 Error) │     │  (401 Error) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                    Refresh Queue                          │
│                                                          │
│  Only ONE refresh request is made.                       │
│  All other requests wait in the queue.                   │
│                                                          │
│  ┌─────────────────┐                                     │
│  │ POST /refresh   │  ← Single HTTP request              │
│  └────────┬────────┘                                     │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐                                     │
│  │ New Token Pair   │                                    │
│  └────────┬────────┘                                     │
│           │                                              │
│           ▼                                              │
│  All queued requests retry with new token                │
│                                                          │
│  Request 1 ──► Retry ──► Success ✓                       │
│  Request 2 ──► Retry ──► Success ✓                       │
│  Request 3 ──► Retry ──► Success ✓                       │
└──────────────────────────────────────────────────────────┘
```

## Session Lifecycle

```
App Starts
    │
    ▼
┌─────────────┐     ┌──────────┐
│ Restore     │────►│ Has      │
│ Session     │     │ Token?   │
└─────────────┘     └────┬─────┘
                    Yes  │  No
              ┌──────────┤
              ▼          ▼
        ┌──────────┐  ┌─────────────┐
        │ Validate │  │ Set state:  │
        │ Token    │  │ unauthed    │
        └────┬─────┘  └─────────────┘
        Valid│  Expired
       ┌─────┤
       ▼     ▼
  ┌────────┐ ┌──────────┐
  │ Set    │ │ Try      │
  │ authed │ │ Refresh  │
  └────────┘ └────┬─────┘
              OK  │  Fail
           ┌──────┤
           ▼      ▼
     ┌────────┐ ┌─────────────┐
     │ Set    │ │ Logout +    │
     │ authed │ │ Clear       │
     └────────┘ └─────────────┘
```

## Multi-Tab Synchronization

When a user logs out in one tab, all other tabs are notified:

1. Tab A calls `logout()`
2. Tab A broadcasts `LOGOUT` message via BroadcastChannel
3. Tabs B, C, D receive the message
4. Tabs B, C, D automatically clear their auth state

This also works for:
- Login events
- Token refresh events

## Security Best Practices

### Token Storage

| Storage | Access Token | Refresh Token | Notes |
|---------|-------------|---------------|-------|
| Memory | ✅ Recommended | ❌ Never | Cleared on refresh |
| httpOnly Cookie | ✅ Good | ✅ Recommended | Server-set only |
| localStorage | ⚠️ Acceptable | ❌ Never | XSS vulnerable |
| sessionStorage | ⚠️ Acceptable | ❌ Never | Tab-scoped |

### Recommendations

1. **Access tokens**: Short-lived (15 minutes), stored in memory
2. **Refresh tokens**: Long-lived (7 days), stored in httpOnly cookies
3. **Cookie attributes**: `Secure`, `SameSite=Strict`, `HttpOnly`
4. **Token rotation**: Each refresh invalidates the old refresh token
5. **HTTPS only**: Always use HTTPS in production
6. **Clock skew**: The SDK handles 5-second clock differences by default
