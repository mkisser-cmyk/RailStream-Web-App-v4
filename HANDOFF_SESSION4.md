# RailStream Web App — Session 4 Handoff
## Updated: March 11, 2026

---

## COMPLETED THIS SESSION

### P0 Fixes
1. **HLS Timestamp Latency Compensation** — Added `hlsLatency` state tracking via `hls.latency` API. Fixed `streamEndUnixTime` and sighting logger to subtract live latency. Thumbnails and sighting timestamps now match actual video content.
2. **Quality Caps Fixed** — Replaced broken hardcoded `autoLevelCapping` indices with resolution-aware `findLevelForMaxHeight()` that inspects actual HLS levels. Dual=720p, Quad=540p, Nine/Sixteen=360p.
3. **Sign Out Device Removal** — `handleLogout()` now calls `DELETE /api/devices/{device_id}` before clearing auth.

### Navigation & Pages
4. **Nav Restructured** — 8 crowded items → 4 top-level + "About ▾" dropdown (Our Story, Our Technology, Host a Camera, 15 Year Anniversary, Network Status).
5. **New "Our Technology" Page** (`/technology`) — Premium showcase: hero, stats bar (40+ sites, 15-20 TB/day, 375 feeds, 2-3 Gbps), "No YouTube. No CDN. Just Us.", infrastructure grid, audio section, AI section, comparison table, co-founders section (Mike Kisser & Andrea Mercatante), 250K Roku installs callout, CTA. All photos from UniFi case study.
6. **Nav Consistency** — Fixed TIERS colors mismatch between SiteHeader.js and page.js. Added admin badge logic to SiteHeader. Added localStorage-first user detection for instant rendering.
7. **Watch Routing** — Added `?page=watch|about|login` URL param handling so clicking "Watch" from standalone pages works.

### Ad System (Foundation)
8. **Backend API** (`/api/ads`) — Full CRUD with admin auth enforcement. MongoDB `ads` collection. Types: preroll, midroll, companion.
9. **Admin Ad Manager Modal** — Purple "Ads" button in toolbar (admin only). Tabbed interface (Sidebar/Pre-Roll/Mid-Roll). Add/edit/delete/toggle ads.
10. **Companion Sidebar** — 300px panel right of player for non-signed-in users. "Go Ad-Free" upsell, sponsored label, auto-rotation for multiple ads.
11. **Pre-Roll Overlay** — Full-screen ad before stream loads for free users. Countdown + skip button. Image and video support.

### UI/UX
12. **Login Modal Redesigned** — Centered logo with orange glow, "Welcome Back" heading, proper labels, "Join Today" footer.
13. **Cookie Consent Banner** — Bottom banner with Accept All / Customize / Reject All. Expandable toggles for Essential, Functional, Analytics cookies.
14. **My Layouts Locked** — Free users see greyed-out lock icon with toast "Sign in to save layouts."
15. **Network Status Cleaned Up** — Removed Bitrate and CPU from public-facing page, shows Uptime only.
16. **Sighting Timestamps** — Now include seconds (10:43:27 AM instead of 10:43 AM).
17. **Multi-view Labels** — Camera name/location moved from bottom to top of tiles. Z-index fixed so mute button stays above label.
18. **Offline/Coming Soon Badges** — Camera picker shows red "Offline" and orange "Coming Soon" overlays on thumbnails.

---

## TODO LIST (Priority Order)

### P0 — Immediate
- [x] **Offline/Coming Soon Modal** — When clicking offline or coming_soon camera, show a MODAL popup (not in-slot display) matching the app design:
  - **Offline:** Camera-off icon, "Camera Offline" heading, location in orange, "This camera is currently offline due to service interruption, maintenance, or site conditions. Please check back soon.", "Go Back" button
  - **Coming Soon:** "COMING SOON" badge with sparkle, camera name large, location, description from API, "This camera is a future release. We're working hard to bring you this view soon!", "Get Notified When Live" orange button, "Follow us for updates" with Facebook + Website links
  - Works from Watch page sidebar picker AND standalone /cameras page

