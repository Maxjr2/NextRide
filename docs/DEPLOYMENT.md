# Deployment Guide

Self-hosting NextRide for a Radeln ohne Alter chapter.

**Minimum requirements:** 1 vCPU · 2 GB RAM · 20 GB storage  
Runs on any VPS, Raspberry Pi 4+, or donated server with Docker support.

---

## Option 1: Docker Compose (recommended)

The fastest way to get a production instance running.

### Prerequisites

- Docker 24+ and Docker Compose v2
- A domain name with DNS pointed at your server
- (Optional) An SMTP account for email notifications

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Maxjr2/nextride.git
cd nextride

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit both files — see "Configuration" below

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec api npm run db:migrate --workspace=apps/api

# 5. (Optional) Seed sample data
docker compose exec api npm run db:seed --workspace=apps/api
```

Services started by `docker compose up`:
- **api** — Express API on port 3001
- **web** — React frontend served by Nginx on port 80
- **db** — PostgreSQL 16
- **keycloak** — Keycloak 23 on port 8080 (admin / admin — change immediately)

### Updating

```bash
git pull
docker compose build
docker compose up -d
docker compose exec api npm run db:migrate --workspace=apps/api
```

---

## Option 2: Manual (without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Keycloak 23+ (or use the [Keycloak Docker image](https://www.keycloak.org/getting-started/getting-started-docker) standalone)
- A process manager (PM2 recommended) or systemd

### Steps

```bash
# 1. Clone
git clone https://github.com/Maxjr2/nextride.git
cd nextride

# 2. Install dependencies
npm install

# 3. Configure
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env

# 4. Build
npm run build

# 5. Run migrations
npm run db:generate --workspace=apps/api
npm run db:migrate --workspace=apps/api

# 6. Start with PM2
npm install -g pm2
pm2 start apps/api/dist/index.js --name nextride-api
pm2 save
pm2 startup   # follow the printed instructions

# 7. Serve the frontend
# The built frontend is in apps/web/dist — serve with Nginx (see below)
npm run build --workspace=apps/web
```

---

## Configuration

### API (`apps/api/.env`)

```dotenv
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

MOCK_MODE=false

DATABASE_URL=postgresql://nextride:STRONG_PASSWORD@localhost:5432/nextride

KEYCLOAK_ISSUER=https://auth.your-domain.org/realms/nextride
KEYCLOAK_AUDIENCE=nextride-api

CORS_ORIGIN=https://your-domain.org

SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=notifications@your-domain.org
SMTP_PASS=your-smtp-password
SMTP_FROM="NextRide <notifications@your-domain.org>"

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### Frontend (`apps/web/.env`)

```dotenv
VITE_MOCK_MODE=false
VITE_API_URL=https://your-domain.org/api
VITE_KEYCLOAK_URL=https://auth.your-domain.org
VITE_KEYCLOAK_REALM=nextride
VITE_KEYCLOAK_CLIENT_ID=nextride-web
```

---

## Keycloak Setup

### 1. Create the realm

In the Keycloak admin console (default: http://your-server:8080, credentials: admin / admin — change immediately):

1. **Add realm** → name it `nextride`
2. Under **Realm Settings → General**: set Display Name to "NextRide"
3. Under **Realm Settings → Login**: enable "User registration" if riders should self-register

### 2. Create the API client

1. **Clients → Create client**
2. Client ID: `nextride-api`
3. Client authentication: **On** (confidential)
4. Note the client secret — not needed in `.env` since the API validates JWTs via JWKS

### 3. Create the frontend client

1. **Clients → Create client**
2. Client ID: `nextride-web`
3. Client authentication: **Off** (public)
4. Valid redirect URIs: `https://your-domain.org/*`
5. Web origins: `https://your-domain.org`

### 4. Create realm roles

Under **Realm roles → Create role**, add:
- `pilot`
- `rider`
- `facility`
- `coordinator`

Assign roles to users under **Users → [user] → Role mapping**.

### 5. Verify a pilot

Pilot accounts must be manually activated after in-person training. Set the `pilot` role only after training is confirmed.

---

## Nginx Configuration

Serve the frontend and proxy API requests from a single domain:

```nginx
server {
    listen 80;
    server_name your-domain.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.org;

    ssl_certificate     /etc/letsencrypt/live/your-domain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.org/privkey.pem;

    # Frontend (built React app)
    root /path/to/nextride/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Get a free TLS certificate with [Let's Encrypt](https://letsencrypt.org/):

```bash
certbot --nginx -d your-domain.org
```

---

## Database

### Backups

Set up automated daily backups. Example using `pg_dump` and a cron job:

```bash
# /etc/cron.d/nextride-backup
0 3 * * * postgres pg_dump nextride | gzip > /backups/nextride-$(date +\%Y\%m\%d).sql.gz
# Retain 30 days
0 4 * * * find /backups -name "nextride-*.sql.gz" -mtime +30 -delete
```

### Migrations

Always run migrations before deploying a new version:

```bash
npm run db:migrate --workspace=apps/api
```

Migrations are idempotent — safe to run on an already-current database.

---

## GDPR Considerations

NextRide processes personal data (names, phone numbers, ride history). Ensure:

1. **Data Processing Agreement** with your hosting provider
2. **EU-hosted servers** are strongly recommended for GDPR compliance
3. **Ride logs are anonymized after 12 months** — the seed script includes this policy; do not disable it
4. **Data export and deletion** on user request — available via the coordinator panel (planned in v1)
5. **Privacy policy** must be linked from the "Mehr" page in the frontend

---

## Monitoring

### Health check endpoint

```bash
curl https://your-domain.org/api/health
# → { "status": "ok", "mockMode": false, "env": "production", "timestamp": "..." }
```

Use this with uptime monitoring (UptimeRobot, Healthchecks.io, etc.).

### Logs

In Docker:

```bash
docker compose logs -f api
```

With PM2:

```bash
pm2 logs nextride-api
```

Log level is controlled by `LOG_LEVEL` in `.env`. Use `info` in production; `debug` only for troubleshooting.

---

## Troubleshooting

**API returns 401 on all requests**
- Check `KEYCLOAK_ISSUER` matches exactly the issuer in your JWTs (`iss` claim)
- Verify the JWKS endpoint is reachable from the API server: `curl $KEYCLOAK_ISSUER/protocol/openid-connect/certs`

**Frontend shows blank page after deploy**
- Ensure Nginx `try_files` falls back to `/index.html` (required for React Router)
- Check browser console for a failed fetch to `VITE_API_URL`

**Database connection refused**
- Confirm `DATABASE_URL` in `.env` points to the correct host and port
- Check PostgreSQL is running: `docker compose ps db` or `systemctl status postgresql`

**Emails not sending**
- Verify `SMTP_HOST` is set; leaving it empty disables email silently
- Test SMTP credentials: `npm run db:seed` logs email output to the console in mock mode
