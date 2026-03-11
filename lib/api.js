// RailStream API Service Layer
const API_BASE = process.env.RAILSTREAM_API_URL || 'https://api.railstream.net';

// Detect browser and OS for device registration
function detectDevice() {
  if (typeof window === 'undefined') return { platform: 'web', device_name: 'Web Browser', device_model: 'Browser', os_version: 'Unknown', app_version: 'Web 1.0' };
  const ua = navigator.userAgent;
  let browser = 'Web Browser';
  let os = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  return {
    platform: 'web',
    device_name: `${browser} on ${os}`,
    device_model: browser,
    os_version: os,
    app_version: 'Web 1.0',
  };
}

// Client-side API calls (for browser)
export const clientApi = {
  // Auth
  async login(username, password) {
    let deviceId = 'web-unknown';
    try {
      let id = localStorage.getItem('railstream_device_id');
      if (!id) {
        id = 'web-' + crypto.randomUUID();
        localStorage.setItem('railstream_device_id', id);
      }
      deviceId = id;
    } catch (e) {}
    const deviceInfo = detectDevice();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        device_id: deviceId,
        ...deviceInfo,
      }),
    });
    const data = await res.json();

    // Register this device with the API after successful login
    if (data.access_token) {
      try {
        fetch('/api/devices/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.access_token}`,
          },
          body: JSON.stringify({
            device_id: deviceId,
            ...deviceInfo,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    return data;
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
