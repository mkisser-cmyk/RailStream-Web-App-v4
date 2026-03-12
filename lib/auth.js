// Auth utilities - client side
const TOKEN_KEY = 'railstream_token';
const USER_KEY = 'railstream_user';
const REMEMBER_KEY = 'railstream_remember';

// Helper: get the correct storage based on "Remember Me" preference
function getStorage() {
  if (typeof window === 'undefined') return null;
  // Default to localStorage (persistent) if rememberMe was checked or not yet set
  const remember = localStorage.getItem(REMEMBER_KEY);
  // If explicitly set to 'false', use sessionStorage
  if (remember === 'false') return sessionStorage;
  return localStorage;
}

export const auth = {
  getToken() {
    if (typeof window === 'undefined') return null;
    // Check both storages (in case user toggled remember me)
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (typeof window === 'undefined') return;
    const storage = getStorage();
    // Clear from the OTHER storage to avoid duplicates
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    storage.setItem(TOKEN_KEY, token);
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
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  // Remove only the token (for device-kicked scenarios)
  removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  // "Remember Me" preference
  setRememberMe(value) {
    if (typeof window === 'undefined') return;
    // Always store this in localStorage so it persists across sessions
    localStorage.setItem(REMEMBER_KEY, value ? 'true' : 'false');
  },

  getRememberMe() {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(REMEMBER_KEY);
    // Default to true (keep me logged in)
    return val !== 'false';
  },

  // Tier comparison helper
  tierLevel(tier) {
    const levels = { fireman: 1, conductor: 2, engineer: 3 };
    return levels[tier?.toLowerCase()] || 0;
  },

  canAccess(userTier, requiredTier) {
    if (requiredTier?.toLowerCase() === 'fireman') return true;
    return this.tierLevel(userTier) >= this.tierLevel(requiredTier);
  },
};
