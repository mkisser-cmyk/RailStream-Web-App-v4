# RailStream Web App — Fork Handoff (Session 3)

## What Was Built This Session

### 1. ✅ "Log Sighting from Player" (P0 — Complete)
- `onLogSighting` callback wired to both HlsPlayer instances (focused + grid view)
- Full modal form in WatchPage: snapshot preview, pre-filled camera/timestamp, railroad/train type/direction dropdowns, locomotive & notes fields
- Submit flow: create sighting → upload snapshot image → close modal

### 2. ✅ Sightings Page Redesign (`/sightings`)
- Premium dark control-room theme matching rest of site
- SiteHeader for consistent nav
- Stats dashboard (Total, Today, Top Railroad, Top Location)
- **Leaderboard / Points System** — TOP SPOTTERS section, 10 pts per sighting, gold/silver/bronze medals
- Collapsible filters with active count badges
- Snapshot images with lightbox viewer
- Railroad brand color badges (CSX blue, BNSF orange, UP yellow, etc.)
- Proper numbered pagination

### 3. ✅ Replay from Sightings ("Jump to Archive")
- Replay button on each sighting entry (within 7-day DVR window)
- URL format: `/?watch=CAMERA_ID&seek=SECONDS_AGO`
- App detects URL params → auto-loads camera → builds timeshift DVR URL
- For sightings > 5 min old: builds `playlist_dvr_timeshift-{offset}-3600.m3u8` (1-hour window centered on sighting)
- Sighting centered in middle of DVR window with 120s buffer for processing delay

### 4. ✅ Device Registration Fix
- Root cause: web app never called `POST /api/devices/register` after login
- Now auto-registers on login with full device info: `device_name: "Chrome on macOS"`, `device_model`, `os_version`, `app_version`
- Device now appears in Tower alongside native apps (iPhone, iPad, Android)

### 5. ✅ Full Device API Surface
- `POST /api/devices/register` — register device (NEW)
- `GET /api/devices` — list devices (existing)
- `DELETE /api/devices/{device_id}` — remove device (existing)
- `PATCH /api/devices/{device_id}` — rename device (proxy ready, API not yet implemented)
- **Kick detection**: heartbeat + playback responses checked for `device_removed` / `device_not_registered` → auto-logout

### 6. ✅ Enhanced Heartbeat with QoE Metrics
- Now sends every 30s: `state` (playing/paused/buffering), `position_seconds`, `device_model`, `os_version`, `app_version`, `client_type: "web"`, `player_version: "hls.js"`, `connection_type` (wifi/4g), `buffer_count`, `buffer_time_seconds`, `error_count`
- HlsPlayer tracks buffer events and reports stats via `onStatsUpdate` callback

### 7. ✅ Favorites API Integration
- Integrated with backend API instead of local-only storage
- `GET /api/favorites` — loads on login
- `POST /api/favorites/{camera_id}` — instant add on star click
- `DELETE /api/favorites/{camera_id}` — instant remove on star click
- `PUT /api/favorites` — bulk sync for reordering
- Favorites now persist across devices

### 8. ✅ Camera List Sorted by State
- Changed from regional grouping (East Coast, Midwest) to alphabetical by state
- Orange state abbreviation badges (CA, FL, GA, IL...)
- Cameras sorted alphabetically within each state
- Favorites section always at top

### 9. ✅ Accessibility Pass (WCAG 2.1 AA)
- **P0 Contrast**: All `text-white/20-50` bumped to minimum `text-white/60-70` across every file
- **P0 Readability**: Empty slot text bumped to text-lg/text-base with font-bold
- **P1 Focus rings**: All inputs/selects now have visible `focus:ring-2 focus:ring-[#ff7a00]/60`
- **P1 Labels**: `htmlFor`/`id` pairs on all 16+ form labels for screen readers
- **P1 Aria**: `aria-label` on player icon buttons
- Skip-nav link already present

### 10. ✅ Bug Fixes
- **Thumbnail overflow**: Clamped to viewport edges with 8px padding
- **Smaller thumbnails in multi-view**: 160×90 in quad/nine vs 240×135 in single
- **Review Ops opening on camera switch**: Fixed by tracking prev counter value
- **Review Ops silent fail on future time**: Now shows red error banner + smart defaults (1 hour ago)
- **Thumbnail wrong time in historical DVR**: Fixed by extracting `dvrUrlOffset` from stream URL
- **Time label in review mode**: Shows actual wall-clock time (e.g., "2:59:45 PM") instead of offset
- **White/blank thumbnail**: Added `thumbFailSet`, dimension validation, `onError` fallback
- **SiteHeader auth**: Now auto-detects logged-in user across all standalone pages
- **Expand button**: Bigger, with proper styled tooltip "Expand to Full View"

---

## IN PROGRESS / NOT YET IMPLEMENTED

### 🔴 P0: Thumbnail & Logger Latency Compensation
**Status: NOT STARTED — requested by user, needs next fork**

**Problem:** Thumbnails and the sighting logger timestamp are ~20-30 seconds AHEAD of the actual video content. The thumbnail shows "2:30 PM" but the video at that seek position is actually showing 2:29:30 PM. This is because HLS live streaming has inherent latency (20-30s delay from real-time).

