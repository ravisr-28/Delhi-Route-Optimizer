import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:5000/api";

export default function AdminLogin({ onBack }) {
  const { login, loginWithToken, isAuthenticated } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const authRef = useRef(isAuthenticated);

  // Update ref whenever isAuthenticated changes
  useEffect(() => {
    authRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      // Relaxed origin check for local dev and production
      const expectedOrigins = [
        "http://localhost:5000",
        "http://localhost:5173",
        "http://localhost:5174",
        import.meta.env.VITE_API_URL,
        window.location.origin,
      ].map(o => o?.replace(/\/$/, '')).filter(Boolean);
      
      const eventOrigin = event.origin.replace(/\/$/, '');
      if (!expectedOrigins.includes(eventOrigin) && event.origin !== '*') {
        console.log("Ignored message from origin:", event.origin);
        return;
      }

      if (!event.data || !event.data.type) return;

      if (event.data.type === "OAUTH_SUCCESS") {
        console.log("OAuth Success received!");
        loginWithToken(event.data.token);
        setSuccess(`Welcome back! Authenticating...`);
        setLoading(false);
        // Success state will be handled by authRef in the interval
      }

      if (event.data.type === "OAUTH_ERROR") {
        setError(event.data.error || "Authentication failed");
        setLoading(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [loginWithToken]);

  const handleSocialLogin = (provider) => {
    setError('');
    setSuccess('');
    setLoading(true);

    const providerPath = provider.toLowerCase();
    const width = 500, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/oauth/${providerPath}`,
      `${provider} Login`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      setError("Popup blocked. Please enable popups.");
      setLoading(false);
      return;
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Small delay to let postMessage finish processing
        setTimeout(() => {
          if (!authRef.current) {
            setLoading(false);
            setError("Login cancelled or failed");
          } else {
            // Already logged in via message
            setLoading(false);
            setSuccess("Login successful!");
            setTimeout(() => { window.location.href = "/"; }, 500);
          }
        }, 500);
      }
    }, 800);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await login(email, password);
      setLoading(false);
      if (!result.success) setError(result.error);
    } catch {
      setLoading(false);
      setError('Connection failed. Please try again.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
        setError(data.message || 'Registration failed');
        return;
      }

      setSuccess('Account created successfully!');
      setTimeout(async () => {
        const result = await login(email, password);
        if (!result.success) setError('Registration complete, but login failed.');
      }, 800);
    } catch {
      setLoading(false);
      setError('Server unavailable.');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 font-sans antialiased text-slate-200">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors group cursor-pointer"
          >
            <i className="fas fa-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
            Back to Home
          </button>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 mb-6">
              <i className="fas fa-shield-alt text-xl text-blue-500"></i>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isSignUp ? 'Start optimizing your transit today' : 'Access your dashboard and routes'}
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <i className="fas fa-exclamation-circle text-red-500 mt-0.5"></i>
              <span className="text-sm font-medium text-red-400">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <i className="fas fa-check-circle text-emerald-500 mt-0.5"></i>
              <span className="text-sm font-medium text-emerald-400">{success}</span>
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-0.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-0.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-0.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-0.5">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg
                         shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Alternate Login */}
          <div className="mt-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-slate-900 px-4 text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin('Google')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 border border-slate-700 
                           hover:bg-slate-700 hover:border-slate-600 transition-all font-medium text-sm group cursor-pointer"
              >
                <i className="fab fa-google text-slate-400 group-hover:text-white transition-colors"></i>
                Google
              </button>
              <button
                onClick={() => handleSocialLogin('GitHub')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 border border-slate-700 
                           hover:bg-slate-700 hover:border-slate-600 transition-all font-medium text-sm group cursor-pointer"
              >
                <i className="fab fa-github text-slate-400 group-hover:text-white transition-colors"></i>
                GitHub
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-400 font-medium">
            {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
            <button
              onClick={() => { resetForm(); setIsSignUp(!isSignUp); }}
              className="ml-2 text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
            >
              {isSignUp ? 'Log in' : 'Start free trial'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs font-semibold text-slate-600 tracking-wide uppercase">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-lock text-[10px]"></i>
            Secure
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <i className="fas fa-shield-check text-[10px]"></i>
            Encrypted
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-800"></div>
          <p>© 2026 Admin Portal</p>
        </div>
      </div>
    </div>
  );
}