import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, Mail, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const STEPS = [
  { number: 1, label: 'Enter your email and password', active: true },
  { number: 2, label: 'Access your project dashboard', active: false },
];

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('arjun@buildtrack.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await api.submitCredentialRequest(requestForm);
      setSuccess(result.message || 'Request submitted successfully.');
      setRequestForm({ name: '', email: '', company: '', phone: '', message: '' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-10 lg:flex xl:p-14"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-canvas">
            Platform Login
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-md">
          <h1 className="text-display-lg font-normal leading-tight text-canvas">
            Manage your projects.
            <br />
            Build with clarity.
          </h1>
          <p className="mt-6 text-sm text-muted-soft">Sign in or request credentials from your admin</p>

          <ol className="mt-8 space-y-5">
            {STEPS.map((step) => (
              <li key={step.number} className="flex items-center gap-4">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step.active
                      ? 'bg-canvas text-ink'
                      : 'border border-white/25 bg-white/10 text-canvas/70'
                  }`}
                >
                  {step.number}
                </span>
                <span className={`text-sm ${step.active ? 'text-canvas' : 'text-muted-soft'}`}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-xl border border-white/15 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-canvas">
              <Mail className="h-4 w-4" />
              <p className="text-sm font-medium">Need an account?</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-soft">
              Real estate teams can request BuildTrack credentials. Our admin will review your request and send login details to your email.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-canvas/80">BuildTrack</span>
        </div>
      </div>

      {/* Sign-in / Request form */}
      <div className="flex w-full flex-col justify-between bg-surface-card px-6 py-10 sm:px-12 lg:w-1/2 lg:px-16 xl:px-20">
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-normal text-ink tracking-tight">BuildTrack</span>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          {/* Mode toggle */}
          <div className="mb-8 flex rounded-lg border border-hairline bg-canvas-soft p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'signin' ? 'bg-surface-card text-ink shadow-sm' : 'text-muted hover:text-body'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('request'); setError(''); setSuccess(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'request' ? 'bg-surface-card text-ink shadow-sm' : 'text-muted hover:text-body'
              }`}
            >
              Contact Admin
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-display-sm font-normal tracking-tight text-ink">
              {mode === 'signin' ? 'Your workspace starts here' : 'Request your credentials'}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {mode === 'signin'
                ? 'Use your email and password to access your projects'
                : 'Submit your details and our admin team will set up your account'}
            </p>
            {mode === 'signin' && (
              <p className="mt-1 text-xs text-muted-soft">
                Demo: <span className="font-medium text-body">arjun@buildtrack.com</span> / password123
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-hairline bg-canvas-soft p-3 text-sm text-error">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-md border border-hairline bg-timeline-grep/20 p-3 text-sm text-success flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
                  Email
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or username"
                  required
                  autoComplete="username"
                  className="text-input text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="text-input pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-soft transition-colors hover:text-body"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 h-12 w-full text-sm font-semibold uppercase tracking-wide"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text-center text-xs text-muted-soft">
                Don&apos;t have credentials?{' '}
                <button type="button" onClick={() => setMode('request')} className="font-semibold text-primary hover:text-primary-hover">
                  Contact admin
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label htmlFor="req-name" className="mb-1.5 block text-sm font-semibold text-ink">
                  Full Name
                </label>
                <input
                  id="req-name"
                  type="text"
                  value={requestForm.name}
                  onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  className="text-input text-sm"
                />
              </div>

              <div>
                <label htmlFor="req-email" className="mb-1.5 block text-sm font-semibold text-ink">
                  Work Email
                </label>
                <input
                  id="req-email"
                  type="email"
                  value={requestForm.email}
                  onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                  placeholder="you@company.com"
                  required
                  className="text-input text-sm"
                />
              </div>

              <div>
                <label htmlFor="req-company" className="mb-1.5 block text-sm font-semibold text-ink">
                  Company / Real Estate Firm
                </label>
                <input
                  id="req-company"
                  type="text"
                  value={requestForm.company}
                  onChange={(e) => setRequestForm({ ...requestForm, company: e.target.value })}
                  placeholder="e.g. Green Valley Developers"
                  className="text-input text-sm"
                />
              </div>

              <div>
                <label htmlFor="req-phone" className="mb-1.5 block text-sm font-semibold text-ink">
                  Phone (optional)
                </label>
                <input
                  id="req-phone"
                  type="tel"
                  value={requestForm.phone}
                  onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="text-input text-sm"
                />
              </div>

              <div>
                <label htmlFor="req-message" className="mb-1.5 block text-sm font-semibold text-ink">
                  Message
                </label>
                <textarea
                  id="req-message"
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  placeholder="Tell us about your projects and what access you need..."
                  rows={3}
                  className="text-input min-h-[88px] resize-y py-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 h-12 w-full gap-2 text-sm font-semibold uppercase tracking-wide"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>

              <p className="text-center text-xs text-muted-soft">
                Already have credentials?{' '}
                <button type="button" onClick={() => setMode('signin')} className="font-semibold text-primary hover:text-primary-hover">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="mx-auto w-full max-w-md text-center text-xs text-muted-soft">
          &copy; 2026 BuildTrack
        </p>
      </div>
    </div>
  );
}
