import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const API_BASE = process.env.RAILSTREAM_API_URL || 'https://api.railstream.net';
const ADMIN_USER = process.env.RAILSTREAM_ADMIN_USER;
const ADMIN_PASS = process.env.RAILSTREAM_ADMIN_PASS;
const API_KEY = process.env.RAILSTREAM_API_KEY || '';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';

// Studio API config
const STUDIO_API_URL = process.env.STUDIO_API_URL || 'https://studio.railstream.net';
const STUDIO_USERNAME = process.env.STUDIO_USERNAME;
const STUDIO_PASSWORD = process.env.STUDIO_PASSWORD;

// Session encryption key (AES-256-GCM)
const SESSION_KEY = process.env.SESSION_ENCRYPTION_KEY || '';

// ── Credential encryption helpers (AES-256-GCM) ──
function encryptCredential(plaintext) {
  if (!SESSION_KEY) throw new Error('SESSION_ENCRYPTION_KEY not set');
  const key = Buffer.from(SESSION_KEY, 'hex');
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptCredential(encryptedStr) {
  if (!SESSION_KEY) throw new Error('SESSION_ENCRYPTION_KEY not set');
  const key = Buffer.from(SESSION_KEY, 'hex');
  const [ivHex, authTagHex, ciphertext] = encryptedStr.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Cache for admin token (simple in-memory cache)
let adminTokenCache = { token: null, expiresAt: 0 };

// Cache for studio auth token
let studioTokenCache = { token: null, expiresAt: 0 };

// Cache for studio sites data (refresh every 5 seconds)
let studioSitesCache = { data: null, thumbnails: {}, fetchedAt: 0 };

// LRU cache for thumbnail scrub images (max 500 entries)
const thumbCache = new Map();
const THUMB_CACHE_MAX = 500;

// MongoDB connection pool (reuse across requests)
let mongoClient = null;
async function getMongoDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
  }
  return mongoClient.db();
}

// Railroad options for validation
const RAILROADS = ['CSX', 'NS', 'UP', 'BNSF', 'CN', 'CP', 'KCS', 'Amtrak', 'NKP', 'SOO', 'IC', 'WC', 'Other'];
const TRAIN_TYPES = ['Intermodal', 'Manifest', 'Coal', 'Grain', 'Auto', 'Passenger', 'Local', 'Work Train', 'Light Power', 'Other'];
const DIRECTIONS = ['Eastbound', 'Westbound', 'Northbound', 'Southbound'];

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

// Extract real client IP from proxy headers (NGINX Proxy Manager → Next.js)
function getClientIP(request) {
  // X-Real-IP is set by your NGINX proxy to the actual client address
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  // Fallback: first IP in the X-Forwarded-For chain
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return null;
}

