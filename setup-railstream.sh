#!/bin/bash
#===============================================================================
# RailStream Web App - Complete Server Setup Script
# Repository: github.com/mkisser-cmyk/RailStream-Web-App-v4
#
# This script sets up a fresh Ubuntu 22.04/24.04 server to host the RailStream
# Next.js web application with MongoDB for chat and Nginx as reverse proxy.
#
# Usage: 
#   chmod +x setup-railstream.sh
#   sudo ./setup-railstream.sh
#
# After running, edit /var/www/railstream/.env with your credentials
#===============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RailStream Web App - Server Setup Script            ║"
echo "║                                                               ║"
echo "║  This will install: Node.js 20, MongoDB, Nginx, PM2          ║"
echo "║  And configure everything for the RailStream web app         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo ./setup-railstream.sh)${NC}"
    exit 1
fi

# Get the domain name
read -p "Enter your domain name (e.g., www.railstream.net): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME="www.railstream.net"
fi
echo -e "${GREEN}Using domain: $DOMAIN_NAME${NC}"

# Get GitHub repo (default to the one in screenshot)
GITHUB_REPO="https://github.com/mkisser-cmyk/RailStream-Web-App-v4.git"
echo -e "${GREEN}Using GitHub repo: $GITHUB_REPO${NC}"

echo ""
echo -e "${YELLOW}Step 1/8: Updating system packages...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${YELLOW}Step 2/8: Installing essential packages...${NC}"
apt install -y curl wget git build-essential software-properties-common gnupg ca-certificates

echo ""
echo -e "${YELLOW}Step 3/8: Installing Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo -e "${GREEN}Node.js version: $(node -v)${NC}"
echo -e "${GREEN}npm version: $(npm -v)${NC}"

# Install Yarn globally
npm install -g yarn
echo -e "${GREEN}Yarn version: $(yarn -v)${NC}"

echo ""
echo -e "${YELLOW}Step 4/8: Installing MongoDB 7.0...${NC}"
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repo (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod
echo -e "${GREEN}MongoDB installed and running${NC}"

echo ""
echo -e "${YELLOW}Step 5/8: Installing PM2 process manager...${NC}"
npm install -g pm2
echo -e "${GREEN}PM2 version: $(pm2 -v)${NC}"

echo ""
echo -e "${YELLOW}Step 6/8: Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
echo -e "${GREEN}Nginx installed${NC}"

echo ""
echo -e "${YELLOW}Step 7/8: Cloning and setting up RailStream app...${NC}"

# Create app directory
mkdir -p /var/www
cd /var/www

# Clone the repository
if [ -d "railstream" ]; then
    echo -e "${YELLOW}Directory exists, pulling latest changes...${NC}"
    cd railstream
    git pull origin main
else
    git clone $GITHUB_REPO railstream
    cd railstream
fi

# Create .env file
echo -e "${YELLOW}Creating .env file...${NC}"
cat > .env << 'ENVFILE'
# RailStream Web App Configuration
# Edit these values with your actual credentials

# Public URL (your domain)
NEXT_PUBLIC_BASE_URL=https://DOMAIN_PLACEHOLDER

# RailStream API
RAILSTREAM_API_URL=https://api.railstream.net

# Player embed secret
PLAYER_EMBED_SECRET=Ki$$leAndrea04

# Admin credentials for API access
RAILSTREAM_ADMIN_USER=WEBSITE_ADMIN
RAILSTREAM_ADMIN_PASS=O3c4DFmES

# MongoDB for chat
MONGO_URL=mongodb://localhost:27017/railstream
ENVFILE

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" .env

echo -e "${GREEN}.env file created at /var/www/railstream/.env${NC}"

# Install dependencies
echo -e "${YELLOW}Installing Node.js dependencies (this may take a few minutes)...${NC}"
yarn install

# Build the application
echo -e "${YELLOW}Building Next.js application...${NC}"
yarn build

echo ""
echo -e "${YELLOW}Step 8/8: Configuring Nginx and PM2...${NC}"

# Create Nginx config
cat > /etc/nginx/sites-available/railstream << NGINXCONF
# RailStream Web App - Nginx Configuration

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME;
    return 301 https://\$server_name\$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_NAME;

    # SSL certificates (will be configured by certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;

    # For initial setup without SSL, comment out the ssl lines above
    # and use this temporary self-signed config:
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Logging
    access_log /var/log/nginx/railstream_access.log;
    error_log /var/log/nginx/railstream_error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINXCONF

# Enable the site
ln -sf /etc/nginx/sites-available/railstream /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

# Create PM2 ecosystem file
cat > /var/www/railstream/ecosystem.config.js << 'PM2CONFIG'
module.exports = {
  apps: [{
    name: 'railstream',
    cwd: '/var/www/railstream',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
PM2CONFIG

# Start the application with PM2
cd /var/www/railstream
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    SETUP COMPLETE! 🎉                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Edit your .env file with correct credentials:${NC}"
echo "   nano /var/www/railstream/.env"
echo ""
echo -e "${YELLOW}2. Set up SSL certificate with Let's Encrypt:${NC}"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d $DOMAIN_NAME"
echo ""
echo -e "${YELLOW}3. After SSL, update Nginx config:${NC}"
echo "   - Edit /etc/nginx/sites-available/railstream"
echo "   - Comment out the snakeoil certificate lines"
echo "   - Uncomment the letsencrypt certificate lines"
echo "   - Run: systemctl reload nginx"
echo ""
echo -e "${YELLOW}4. Configure your DNS:${NC}"
echo "   Point $DOMAIN_NAME to this server's IP address"
echo ""
echo -e "${YELLOW}5. Test your site:${NC}"
echo "   https://$DOMAIN_NAME"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "   pm2 status           - Check app status"
echo "   pm2 logs railstream  - View app logs"
echo "   pm2 restart all      - Restart the app"
echo "   pm2 monit            - Monitor resources"
echo ""
echo -e "${BLUE}File Locations:${NC}"
echo "   App:    /var/www/railstream/"
echo "   Logs:   pm2 logs or /var/log/nginx/"
echo "   Nginx:  /etc/nginx/sites-available/railstream"
echo "   .env:   /var/www/railstream/.env"
echo ""
echo -e "${GREEN}RailStream is now running at http://localhost:3000${NC}"
echo -e "${GREEN}(Will be available at https://$DOMAIN_NAME after DNS + SSL setup)${NC}"
