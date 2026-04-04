# Contributing to S3 Explorer

Thanks for your interest in contributing. This guide covers everything you need to get started.

## Project Structure

```
s3explorer/
  apps/
    client/          # React frontend (Vite + Tailwind)
      src/
        api.ts       # API client — all fetch calls, error handling, request cancellation
        App.tsx      # Root component — auth flow, state management, routing
        components/  # UI components (Sidebar, Header, FileTable, modals, etc.)
        hooks/       # Custom React hooks (useDebounce, useNetworkStatus)
        utils/       # Pure utility functions (formatting, validation, file helpers)
        types/       # TypeScript interfaces
        constants/   # App-wide constants (timeouts, pagination, storage keys)
    server/          # Express backend (TypeScript)
      src/
        index.ts     # Server entry — Express setup, middleware, route mounting
        middleware/   # Auth middleware (Argon2, rate limiting, session management)
        routes/      # API routes (auth, buckets, objects, connections, setup)
        services/    # Core services (S3 client, SQLite DB, AES-256-GCM encryption)
        types/       # Shared TypeScript interfaces
```

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone and install
git clone https://github.com/subratomandal/s3explorer.git
cd s3explorer
npm run install:all

# Set environment
export APP_PASSWORD='DevPassword123!'
export SESSION_SECRET='dev-session-secret-32-characters!!'
export DATA_DIR='./data'

# Run both servers (backend on :3000, frontend on :5173)
npm run dev
```

The Vite dev server proxies `/api` requests to the Express backend automatically.

### Using Docker (optional)

```bash
docker-compose up -d
```

This starts MinIO (local S3) on port 9000 and the app on port 3000.

## Making Changes

### Before You Start

1. Check existing [issues](https://github.com/subratomandal/s3explorer/issues) to avoid duplicate work.
2. For large changes, open an issue first to discuss the approach.

### Branch Naming

- `fix/short-description` for bug fixes
- `feat/short-description` for new features
- `docs/short-description` for documentation

### Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary.
- **React** — functional components, hooks only. No class components.
- **CSS** — Tailwind utility classes. Base component styles live in `index.css`. Avoid inline styles unless dynamic.
- **Naming** — camelCase for variables/functions, PascalCase for components/types, UPPER_SNAKE for constants.
- **No unnecessary abstractions** — three similar lines are better than a premature helper function.
- **Comments** — only where the "why" isn't obvious from the code. No JSDoc on every function.

### Commit Messages

Keep them short and descriptive:

```
fix: prevent duplicate uploads when dropping same file twice
feat: add batch download for selected files
docs: update provider setup instructions
```

### Testing Your Changes

```bash
# Type check both apps
cd apps/client && npx tsc --noEmit
cd apps/server && npx tsc --noEmit

# Build to verify production build works
npm run build
```

## Architecture Notes

### Auth Flow

1. Server checks for `APP_PASSWORD` env var or stored password in SQLite.
2. If neither exists, the app enters setup mode (first-run wizard).
3. Passwords are hashed with Argon2id. Sessions stored in SQLite.
4. Rate limiting: 10 attempts per 15 minutes, 30-minute lockout.

### S3 Connection Management

- Users can store up to 100 S3 connections.
- Credentials are encrypted at rest with AES-256-GCM (key stored in `DATA_DIR/encryption.key`).
- One connection is "active" at a time. The S3 client is created per-request from the active connection.

### Frontend Patterns

- **Optimistic UI** — create/delete/rename operations update the UI immediately, then roll back on API failure.
- **Lazy loading** — modals and secondary pages are loaded via `React.lazy()`.
- **Virtual scrolling** — file lists over 100 items use `react-window` for performance.
- **Request cancellation** — navigating away cancels in-flight list requests via `AbortController`.

### Key Files to Know

| File | What it does |
|------|-------------|
| `apps/client/src/api.ts` | Every API call, error mapping, upload progress |
| `apps/client/src/App.tsx` | All app state, auth flow, event handlers |
| `apps/server/src/services/s3.ts` | S3 SDK wrapper — all bucket/object operations |
| `apps/server/src/services/db.ts` | SQLite schema, session store, CRUD operations |
| `apps/server/src/services/crypto.ts` | AES-256-GCM encrypt/decrypt for stored credentials |
| `apps/server/src/middleware/auth.ts` | Password verification, rate limiting, session handling |

## Pull Requests

1. Keep PRs focused — one feature or fix per PR.
2. Include a clear description of what changed and why.
3. Make sure both `tsc --noEmit` checks pass.
4. Test manually in both dark and light themes, desktop and mobile.

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS if it's a frontend issue
- Error logs if it's a backend issue

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
