// Auth utilities - client side
const TOKEN_KEY = 'railstream_token';
const REFRESH_KEY = 'railstream_refresh_token';
const USER_KEY = 'railstream_user';
const REMEMBER_KEY = 'railstream_remember';

// Helper: get the correct storage based on "Remember Me" preference
function getStorage() {
  if (typeof window === 'undefined') return null;
  const remember = localStorage.getItem(REMEMBER_KEY);
  if (remember === 'false') return sessionStorage;
  return localStorage;
}

export const auth = {
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (typeof window === 'undefined') return;
    const storage = getStorage();
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    storage.setItem(TOKEN_KEY, token);
  },

  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
  },

  setRefreshToken(token) {
    if (typeof window === 'undefined') return;
    const storage = getStorage();
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    if (token) storage.setItem(REFRESH_KEY, token);
  },

  getUser() {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setUser(user) {
    if (typeof window === 'undefined') return;
    const storage = getStorage();
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    storage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setRememberMe(value) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REMEMBER_KEY, value ? 'true' : 'false');
  },

  getRememberMe() {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(REMEMBER_KEY);
    return val !== 'false';
  },

  // Silent token refresh — returns true if successful
  // First tries server-side renewal (stored credentials), then falls back to refresh_token
  async refresh() {
    // Strategy 1: Server-side renewal (for "Keep me logged in" sessions)
    // The server has encrypted credentials and can re-authenticate for us
    try {
      const renewRes = await fetch('/api/auth/renew', { method: 'POST' });
      if (renewRes.ok) {
        const data = await renewRes.json();
        if (data.renewed && data.access_token) {
          this.setToken(data.access_token);
          if (data.user) this.setUser(data.user);
          console.log('[Auth] Session renewed via server-side credentials');
          return true;
        }
      }
    } catch (e) {
      console.log('[Auth] Server renewal error:', e.message);
    }

    // Strategy 2: Traditional refresh token (if available)
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          this.setToken(data.access_token);
          if (data.refresh_token) this.setRefreshToken(data.refresh_token);
          if (data.user) this.setUser(data.user);
          console.log('[Auth] Token refreshed via refresh_token');
          return true;
        }
      }
      console.log('[Auth] Refresh failed — status:', res.status);
      return false;
    } catch (e) {
      console.log('[Auth] Refresh error:', e.message);
      return false;
    }
  },

  // Parse JWT expiry (returns epoch seconds, or null if unable to parse)
  getTokenExpiry() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp || null; // epoch seconds
    } catch {
      return null;
    }
  },

  // Seconds remaining until token expires (negative = already expired)
  tokenSecondsRemaining() {
    const exp = this.getTokenExpiry();
    if (!exp) return 0;
    return exp - Math.floor(Date.now() / 1000);
  },

  // Is the current access token expired (or within a grace window)?
  isTokenExpired(graceSeconds = 30) {
    return this.tokenSecondsRemaining() < graceSeconds;
  },

  tierLevel(tier) {
    const levels = { fireman: 1, conductor: 2, engineer: 3 };
    return levels[tier?.toLowerCase()] || 0;
  },

  canAccess(userTier, requiredTier) {
    if (requiredTier?.toLowerCase() === 'fireman') return true;
    return this.tierLevel(userTier) >= this.tierLevel(requiredTier);
  },
};
