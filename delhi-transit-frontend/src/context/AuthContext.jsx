import { createContext, useContext, useState, useEffect } from 'react';
import { authenticate, saveToken, removeToken, getCurrentUser } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const existing = getCurrentUser();
    if (existing) setUser(existing);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const result = await authenticate(username, password);
    if (result.success) {
      saveToken(result.token);
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
