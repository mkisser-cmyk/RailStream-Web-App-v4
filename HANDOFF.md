# RailStream Web Application — Complete Handoff Document
## For New Agent/Fork — March 11, 2026

---

## 1. WHAT IS THIS APPLICATION?

RailStream is a **premium live railroad camera streaming platform** built with Next.js 14. It replaces an older Joomla/WordPress site. The app serves as a modern presentation layer for an existing infrastructure:
- **Main API**: `api.railstream.net` — Camera catalog, authentication, stream authorization, user management
- **Studio API**: `studio.railstream.net` — Camera health monitoring, live thumbnails
- **Media Servers**: `media01.railstream.net` — HLS video streams via Nimble Streamer
- **NFS Thumbnails**: Mounted at `/mnt/railstream-thumbs` — 2-second interval JPEG thumbnails for DVR scrubbing

**Production URL**: `apps.railstream.net` (hosted on `trn-webapp01` at `/var/www/railstream`)
**Test credentials**: `chicagotest` / `sZyE8cDFk` (Engineer tier)
**Admin credentials**: `railstream` / `cn5453` (Admin/Development tier)

---

## 2. TECH STACK

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Video**: Custom `hls.js` player (`components/HlsPlayer.js`)
- **Backend**: Next.js API Routes as BFF proxy (`app/api/[[...path]]/route.js`)
- **Database**: MongoDB (local via `MONGO_URL` env var) — used for train sightings, future features
- **Upstream APIs**: Proxied through the BFF to `api.railstream.net` and `studio.railstream.net`
- **Package manager**: YARN only (never npm)

---

## 3. ENVIRONMENT VARIABLES (`.env`)

```
MONGO_URL=mongodb://localhost:27017/railstream
NEXT_PUBLIC_BASE_URL=https://apps.railstream.net
RAILSTREAM_API_URL=https://api.railstream.net
RAILSTREAM_API_KEY=web_9c8f46fd56486a168cca8cb9363b2f47
RAILSTREAM_ADMIN_USER=WEBAPP_ADMIN
RAILSTREAM_ADMIN_PASS=<in .env>
STUDIO_API_URL=https://studio.railstream.net
STUDIO_USERNAME=WebAPP_RS$
STUDIO_PASSWORD=<in .env>
THUMBNAIL_PATH=/mnt/railstream-thumbs
```

**NEVER modify MONGO_URL or NEXT_PUBLIC_BASE_URL** — these are configured for the infrastructure.

---

## 4. CODE ARCHITECTURE

```
/app
├── app/
│   ├── page.js                    # MONOLITHIC ~2500 lines — Main app (Home, Watch, About, Join pages)
│   ├── layout.js                  # Root layout with fonts, metadata
│   ├── api/
│   │   └── [[...path]]/route.js   # SINGLE catch-all API proxy (~1000 lines) — ALL backend routes
│   ├── 15years/page.js            # 15th anniversary page
│   ├── cameras/page.js            # Camera directory page
│   ├── host/page.js               # Host a camera page
│   ├── network-status/page.js     # Public camera health/status page (Studio API)
│   └── sightings/page.js          # NEW: Train sightings log page
├── components/
│   ├── HlsPlayer.js               # Custom HLS video player (~1130 lines) — DVR, snapshot, scrubbing
│   └── SiteHeader.js              # Shared navigation header
├── uploads/
│   └── sightings/                 # Uploaded sighting snapshot images
├── .env                           # Environment variables (PROTECTED)
├── test_result.md                 # Testing protocol and results
└── package.json
```

### CRITICAL: `app/page.js` is a monolith
This single file contains: Home page, Watch page (with multi-view grid, camera picker, toolbar, chat), About page, Join page, authentication flow, session management, all state management. It desperately needs refactoring into smaller components/hooks but works as-is.

---

## 5. KEY API ENDPOINTS (in `app/api/[[...path]]/route.js`)

