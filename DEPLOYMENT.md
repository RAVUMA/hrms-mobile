# HJ Holdings HRMS Mobile - Deployment Guide

## Prerequisites

- Node.js (v18+)
- npm
- PM2 (`npm install -g pm2`)
- CloudPanel (for reverse proxy)

## Initial Setup

```bash
# Clone the repo and navigate to the project
cd /path/to/hrms-mobile

# Install dependencies
npm install

# Build for production
npm run build
```

## Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.cjs

# Save process list so it persists across reboots
pm2 save

# Generate startup script (run the command it outputs)
pm2 startup
```

The app will be running on **port 5372**.

## CloudPanel Reverse Proxy

In CloudPanel, create a reverse proxy site for your domain and point it to:

```
http://127.0.0.1:5372
```

Domain: `mobile.hjholdings.lk`

## Common PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs hj-mobile

# Restart (after a new build)
pm2 restart hj-mobile

# Stop
pm2 stop hj-mobile

# Delete from PM2 process list
pm2 delete hj-mobile
```

## Redeployment (After Code Changes)

```bash
# Pull latest changes
git pull

# Install dependencies (if changed)
npm install

# Rebuild
npm run build

# Restart
pm2 restart hj-mobile
```
