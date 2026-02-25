# RailStream Next.js Application - Deployment Checklist

## Server Requirements

### Software
- **Node.js**: v18.x or higher (LTS recommended)
- **Yarn**: v1.22.x (package manager)
- **PM2** or **systemd**: For process management
- **Nginx** or **Caddy**: Reverse proxy (optional but recommended)

### Hardware
- **RAM**: Minimum 2GB, 4GB+ recommended
- **CPU**: 2+ cores
- **Storage**: 10GB minimum

---

## Environment Variables (.env)

Create a `.env` file in the project root with these values:

```bash
# MongoDB (if using local features - optional for this app)
MONGO_URL=mongodb://localhost:27017/railstream

# Public URL (your domain)
NEXT_PUBLIC_BASE_URL=https://www.railstream.net

# RailStream API
RAILSTREAM_API_URL=https://api.railstream.net

# Player embed secret (for signed URLs)
PLAYER_EMBED_SECRET=Ki$$leAndrea04

# Admin credentials for API access (get streams.web_hls data)
RAILSTREAM_ADMIN_USER=WEBSITE_ADMIN
RAILSTREAM_ADMIN_PASS=O3c4DFmES
```

---

## Nuevo License Domain

**CRITICAL**: Your Nuevo Video.js license must include the deployment domain.

Currently allowed domains (from player.railstream.net CSP):
- `railstream.net`
- `www.railstream.net`
- `railstream.tv`
- `www.railstream.tv`
- `*.railstream.net`
- `*.railstream.tv`

If deploying to a new domain, update your Nuevo license.

---

## Deployment Steps

### 1. Clone and Install

```bash
# Clone the repo (or copy files)
cd /var/www/railstream

# Install dependencies
yarn install --production

# Build the application
yarn build
```

### 2. Configure Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start yarn --name "railstream" -- start

# Save PM2 config
pm2 save

# Enable startup on boot
pm2 startup
```

### 3. Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    server_name www.railstream.net railstream.net;
    return 301 https://www.railstream.net$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.railstream.net;

    ssl_certificate /etc/letsencrypt/live/railstream.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/railstream.net/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d railstream.net -d www.railstream.net
```

---

## API Endpoints Used

Your FastAPI server provides these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cameras/catalog` | GET | List all cameras |
| `/api/auth/login` | POST | User authentication |
| `/api/playback/authorize` | POST | Legacy mobile playback |
| `/api/playback/web-authorize` | POST | Web playback with wms_auth |
| `/api/admin/cameras` | GET | Admin camera data (requires auth) |

---

## Files Structure

```
/app/
├── app/                    # Next.js pages
│   ├── page.js            # Main app (home, watch, about)
│   ├── cameras/page.js    # Camera directory
│   ├── 15years/page.js    # Anniversary celebration
│   ├── host/page.js       # Host recruitment
│   ├── api/[[...path]]/   # API proxy routes
│   └── globals.css        # Global styles
├── components/
│   ├── RailStreamPlayer.js # Video player component
│   └── ui/                 # Shadcn UI components
├── lib/
│   ├── api.js             # API client
│   └── auth.js            # Auth helpers
├── public/
│   └── vendor/nuevo/      # Video.js + Nuevo assets
├── .env                   # Environment variables
└── package.json
```

---

## Post-Deployment Tasks

### 1. Configure Camera web_hls URLs
For each camera in your admin panel, ensure `streams.website_hls` is set:
```
https://media01.railstream.net/q3ChrEVX4nmXXuAu/{NIMBLE_CAM_ID}/
```

### 2. Test Video Playback
1. Navigate to /cameras
2. Click a Fostoria camera (FOS-WEST, etc.)
3. Verify video plays in the embed player

### 3. Monitor Logs
```bash
# PM2 logs
pm2 logs railstream

# Nginx logs
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Video Not Playing
1. Check Nuevo license covers domain
2. Verify `streams.website_hls` is set in camera config
3. Check `wmsAuthSign` token generation in API

### API Errors
1. Verify RAILSTREAM_ADMIN credentials
2. Check API server is reachable
3. Review Next.js server logs

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
yarn install
yarn build
```

---

## Future Development Notes

### DVR Feature (Coming)
The player source includes DVR/Review Ops code. To enable:
1. Study `/player_source/assets/js/v3.1.0/rs-media.js`
2. The timeshift URL format: `playlist_dvr_timeshift-{offset}-{duration}.m3u8`
3. Thumbnails available at: `{thumb_base}/{unix_timestamp}.jpg`

### Multi-View Quality Switching
For dual/quad views, use lower quality streams:
- Single: `streams.website_hls` (1080p)
- Dual: `streams.hls_720p`
- Quad+: `streams.hls_540p`

---

## Contact

For issues with this application, check:
- Next.js docs: https://nextjs.org/docs
- Video.js docs: https://videojs.com/guides
- Nuevo docs: https://www.nuevodevel.com/nuevo/

For RailStream API issues, contact your API team.