### Proxied to `api.railstream.net`:
- `POST /api/auth/login` — User login, returns `access_token`
- `GET /api/auth/me` — Get current user info (requires Bearer token)
- `GET /api/cameras/catalog` — List all 46 cameras
- `GET /api/cameras/:id` — Single camera details
- `POST /api/playback/authorize` — Get HLS stream URL for a camera (sends device_id, device_name, etc.)
- `POST /api/playback/web-authorize` — Legacy stream auth
- `POST /api/playback/heartbeat` — Keep stream session alive
- `POST /api/playback/stop` — End a stream session
- `GET /api/devices` — List user's registered devices
- `DELETE /api/devices/:id` — Remove a device
- `GET/PUT /api/user/preferences` — User favorites and layout presets

### Proxied to `studio.railstream.net`:
- `GET /api/studio/sites` — Camera health data (19 cameras, cached 5s)
- `GET /api/studio/thumbnail?id=SITE_ID` — Live JPEG preview from a camera
- `GET /api/studio/thumbnails-map` — Mapping of catalog camera IDs to studio site IDs

### Local (MongoDB / Filesystem):
- `GET /api/thumbnails/scrub?cam=FOS_CAM01&ts=UNIX_TS` — DVR thumbnail from NFS mount
- `GET /api/sightings` — List train sightings (public, filterable)
- `GET /api/sightings/stats` — Sighting statistics
- `POST /api/sightings` — Create sighting (paid members only)
- `PUT /api/sightings/:id` — Edit sighting (own entries)
- `DELETE /api/sightings/:id` — Delete sighting (own entries or admin)
- `POST /api/sightings/upload` — Upload snapshot image for a sighting
- `GET /api/sightings/image/:filename` — Serve sighting image

---

## 6. COMPLETED FEATURES

### Video Player (`components/HlsPlayer.js`):
- ✅ HLS.js playback with DVR (2hr window, 7-day Review Ops mode)
- ✅ Audio track switching (No Radio / Radio / Radio Only)
- ✅ Snapshot capture (downloads JPEG with watermark)
- ✅ 10-second skip forward/rewind
- ✅ Per-camera mute in multi-view
- ✅ Quality capping based on view mode (1080p single, 720p quad, etc.)
- ✅ **Thumbnail scrubbing** — Hover over timeline shows preview thumbnail from NFS mount
  - Uses `position: fixed` portal approach to escape `overflow:hidden`
  - Client-side cache + aggressive prefetching (8 ahead, 2 behind)
  - Server-side LRU cache (500 entries) + parallel file lookup
  - Time label shows `-MM:SS` offset from live (matching old player style)
- ✅ **"Return to Live" button** — Shows "↩ Return to Live" when behind live, red "LIVE" when at live
- ✅ **"Log Sighting" button** — Captures snapshot + opens sighting form (IN PROGRESS, wiring to page.js incomplete)
- ✅ DVR won't snap back to live (`liveMaxLatencyDurationCount: 99999`, `backBufferLength: Infinity`)

### Multi-View System:
- ✅ 1, 2, 4, 9, 16-camera layouts
- ✅ Click-to-place: Click empty slot → pick camera from sidebar
- ✅ Click tile in multi-view → expand to fullscreen single view
- ✅ Branded placeholder images for empty slots (RailStream logo)

### Session Management:
- ✅ Persistent `device_id` in localStorage
- ✅ `getDeviceInfo()` sends browser name, OS, platform to API (e.g., "Chrome on macOS")
- ✅ `loadCamera` stores `session_id` from playback/authorize response
- ✅ Heartbeat every 30s for active sessions
- ✅ `beforeunload` cleanup sends stop via `sendBeacon`
- ✅ `removeCamera()` stops the session when removing from slot
- ✅ `handleLogout()` stops all sessions
- ✅ Stream limit error UI ("Stream Limit Reached" with retry button)
- ✅ Upgrade required UI (lock icon + upgrade link)

