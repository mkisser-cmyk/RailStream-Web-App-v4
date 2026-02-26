# RailStream Web App - Complete Deployment Guide

## Overview

This guide will walk you through setting up a fresh Ubuntu server to host the RailStream Next.js web application.

**GitHub Repository:** `github.com/mkisser-cmyk/RailStream-Web-App-v4`

---

## Part 1: Create Your VM

### Option A: DigitalOcean (Recommended)

1. Go to [DigitalOcean](https://digitalocean.com)
2. Create a Droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic - $12/mo (2GB RAM, 1 vCPU, 50GB SSD)
   - **Datacenter:** Choose closest to your users
   - **Authentication:** SSH Key (recommended) or Password
   - **Hostname:** `railstream-web`

### Option B: Vultr

1. Go to [Vultr](https://vultr.com)
2. Deploy New Server:
   - **Type:** Cloud Compute
   - **Location:** Your choice
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** $12/mo (2GB RAM, 1 vCPU)

### Option C: AWS EC2

1. Launch EC2 Instance:
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance Type:** t3.small (2GB RAM)
   - **Storage:** 30GB gp3
   - **Security Group:** Allow ports 22, 80, 443

### Option D: Self-Hosted / Proxmox / VMware

1. Create VM with:
   - **OS:** Ubuntu 22.04 LTS Server
   - **RAM:** 2GB minimum (4GB recommended)
   - **CPU:** 2 cores
   - **Storage:** 30GB minimum
   - **Network:** Static IP or DHCP reservation

---

## Part 2: DNS Configuration

Before setting up the server, configure your DNS:

1. Go to your domain registrar (GoDaddy, Cloudflare, etc.)
2. Add/Update DNS records:

```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          300
A       www     YOUR_SERVER_IP          300
CNAME   www     railstream.net          300  (alternative)
```

---

## Part 3: Server Setup (Automated)

### Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Download and Run Setup Script

```bash
# Download the setup script
curl -o setup-railstream.sh https://raw.githubusercontent.com/mkisser-cmyk/RailStream-Web-App-v4/main/setup-railstream.sh

# Make it executable
chmod +x setup-railstream.sh

# Run it
sudo ./setup-railstream.sh
```

The script will:
- ✅ Update system packages
- ✅ Install Node.js 20 LTS
- ✅ Install MongoDB 7.0
- ✅ Install Nginx
- ✅ Install PM2 process manager
- ✅ Clone your GitHub repository
- ✅ Build the Next.js app
- ✅ Configure Nginx reverse proxy
- ✅ Start the application

---

## Part 4: Manual Setup (Alternative)

If you prefer to set up manually, here are all the steps:

### 4.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn
```

### 4.3 Install MongoDB

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4.4 Install PM2 and Nginx

```bash
sudo npm install -g pm2
sudo apt install -y nginx
```

### 4.5 Clone and Build App

```bash
cd /var/www
sudo git clone https://github.com/mkisser-cmyk/RailStream-Web-App-v4.git railstream
cd railstream
sudo yarn install
sudo yarn build
```

### 4.6 Create .env File

```bash
sudo nano /var/www/railstream/.env
```

Add:
```
NEXT_PUBLIC_BASE_URL=https://www.railstream.net
RAILSTREAM_API_URL=https://api.railstream.net
PLAYER_EMBED_SECRET=Ki$$leAndrea04
RAILSTREAM_ADMIN_USER=WEBSITE_ADMIN
RAILSTREAM_ADMIN_PASS=O3c4DFmES
MONGO_URL=mongodb://localhost:27017/railstream
```

### 4.7 Start with PM2

```bash
cd /var/www/railstream
pm2 start yarn --name railstream -- start
pm2 save
pm2 startup
```

---

## Part 5: SSL Certificate Setup

After DNS propagation (can take up to 24 hours, usually minutes):

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d www.railstream.net -d railstream.net

# Certbot will automatically configure Nginx
```

---

## Part 6: Post-Setup Tasks

### 6.1 Configure Camera Stream URLs

In your RailStream Admin panel, for EACH camera, set `streams.website_hls`:

```
https://media01.railstream.net/q3ChrEVX4nmXXuAu/{NIMBLE_CAM_ID}/
```

Example camera mappings:
- FOS-WEST → `https://media01.railstream.net/q3ChrEVX4nmXXuAu/FOS_CAM01/`
- FOS-EAST → `https://media01.railstream.net/q3ChrEVX4nmXXuAu/FOS_CAM02/`
- etc.

### 6.2 Test the Application

1. Visit `https://www.railstream.net`
2. Check that cameras load
3. Try logging in
4. Test the chat
5. Verify all pages work

---

## Useful Commands

```bash
# View app status
pm2 status

# View app logs
pm2 logs railstream

# Restart app (after code changes)
pm2 restart railstream

# Monitor resources
pm2 monit

# Rebuild after git pull
cd /var/www/railstream
git pull origin main
yarn build
pm2 restart railstream

# View Nginx logs
tail -f /var/log/nginx/railstream_access.log
tail -f /var/log/nginx/railstream_error.log

# Restart Nginx
sudo systemctl restart nginx

# Check MongoDB status
sudo systemctl status mongod
```

---

## Updating the Application

When you push new code to GitHub:

```bash
cd /var/www/railstream
git pull origin main
yarn install          # Only if dependencies changed
yarn build
pm2 restart railstream
```

---

## Troubleshooting

### App Not Starting

```bash
# Check PM2 logs
pm2 logs railstream --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart railstream
```

### 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx config
sudo nginx -t

# Restart services
pm2 restart railstream
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

---

## File Locations

| What | Where |
|------|-------|
| Application | `/var/www/railstream/` |
| Environment Config | `/var/www/railstream/.env` |
| Nginx Config | `/etc/nginx/sites-available/railstream` |
| PM2 Config | `/var/www/railstream/ecosystem.config.js` |
| Nginx Logs | `/var/log/nginx/railstream_*.log` |
| MongoDB Data | `/var/lib/mongodb/` |
| SSL Certificates | `/etc/letsencrypt/live/www.railstream.net/` |

---

## Security Recommendations

1. **Firewall:** Enable UFW
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **SSH Key Auth:** Disable password login
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

3. **Auto Updates:** Enable unattended upgrades
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

---

## Future Enhancement: CMS Admin

A backend admin panel for editing static pages can be added later. This would allow:
- Edit About, Hosts, FAQ pages
- Add/remove host cards
- Update timeline events
- Manage announcements

This will be a separate feature added to the application.

---

## Support

For issues:
1. Check PM2 logs: `pm2 logs railstream`
2. Check Nginx logs: `/var/log/nginx/railstream_error.log`
3. Check MongoDB: `sudo systemctl status mongod`

---

**Good luck! 🚂 Your RailStream app will be live soon!**
