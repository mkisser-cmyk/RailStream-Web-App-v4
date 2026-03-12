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
  async refresh() {
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
          console.log('[Auth] Token refreshed silently');
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

  tierLevel(tier) {
    const levels = { fireman: 1, conductor: 2, engineer: 3 };
    return levels[tier?.toLowerCase()] || 0;
  },

  canAccess(userTier, requiredTier) {
    if (requiredTier?.toLowerCase() === 'fireman') return true;
    return this.tierLevel(userTier) >= this.tierLevel(requiredTier);
  },
};