### Train Sightings Log (`/sightings`):
- ✅ Full CRUD API with MongoDB storage (`train_sightings` collection)
- ✅ Public browsing with filters (camera, date, railroad)
- ✅ Stats dashboard (total, today, top railroads, top locations)
- ✅ Railroad color badges (CSX blue, BNSF orange, NS black, etc.)
- ✅ Paid members only for creating entries
- ✅ Edit/delete own entries, admin can delete any
- ✅ Image upload endpoint for sighting snapshots
- ✅ "Replay" button on entries (links to DVR at that timestamp)
- ⚠️ **IN PROGRESS**: "Log Sighting" button in player needs wiring to sighting form in page.js
- ⚠️ **IN PROGRESS**: Sighting form modal in WatchPage (state added, submit handler added, JSX form NOT yet added)

### Other Pages:
- ✅ Network Status (`/network-status`) — Camera health from Studio API
- ✅ 15 Year Anniversary (`/15years`)
- ✅ Camera Directory (`/cameras`)
- ✅ Host a Camera (`/host`)

### UI/UX:
- ✅ Dark "control room" theme with orange (#ff7a00) accents
- ✅ WCAG AA contrast compliance
- ✅ Live video background on home page
- ✅ Live thumbnails in camera picker sidebar (refresh every 5s)
- ✅ "My Layouts" dropdown for saved presets
- ✅ Tier-gating with lock icons and upgrade prompts
- ✅ Admin badge for `is_admin` users

---

## 7. IN-PROGRESS / INCOMPLETE WORK

### 7a. Sighting Form in Player (P0 — was being built when session ended)
**Where to resume**: `app/page.js`, inside the `WatchPage` function.

**What's done**:
- State variables added: `sightingForm`, `sightingSubmitting`, `sightingData`
- `handleLogSighting(camera, slotData)` — receives snapshot + camera info from player
- `submitSighting(e)` — creates sighting via API, uploads image
- Constants added: `RAILROADS`, `TRAIN_TYPES`, `DIRECTIONS`

**What's NOT done**:
1. The `onLogSighting` prop is NOT yet passed to `<HlsPlayer>` in the JSX
2. The sighting form MODAL JSX is NOT yet rendered in WatchPage's return statement
3. Need to add `onLogSighting={(data) => handleLogSighting(selectedCameras[i], data)}` to each HlsPlayer instance
4. Need to add the modal JSX (similar to the form on `/sightings` page) at the bottom of WatchPage's return

**How to complete**:
1. Find the `<HlsPlayer` usages in WatchPage (single view around line 1448, multi-view around line 1575)
2. Add `onLogSighting={(data) => handleLogSighting(selectedCameras[SLOT_INDEX], data)}` prop
3. Add the sighting form modal at the end of WatchPage's return (before the closing `</div>`)
4. The modal should show the snapshot preview, pre-filled camera/time, and the railroad/train fields

### 7b. Approach A — Attach Existing Snapshot to Sighting
On the `/sightings` page form, add an optional image upload field where users can drag/drop or select a previously saved snapshot. The upload API (`POST /api/sightings/upload`) already exists.

---

## 8. UPCOMING / FUTURE TASKS

### P1: Admin Panel (`/admin`)
User requested a WordPress/Joomla-style admin panel for `is_admin` users:
- **Ad Management**: Pre-roll/mid-roll ad config (enable/disable, URLs, timing intervals)
- **ads.txt**: Upload/edit ads.txt file served at site root
- **Content Editor**: Edit page text (Home, About, etc.) stored in MongoDB
- **Site Settings**: General config (site name, taglines, etc.)
- **Dashboard**: Stats overview, active streams, camera health

### P2: Player Dev Tools Panel
"Stats for Nerds" overlay (like YouTube) toggled with Shift+D:
- Player version, edge server, RTT
- Video resolution, bitrate, FPS
- Network throughput, buffer health
- Dropped frames, current play time
- All data available from HLS.js

### P3: User Portal / Account Area
Scope TBD — will talk to `api.railstream.net` for:
- Account info and settings
- Device management (view/remove devices)
- Subscription/billing
- Support tickets

### P4: Video Clip Extraction for Sightings
Instead of linking to DVR, extract and save a 30-60 second video clip of the train sighting. Requires ffmpeg on the server.

### P5: Community Features
- Forums
- Photo/video archive (tied to sightings)
- Sightings map
- Native mobile apps

---

## 9. KNOWN ISSUES / GOTCHAS

1. **`app/page.js` is critically oversized** (~2500 lines). Any edit risks regressions. Should be refactored into smaller components/hooks.
2. **Thumbnail scrubbing performance** depends on NFS mount speed. First scrub is slower, subsequent scrubs are fast due to client + server caching.
3. **The `BackgroundHlsPlayer`** (home page video) is a simplified version that doesn't use any of the DVR/scrubbing features.
4. **Production deployment** requires manual `git pull && yarn build && pm2 restart all` on the user's server.
5. **Two upstream APIs** with different auth mechanisms:
   - `api.railstream.net` uses `X-API-Key` header + Bearer token for user auth
   - `studio.railstream.net` uses username/password cookie-based auth
6. **MongoDB ObjectIDs are NOT used** — all IDs are UUIDs (`crypto.randomUUID()`)
7. **NFS mount** at `/mnt/railstream-thumbs` contains camera folders like `FOS_CAM01/1773042906.jpg` (unix timestamp, 2s intervals)
8. **HLS URL pattern**: `https://media01.railstream.net/Live_Mobile/{CAM_NAME}/playlist_dvr_timeshift-{offset}-{duration}.m3u8`
   - `CAM_NAME` extracted from URL for thumbnail scrubbing (e.g., `FOS_CAM01`)
   - Offset 0 = live, duration 7200 = 2hr DVR window

---

## 10. USER TIERS (from API)

| Tier | Access Level |
|------|-------------|
| `free` | Limited cameras, ads |
| `fireman` | More cameras, no ads |
| `conductor` | All cameras, DVR |
| `engineer` | All cameras, DVR, Review Ops, multi-view |
| `development` | Same as engineer + admin tools |
| `admin` | Full access, `is_admin: true` |

Paid tiers (can log sightings): `fireman`, `conductor`, `engineer`, `development`, `admin`

---

## 11. PRODUCTION SERVER INFO

- **Server**: `trn-webapp01` (Ubuntu 24.04)
- **App path**: `/var/www/railstream`
- **Process manager**: `pm2`
- **NFS mount**: `172.20.7.28:/mnt/RS_Rust/thumbs` → `/mnt/railstream-thumbs`
- **Network interface for NFS**: `enX1` (DHCP via Netplan)
- **Deploy command**: `cd /var/www/railstream && git pull && yarn build && pm2 restart all`

---

## 12. TESTING

- **Test file**: `/app/test_result.md` — MUST be read before invoking any testing agent
- **Backend testing**: Use `deep_testing_backend_nextjs` agent
- **Frontend testing**: ALWAYS ask user before running `deep_testing_frontend_nextjs`
- **Test credentials**: `chicagotest` / `sZyE8cDFk`
- **API key**: `web_9c8f46fd56486a168cca8cb9363b2f47`
- **Test camera ID**: `699894a055761e18195294e3` (Atlanta)

---

## 13. IMMEDIATE NEXT STEPS FOR NEW AGENT

1. **Complete the sighting form modal in WatchPage** (see section 7a above — ~30 min work)
2. **Add image attachment to `/sightings` page form** (drag/drop or file select)
3. **Test thumbnail scrubbing** on production (it works — user confirmed popup shows)
4. **Admin Panel** is the next major feature the user wants
5. **Player Dev Tools** (Shift+D) is a nice-to-have the user requested
