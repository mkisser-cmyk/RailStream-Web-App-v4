// RailStream API Service Layer
const API_BASE = process.env.RAILSTREAM_API_URL || 'https://api.railstream.net';

// Client-side API calls (for browser)
export const clientApi = {
  // Auth
  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return res.json();
  },

  async getMe() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json();
  },

  // Cameras
  async getCatalog() {
    const res = await fetch('/api/cameras/catalog');
    return res.json();
  },

  async getCamera(id) {
    const res = await fetch(`/api/cameras/${id}`);
    return res.json();
  },

  // Playback
  async authorizePlayback(cameraId) {
    const res = await fetch('/api/playback/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camera_id: cameraId }),
    });
    return res.json();
  },
};

// Server-side API calls (for API routes)
export const serverApi = {
  async login(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  },

  async getCatalog() {
    const res = await fetch(`${API_BASE}/api/cameras/catalog`);
    return res.json();
  },

  async authorizePlayback(cameraId, token, deviceId) {
    const res = await fetch(`${API_BASE}/api/playback/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        camera_id: cameraId,
        device_id: deviceId || `web-${Date.now()}`,
        platform: 'web',
      }),
    });
    return res.json();
  },
};
