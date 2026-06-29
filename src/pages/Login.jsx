import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2, Wallet, Package, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('arjun@buildtrack.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Central Glassmorphic Card Container */}
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-premium border border-slate-100 min-h-[580px]">
        
        {/* Left Side Panel - Branding & Image Grid */}
        <div className="relative hidden w-1/2 bg-slate-900 md:flex flex-col justify-between p-10 overflow-hidden">
          {/* Background image overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop&q=80')" }}
          ></div>
          
          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-premium">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">BuildTrack</span>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Construction Management</p>
            </div>
          </div>

          {/* Benefits copy */}
          <div className="relative z-10 my-auto">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Build Better. <br />
              <span className="text-primary">Manage Smarter.</span>
            </h2>
            <p className="mt-3 text-xs text-slate-300 leading-relaxed max-w-sm">
              Complete control over your projects, budgets, materials and progress – all in one place.
            </p>

            {/* Benefit bullet list */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm max-w-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Track Every Rupee</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Budget planning, real-time expenses and cost control.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm max-w-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Manage Materials</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Real-time stock, usage tracking and smart alerts.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm max-w-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Deliver On Time</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Monitor progress, tasks and daily site activities.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer copyright */}
          <div className="relative z-10 text-[10px] text-slate-500 font-medium">
            &copy; 2026 BuildTrack Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side Panel - Authentication Form */}
        <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 md:w-1/2">
          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Welcome Back! 👋</h3>
            <p className="text-xs text-slate-400 mt-1">Sign in to continue to BuildTrack</p>
          </div>

          {/* Alert Notification */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-3 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="block w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="block w-full rounded-lg border border-slate-200 pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-500 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                />
                Remember me
              </label>
              <a href="#" className="font-bold text-primary hover:text-primary-hover">Forgot Password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Social login option */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-150"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-3 font-semibold text-slate-400">or continue with</span>
            </div>
          </div>

          <button
            onClick={handleLogin}
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-premium"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.76 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.65 2.83C6.01 7.21 8.78 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.46h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.65 2.83c2.14-1.97 3.36-4.87 3.36-8.49z" />
              <path fill="#FBBC05" d="M5.15 14.67c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.5 7.28C.54 9.22 0 11.36 0 13.62s.54 4.4 1.5 6.34l3.65-2.83c-.24-.72-.38-1.49-.38-2.28z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.65-2.83c-1.01.68-2.3 1.09-3.96 1.09-3.22 0-5.99-2.17-6.96-5.28L1.74 15.9c1.9 3.85 5.85 6.5 10.26 6.5z" />
            </svg>
            Sign in with Google
          </button>

          {/* Footer contact */}
          <p className="mt-8 text-center text-[10px] text-slate-400 font-medium">
            Don't have an account? <span className="font-bold text-primary cursor-pointer hover:underline">Contact Administrator</span>
          </p>
        </div>
      </div>
    </div>
  );
}
