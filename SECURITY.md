# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in S3 Explorer, please report it responsibly.

**Do not open a public issue.** Instead, email **security@subratomandal.com** or use [GitHub's private vulnerability reporting](https://github.com/subratomandal/s3explorer/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

You should receive a response within 72 hours. Critical issues will be patched and released as soon as possible.

## Security Model

S3 Explorer is designed for self-hosted deployments where a single admin manages S3 buckets through a web interface. Here's how it handles security:

### Authentication

- **Single-password auth** — no usernames, no multi-user support. This is intentional for simplicity in self-hosted setups.
- **Argon2id hashing** — passwords are hashed using Argon2id (winner of the Password Hashing Competition). The hash is stored in SQLite, never in plaintext.
- **Rate limiting** — 10 login attempts per 15-minute window per IP. After exceeding the limit, the IP is blocked for 30 minutes. Rate limit state is persisted in SQLite so it survives restarts.

### Session Management

- **Server-side sessions** — stored in SQLite, not in the browser. The client only holds an opaque session ID in a cookie.
- **Cookie security** — `httpOnly` (no JavaScript access), `sameSite: strict` (no CSRF), `secure: true` in production (HTTPS only).
- **Session expiry** — 24 hours by default, 7 days with "Remember Me". Expired sessions are cleaned up hourly.

### Credential Storage

- **AES-256-GCM encryption** — all S3 access keys and secret keys are encrypted at rest before being written to SQLite.
- **Encryption key** — a 256-bit random key is generated on first run and stored in `DATA_DIR/encryption.key` with `0600` permissions (owner-only read/write).
- **No client-side storage** — credentials never touch `localStorage`, `sessionStorage`, or cookies. They only exist decrypted in server memory during an active S3 request.

### Network Security

- **Helmet.js** — sets security headers including Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, and more.
- **CSP policy** — `default-src 'self'`, `script-src 'self'`, restricted `connect-src`, `img-src`, `font-src`. Inline scripts are blocked.
- **Proxy architecture** — file downloads and previews go through the server (`/api/objects/:bucket/proxy`). The browser never connects directly to S3, so S3 credentials are never exposed to the client.

### Input Validation

- **Bucket names** — validated against S3 naming rules (3-63 chars, lowercase, no `..`).
- **Object keys** — max 1024 bytes, no path traversal (`../`).
- **File uploads** — temporary files are written to `DATA_DIR/tmp-uploads/` and deleted after upload completes (or on error). Max 500MB per file.
- **Filenames** — sanitized to remove path components and dangerous characters before S3 upload.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.x     | Yes       |
| < 3.0   | No        |

Only the latest major version receives security updates.

## Environment Hardening

For production deployments, ensure:

1. **Set `NODE_ENV=production`** — this enables secure cookies and hides error details.
2. **Use HTTPS** — required for `secure` cookies to work. Use a reverse proxy (nginx, Caddy) or deploy behind Railway/Cloudflare.
3. **Set a strong `APP_PASSWORD`** — 12+ characters, mixed case, numbers, special characters.
4. **Set `SESSION_SECRET`** — use `openssl rand -hex 32` to generate a random 64-character hex string.
5. **Protect the data directory** — `DATA_DIR` contains the SQLite database (with encrypted credentials) and the encryption key. Restrict filesystem permissions.
6. **Use a persistent volume** — in Docker/Railway, mount `DATA_DIR` to a persistent volume so the encryption key and database survive container restarts.

## Known Limitations

- **Single-user only** — there's no role-based access control. Anyone with the password has full access to all connected S3 buckets.
- **No audit logging** — file operations (upload, delete, rename) are not logged to a persistent audit trail.
- **No MFA** — the password is the only authentication factor.
- **Trust boundary** — the server has full access to all connected S3 buckets. A compromised server means compromised S3 access.

These are accepted trade-offs for a lightweight self-hosted tool. If you need multi-user RBAC or audit trails, consider a dedicated cloud storage management platform.
