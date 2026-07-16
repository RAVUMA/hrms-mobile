# Hosting Plan — HJ Holdings HRMS (Mobile Web App)

This is a **static single-page app** (React + Vite, built to plain HTML/CSS/JS).
There is no server-side code to run in production — `npm run build` produces
a `dist/` folder, and that's the entire deployment. No Node.js process needs
to stay running on the VPS.

It talks to the existing Horilla backend at `https://hrms.hjholdings.lk/api`
over the network — this app doesn't need its own database or backend, just
a place to serve static files over HTTPS.

**Status: hosted and live at `https://mobile.hjholdings.lk`.** One
outstanding blocker remains — see Step 5. Login currently fails because the
backend hasn't allowed this origin yet (confirmed via direct testing: the
backend's response still has no `Access-Control-Allow-Origin` header for
requests from `https://mobile.hjholdings.lk`).

---

## Requirements before you start

1. **A domain or subdomain** pointed at the VPS (e.g. `mobile.hjholdings.lk`).
   Get an A record added in DNS pointing to the VPS's IP address.
2. **HTTPS is mandatory, not optional.** The app uses the browser's
   Geolocation API (for the Clock In/Out feature, matching an office
   geofence). Browsers **refuse to expose location at all** on a plain
   `http://` origin (only `https://` or `localhost` are treated as
   "secure contexts"). Skipping SSL means Clock In/Out will silently fail
   for every user.
3. **Nginx** (or any static file server / reverse proxy — instructions below
   assume Nginx since it's the most common).
4. **Node.js 20+** only needed temporarily to run the build (either on the
   VPS, or build locally and upload the `dist/` folder — either works, see
   Step 1).

---

## Step 1 — Build the app

Either on the VPS, or on a dev machine and upload the result:

```bash
npm install
npm run build
```

This produces a `dist/` folder containing static files (`index.html`,
`assets/*.js`, `assets/*.css`). This whole folder is what gets deployed —
nothing else from the repo is needed at runtime.

## Step 2 — Put the files on the VPS

Copy the contents of `dist/` to somewhere Nginx can serve, e.g.:

```bash
mkdir -p /var/www/hj-mobile
# copy dist/* into /var/www/hj-mobile
```

## Step 3 — Nginx config

This is a client-side-routed SPA (React Router) — the server must serve
`index.html` for **any** path that doesn't match a real file, and let the
app's JavaScript handle routing itself. Without the `try_files` fallback
below, refreshing the page on e.g. `/leaves` will 404.

```nginx
server {
    listen 80;
    server_name mobile.hjholdings.lk;

    root /var/www/hj-mobile;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache hashed asset files aggressively; they change name on every build
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Step 4 — HTTPS via Let's Encrypt (certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mobile.hjholdings.lk
```

Certbot edits the Nginx config in place to add the SSL certificate and a
redirect from port 80 → 443. Confirm afterward that `https://mobile.hjholdings.lk`
loads and that plain `http://` redirects to it.

## Step 5 — Backend CORS update (separate repo/server)

The `hrms-horilla` backend (wherever it's hosted — may be this same VPS or a
different one) needs to allow this app's real domain to call its API. In
that project's production `.env`, add/update:

```
CORS_ALLOWED_ORIGINS=https://mobile.hjholdings.lk
```

(comma-separate additional origins if there are more, e.g. keeping
`http://localhost:5173` for local development testing)

Then restart that Django service. See the `hrms-horilla` repo's own
`CORS_FIX_DEPLOYMENT.md` for full details and a curl command to verify this
step specifically — **this app's login will not work until that's done**,
regardless of how correctly this app itself is hosted.

## Step 6 — Verify

1. Visit `https://mobile.hjholdings.lk` — should load the login screen.
2. Try logging in with a real account — confirms CORS is correctly
   configured on the backend (Step 5).
3. Navigate to a sub-page (e.g. Modules → Employees) and refresh the
   browser on that URL directly — confirms the Nginx `try_files` fallback
   (Step 3) is working; a 404 here means that config is missing/wrong.
4. Try Clock In/Out — confirms HTTPS is active (Step 4); a permission
   prompt for location should appear. If it's silently unavailable, the
   site isn't being served over HTTPS.

---

## Updating the app later

There's no CI/CD set up yet — each update is manual:
```bash
npm run build
# re-copy the new dist/ folder to /var/www/hj-mobile, replacing the old one
```
No Nginx reload or service restart is needed for static file updates —
changes take effect immediately for new page loads.
