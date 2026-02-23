// Auth utilities - client side
const TOKEN_KEY = 'railstream_token';
const USER_KEY = 'railstream_user';

export const auth = {
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  getUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  // Tier comparison helper
  tierLevel(tier) {
    const levels = { fireman: 1, conductor: 2, engineer: 3 };
    return levels[tier?.toLowerCase()] || 0;
  },

  canAccess(userTier, requiredTier) {
    // If required tier is fireman (free), anyone can access
    if (requiredTier?.toLowerCase() === 'fireman') {
      return true;
    }
    // Otherwise, user needs appropriate tier
    return this.tierLevel(userTier) >= this.tierLevel(requiredTier);
  },
};
