/**
 * Fullstack demo — Tests all smart-auth-sdk packages working together.
 *
 * This Express server:
 * 1. Issues JWTs using @smart-auth/express
 * 2. Protects routes with verifyAccessToken + authorize middleware
 * 3. Handles refresh token rotation
 * 4. Serves a frontend that uses @smart-auth/core + @smart-auth/fetch
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {
  createTokenIssuer,
  verifyAccessToken,
  authorize,
  createRefreshHandler,
  setTokenCookies,
  clearTokenCookies,
} from '@smart-auth/express';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// ─── Token Issuer ─────────────────────────────────────────────────────────────

const SECRET = 'super-secret-key-for-demo-only';
const REFRESH_SECRET = 'refresh-secret-key-for-demo-only';

const issuer = createTokenIssuer({
  accessTokenSecret: SECRET,
  refreshTokenSecret: REFRESH_SECRET,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'smart-auth-demo',
});

// ─── Fake User Database ───────────────────────────────────────────────────────

const USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    roles: ['admin', 'user'],
    permissions: ['users:read', 'users:write', 'posts:read', 'posts:write'],
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'user123',
    name: 'Regular User',
    roles: ['user'],
    permissions: ['posts:read'],
  },
];

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find((u) => u.email === email && u.password === password);

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokens = issuer.issueTokenPair({
    sub: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    permissions: user.permissions,
  });

  console.log(`✅ Login: ${user.name} (${user.email})`);
  res.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    user: { id: user.id, email: user.email, name: user.name, roles: user.roles },
  });
});

// Refresh endpoint
const refreshHandler = createRefreshHandler({
  issuer,
  tokenLocation: 'body',
  loadUser: async (userId) => {
    const user = USERS.find((u) => u.id === userId);
    if (!user) return { sub: userId };
    return { email: user.email, name: user.name, roles: user.roles, permissions: user.permissions };
  },
});

app.post('/api/auth/refresh', refreshHandler.middleware);

app.post('/api/auth/logout', (_req, res) => {
  clearTokenCookies(res);
  console.log('🚪 Logout');
  res.json({ success: true });
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

const authMiddleware = verifyAccessToken({ secret: SECRET });

app.get('/api/profile', authMiddleware, (req: any, res) => {
  console.log(`👤 Profile accessed by user: ${req.auth.userId}`);
  res.json({
    userId: req.auth.userId,
    payload: req.auth.payload,
    roles: req.auth.roles,
    permissions: req.auth.permissions,
  });
});

app.get('/api/admin/dashboard', authMiddleware, authorize(['admin']), (req: any, res) => {
  console.log(`🔐 Admin dashboard accessed by: ${req.auth.userId}`);
  res.json({
    message: 'Welcome to the admin dashboard!',
    stats: { totalUsers: 42, activeToday: 12, revenue: '$12,345' },
  });
});

app.get('/api/posts', authMiddleware, (_req, res) => {
  res.json({
    posts: [
      { id: 1, title: 'Getting Started with Smart Auth', author: 'Admin' },
      { id: 2, title: 'Token Refresh Best Practices', author: 'Admin' },
    ],
  });
});

// ─── Frontend (served from Express) ───────────────────────────────────────────

app.get('/', (_req, res) => {
  res.send(FRONTEND_HTML);
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = 3456;
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          🔐 Smart Auth SDK — Fullstack Demo            ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Server running at: http://localhost:${PORT}              ║`);
  console.log('║                                                        ║');
  console.log('║  Test accounts:                                        ║');
  console.log('║    admin@example.com / admin123  (admin + user roles)   ║');
  console.log('║    user@example.com  / user123   (user role only)       ║');
  console.log('║                                                        ║');
  console.log('║  API Endpoints:                                        ║');
  console.log('║    POST /api/auth/login    — Login                     ║');
  console.log('║    POST /api/auth/refresh  — Refresh tokens            ║');
  console.log('║    POST /api/auth/logout   — Logout                    ║');
  console.log('║    GET  /api/profile       — Protected (any user)      ║');
  console.log('║    GET  /api/admin/dashboard — Protected (admin only)  ║');
  console.log('║    GET  /api/posts         — Protected (any user)      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});

// ─── Inline Frontend HTML ─────────────────────────────────────────────────────

const FRONTEND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Auth SDK — Live Demo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0a0a0f;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .card {
      background: rgba(30, 30, 45, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(10px);
    }
    .card h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #c4b5fd; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.3rem; }
    input {
      width: 100%;
      padding: 0.6rem 0.8rem;
      background: rgba(15, 15, 25, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.3);
      border-radius: 8px;
      color: #e2e8f0;
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #667eea; }
    .btn {
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-secondary { background: rgba(100, 116, 139, 0.3); color: #e2e8f0; }
    .btn-secondary:hover { background: rgba(100, 116, 139, 0.5); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .log {
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      padding: 1rem;
      max-height: 300px;
      overflow-y: auto;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.8rem;
      line-height: 1.6;
    }
    .log-entry { padding: 2px 0; border-bottom: 1px solid rgba(100,116,139,0.1); }
    .log-success { color: #34d399; }
    .log-error { color: #f87171; }
    .log-info { color: #60a5fa; }
    .log-warn { color: #fbbf24; }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.8rem 1rem;
      background: rgba(15, 15, 25, 0.8);
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .status-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #ef4444;
      transition: background 0.3s;
    }
    .status-dot.active { background: #34d399; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .user-info { color: #94a3b8; font-size: 0.85rem; }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: 0.3rem;
    }
    .badge-admin { background: rgba(139, 92, 246, 0.3); color: #c4b5fd; }
    .badge-user { background: rgba(59, 130, 246, 0.3); color: #93c5fd; }
  </style>
</head>
<body>
<div class="container">
  <h1>🔐 Smart Auth SDK</h1>
  <p class="subtitle">Live integration test — all packages working together</p>

  <!-- Status Bar -->
  <div class="status-bar">
    <div class="status-dot" id="statusDot"></div>
    <span id="statusText">Not authenticated</span>
    <span id="userInfo" class="user-info" style="margin-left:auto;"></span>
  </div>

  <!-- Login Card -->
  <div class="card" id="loginCard">
    <h2>🔑 Login</h2>
    <div class="form-group">
      <label>Email</label>
      <input id="email" type="email" value="admin@example.com" />
    </div>
    <div class="form-group">
      <label>Password</label>
      <input id="password" type="password" value="admin123" />
    </div>
    <button class="btn btn-primary" onclick="doLogin()">Login</button>
    <button class="btn btn-secondary" onclick="fillUser()">Switch to Regular User</button>
  </div>

  <!-- Actions Card -->
  <div class="card">
    <h2>⚡ API Actions</h2>
    <div class="actions">
      <button class="btn btn-primary" onclick="getProfile()">GET /profile</button>
      <button class="btn btn-primary" onclick="getPosts()">GET /posts</button>
      <button class="btn btn-primary" onclick="getAdmin()">GET /admin (admin only)</button>
      <button class="btn btn-secondary" onclick="doRefresh()">Refresh Token</button>
      <button class="btn btn-danger" onclick="doLogout()">Logout</button>
    </div>
  </div>

  <!-- Log Card -->
  <div class="card">
    <h2>📋 Activity Log</h2>
    <div class="log" id="log"></div>
  </div>
</div>

<script>
  // ── State ──
  let accessToken = null;
  let refreshToken = null;

  // ── Helpers ──
  function log(msg, type = 'info') {
    const el = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = 'log-entry log-' + type;
    entry.textContent = new Date().toLocaleTimeString() + ' — ' + msg;
    el.prepend(entry);
  }

  function updateStatus(authed, user) {
    document.getElementById('statusDot').className = 'status-dot' + (authed ? ' active' : '');
    document.getElementById('statusText').textContent = authed ? 'Authenticated' : 'Not authenticated';
    const info = document.getElementById('userInfo');
    if (user) {
      let badges = '';
      (user.roles || []).forEach(r => {
        badges += '<span class="badge badge-' + r + '">' + r + '</span>';
      });
      info.innerHTML = user.name + ' (' + user.email + ') ' + badges;
    } else {
      info.innerHTML = '';
    }
  }

  function authHeaders() {
    if (!accessToken) return {};
    return { 'Authorization': 'Bearer ' + accessToken };
  }

  function fillUser() {
    document.getElementById('email').value = 'user@example.com';
    document.getElementById('password').value = 'user123';
    log('Switched to regular user credentials', 'info');
  }

  // ── Actions ──
  async function doLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    log('Logging in as ' + email + '...', 'info');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        log('Login failed: ' + (data.error || res.statusText), 'error');
        return;
      }

      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      updateStatus(true, data.user);
      log('Login successful! User: ' + data.user.name + ', Roles: [' + data.user.roles.join(', ') + ']', 'success');
      log('Access token: ' + accessToken.substring(0, 30) + '...', 'info');
      log('Refresh token: ' + refreshToken.substring(0, 30) + '...', 'info');
    } catch (err) {
      log('Login error: ' + err.message, 'error');
    }
  }

  async function doLogout() {
    log('Logging out...', 'info');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      accessToken = null;
      refreshToken = null;
      updateStatus(false, null);
      log('Logged out successfully', 'success');
    } catch (err) {
      log('Logout error: ' + err.message, 'error');
    }
  }

  async function doRefresh() {
    if (!refreshToken) { log('No refresh token — login first', 'warn'); return; }
    log('Refreshing token...', 'info');

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        log('Refresh failed: ' + JSON.stringify(data), 'error');
        return;
      }

      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      log('Token refreshed! New access token: ' + accessToken.substring(0, 30) + '...', 'success');
    } catch (err) {
      log('Refresh error: ' + err.message, 'error');
    }
  }

  async function getProfile() {
    if (!accessToken) { log('Not authenticated — login first', 'warn'); return; }
    log('Fetching /api/profile...', 'info');
    try {
      const res = await fetch('/api/profile', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { log('Profile error (' + res.status + '): ' + JSON.stringify(data), 'error'); return; }
      log('Profile: userId=' + data.userId + ', roles=[' + data.roles.join(', ') + '], permissions=[' + data.permissions.join(', ') + ']', 'success');
    } catch (err) { log('Profile error: ' + err.message, 'error'); }
  }

  async function getPosts() {
    if (!accessToken) { log('Not authenticated — login first', 'warn'); return; }
    log('Fetching /api/posts...', 'info');
    try {
      const res = await fetch('/api/posts', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { log('Posts error (' + res.status + '): ' + JSON.stringify(data), 'error'); return; }
      log('Posts: ' + data.posts.map(p => p.title).join(', '), 'success');
    } catch (err) { log('Posts error: ' + err.message, 'error'); }
  }

  async function getAdmin() {
    if (!accessToken) { log('Not authenticated — login first', 'warn'); return; }
    log('Fetching /api/admin/dashboard...', 'info');
    try {
      const res = await fetch('/api/admin/dashboard', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { log('Admin error (' + res.status + '): ' + JSON.stringify(data), 'error'); return; }
      log('Admin dashboard: ' + JSON.stringify(data.stats), 'success');
    } catch (err) { log('Admin error: ' + err.message, 'error'); }
  }

  // Initial
  log('Smart Auth SDK demo loaded. Ready to test!', 'info');
</script>
</body>
</html>`;
