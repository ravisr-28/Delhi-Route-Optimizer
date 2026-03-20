// Authentication utility — uses backend API for real JWT auth

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:3000/api";

const TOKEN_KEY = 'delhi_transit_admin_token';

// Base64 decode helper
function b64Decode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

// Decode JWT payload
export function decodeToken(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(b64Decode(parts[1]));

    // check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) return null;

    return decoded;
  } catch {
    return null;
  }
}

// Authenticate with backend
export async function authenticate(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.message || 'Invalid credentials' };
    }

    return {
      success: true,
      token: data.data.token,
      user: {
        id: data.data.user._id,
        email: data.data.user.email,
        username: data.data.user.email,
        name: data.data.user.name,
        role: data.data.user.role,
      },
    };
  } catch {
    return { success: false, error: 'Server unavailable. Please try again later.' };
  }
}

// Save token
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Get stored token
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Remove token
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Get current logged in user
export function getCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  const decoded = decodeToken(token);

  if (!decoded) {
    removeToken();
    return null;
  }

  return {
    id: decoded.userId,
    email: decoded.email,
    username: decoded.email,
    name: decoded.name || decoded.email,
    role: decoded.role || 'user',
  };
}