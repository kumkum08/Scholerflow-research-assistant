import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft,
  Moon,
  Sun,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../contexts/DarkModeContext';
import { signupUser, loginUser } from '../services/apiService';

interface UserPageProps {
  onSignIn: (user: { name: string; email: string; id: string }) => void;
  onBack?: () => void;
}

export default function UserPage({ onSignIn, onBack }: UserPageProps) {
  const [page, setPage] = useState<'landing' | 'login' | 'signup'>('landing');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  const bgClass = isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-cyan-50';
  const cardClass = isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200';
  const inputClass = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-600'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const buttonClass =
    'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95';
  const secondaryButtonClass = isDark
    ? 'border-2 border-slate-700 hover:bg-slate-800 text-slate-100'
    : 'border-2 border-slate-200 hover:bg-slate-50 text-slate-900';

  const resetForm = (nextPage: 'landing' | 'login' | 'signup') => {
    setPage(nextPage);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('All fields are required');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const response = await signupUser(formData.email, formData.name, formData.password);

      if (!response.success) {
        throw new Error(response.error || 'Signup failed');
      }

      onSignIn({
        name: response.user.name,
        email: response.user.email,
        id: response.user.id,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }

      const response = await loginUser(formData.email, formData.password);

      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }

      onSignIn({
        name: response.user.name,
        email: response.user.email,
        id: response.user.id,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex min-h-[100svh] flex-col items-center justify-center overflow-x-hidden px-4 py-20 transition-colors sm:px-6 sm:py-10 ${bgClass}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/70'}`}
        />
        <div
          className={`absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 rounded-full blur-3xl ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-200/80'}`}
        />
      </div>

      <button
        onClick={toggleDarkMode}
        className={`absolute right-4 top-4 z-10 rounded-full p-3 transition-colors sm:right-6 sm:top-6 ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600 shadow-lg'}`}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {(page !== 'landing' || onBack) && (
        <button
          onClick={() => {
            if (page === 'landing' && onBack) {
              onBack();
            } else {
              resetForm('landing');
            }
          }}
          className={`absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg p-2 transition-colors sm:left-6 sm:top-6 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        >
          <ArrowLeft size={20} />
          <span className={`text-sm font-semibold ${textClass}`}>Back</span>
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center sm:mb-12">
          <div className="mb-4 rounded-2xl bg-indigo-600 p-4 shadow-lg shadow-indigo-200/60">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className={`text-center text-3xl font-black tracking-tight sm:text-4xl ${textClass}`}>
            ScholarFlow
          </h1>
          <p className={`mt-2 text-center text-xs font-semibold uppercase tracking-[0.35em] sm:text-sm ${mutedClass}`}>
            AI Research Assistant
          </p>
        </div>

        {page === 'landing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className={`${cardClass} rounded-[28px] border p-6 text-center shadow-xl backdrop-blur sm:p-8`}>
              <h2 className={`mb-3 text-2xl font-bold ${textClass}`}>Welcome to ScholarFlow</h2>
              <p className={`${mutedClass} mb-8 leading-relaxed`}>
                Your AI-powered research assistant for academic writing and analysis.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => resetForm('signup')}
                  className={`group flex w-full items-center justify-center gap-2 ${buttonClass}`}
                >
                  <span>Create New Account</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => resetForm('login')}
                  className={`w-full rounded-xl py-3 font-bold transition-all ${secondaryButtonClass}`}
                >
                  Sign In to Existing Account
                </button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`mt-6 grid grid-cols-1 gap-3 border-t pt-6 sm:mt-8 sm:grid-cols-3 sm:gap-4 sm:pt-8 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
            >
              <div className={`rounded-2xl px-4 py-3 text-center ${isDark ? 'bg-slate-900/60' : 'bg-white/70'}`}>
                <div className="mb-2 text-2xl font-bold text-indigo-600">Write</div>
                <p className={`text-xs font-semibold ${mutedClass}`}>Write Papers</p>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-center ${isDark ? 'bg-slate-900/60' : 'bg-white/70'}`}>
                <div className="mb-2 text-2xl font-bold text-indigo-600">Assist</div>
                <p className={`text-xs font-semibold ${mutedClass}`}>AI Assistant</p>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-center ${isDark ? 'bg-slate-900/60' : 'bg-white/70'}`}>
                <div className="mb-2 text-2xl font-bold text-indigo-600">Analyze</div>
                <p className={`text-xs font-semibold ${mutedClass}`}>Analysis</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {page === 'login' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`${cardClass} rounded-[28px] border p-6 shadow-xl backdrop-blur sm:p-8`}>
              <h2 className={`mb-6 text-2xl font-bold ${textClass}`}>Sign In</h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
                    isDark
                      ? 'bg-red-900/20 border-red-700/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${mutedClass}`}>Email Address</label>
                  <div className="relative">
                    <Mail size={18} className={`absolute left-3 top-3.5 ${mutedClass}`} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setError('');
                      }}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${mutedClass}`}>Password</label>
                  <div className="relative">
                    <Lock size={18} className={`absolute left-3 top-3.5 ${mutedClass}`} />
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setError('');
                      }}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full items-center justify-center gap-2 ${buttonClass}`}
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className={mutedClass}>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => resetForm('signup')}
                    className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {page === 'signup' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`${cardClass} rounded-[28px] border p-6 shadow-xl backdrop-blur sm:p-8`}>
              <h2 className={`mb-6 text-2xl font-bold ${textClass}`}>Create Account</h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
                    isDark
                      ? 'bg-red-900/20 border-red-700/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${mutedClass}`}>Full Name</label>
                  <div className="relative">
                    <UserIcon size={18} className={`absolute left-3 top-3.5 ${mutedClass}`} />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setError('');
                      }}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${mutedClass}`}>Email Address</label>
                  <div className="relative">
                    <Mail size={18} className={`absolute left-3 top-3.5 ${mutedClass}`} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setError('');
                      }}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${mutedClass}`}>Password</label>
                  <div className="relative">
                    <Lock size={18} className={`absolute left-3 top-3.5 ${mutedClass}`} />
                    <input
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setError('');
                      }}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
                      disabled={loading}
                    />
                  </div>
                  <p className={`mt-2 text-xs ${mutedClass}`}>Minimum 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full items-center justify-center gap-2 ${buttonClass}`}
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className={mutedClass}>
                  Already have an account?{' '}
                  <button
                    onClick={() => resetForm('login')}
                    className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