// Build headers for upstream API calls, including client IP forwarding
function upstreamHeaders(request, { token, contentType } = {}) {
  const headers = { 'X-API-Key': API_KEY };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (contentType) headers['Content-Type'] = contentType;
  // Forward real client IP to the upstream RailStream API
  const clientIP = getClientIP(request);
  if (clientIP) {
    headers['X-Real-IP'] = clientIP;
    headers['X-Forwarded-For'] = request.headers.get('x-forwarded-for') || clientIP;
  }
  return headers;
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
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
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

// Get studio auth token (with caching)
async function getStudioToken() {
  const now = Date.now();
  if (studioTokenCache.token && studioTokenCache.expiresAt > now + 300000) {
    return studioTokenCache.token;
  }
  const res = await fetch(`${STUDIO_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: STUDIO_USERNAME, password: STUDIO_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error('Studio login failed');
  }
  const data = await res.json();
  studioTokenCache = {
    token: data.access_token,
    expiresAt: now + 3600000, // 1 hour
  };
  return data.access_token;
}

// Fetch studio sites with caching (10-second TTL for fresh thumbnails)
// Pre-decodes thumbnail base64 into Buffers for zero-cost serving
let thumbnailBufferCache = {}; // siteId -> Buffer (pre-decoded)
let thumbnailDataUriCache = null; // { data: { siteId: "data:image/jpeg;base64,..." }, timestamp }
let thumbnailDataUriCacheTime = 0;

async function fetchStudioSites() {
  const now = Date.now();
  if (studioSitesCache.data && (now - studioSitesCache.fetchedAt) < 10000) {
    return studioSitesCache;
  }
  const token = await getStudioToken();
  const res = await fetch(`${STUDIO_API_URL}/api/sites`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch studio sites');
  }
  const sites = await res.json();
  
  // Separate thumbnails from site data and sanitize
  const thumbnails = {};
  const newBufferCache = {};
  const sanitizedSites = sites.map(site => {
    // Store thumbnail separately
    if (site.health?.preview_image) {
      thumbnails[site.id] = site.health.preview_image;
      // Pre-decode base64 to Buffer for fast serving
      try {
        newBufferCache[site.id] = Buffer.from(site.health.preview_image, 'base64');
      } catch (e) { /* skip bad data */ }
    }
    // Return sanitized site data (no passwords, IPs, API keys)
    return {
      id: site.id,
      name: site.name,
      location: site.location,
      description: site.description || '',
      health: {
        status: site.health?.status || 'unknown',
        stream_status: site.health?.stream_status || 'unknown',
        last_heartbeat: site.health?.last_heartbeat || null,
        uptime_seconds: site.health?.uptime_seconds || 0,
        video_bitrate: site.health?.video_bitrate || 0,
        source_bitrate: site.health?.source_bitrate || 0,
        audio_bitrate: site.health?.audio_bitrate || 0,
        fps: site.health?.fps || 0,
        dropped_frames: site.health?.dropped_frames || 0,
        cpu_usage: site.health?.cpu_usage || 0,
        gpu_usage: site.health?.gpu_usage || 0,
        gpu_temp: site.health?.gpu_temp || 0,
        error_message: site.health?.error_message || '',
        has_preview: !!site.health?.preview_image,
      },
      encoder: {
        codec: site.encoder?.codec || 'unknown',
        hardware: site.encoder?.hardware || 'unknown',
      },
      output: {
        resolution: site.output?.resolution || 'unknown',
        fps: site.output?.fps || 0,
      },
    };
  });

  thumbnailBufferCache = newBufferCache;
  // Invalidate data URI cache so it rebuilds with fresh data
  thumbnailDataUriCache = null;
  thumbnailDataUriCacheTime = 0;
  
  studioSitesCache = { data: sanitizedSites, thumbnails, fetchedAt: now };
  return studioSitesCache;
}

// Build mapping from studio sites to catalog cameras
function buildStudioToCatalogMapping(studioSites, catalogCameras) {
  const mapping = {}; // catalogCameraId -> studioSiteId
  
  // State abbreviation to full name mapping
  const stateMap = {
    'NJ': 'New Jersey', 'TX': 'Texas', 'IL': 'Illinois', 'OH': 'Ohio',
    'GA': 'Georgia', 'PA': 'Pennsylvania', 'VA': 'Virginia', 'NC': 'North Carolina',
    'WV': 'West Virginia', 'FL': 'Florida', 'CA': 'California', 'KY': 'Kentucky',
    'MI': 'Michigan', 'NE': 'Nebraska', 'MN': 'Minnesota', 'IN': 'Indiana',
  };
  
  for (const site of studioSites) {
    const siteName = (site.name || '').toLowerCase();
    const siteLoc = (site.location || '').toLowerCase();
    
    // Extract city from studio name (before comma)
    const cityMatch = siteName.match(/^([^,|]+)/);
    const city = cityMatch ? cityMatch[1].trim() : '';
    
    // Extract direction/type keywords
    const hasEast = /east/i.test(siteName);
    const hasWest = /west/i.test(siteName);
    const hasPTZ = /ptz/i.test(siteName);
    const hasStatic = /static/i.test(siteName);
    
    // Special name patterns
    const specialNames = ['mount carmel', 'mh tower', 'ac tower', 'be tower', 'bi tower', 'nkp'];
    let specialMatch = null;
    for (const sp of specialNames) {
      if (siteName.includes(sp)) { specialMatch = sp; break; }
    }
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const cam of catalogCameras) {
      let score = 0;
      const camName = (cam.name || '').toLowerCase();
      const camLoc = (cam.location || '').toLowerCase();
      const camFull = `${camName} ${camLoc}`.toLowerCase();
      
      // City match (check if catalog name contains city)
      if (city && camName.includes(city)) {
        score += 10;
      } else if (city) {
        // Try state expansion: "waldwick, nj" -> check "waldwick" in "waldwick, new jersey"
        const parts = siteName.split(',');
        if (parts.length >= 1) {
          const studioCity = parts[0].trim().toLowerCase();
          if (camName.includes(studioCity)) score += 10;
        }
      }
      
      // Location/state match
      if (siteLoc) {
        const locCity = siteLoc.split(',')[0].trim().toLowerCase();
        if (camName.includes(locCity)) score += 5;
        // State expansion
        const stateAbbr = siteLoc.split(',')[1]?.trim().toUpperCase();
        const stateFull = stateMap[stateAbbr];
        if (stateFull && camName.toLowerCase().includes(stateFull.toLowerCase())) score += 3;
      }
      
      if (score < 5) continue; // No city match, skip
      
      // Direction matching
      if (hasEast && camFull.includes('east')) score += 8;
      if (hasWest && camFull.includes('west')) score += 8;
      if (hasPTZ && camFull.includes('ptz')) score += 8;
      if (hasStatic && camFull.includes('static')) score += 8;
      
      // Special name matching
      if (specialMatch && camFull.includes(specialMatch)) score += 15;
      
      // Penalize if direction mismatch
      if (hasEast && camFull.includes('west') && !camFull.includes('east')) score -= 5;
      if (hasWest && camFull.includes('east') && !camFull.includes('west')) score -= 5;
      
      // NKP special case
      if (/nkp/i.test(siteName) && camFull.includes('nkp')) score += 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = cam;
      }
    }
    
    if (bestMatch && bestScore >= 10) {
      mapping[bestMatch._id] = site.id;
    }
  }
  
  return mapping;
}

// Get camera streams from admin API
async function getCameraStreams(cameraId, adminToken) {
  // First get camera list to find by short_code or _id
  const res = await fetch(`${API_BASE}/api/admin/cameras?limit=200`, {
    headers: { 'Authorization': `Bearer ${adminToken}`, 'X-API-Key': API_KEY },
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
        headers: upstreamHeaders(request, { contentType: 'application/json' }),
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

        // ── Persistent session: store encrypted credentials for auto-renewal ──
        // This enables "Keep me logged in" — the server can re-authenticate
        // on behalf of the user before the 30-min token expires.
        if (body.remember_me && body.username && body.password && SESSION_KEY) {
          try {
            const db = await getMongoDb();
            const sessionId = crypto.randomUUID();
            const encPassword = encryptCredential(body.password);
            await db.collection('user_sessions').insertOne({
              session_id: sessionId,
              username: body.username.toLowerCase(),
              encrypted_password: encPassword,
              created_at: new Date(),
              last_renewed_at: new Date(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });
            // Ensure TTL index exists (auto-deletes expired sessions)
            await db.collection('user_sessions').createIndex(
              { expires_at: 1 },
              { expireAfterSeconds: 0 }
            ).catch(() => {}); // ignore if already exists
            // Set long-lived session cookie (30 days)
            response.cookies.set('railstream_session', sessionId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 30 * 24 * 60 * 60, // 30 days
            });
          } catch (e) {
            console.error('[Auth] Failed to create persistent session:', e.message);
            // Non-fatal — login still succeeds, just without persistent session
          }
        }

        return handleCORS(response);
      }
      return handleCORS(NextResponse.json(data, { status: res.status }));
    }

    // Auth: Logout
    if (route === '/auth/logout' && method === 'POST') {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete('railstream_token');
      // Clean up persistent session if it exists
      const cookieStore = cookies();
      const sessionId = cookieStore.get('railstream_session')?.value;
      if (sessionId) {
        try {
          const db = await getMongoDb();
          await db.collection('user_sessions').deleteOne({ session_id: sessionId });
        } catch (e) {
          console.error('[Auth] Failed to delete persistent session:', e.message);
        }
        response.cookies.delete('railstream_session');
      }
      return handleCORS(response);
    }

    // Auth: Renew — use stored credentials to get a fresh access token
    // This powers the "Keep me logged in" / "always active" session feature.
    // Called proactively by the client before the 30-min token expires.
    if (route === '/auth/renew' && method === 'POST') {
      const cookieStore = cookies();
      const sessionId = cookieStore.get('railstream_session')?.value;
      if (!sessionId) {
        return handleCORS(NextResponse.json({ error: 'No persistent session', renewed: false }, { status: 401 }));
      }
      try {
        const db = await getMongoDb();
        const session = await db.collection('user_sessions').findOne({ session_id: sessionId });
        if (!session) {
          // Session expired or was deleted — clear the cookie
          const response = NextResponse.json({ error: 'Session not found', renewed: false }, { status: 401 });
          response.cookies.delete('railstream_session');
          return handleCORS(response);
        }
        // Decrypt credentials and re-authenticate
        const password = decryptCredential(session.encrypted_password);
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: upstreamHeaders(request, { contentType: 'application/json' }),
          body: JSON.stringify({ username: session.username, password }),
        });
        const loginData = await loginRes.json();
        if (loginData.access_token) {
          // Update session's last_renewed_at and extend expiry
          await db.collection('user_sessions').updateOne(
            { session_id: sessionId },
            { $set: { last_renewed_at: new Date(), expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
          );
          const response = NextResponse.json({
            renewed: true,
            access_token: loginData.access_token,
            expires_in: loginData.expires_in || 1800,
            user: loginData.user,
          });
          // Update the access token cookie
          response.cookies.set('railstream_token', loginData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: loginData.expires_in || 3600,
          });
          // Extend the session cookie too
          response.cookies.set('railstream_session', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
          });
          console.log(`[Auth] Session renewed for ${session.username}`);
          return handleCORS(response);
        }
        // Login failed (password changed, account suspended, etc.)
        // Delete the stale session
        await db.collection('user_sessions').deleteOne({ session_id: sessionId });
        const response = NextResponse.json({ error: 'Credentials no longer valid', renewed: false }, { status: 401 });
        response.cookies.delete('railstream_session');
        return handleCORS(response);
      } catch (e) {
        console.error('[Auth] Session renewal error:', e.message);
        return handleCORS(NextResponse.json({ error: 'Renewal failed', renewed: false }, { status: 500 }));
      }
    }

    // Auth: Get current user
    if (route === '/auth/me' && method === 'GET') {
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Not authenticated' }, { status: 401 }));
      }
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: upstreamHeaders(request, { token }),
      });
      if (!res.ok) {
        return handleCORS(NextResponse.json({ error: 'Session expired' }, { status: 401 }));
      }
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // Auth: Refresh token — silently get a new access token using refresh token
    if (route === '/auth/refresh' && method === 'POST') {
      const body = await request.json();
      const refreshToken = body.refresh_token;
      if (!refreshToken) {
        return handleCORS(NextResponse.json({ error: 'No refresh token' }, { status: 400 }));
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: upstreamHeaders(request, { contentType: 'application/json' }),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.access_token) {
          // Update the httpOnly cookie too
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
      } catch (e) {
        return handleCORS(NextResponse.json({ error: 'Refresh failed' }, { status: 500 }));
      }
    }

    // Cameras: Get catalog
    if (route === '/cameras/catalog' && method === 'GET') {
      const res = await fetch(`${API_BASE}/api/cameras/catalog`, {
        headers: { 'X-API-Key': API_KEY },
      });
      const data = await res.json();
      
      // Merge in radio detection status from local DB
      try {
        const db = await getMongoDb();
        const radioEntries = await db.collection('camera_radio').find({}).toArray();
        const radioMap = {};
        radioEntries.forEach(r => { radioMap[r.camera_id] = true; });
        
        // Attach has_radio flag to each camera
        if (Array.isArray(data)) {
          data.forEach(cam => { cam.has_radio = !!radioMap[cam._id]; });
        }
      } catch (err) {
        console.error('Radio merge error:', err);
      }
      
      return handleCORS(NextResponse.json(data));
    }

    // Cameras: Report radio detection — saves that a camera has scanner audio
    if (route === '/cameras/radio' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { camera_id, has_radio } = body;
      if (!camera_id) return handleCORS(NextResponse.json({ error: 'camera_id required' }, { status: 400 }));
      
      try {
        const db = await getMongoDb();
        if (has_radio) {
          await db.collection('camera_radio').updateOne(
            { camera_id },
            { $set: { camera_id, has_radio: true, detected_at: new Date() } },
            { upsert: true }
          );
        } else {
          await db.collection('camera_radio').deleteOne({ camera_id });
        }
        return handleCORS(NextResponse.json({ ok: true }));
      } catch (err) {
        return handleCORS(NextResponse.json({ error: 'Failed' }, { status: 500 }));
      }
    }

    // Cameras: Get radio status for all cameras
    if (route === '/cameras/radio' && method === 'GET') {
      try {
        const db = await getMongoDb();
        const entries = await db.collection('camera_radio').find({}).toArray();
        const radioMap = {};
        entries.forEach(r => { radioMap[r.camera_id] = true; });
        return handleCORS(NextResponse.json({ ok: true, radio: radioMap }));
      } catch {
        return handleCORS(NextResponse.json({ ok: true, radio: {} }));
      }
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
          ...upstreamHeaders(request, { token, contentType: 'application/json' }),
        },
        body: JSON.stringify({
          camera_id: body.camera_id,
          device_id: body.device_id || `web-${Date.now()}`,
          platform: body.platform || 'web',
          device_name: body.device_name || 'Web Browser',
          device_model: body.device_model || 'Browser',
          os_version: body.os_version || 'Unknown',
          app_version: body.app_version || 'Web 1.0',
        }),
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // Playback: Stop session
    if (route === '/playback/stop' && method === 'POST') {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('session_id');
      const body = await request.json().catch(() => ({}));
      const sid = sessionId || body.session_id;
      if (!sid) {
        return handleCORS(NextResponse.json({ error: 'session_id required' }, { status: 400 }));
      }
      const token = getToken(request);
      const res = await fetch(`${API_BASE}/api/playback/stop?session_id=${sid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({ ok: true }));
      return handleCORS(NextResponse.json(data));
    }

    // Playback: Stop ALL sessions — clears all active streams for the user
    if (route === '/playback/stop-all' && method === 'POST') {
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Auth required' }, { status: 401 }));
      
      // Get user's active sessions from the upstream API
      try {
        const sessRes = await fetch(`${API_BASE}/api/playback/sessions`, {
          headers: { 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` },
        });
        const sessData = await sessRes.json().catch(() => ({}));
        const sessions = sessData.sessions || sessData.data || [];
        
        let stopped = 0;
        for (const sess of sessions) {
          const sid = sess.session_id || sess.id;
          if (sid) {
            await fetch(`${API_BASE}/api/playback/stop?session_id=${sid}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` },
            }).catch(() => {});
            stopped++;
          }
        }
        return handleCORS(NextResponse.json({ ok: true, stopped, message: `Stopped ${stopped} sessions` }));
      } catch (err) {
        return handleCORS(NextResponse.json({ ok: false, error: 'Failed to stop sessions' }, { status: 500 }));
      }
    }

    // Playback: Heartbeat — keep session alive
    if (route === '/playback/heartbeat' && method === 'POST') {
      const body = await request.json();
      const token = getToken(request);
      const res = await fetch(`${API_BASE}/api/playback/heartbeat`, {
        method: 'POST',
        headers: upstreamHeaders(request, { token, contentType: 'application/json' }),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({ ok: true }));
      return handleCORS(NextResponse.json(data));
    }

    // ── Favorites API ──
    // GET /api/favorites — List user's favorites
    if (route === '/favorites' && method === 'GET') {
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      const res = await fetch(`${API_BASE}/api/favorites`, {
        headers: { 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // POST /api/favorites/{camera_id} — Add to favorites
    if (route.startsWith('/favorites/') && method === 'POST') {
      const cameraId = route.replace('/favorites/', '');
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      const res = await fetch(`${API_BASE}/api/favorites/${cameraId}`, {
        method: 'POST',
        headers: { 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // DELETE /api/favorites/{camera_id} — Remove from favorites
    if (route.startsWith('/favorites/') && method === 'DELETE') {
      const cameraId = route.replace('/favorites/', '');
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      const res = await fetch(`${API_BASE}/api/favorites/${cameraId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // PUT /api/favorites — Bulk sync/replace all favorites
    if (route === '/favorites' && method === 'PUT') {
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      const body = await request.json();
      const res = await fetch(`${API_BASE}/api/favorites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ camera_ids: body.camera_ids }),
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // Devices: Register a device
    if (route === '/devices/register' && method === 'POST') {
      const body = await request.json();
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }
      const res = await fetch(`${API_BASE}/api/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // Devices: List user's registered devices
    if (route === '/devices' && method === 'GET') {
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }
      const res = await fetch(`${API_BASE}/api/devices`, {
        headers: {
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      return handleCORS(NextResponse.json(data));
    }

    // Devices: Remove a device
    if (route.startsWith('/devices/') && !route.includes('/register') && method === 'DELETE') {
      const deviceId = route.replace('/devices/', '');
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }
      const res = await fetch(`${API_BASE}/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({ ok: true }));
      return handleCORS(NextResponse.json(data));
    }

    // Devices: Rename a device
    if (route.startsWith('/devices/') && !route.includes('/register') && method === 'PATCH') {
      const deviceId = route.replace('/devices/', '');
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }
      const body = await request.json();
      const res = await fetch(`${API_BASE}/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ device_name: body.device_name }),
      });
      const data = await res.json().catch(() => ({ ok: true }));
      return handleCORS(NextResponse.json(data));
    }
    if (route === '/playback/web-authorize' && method === 'POST') {
      const body = await request.json();
      const cameraId = body.camera_id;
      
      if (!cameraId) {
        return handleCORS(NextResponse.json({ error: 'camera_id required' }, { status: 400 }));
      }
      
      try {
        // Call upstream web-authorize directly with API key
        const authRes = await fetch(`${API_BASE}/api/playback/web-authorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
          body: JSON.stringify({ camera_id: cameraId }),
        });
        
        const authData = await authRes.json();
        
        if (!authRes.ok || !authData.ok) {
          return handleCORS(NextResponse.json({ 
            error: authData.error || authData.detail || 'Failed to authorize playback' 
          }, { status: authRes.status || 500 }));
        }
        
        // Pass through the upstream response
        return handleCORS(NextResponse.json(authData));
        
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

    // ── User Preferences (Favorites & Presets) ──
    // GET /api/user/preferences — Load user's saved favorites & presets
    if (route === '/user/preferences' && method === 'GET') {
      const token = request.headers.get('authorization')?.split(' ')[1];
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }

      try {
        // Verify user with upstream API
        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!meRes.ok) {
          return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }));
        }
        const userData = await meRes.json();
        const userId = userData._id || userData.id || userData.username;

        // Connect to MongoDB directly
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        const db = client.db('railstream');
        
        const prefs = await db.collection('user_preferences').findOne({ userId });
        await client.close();

        return handleCORS(NextResponse.json({
          ok: true,
          favorites: prefs?.favorites || [],
          presets: prefs?.presets || [],
        }));
      } catch (error) {
        console.error('Get preferences error:', error);
        return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
      }
    }

    // PUT /api/user/preferences — Save user's favorites & presets
    if (route === '/user/preferences' && method === 'PUT') {
      const token = request.headers.get('authorization')?.split(' ')[1];
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }

      try {
        // Verify user
        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!meRes.ok) {
          return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }));
        }
        const userData = await meRes.json();
        const userId = userData._id || userData.id || userData.username;

        const body = await request.json();
        const { favorites, presets } = body;

        // Connect to MongoDB directly
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        const db = client.db('railstream');

        const update = { updatedAt: new Date() };
        if (favorites !== undefined) update.favorites = favorites;
        if (presets !== undefined) update.presets = presets;

        await db.collection('user_preferences').updateOne(
          { userId },
          { $set: update, $setOnInsert: { userId, username: userData.username || '', createdAt: new Date() } },
          { upsert: true }
        );
        await client.close();

        return handleCORS(NextResponse.json({ ok: true }));
      } catch (error) {
        console.error('Save preferences error:', error);
        return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
      }
    }

    // ── Studio API Endpoints ──
    // GET /api/studio/sites — Fetch all studio sites with health data
    if (route === '/studio/sites' && method === 'GET') {
      try {
        const cache = await fetchStudioSites();
        return handleCORS(NextResponse.json({
          ok: true,
          sites: cache.data,
          cached_at: cache.fetchedAt,
        }));
      } catch (error) {
        console.error('Studio sites error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to fetch studio data' }, { status: 502 }));
      }
    }

    // GET /api/studio/thumbnail?id=SITE_ID — Serve a live preview image for a site
    // Uses pre-decoded buffer cache for zero-cost serving
    if (route === '/studio/thumbnail' && method === 'GET') {
      const url = new URL(request.url);
      const siteId = url.searchParams.get('id');
      if (!siteId) {
        return handleCORS(NextResponse.json({ error: 'id parameter required' }, { status: 400 }));
      }
      try {
        await fetchStudioSites(); // Ensure cache is fresh
        // Serve from pre-decoded buffer cache (no base64 decode per request!)
        const buffer = thumbnailBufferCache[siteId];
        if (!buffer) {
          const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
          return new NextResponse(pixel, {
            status: 200,
            headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=5' },
          });
        }
        return new NextResponse(buffer, {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=5' },
        });
      } catch (error) {
        console.error('Studio thumbnail error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 502 }));
      }
    }

    // GET /api/studio/thumbnails-batch — Returns ALL thumbnails as data URIs in ONE request
    // This is the preferred endpoint: 1 request instead of 46 individual image requests
    if (route === '/studio/thumbnails-batch' && method === 'GET') {
      try {
        const now = Date.now();
        // Serve from cache if data URI cache is fresh (matches studio cache TTL)
        if (thumbnailDataUriCache && (now - thumbnailDataUriCacheTime) < 10000) {
          return handleCORS(NextResponse.json(thumbnailDataUriCache, {
            headers: { 'Cache-Control': 'public, max-age=5' },
          }));
        }
        const cache = await fetchStudioSites();
        // Build data URI map from raw base64 (browser handles data URIs natively)
        const dataUris = {};
        Object.entries(cache.thumbnails).forEach(([siteId, base64]) => {
          dataUris[siteId] = `data:image/jpeg;base64,${base64}`;
        });
        const response = { ok: true, thumbnails: dataUris, timestamp: now };
        thumbnailDataUriCache = response;
        thumbnailDataUriCacheTime = now;
        return handleCORS(NextResponse.json(response, {
          headers: { 'Cache-Control': 'public, max-age=5' },
        }));
      } catch (error) {
        console.error('Thumbnails batch error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to fetch thumbnails' }, { status: 502 }));
      }
    }

    // GET /api/studio/thumbnails-map — Return mapping of studioSiteId → catalogCameraId
    // Uses cached data to minimize external API calls
    if (route === '/studio/thumbnails-map' && method === 'GET') {
      try {
        const cache = await fetchStudioSites();
        // Use cached catalog (refresh every 60s to reduce API load)
        if (!global._catalogCache || (Date.now() - global._catalogCacheTime) > 60000) {
          const catalogRes = await fetch(`${API_BASE}/api/cameras/catalog`, {
            headers: { 'X-API-Key': API_KEY },
          });
          global._catalogCache = await catalogRes.json();
          global._catalogCacheTime = Date.now();
        }
        const catalog = global._catalogCache;
        
        // Build a mapping from studio site to catalog camera
        const mapping = buildStudioToCatalogMapping(cache.data, catalog);
        return handleCORS(NextResponse.json({
          ok: true,
          mapping,
          available_thumbnails: Object.keys(cache.thumbnails),
        }));
      } catch (error) {
        console.error('Thumbnails map error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to build mapping' }, { status: 502 }));
      }
    }

    // ── Stream Latency Calibration ──
    // GET /api/stream/calibrate?cam=BIM_CAM02
    // Measures actual stream latency by probing for the latest thumbnail
    // Returns { latency_seconds, server_time, latest_content_time }
    if (route === '/stream/calibrate' && method === 'GET') {
      const url = new URL(request.url);
      const cam = url.searchParams.get('cam');

      if (!cam) {
        return handleCORS(NextResponse.json({ error: 'cam parameter required' }, { status: 400 }));
      }

      const safeCam = cam.replace(/[^a-zA-Z0-9_-]/g, '');
      const THUMB_BASE = process.env.THUMBNAIL_PATH || '/mnt/railstream-thumbs';
      const serverTime = Math.floor(Date.now() / 1000);

      try {
        const fs = await import('fs/promises');
        const path_mod = await import('path');
        const camDir = path_mod.join(THUMB_BASE, safeCam);

        // Verify directory exists
        await fs.access(camDir);

        // Probe for the latest thumbnail by checking timestamps from "now" backwards.
        // Thumbnails are saved every ~2 seconds as {unix_timestamp}.jpg.
        // Instead of listing millions of files, we probe specific timestamps.
        // Start from "now" and go back in 2-second steps until we find one (max 5 minutes back).
        const MAX_PROBE_SECONDS = 600; // Probe up to 10 minutes back
        const STEP = 2; // Thumbnails are every 2 seconds

        let latestTs = 0;
        for (let offset = 0; offset <= MAX_PROBE_SECONDS; offset += STEP) {
          const probeTs = serverTime - offset;
          const probePath = path_mod.join(camDir, `${probeTs}.jpg`);
          try {
            await fs.access(probePath);
            latestTs = probeTs;
            break; // Found the latest!
          } catch {
            continue; // File doesn't exist at this timestamp
          }
        }

        if (latestTs === 0) {
          // No thumbnails found in range — return default estimate
          return handleCORS(NextResponse.json({
            ok: true,
            latency_seconds: 30,
            server_time: serverTime,
            latest_content_time: serverTime - 30,
            source: 'default',
          }));
        }

        const latency = serverTime - latestTs;
        return handleCORS(NextResponse.json({
          ok: true,
          latency_seconds: Math.max(0, latency),
          server_time: serverTime,
          latest_content_time: latestTs,
          source: 'thumbnails',
        }));
      } catch (error) {
        // Directory doesn't exist or not accessible — return default
        return handleCORS(NextResponse.json({
          ok: true,
          latency_seconds: 30,
          server_time: serverTime,
          latest_content_time: serverTime - 30,
          source: 'default',
        }));
      }
    }

    // ── Thumbnail Scrubbing ──
    // GET /api/thumbnails/scrub?cam=FOS_CAM01&ts=1710000000
    // Serves DVR thumbnail images from NFS mount for timeline scrubbing
    if (route === '/thumbnails/scrub' && method === 'GET') {
      const url = new URL(request.url);
      const cam = url.searchParams.get('cam');
      const ts = url.searchParams.get('ts');

      if (!cam || !ts) {
        return handleCORS(NextResponse.json({ error: 'cam and ts parameters required' }, { status: 400 }));
      }

      // Sanitize cam name to prevent directory traversal
      const safeCam = cam.replace(/[^a-zA-Z0-9_-]/g, '');
      const timestamp = parseInt(ts, 10);
      if (isNaN(timestamp)) {
        return handleCORS(NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 }));
      }

      // Check in-memory cache first
      const cacheKey = `${safeCam}/${timestamp}`;
      if (thumbCache.has(cacheKey)) {
        const cached = thumbCache.get(cacheKey);
        // Move to end (most recently used)
        thumbCache.delete(cacheKey);
        thumbCache.set(cacheKey, cached);
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const THUMB_BASE = process.env.THUMBNAIL_PATH || '/mnt/railstream-thumbs';

      try {
        const fs = await import('fs/promises');
        const path_mod = await import('path');

        // Try exact timestamp first (fast path)
        const exactPath = path_mod.join(THUMB_BASE, safeCam, `${timestamp}.jpg`);
        try {
          const imageData = await fs.readFile(exactPath);
          if (thumbCache.size >= THUMB_CACHE_MAX) {
            const oldest = thumbCache.keys().next().value;
            thumbCache.delete(oldest);
          }
          thumbCache.set(cacheKey, imageData);
          return new Response(imageData, {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } catch {
          // Exact file not found, try nearby (parallel)
        }

        // Parallel check for nearby timestamps (±2s, ±4s, ±6s)
        const offsets = [-2, 2, -4, 4, -6, 6];
        const checks = offsets.map(async (offset) => {
          const tryPath = path_mod.join(THUMB_BASE, safeCam, `${timestamp + offset}.jpg`);
          const data = await fs.readFile(tryPath);
          return data;
        });

        try {
          const imageData = await Promise.any(checks);
          if (thumbCache.size >= THUMB_CACHE_MAX) {
            const oldest = thumbCache.keys().next().value;
            thumbCache.delete(oldest);
          }
          thumbCache.set(cacheKey, imageData);
          return new Response(imageData, {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } catch {
          // None found
        }

        // No thumbnail found — return 204
        return new Response(null, {
          status: 204,
          headers: {
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*',
          },
        });

      } catch (error) {
        console.error('Thumbnail scrub error:', error);
        return new Response(null, {
          status: 204,
          headers: {
            'Cache-Control': 'public, max-age=10',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // ════════════════════════════════════════════
    // ── Train Sightings Log API ──
    // ════════════════════════════════════════════

    // GET /api/sightings — List sightings (public, filterable)
    if (route === '/sightings' && method === 'GET') {
      try {
        const url = new URL(request.url);
        const camera_id = url.searchParams.get('camera_id');
        const date = url.searchParams.get('date'); // YYYY-MM-DD
        const railroad = url.searchParams.get('railroad');
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

        const db = await getMongoDb();
        const col = db.collection('train_sightings');

        const camera_name = url.searchParams.get('camera_name');

        const query = {};
        if (camera_id) query.camera_id = camera_id;
        // Use regex match for camera_name to handle partial matches
        // (e.g., "Atlanta, Georgia" should match sightings tagged as "Atlanta Howell Yard East")
        if (camera_name) {
          // Extract the city/location keyword for broader matching
          const cityPart = camera_name.split(',')[0].trim();
          query.$or = [
            { camera_name: camera_name },
            { camera_name: { $regex: cityPart, $options: 'i' } },
            { location: { $regex: cityPart, $options: 'i' } },
          ];
        }
        if (railroad) query.railroad = railroad;
        if (date) {
          const dayStart = new Date(date + 'T00:00:00Z');
          const dayEnd = new Date(date + 'T23:59:59.999Z');
          // Handle sighting_time stored as both ISO strings and Date objects
          query.sighting_time = {
            $gte: dayStart.toISOString(),
            $lte: dayEnd.toISOString(),
          };
        }

        const total = await col.countDocuments(query);
        const sightings = await col
          .find(query)
          .sort({ sighting_time: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();

        return handleCORS(NextResponse.json({
          ok: true,
          sightings,
          total,
          page,
          pages: Math.ceil(total / limit),
        }));
      } catch (error) {
        console.error('Sightings list error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to fetch sightings' }, { status: 500 }));
      }
    }

    // POST /api/sightings/upload — Upload a snapshot image for a sighting
    if (route === '/sightings/upload' && method === 'POST') {
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }

      try {
        const body = await request.json();
        const { image_data, sighting_id } = body; // image_data is base64 JPEG

        if (!image_data) {
          return handleCORS(NextResponse.json({ error: 'image_data (base64) is required' }, { status: 400 }));
        }

        // Strip data URL prefix if present
        const base64 = image_data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');

        // Save to filesystem
        const fs = await import('fs/promises');
        const path_mod = await import('path');
        const uploadsDir = process.env.UPLOADS_PATH || path_mod.join(process.cwd(), 'uploads', 'sightings');
        await fs.mkdir(uploadsDir, { recursive: true });

        const filename = `${sighting_id || crypto.randomUUID()}.jpg`;
        const filePath = path_mod.join(uploadsDir, filename);
        await fs.writeFile(filePath, buffer);

        const imageUrl = `/api/sightings/image/${filename}`;

        // If sighting_id provided, update the sighting with the image URL
        if (sighting_id) {
          const db = await getMongoDb();
          await db.collection('train_sightings').updateOne(
            { _id: sighting_id },
            { $set: { image_url: imageUrl, updated_at: new Date().toISOString() } }
          );
        }

        return handleCORS(NextResponse.json({ ok: true, image_url: imageUrl, filename }));
      } catch (error) {
        console.error('Sighting upload error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to upload image' }, { status: 500 }));
      }
    }

    // GET /api/sightings/image/:filename — Serve a sighting snapshot image
    if (route.startsWith('/sightings/image/') && method === 'GET') {
      const filename = route.split('/sightings/image/')[1];
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return handleCORS(NextResponse.json({ error: 'Invalid filename' }, { status: 400 }));
      }

      try {
        const fs = await import('fs/promises');
        const path_mod = await import('path');
        const uploadsDir = process.env.UPLOADS_PATH || path_mod.join(process.cwd(), 'uploads', 'sightings');
        const filePath = path_mod.join(uploadsDir, filename);
        const imageData = await fs.readFile(filePath);

        return new Response(imageData, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch {
        return new Response(null, { status: 404 });
      }
    }

    // GET /api/roundhouse/image/:filename — Serve a roundhouse photo (protected)
    if (route.startsWith('/roundhouse/image/') && method === 'GET') {
      const filename = route.split('/roundhouse/image/')[1];
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return handleCORS(NextResponse.json({ error: 'Invalid filename' }, { status: 400 }));
      }

      try {
        const fs = await import('fs/promises');
        const path_mod = await import('path');
        const uploadsDir = process.env.ROUNDHOUSE_UPLOADS_PATH || path_mod.join(process.cwd(), 'uploads', 'roundhouse');
        const filePath = path_mod.join(uploadsDir, filename);
        const imageData = await fs.readFile(filePath);

        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

        return new Response(imageData, {
          status: 200,
          headers: {
            'Content-Type': mimeMap[ext] || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
            // Download protection headers
            'Content-Disposition': 'inline',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch {
        return new Response(null, { status: 404 });
      }
    }

    // GET /api/sightings/stats — Quick stats
    if (route === '/sightings/stats' && method === 'GET') {
      try {
        const db = await getMongoDb();
        const col = db.collection('train_sightings');
        
        const today = new Date().toISOString().slice(0, 10);
        const todayStart = today + 'T00:00:00Z';
        const todayEnd = today + 'T23:59:59Z';

        const [totalAll, totalToday, topRailroads, topLocations, leaderboard] = await Promise.all([
          col.countDocuments({}),
          col.countDocuments({ sighting_time: { $gte: todayStart, $lte: todayEnd } }),
          col.aggregate([
            { $group: { _id: '$railroad', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]).toArray(),
          col.aggregate([
            { $group: { _id: '$camera_name', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]).toArray(),
          col.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ]).toArray(),
        ]);

        // Points system: each sighting = 10 points, with image = 15 points
        // For leaderboard, we'll calculate points (10 per sighting base)
        const leaderboardWithPoints = leaderboard.map((u, idx) => ({
          username: u._id,
          sightings: u.count,
          points: u.count * 10,
          rank: idx + 1,
        }));

        return handleCORS(NextResponse.json({
          ok: true,
          total: totalAll,
          today: totalToday,
          top_railroads: topRailroads.map(r => ({ name: r._id, count: r.count })),
          top_locations: topLocations.map(l => ({ name: l._id, count: l.count })),
          leaderboard: leaderboardWithPoints,
        }));
      } catch (error) {
        console.error('Sightings stats error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 }));
      }
    }

    // POST /api/sightings — Create a sighting (paid members only)
    if (route === '/sightings' && method === 'POST') {
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }

      // Verify user with main API
      try {
        const userRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!userRes.ok) {
          return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }));
        }
        const userData = await userRes.json();
        const tier = userData.tier || userData.membership_tier || 'free';
        const paidTiers = ['conductor', 'engineer', 'fireman', 'development', 'admin'];
        if (!paidTiers.includes(tier) && !userData.is_admin) {
          return handleCORS(NextResponse.json({ error: 'Paid membership required to log sightings' }, { status: 403 }));
        }

        const body = await request.json();
        const { camera_id, camera_name, location, sighting_time, railroad, train_id, direction, locomotives, train_type, notes } = body;

        if (!camera_id || !sighting_time || !railroad) {
          return handleCORS(NextResponse.json({ error: 'camera_id, sighting_time, and railroad are required' }, { status: 400 }));
        }

        const db = await getMongoDb();
        const sighting = {
          _id: crypto.randomUUID(),
          camera_id,
          camera_name: camera_name || '',
          location: location || '',
          sighting_time,
          railroad,
          train_id: train_id || '',
          direction: direction || '',
          locomotives: locomotives || '',
          train_type: train_type || '',
          notes: notes || '',
          user: userData.username || userData.name || 'Unknown',
          user_tier: tier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await db.collection('train_sightings').insertOne(sighting);
        return handleCORS(NextResponse.json({ ok: true, sighting }, { status: 201 }));
      } catch (error) {
        console.error('Sightings create error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to create sighting' }, { status: 500 }));
      }
    }

    // PUT /api/sightings/:id — Edit a sighting (own entries only)
    if (route.startsWith('/sightings/') && method === 'PUT') {
      const sightingId = route.split('/')[2];
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }

      try {
        const userRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!userRes.ok) {
          return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }));
        }
        const userData = await userRes.json();

        const db = await getMongoDb();
        const col = db.collection('train_sightings');
        const existing = await col.findOne({ _id: sightingId });
        if (!existing) {
          return handleCORS(NextResponse.json({ error: 'Sighting not found' }, { status: 404 }));
        }
        if (existing.user !== (userData.username || userData.name) && !userData.is_admin) {
          return handleCORS(NextResponse.json({ error: 'You can only edit your own sightings' }, { status: 403 }));
        }

        const body = await request.json();
        const updates = {};
        const allowed = ['railroad', 'train_id', 'direction', 'locomotives', 'train_type', 'notes', 'sighting_time'];
        for (const key of allowed) {
          if (body[key] !== undefined) updates[key] = body[key];
        }
        updates.updated_at = new Date().toISOString();

        await col.updateOne({ _id: sightingId }, { $set: updates });
        const updated = await col.findOne({ _id: sightingId });
        return handleCORS(NextResponse.json({ ok: true, sighting: updated }));
      } catch (error) {
        console.error('Sightings update error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to update sighting' }, { status: 500 }));
      }
    }

    // DELETE /api/sightings/:id — Delete a sighting (own entries or admin)
    if (route.startsWith('/sightings/') && method === 'DELETE') {
      const sightingId = route.split('/')[2];
      const token = getToken(request);
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Authentication required' }, { status: 401 }));
      }

      try {
        const userRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!userRes.ok) {
          return handleCORS(NextResponse.json({ error: 'Invalid token' }, { status: 401 }));
        }
        const userData = await userRes.json();

        const db = await getMongoDb();
        const col = db.collection('train_sightings');
        const existing = await col.findOne({ _id: sightingId });
        if (!existing) {
          return handleCORS(NextResponse.json({ error: 'Sighting not found' }, { status: 404 }));
        }
        if (existing.user !== (userData.username || userData.name) && !userData.is_admin) {
          return handleCORS(NextResponse.json({ error: 'You can only delete your own sightings' }, { status: 403 }));
        }

        await col.deleteOne({ _id: sightingId });
        return handleCORS(NextResponse.json({ ok: true, deleted: sightingId }));
      } catch (error) {
        console.error('Sightings delete error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to delete sighting' }, { status: 500 }));
      }
    }

    // ========== ADS MANAGEMENT ==========

    // GET /api/ads - Get all ads (public: only enabled, admin: all)
    if (route === '/ads' && method === 'GET') {
      try {
        const db = await getMongoDb();
        const col = db.collection('ads');
        
        // Check if caller is admin
        let isAdmin = false;
        const token = getToken(request);
        if (token) {
          try {
            const authRes = await fetch(`${API_BASE}/api/auth/me`, {
              headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
            });
            if (authRes.ok) {
              const userData = await authRes.json();
              isAdmin = userData.is_admin === true;
            }
          } catch (e) {}
        }
        
        const filter = isAdmin ? {} : { enabled: true };
        const ads = await col.find(filter).sort({ priority: 1, createdAt: -1 }).toArray();
        return handleCORS(NextResponse.json({ ads, isAdmin }));
      } catch (error) {
        console.error('Ads fetch error:', error);
        return handleCORS(NextResponse.json({ ads: [] }));
      }
    }

    // POST /api/ads - Create ad (admin only)
    if (route === '/ads' && method === 'POST') {
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Auth required' }, { status: 401 }));
      
      try {
        const authRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!authRes.ok) return handleCORS(NextResponse.json({ error: 'Auth failed' }, { status: 401 }));
        const userData = await authRes.json();
        if (!userData.is_admin) return handleCORS(NextResponse.json({ error: 'Admin only' }, { status: 403 }));
        
        const body = await request.json();
        const { type, title, imageUrl, videoUrl, clickUrl, skipAfter, interval, priority } = body;
        
        if (!type || !['preroll', 'midroll', 'companion'].includes(type)) {
          return handleCORS(NextResponse.json({ error: 'Invalid ad type. Must be preroll, midroll, or companion.' }, { status: 400 }));
        }
        
        const db = await getMongoDb();
        const ad = {
          _id: crypto.randomUUID(),
          type,
          title: title || '',
          imageUrl: imageUrl || '',
          videoUrl: videoUrl || '',
          clickUrl: clickUrl || '',
          enabled: true,
          skipAfter: skipAfter || 5,
          interval: interval || 15,
          priority: priority || 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await db.collection('ads').insertOne(ad);
        return handleCORS(NextResponse.json({ ok: true, ad }));
      } catch (error) {
        console.error('Ads create error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to create ad' }, { status: 500 }));
      }
    }

    // PUT /api/ads/{id} - Update ad (admin only)
    if (route.startsWith('/ads/') && method === 'PUT') {
      const adId = path[1];
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Auth required' }, { status: 401 }));
      
      try {
        const authRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!authRes.ok) return handleCORS(NextResponse.json({ error: 'Auth failed' }, { status: 401 }));
        const userData = await authRes.json();
        if (!userData.is_admin) return handleCORS(NextResponse.json({ error: 'Admin only' }, { status: 403 }));
        
        const body = await request.json();
        const updates = { updatedAt: new Date().toISOString() };
        
        if (body.type !== undefined) updates.type = body.type;
        if (body.title !== undefined) updates.title = body.title;
        if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
        if (body.videoUrl !== undefined) updates.videoUrl = body.videoUrl;
        if (body.clickUrl !== undefined) updates.clickUrl = body.clickUrl;
        if (body.enabled !== undefined) updates.enabled = body.enabled;
        if (body.skipAfter !== undefined) updates.skipAfter = body.skipAfter;
        if (body.interval !== undefined) updates.interval = body.interval;
        if (body.priority !== undefined) updates.priority = body.priority;
        
        const db = await getMongoDb();
        const result = await db.collection('ads').updateOne({ _id: adId }, { $set: updates });
        
        if (result.matchedCount === 0) {
          return handleCORS(NextResponse.json({ error: 'Ad not found' }, { status: 404 }));
        }
        
        const updated = await db.collection('ads').findOne({ _id: adId });
        return handleCORS(NextResponse.json({ ok: true, ad: updated }));
      } catch (error) {
        console.error('Ads update error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to update ad' }, { status: 500 }));
      }
    }

    // DELETE /api/ads/{id} - Delete ad (admin only)
    if (route.startsWith('/ads/') && method === 'DELETE') {
      const adId = path[1];
      const token = getToken(request);
      if (!token) return handleCORS(NextResponse.json({ error: 'Auth required' }, { status: 401 }));
      
      try {
        const authRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': API_KEY },
        });
        if (!authRes.ok) return handleCORS(NextResponse.json({ error: 'Auth failed' }, { status: 401 }));
        const userData = await authRes.json();
        if (!userData.is_admin) return handleCORS(NextResponse.json({ error: 'Admin only' }, { status: 403 }));
        
        const db = await getMongoDb();
        const result = await db.collection('ads').deleteOne({ _id: adId });
        
        if (result.deletedCount === 0) {
          return handleCORS(NextResponse.json({ error: 'Ad not found' }, { status: 404 }));
        }
        
        return handleCORS(NextResponse.json({ ok: true, deleted: adId }));
      } catch (error) {
        console.error('Ads delete error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 }));
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
