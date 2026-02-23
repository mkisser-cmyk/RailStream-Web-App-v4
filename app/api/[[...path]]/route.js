import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.RAILSTREAM_API_URL || 'https://api.railstream.net';

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

    // Playback: Authorize
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