### P1 — High Priority
- [x] **Mid-Roll Ad Display** — YouTube-style split-screen: camera shrinks to ~35% left (muted), ad panel takes ~65% right (with sound). First midroll after 2 min, then every `interval` min (admin configurable). Skip countdown + "Skip Ad →" button. Companion sidebar hides during midroll. Chat hidden during midroll. "Go Ad-Free" + "Stream is still live" labels.
- [ ] **Pre-fill Train Numbers in Sighting Form** — For certain locations, pre-populate a dropdown with known train numbers (e.g., "Amtrak 20, Amtrak 21" for Atlanta). Requires adding schedule data to camera info.
- [ ] **VAST Tag Integration** — Camera objects have `vast_tag_url` field. Wire this into the pre-roll ad system so camera-specific VAST ads can play.

### P2 — Medium Priority
- [ ] **Device Management UI** — New page in user account area: `GET /api/devices` list, `DELETE /api/devices/{device_id}` button, `PATCH` to rename. Show device type, last active, registered date.
- [ ] **Ad Impressions Tracking** — Track ad views and clicks in MongoDB. Show basic stats in admin panel (impressions, CTR).
- [ ] **Ad Scheduling/Rotation** — Time-based ad scheduling (e.g., show ad X only 6pm-12am). Weight-based rotation between multiple ads of same type.

### P3 — Lower Priority
- [ ] **Admin Panel (Full)** — Dedicated admin interface for managing ad content, editing static page text, camera metadata, and user management.
- [ ] **Player "Stats for Nerds"** — Overlay showing buffer health, resolution, bitrate, latency, dropped frames.
- [ ] **Refactor page.js** — The main `app/page.js` is a critically oversized god-component (~3600 lines). Break into custom hooks (useAuth, useFavorites, usePlaybackSessions, useAds) and smaller components.

### P4 — Future
- [ ] **Store Sighting Video Clips** — Investigate saving short video clips of sightings.
- [ ] **PWA Push Notifications** — Train alerts via service worker.
- [ ] **AI Train Classification Integration** — Wire into the GPU farm's AI detection for real-time alerts.

---

## ARCHITECTURE NOTES

### Key Files Modified This Session
- `components/HlsPlayer.js` — Latency tracking, resolution-aware quality caps
- `components/SiteHeader.js` — Complete rewrite with About dropdown, consistent auth display
- `components/CookieConsent.js` — NEW: Cookie consent banner
- `app/page.js` — Nav rewrite, ad system, pre-roll, offline/coming_soon handling, login redesign, layouts lock
- `app/technology/page.js` — NEW: Our Technology page
- `app/layout.js` — Added CookieConsent import
- `app/api/[[...path]]/route.js` — Ads CRUD endpoints
- `app/network-status/page.js` — Removed internal metrics
- `app/sightings/page.js` — Seconds in timestamps

### Ad System Schema (MongoDB `ads` collection)
```json
{
  "_id": "uuid",
  "type": "preroll | midroll | companion",
  "title": "string",
  "imageUrl": "string",
  "videoUrl": "string (for preroll)",
  "clickUrl": "string",
  "enabled": true,
  "skipAfter": 5,
  "interval": 15,
  "priority": 10,
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Quality Cap System
```javascript
QUALITY_TARGET = {
  single: -1,     // Auto ABR
  dual: 720,      // 720p max
  quad: 540,      // 540p max
  nine: 360,      // 360p max
  sixteen: 360,   // 360p max
}
// Uses findLevelForMaxHeight(hls, maxHeight) to match by actual resolution
```

### API Endpoints Added
- `GET /api/ads` — Public: enabled ads only. Admin: all ads + isAdmin flag
- `POST /api/ads` — Create ad (admin only)
- `PUT /api/ads/{id}` — Update/toggle ad (admin only)
- `DELETE /api/ads/{id}` — Delete ad (admin only)

### Test Credentials
- Admin: `railstream` / `cn5453`
- User: `chicagotest` / `sZyE8cDFk`

---

## KNOWN ISSUES
- **page.js is ~3600 lines** — Urgently needs refactoring into hooks/components
- **Pre-roll latency compensation** — Needs production validation with real streams
- **Archive replay centering** — 120s buffer added previously, needs production validation
