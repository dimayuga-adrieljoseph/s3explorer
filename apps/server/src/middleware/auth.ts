import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import { rateLimits, clearAllSessions } from '../services/db.js';

// Password validation helper (exported for setup route)
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (password.length < 12) {
    return { valid: false, reason: 'Password must be at least 12 characters' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain number' };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain special character' };
  }
  return { valid: true };
}

// Rate limiting config
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10; // 10 attempts per 15 min
const BLOCK_DURATION = 30 * 60 * 1000; // 30 min block after exceeding

interface RateLimitRecord {
  ip: string;
  attempts: number;
  first_attempt: number;
  blocked_until: number | null;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimits.get(ip) as RateLimitRecord | undefined;

  if (!record) {
    return { allowed: true };
  }

  // Check if blocked
  if (record.blocked_until && record.blocked_until > now) {
    return { allowed: false, retryAfter: Math.ceil((record.blocked_until - now) / 1000) };
  }

  // Check if window expired, reset if so
  if (now - record.first_attempt > RATE_LIMIT_WINDOW) {
    rateLimits.reset(ip);
    return { allowed: true };
  }

  // Check attempts in window
  if (record.attempts >= MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_DURATION;
    rateLimits.upsert(ip, record.attempts, record.first_attempt, blockedUntil, record.attempts, record.first_attempt, blockedUntil);
    return { allowed: false, retryAfter: Math.ceil(BLOCK_DURATION / 1000) };
  }

  return { allowed: true };
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const record = rateLimits.get(ip) as RateLimitRecord | undefined;

  if (!record || now - record.first_attempt > RATE_LIMIT_WINDOW) {
    rateLimits.upsert(ip, 1, now, null, 1, now, null);
  } else {
    rateLimits.upsert(ip, record.attempts + 1, record.first_attempt, null, record.attempts + 1, record.first_attempt, null);
  }
}

function resetAttempts(ip: string): void {
  rateLimits.reset(ip);
}

import { preferences } from '../services/db.js';

// Global state
let passwordHash: string = '';
let setupMode = false;
let passwordSource: 'env' | 'db' | 'none' = 'none';
let recoveryTokenHash: string | null = null;

// Generate a recovery token for password reset (only for DB-stored passwords)
function generateRecoveryToken(): void {
  const token = crypto.randomBytes(16).toString('hex');
  recoveryTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  console.log('');
  console.log('='.repeat(60));
  console.log('  PASSWORD RECOVERY TOKEN (save this somewhere safe):');
  console.log(`  ${token}`);
  console.log('  Use this token to reset your password if forgotten.');
  console.log('  A new token is generated on each server restart.');
  console.log('='.repeat(60));
  console.log('');
}

// Initialize auth state
export async function initializeAuth() {
  const envPassword = process.env.APP_PASSWORD;

  if (envPassword) {
    console.log('Auth: Using APP_PASSWORD from environment');
    passwordHash = await argon2.hash(envPassword);
    setupMode = false;
    passwordSource = 'env';
    return;
  }

  const dbPassword = preferences.get('admin_password');
  if (dbPassword) {
    console.log('Auth: Using stored admin password from database');
    passwordHash = dbPassword;
    setupMode = false;
    passwordSource = 'db';
    generateRecoveryToken();
    return;
  }

  console.log('Auth: No password configured - entering SETUP MODE');
  setupMode = true;
  passwordSource = 'none';
}

// Start initialization
initializeAuth().catch(err => {
  console.error('Failed to initialize auth:', err);
});

export function isSetupMode() {
  return setupMode;
}

export async function setAdminPassword(password: string) {
  passwordHash = await argon2.hash(password);
  preferences.set('admin_password', passwordHash);
  setupMode = false;
  console.log('Auth: Admin password set successfully');
}

export async function login(req: Request, res: Response): Promise<void> {
  // If in setup mode, reject login
  if (setupMode) {
    res.status(423).json({
      error: 'Setup required',
      code: 'SETUP_REQUIRED',
      message: 'Server has not been configured. Please complete setup first.'
    });
    return;
  }

  const ip = getClientIp(req);

  // Check rate limit
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: 'Too many login attempts',
      retryAfter: rateCheck.retryAfter
    });
    return;
  }

  const { password, rememberMe } = req.body;

  if (!password) {
    recordAttempt(ip);
    res.status(400).json({ error: 'Password required' });
    return;
  }

  try {
    const valid = await argon2.verify(passwordHash, password);

    if (!valid) {
      recordAttempt(ip);
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Success - reset rate limit and create session
    resetAttempts(ip);

    req.session.authenticated = true;
    req.session.loginTime = Date.now();

    // Set session duration based on rememberMe
    if (rememberMe) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}

export function logout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('sid');
    res.json({ success: true });
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

export function canResetPassword(): boolean {
  return passwordSource === 'db' && recoveryTokenHash !== null;
}

export function getAuthStatus(req: Request, res: Response): void {
  res.json({
    authenticated: !!req.session?.authenticated,
    loginTime: req.session?.loginTime || null,
    configured: !setupMode, // Client needs to know if setup is required
    canReset: canResetPassword(),
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  if (!canResetPassword()) {
    res.status(403).json({
      error: passwordSource === 'env'
        ? 'Password is set via APP_PASSWORD environment variable. Update the variable and restart the server.'
        : 'Password reset is not available.',
    });
    return;
  }

  const ip = getClientIp(req);

  // Rate limit (same as login)
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: 'Too many attempts. Please try again later.',
      retryAfter: rateCheck.retryAfter,
    });
    return;
  }

  const { recoveryToken, newPassword } = req.body;

  if (!recoveryToken || !newPassword) {
    recordAttempt(ip);
    res.status(400).json({ error: 'Recovery token and new password are required' });
    return;
  }

  // Verify recovery token using timing-safe comparison
  try {
    const inputHash = crypto.createHash('sha256').update(recoveryToken).digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(recoveryTokenHash!, 'hex')
    );

    if (!isValid) {
      recordAttempt(ip);
      res.status(401).json({ error: 'Invalid recovery token' });
      return;
    }
  } catch {
    recordAttempt(ip);
    res.status(401).json({ error: 'Invalid recovery token' });
    return;
  }

  // Validate password strength
  const check = validatePasswordStrength(newPassword);
  if (!check.valid) {
    res.status(400).json({ error: check.reason });
    return;
  }

  try {
    // Set new password
    await setAdminPassword(newPassword);

    // Clear all existing sessions
    clearAllSessions();

    // Generate a new recovery token (old one is now invalid)
    generateRecoveryToken();

    // Reset rate limits for this IP
    resetAttempts(ip);

    res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
    loginTime: number;
  }
}
