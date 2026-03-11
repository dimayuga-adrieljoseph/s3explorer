import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import * as api from '../api';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset password state
  const [showReset, setShowReset] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(password, rememberMe);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(recoveryToken.trim(), newPassword);
      setResetSuccess(true);
      setRecoveryToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowReset(false);
    setResetSuccess(false);
    setError(null);
    setRecoveryToken('');
    setNewPassword('');
    setConfirmPassword('');
    setPassword('');
  };

  const requirements = [
    { label: 'At least 12 characters', valid: newPassword.length >= 12 },
    { label: 'Lowercase letter', valid: /[a-z]/.test(newPassword) },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { label: 'Number', valid: /[0-9]/.test(newPassword) },
    { label: 'Special character', valid: /[^a-zA-Z0-9]/.test(newPassword) },
  ];

  const allRequirementsMet = requirements.every(r => r.valid);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <img
              src="/logo.svg"
              alt="S3 Explorer"
              className="w-14 h-14 sm:w-16 sm:h-16 logo-themed"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            {showReset ? 'Reset Password' : 'Welcome back'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1.5 sm:mt-2">
            {showReset
              ? resetSuccess
                ? 'Your password has been reset'
                : 'Enter your recovery token from server logs'
              : 'Enter your password to continue'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-background-secondary border border-border rounded-xl p-4 sm:p-6">
          {showReset ? (
            resetSuccess ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm flex items-center gap-2" role="status">
                  <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Password reset successfully. Please log in with your new password.
                </div>
                <button
                  onClick={handleBackToLogin}
                  className="w-full py-3 px-4 rounded-lg bg-accent-purple text-white hover:brightness-110 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="recovery-token" className="text-sm text-foreground-secondary">Recovery Token</label>
                  <input
                    id="recovery-token"
                    type="text"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    className="input font-mono h-11 sm:h-10 text-base sm:text-sm"
                    placeholder="Paste token from server logs"
                    required
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <p className="text-xs text-foreground-muted">
                    Found in your server console output on startup.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-sm text-foreground-secondary">New Password</label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input pr-12 font-mono h-11 sm:h-10 text-base sm:text-sm"
                      placeholder="New password"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground-muted hover:text-foreground transition-colors w-11"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" /> : <Eye className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-new-password" className="text-sm text-foreground-secondary">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pr-12 font-mono h-11 sm:h-10 text-base sm:text-sm"
                      placeholder="Confirm new password"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground-muted hover:text-foreground transition-colors w-11"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" /> : <Eye className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                {newPassword && (
                  <div className="space-y-1.5 py-1">
                    {requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          req.valid ? 'bg-accent-green/20 text-accent-green' : 'bg-background-tertiary text-foreground-muted'
                        }`}>
                          {req.valid && <Check className="w-2 h-2" />}
                        </div>
                        <span className={req.valid ? 'text-foreground' : 'text-foreground-secondary'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div id="reset-error" className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm flex items-center gap-2" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !recoveryToken.trim() || !allRequirementsMet || newPassword !== confirmPassword}
                  className="w-full py-3 px-4 rounded-lg bg-accent-purple text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full text-sm text-foreground-muted hover:text-foreground transition-colors py-1"
                >
                  Back to login
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm text-foreground-secondary">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12 font-mono h-11 sm:h-10 text-base sm:text-sm"
                    placeholder="Enter password"
                    required
                    autoFocus
                    autoComplete="current-password"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground-muted hover:text-foreground transition-colors w-11"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" /> : <Eye className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group py-1">
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${rememberMe
                      ? 'bg-accent-purple border-accent-purple'
                      : 'border-border bg-transparent group-hover:border-border-hover'
                    }`}
                  aria-hidden="true"
                >
                  {rememberMe && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </span>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                  aria-label="Remember me for 7 days"
                />
                <span className="text-sm text-foreground-secondary group-hover:text-foreground transition-colors">Remember me</span>
              </label>

              {error && (
                <div id="login-error" className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 px-4 rounded-lg bg-accent-purple text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setShowReset(true); setError(null); }}
                className="w-full text-sm text-foreground-muted hover:text-foreground transition-colors py-1"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>

      </div>

      {/* GitHub link */}
      <a
        href="https://github.com/subratomandal"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity duration-200"
        aria-label="Visit GitHub (opens in new tab)"
      >
        <svg className="w-4 h-4" viewBox="0 0 98 96" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
        </svg>
      </a>
    </div>
  );
}
