import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.RAILSTREAM_API_URL || 'https://api.railstream.net';
const ADMIN_USER = process.env.RAILSTREAM_ADMIN_USER;
const ADMIN_PASS = process.env.RAILSTREAM_ADMIN_PASS;

// Cache for admin token (simple in-memory cache)
let adminTokenCache = { token: null, expiresAt: 0 };

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }));
}

// Get token from cookies or authorization header
function getToken(request) {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Check cookies
  const cookieStore = cookies();
  return cookieStore.get('railstream_token')?.value;
}

// Get admin token (with caching)
async function getAdminToken() {
  const now = Date.now();
  
  // Return cached token if still valid (with 5 min buffer)
  if (adminTokenCache.token && adminTokenCache.expiresAt > now + 300000) {
    return adminTokenCache.token;
  }
  
  // Login to get new token
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  
  if (!res.ok) {
    throw new Error('Admin login failed');
  }
  
  const data = await res.json();
  adminTokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in * 1000),
  };
  
  return data.access_token;
}

// Get camera streams from admin API
async function getCameraStreams(cameraId, adminToken) {
  // First get camera list to find by short_code or _id
  const res = await fetch(`${API_BASE}/api/admin/cameras?limit=200`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  
  if (!res.ok) {
    return null;
  }
  
  const data = await res.json();
  const cameras = data.cameras || [];
  
  // Find camera by short_code or _id
  const camera = cameras.find(c => 
    c.short_code === cameraId || c._id === cameraId
  );
  
  return camera;
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'RailStream API Proxy', version: '1.0.0' }));
    }

    // Auth: Login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json();
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.access_token) {
        const response = NextResponse.json(data);
        response.cookies.set('railstream_token', data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: data.expires_in || 3600,
        });
        return handleCORS(response);
      }
      return handleCORS(NextResponse.json(data, { status: res.status }));
    }

    // Auth: Logout
    if (route === '/auth/logout' && method === 'POST') {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete('railstream_token');
      return handleCORS(response);
    }

    // Auth: Get current user
    if (route === '/auth/me' && method === 'GET') {
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Not authenticated' }, { status: 401 }));
      }
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        return handleCORS(NextResponse.json({ error: 'Session expired' }, { status: 401 }));
      }
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // Cameras: Get catalog
    if (route === '/cameras/catalog' && method === 'GET') {
      const res = await fetch(`${API_BASE}/api/cameras/catalog`);
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // Cameras: Get single camera (by _id from catalog)
    if (route.startsWith('/cameras/') && method === 'GET') {
      const cameraId = path[1];
      // Fetch catalog and find the camera
      const res = await fetch(`${API_BASE}/api/cameras/catalog`);
      const catalog = await res.json();
      const camera = catalog.find(c => c._id === cameraId);
      if (!camera) {
        return handleCORS(NextResponse.json({ error: 'Camera not found' }, { status: 404 }));
      }
      return handleCORS(NextResponse.json(camera));
    }

    // Playback: Authorize (legacy mobile endpoint)
    if (route === '/playback/authorize' && method === 'POST') {
      const body = await request.json();
      const token = getToken(request);
      
      const res = await fetch(`${API_BASE}/api/playback/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          camera_id: body.camera_id,
          device_id: body.device_id || `web-${Date.now()}`,
          platform: 'web',
        }),
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data, { status: res.status }));
    }

    // Playback: Web Authorize - Returns web_hls URL + wms_auth for Video.js player
    if (route === '/playback/web-authorize' && method === 'POST') {
      const body = await request.json();
      const cameraId = body.camera_id;
      
      try {
        // Get admin token
        const adminToken = await getAdminToken();
        
        // Get camera with streams from admin API
        const camera = await getCameraStreams(cameraId, adminToken);
        if (!camera) {
          return handleCORS(NextResponse.json({ error: 'Camera not found' }, { status: 404 }));
        }
        
        // Get wms_auth token from web-authorize endpoint
        const authRes = await fetch(`${API_BASE}/api/playback/web-authorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camera_id: camera.short_code || cameraId }),
        });
        
        const authData = await authRes.json();
        if (!authData.ok) {
          return handleCORS(NextResponse.json({ error: 'Failed to authorize playback' }, { status: 500 }));
        }
        
        // Build response with correct web_hls from streams
        const webHls = camera.streams?.web_hls || camera.streams?.website_hls;
        const thumbBase = camera.streams?.thumb_base || `/thumbs/${camera.short_code || cameraId}/`;
        
        return handleCORS(NextResponse.json({
          ok: true,
          cam_id: camera.short_code || cameraId,
          camera_name: camera.name,
          location: camera.location,
          edge_base: webHls,
          thumb_base: thumbBase,
          wms_auth: authData.wms_auth,
          token_expires_in: authData.token_expires_in || 540,
          dvr_days: authData.dvr_days || 7,
          status: camera.status,
        }));
        
      } catch (error) {
        console.error('Web authorize error:', error);
        return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
      }
    }

    // Playback: Generate signed embed URL (like Joomla does)
    if (route === '/playback/embed-url' && method === 'POST') {
      const body = await request.json();
      const { camera_id, peers = [], timezone = 'America/New_York' } = body;
      
      try {
        const EMBED_SECRET = process.env.PLAYER_EMBED_SECRET;
        if (!EMBED_SECRET) {
          return handleCORS(NextResponse.json({ error: 'Embed secret not configured' }, { status: 500 }));
        }
        
        // Get camera info
        const adminToken = await getAdminToken();
        const camera = await getCameraStreams(camera_id, adminToken);
        if (!camera) {
          return handleCORS(NextResponse.json({ error: 'Camera not found' }, { status: 404 }));
        }
        
        // Build payload like Joomla does
        const now = Math.floor(Date.now() / 1000);
        const camId = camera.short_code || camera_id;
        const peerList = peers.length > 0 ? peers : [camId];
        const labels = peerList.map(p => {
          // Try to get label from camera name
          return camera.name || p;
        }).join('|');
        
        // Generate random nonce
        const nonce = Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        
        const payload = {
          cam: camId,
          peers: peerList,
          labels: labels,
          dev: 0,
          tz: timezone,
          iat: now,
          exp: now + 300, // 5 minutes
          nonce: nonce,
        };
        
        // Base64url encode
        const json = JSON.stringify(payload);
        const p = Buffer.from(json).toString('base64')
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        // HMAC-SHA256 signature
        const crypto_mod = await import('crypto');
        const s = crypto_mod.createHmac('sha256', EMBED_SECRET).update(p).digest('hex');
        
        // Build embed URL
        const embedUrl = `https://railstream.tv/embed/v3.1.0/?p=${encodeURIComponent(p)}&s=${s}`;
        
        return handleCORS(NextResponse.json({
          ok: true,
          embed_url: embedUrl,
          cam_id: camId,
          camera_name: camera.name,
          location: camera.location,
          expires_in: 300,
        }));
        
      } catch (error) {
        console.error('Embed URL error:', error);
        return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
      }
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }));

  } catch (error) {
    console.error('API Error:', error);
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// Export all HTTP methods
export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;
