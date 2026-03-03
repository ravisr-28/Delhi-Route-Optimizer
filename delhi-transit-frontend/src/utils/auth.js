// Authentication utility — uses backend API for real JWT auth
// No credentials are stored in the frontend (#3, #4)

const API_BASE = 'http://localhost:5000/api';

// Base64 decode helper (for reading JWT payload only — NOT for signing)
function b64Decode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return decodeURIComponent(escape(atob(str)));
}

// Decode a JWT token payload (does NOT verify signature — backend handles that)
export function decodeToken(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decoded = JSON.parse(b64Decode(parts[1]));

        // Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) return null;

        return decoded;
    } catch {
        return null;
    }
}

// Authenticate user via backend API
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
                username: data.data.user.email,
                name: data.data.user.name,
                role: data.data.user.role,
            },
        };
    } catch (err) {
        return { success: false, error: 'Server unavailable. Please try again later.' };
    }
}

// Token storage helpers
const TOKEN_KEY = 'delhi_transit_admin_token';

export function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// Get current authenticated user from stored token
export function getCurrentUser() {
    const token = getStoredToken();
    if (!token) return null;
    const decoded = decodeToken(token);
    if (!decoded) {
        removeToken(); // Clean up expired/invalid token
        return null;
    }
    // Return a consistent user object shape
    return {
        username: decoded.email,
        name: decoded.name || decoded.email,
        role: decoded.role || 'user',
    };
}
