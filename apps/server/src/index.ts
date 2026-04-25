import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { SQLiteStore, preferences, connections } from './services/db.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import bucketsRouter from './routes/buckets.js';
import objectsRouter from './routes/objects.js';
import connectionsRouter from './routes/connections.js';
import setupRouter from './routes/setup.js';
import { encryptAndPack } from './services/crypto.js';
import { createBucket } from './services/s3.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Only trust the first proxy hop -- prevents IP spoofing via chained X-Forwarded-For headers
// when deployed behind a single reverse proxy (Railway, nginx, ALB, etc.)
app.set('trust proxy', 1);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Monkey-patch res.json to log 5xx responses -- we intercept here instead of
// relying on the global error handler because many routes catch errors themselves
// and return structured JSON without re-throwing.
app.use((req, res, next) => {
  const originalJson = res.json;
  // @ts-ignore
  res.json = function (body) {
    if (res.statusCode >= 500) {
      console.error(`[${req.method}] ${req.url} returned ${res.statusCode}:`, body);
    }
    return originalJson.call(this, body);
  };
  next();
});

// Session secret priority: DB (persisted during setup wizard) > env var > random.
// DB takes precedence so the setup wizard's choice survives container restarts even
// without env vars. Random fallback works for dev but invalidates all sessions on restart.
let sessionSecret = preferences.get('session_secret') || process.env.SESSION_SECRET;

if (!sessionSecret) {
  console.warn('WARNING: SESSION_SECRET not set, generating random secret. Sessions will invalidate on restart.');
  sessionSecret = crypto.randomBytes(32).toString('hex');
} else {
  console.log('Using configured session secret');
}

app.use(session({
  name: 'sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore() as any,
  cookie: {
    // 'auto' lets express-session use the trust proxy setting to decide:
    // secure over HTTPS, plain over HTTP. This is critical for self-hosted
    // Docker deployments accessed via http://localhost without a TLS proxy.
    secure: 'auto',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day default
  },
}));

// Auth routes (no auth required)
app.use('/api/auth', authRouter);
app.use('/api/setup', setupRouter);


// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected API routes
app.use('/api/buckets', requireAuth, bucketsRouter);
app.use('/api/objects', requireAuth, objectsRouter);
app.use('/api/connections', requireAuth, connectionsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  if (!res.headersSent) {
    // Don't expose error details in production
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message;
    res.status(500).json({ error: message });
  }
});

// Serve static files if they exist (Production / Docker)
const publicPath = path.join(__dirname, '..', 'public');

if (fs.existsSync(publicPath)) {
  console.log(`Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));

  // SPA catch-all: any non-API, non-static route falls through to index.html
  // so client-side routing (React Router, etc.) can handle it.
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  console.log(`Static files not found at ${publicPath} (Running in API-only/Dev mode)`);
}

// Auto-configure a connection from environment variables when S3 credentials are
// provided at deploy time (e.g., Railway environment variables). This lets the app
// start fully connected without requiring the user to go through the UI setup wizard.
async function initEnvConnection(): Promise<void> {
  const bucket = process.env.BUCKET;
  const endpoint = process.env.ENDPOINT;
  const accessKeyId = process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY;
  const region = process.env.REGION || 'us-east-1';

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return; // No env-based connection configured
  }

  const ENV_CONN_NAME = 'env-default';

  // Check if an env-based connection already exists and is active
  const existing = connections.getAll().find(c => c.name === ENV_CONN_NAME);
  if (existing) {
    if (!existing.is_active) {
      connections.setActive(existing.id);
    }
    console.log('S3: Using existing env-based connection');
    return;
  }

  console.log(`S3: Initializing connection from environment variables (bucket: ${bucket})`);

  const accessKeyEnc = encryptAndPack(accessKeyId);
  const secretKeyEnc = encryptAndPack(secretAccessKey);

  const result = connections.create(
    ENV_CONN_NAME,
    endpoint,
    region,
    accessKeyEnc,
    secretKeyEnc,
    1, // forcePathStyle
    bucket
  );

  const newId = result.lastInsertRowid as number;
  connections.setActive(newId);

  // Ensure the bucket exists — createBucket handles BucketAlreadyExists gracefully
  try {
    await createBucket(bucket);
    console.log(`S3: Bucket "${bucket}" is ready`);
  } catch (err: any) {
    console.warn(`S3: Could not create bucket "${bucket}":`, err.message);
  }
}

initEnvConnection().catch(err => {
  console.error('S3: Failed to initialize env-based connection:', err);
});

app.listen(PORT, () => {
  console.log(`S3 Explorer running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
