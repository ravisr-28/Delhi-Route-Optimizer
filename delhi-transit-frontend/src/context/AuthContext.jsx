import { createContext, useContext, useState, useEffect } from 'react';
import {
  authenticate,
  saveToken,
  removeToken,
  getCurrentUser
} from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto login from stored JWT & sync across tabs
  useEffect(() => {
    const syncAuth = () => {
      const existing = getCurrentUser();
      setUser(existing);
      setLoading(false);
    };

    // Initial check
    syncAuth();

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'delhi_transit_admin_token') {
        console.log("Auth token changed in another tab, syncing...");
        syncAuth();
      }
    });

    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // Normal login
  const login = async (username, password) => {
    const result = await authenticate(username, password);

    if (result.success) {
      saveToken(result.token);
      setUser(result.user);
      return { success: true };
    }

    return { success: false, error: result.error };
  };

  // ⭐ OAuth login using token - IMPROVED VERSION
  const loginWithToken = (token) => {
    try {
      // Save token to localStorage
      saveToken(token);

      // Decode JWT token to get user info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      const userData = {
        id: payload.userId,
        email: payload.email,
        username: payload.email,
        name: payload.name,
        role: payload.role
      };

      // Set user in state
      setUser(userData);

      console.log('OAuth login successful for:', userData.email);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Invalid OAuth token:', error);
      removeToken(); // Clean up invalid token
      return { success: false, error: 'Invalid token' };
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithToken,
        logout,
        loading,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}