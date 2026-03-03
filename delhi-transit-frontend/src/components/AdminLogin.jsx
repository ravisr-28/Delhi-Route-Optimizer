import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

export default function AdminLogin({ onBack }) {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await login(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    } catch {
      setLoading(false);
      setError('Something went wrong. Please try again.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.message || data.errors?.[0]?.msg || 'Registration failed.');
        return;
      }

      setSuccess('Account created! Signing you in...');
      // Auto-login after registration
      setTimeout(async () => {
        const result = await login(email, password);
        if (!result.success) {
          setSuccess('');
          setError('Account created but login failed. Try signing in manually.');
        }
      }, 800);
    } catch {
      setLoading(false);
      setError('Server unavailable. Please try again later.');
    }
  };

  const handleSocialLogin = (provider) => {
    setError('');
    setSuccess('');
    setLoading(true);

    const providerPath = provider.toLowerCase();
    const width = 500, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `http://localhost:5000/api/oauth/${providerPath}`,
      `${provider} Login`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    // Listen for the OAuth callback message from the popup
    const handleMessage = async (event) => {
      if (event.origin !== 'http://localhost:5000') return;

      window.removeEventListener('message', handleMessage);
      setLoading(false);

      if (event.data?.type === 'OAUTH_SUCCESS' && event.data.token) {
        // Save token and user directly
        const { saveToken } = await import('../utils/auth.js');
        saveToken(event.data.token);
        // Trigger re-auth by calling login context — but we already have the token
        // So we set user directly via page reload
        setSuccess(`Welcome, ${event.data.user?.name || 'User'}! Logging you in...`);
        setTimeout(() => window.location.reload(), 600);
      } else if (event.data?.type === 'OAUTH_ERROR') {
        setError(event.data.error || `${provider} login failed.`);
      }
    };

    window.addEventListener('message', handleMessage);

    // Detect if popup was closed without completing
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[200px]"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to App
          </button>
        )}

        {/* Login Card */}
        <div className="bg-[#0f1728]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-violet-500/30">
              🚇
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              {isSignUp ? 'Sign up for Delhi Route Optimizer' : 'Sign in to Delhi Route Optimizer'}
            </p>
          </div>

          {/* Error / Success messages */}
          {error && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${
              error.includes('coming soon')
                ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              <span className="mt-0.5">{error.includes('coming soon') ? 'ℹ' : '!'}</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400">
              <span>✅</span> {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {/* Name — only for sign up */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">●</span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500
                               focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">●</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus={!isSignUp}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">●</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'Min. 6 characters' : 'Enter your password'}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm Password — only for sign up */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">●</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500
                               focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || (isSignUp && (!name || !confirmPassword))}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: loading ? '#4b5563' : 'linear-gradient(135deg, #7c3aed, #db2777)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(124, 58, 237, 0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {isSignUp ? 'Creating Account...' : 'Signing in...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-gray-500">or continue with</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('Google')}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-white/10
                         hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group disabled:opacity-50"
              style={{ backgroundColor: '#1e293b' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors">Google</span>
            </button>

            {/* Microsoft */}
            <button
              onClick={() => handleSocialLogin('Microsoft')}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-white/10
                         hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group disabled:opacity-50"
              style={{ backgroundColor: '#1e293b' }}
            >
              <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors">Microsoft</span>
            </button>

            {/* GitHub */}
            <button
              onClick={() => handleSocialLogin('GitHub')}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-white/10
                         hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group disabled:opacity-50"
              style={{ backgroundColor: '#1e293b' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300 group-hover:text-white transition-colors">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors">GitHub</span>
            </button>
          </div>

          {/* Toggle Sign In / Sign Up */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => { resetForm(); setIsSignUp(!isSignUp); }}
                className="ml-2 text-violet-400 hover:text-violet-300 font-semibold transition-colors cursor-pointer"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Security badge */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">JWT Protected</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Encrypted</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-green-500">●</span>
              <span className="text-[10px] text-gray-500">Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