**Root Cause:** `streamEndUnixTime = Date.now()/1000 - dvrUrlOffset` assumes the live edge = current wall-clock time. But in reality, the live edge is ~20-30s behind real-time due to HLS segment buffering.

**Fix approach:**
1. Get actual latency from HLS.js: `hlsRef.current?.latency` (available in HLS.js API)
2. Store it in state: `const [hlsLatency, setHlsLatency] = useState(0)`
3. Update `streamEndUnixTime` calculation: `Date.now()/1000 - dvrUrlOffset - hlsLatency`
4. For sighting logger: subtract latency from captured timestamp in `handleLogSighting`
5. Fallback: if `hls.latency` unavailable, use a fixed 25-second offset

**Files to modify:**
- `components/HlsPlayer.js` — get `hls.latency`, pass to `streamEndUnixTime` calc
- `app/page.js` — adjust sighting timestamp in `handleLogSighting`

### 🟡 P1: Amtrak Train Numbers per Location
**Status: DISCUSSED, NOT STARTED**

User wants a static mapping of Amtrak train numbers per camera location:
- Atlanta, GA → #19/#20 (Crescent)
- Fostoria, OH → #48/#49 (Lake Shore Limited), #29/#30 (Capitol Limited)
- When "Amtrak" is selected as railroad, show quick-pick buttons for known trains at that camera

### 🟡 P2: "My Devices" Management Page
**Status: API proxies ready, UI NOT built**

Need to build a page in the account area:
- List all registered devices with name, model, OS, last seen
- "Remove" button to DELETE a device
- Rename functionality (when API supports PATCH)

---

## KEY TECHNICAL DETAILS FOR NEXT FORK

### Authentication
- Token stored in `localStorage` as `railstream_token`
- `lib/auth.js` manages get/set/clear
- `lib/api.js` handles login + auto device registration
- SiteHeader auto-detects auth if no `user` prop passed

### Device Registration Flow
1. User logs in → `clientApi.login()` in `lib/api.js`
2. On success, auto-calls `POST /api/devices/register` with device info
3. Heartbeat every 30s includes device info + QoE metrics
4. On tab close: `sendBeacon` to `/api/playback/stop`
5. Kick detection: if heartbeat returns `device_removed` → auto-logout

### Favorites Flow
- On login: `GET /api/favorites` → load into state
- Star click: `POST /api/favorites/{id}` (add) or `DELETE /api/favorites/{id}` (remove)
- Also stored in localStorage as fallback

### Sightings Flow
- MongoDB collection: `train_sightings` (direct DB, not proxied to API)
- CRUD at `/api/sightings`
- Image upload: `POST /api/sightings/upload` with base64 `image_data`
- Images saved to `/app/uploads/sightings/`
- Served via `GET /api/sightings/image/{filename}`
- Stats + leaderboard: `GET /api/sightings/stats`

### DVR / Replay Architecture
- Live stream: `playlist_dvr_timeshift-0-604800.m3u8` (7-day window)
- Historical: `playlist_dvr_timeshift-{offset}-{window}.m3u8`
- `offset` = seconds back from now to the window's newest point
- For replay: offset = `seekSecs - windowSec/2 + 120` (centered + buffer)
- Thumbnail timestamp: `streamEndUnixTime = Date.now()/1000 - dvrUrlOffset`

### File Structure (modified this session)
```
/app
├── app/
│   ├── sightings/page.js     # REDESIGNED: leaderboard, filters, images
│   ├── page.js                # HEAVILY MODIFIED: sighting modal, favorites API, device reg, replay, accessibility
│   └── api/[[...path]]/route.js  # MODIFIED: favorites proxy, devices/register proxy, PATCH proxy, leaderboard stats
├── components/
│   ├── HlsPlayer.js           # MODIFIED: thumbnail fixes, DVR time calc, initialSeekOffset, QoE stats, review ops fixes
│   └── SiteHeader.js          # MODIFIED: auto-detect auth
├── lib/
│   ├── api.js                 # MODIFIED: device info on login, auto-register
│   └── auth.js                # unchanged
└── HANDOFF.md                 # Previous session handoff
```

### Test Credentials
- `chicagotest` / `sZyE8cDFk` (Engineer tier)
- `railstream` / `cn5453` (Admin tier)
- API Key: `web_9c8f46fd56486a168cca8cb9363b2f47`
- MongoDB: via `MONGO_URL` env var

### What's Working
- ✅ Video playback, multi-view (1/2/4/9/16)
- ✅ Thumbnail scrubbing (with viewport clamping + compact mode)
- ✅ DVR seeking + Review Ops
- ✅ Session/device management with full QoE heartbeat
- ✅ Device registration (shows in Tower)
- ✅ Train Log (sightings) CRUD + images + leaderboard
- ✅ Log sighting from player
- ✅ Replay from sightings (time-centered DVR window)
- ✅ Favorites synced with backend API
- ✅ Auth state across all pages
- ✅ WCAG 2.1 AA contrast + focus + labels

### What's Broken / Needs Work
- 🔴 Thumbnail timestamps ~20-30s ahead (HLS latency not compensated)
- 🔴 Sighting logger timestamp ~20-30s ahead (same cause)
- 🟡 Archive replay centering may still be slightly off (user reported ~2min, we added 120s buffer — needs production validation)
