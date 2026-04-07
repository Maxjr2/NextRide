# Docker

NextRide ships with two Docker Compose configurations.

---

## Mock Mode (zero infrastructure)

The fastest way to see NextRide running — no PostgreSQL, no Keycloak:

```bash
docker compose -f docker-compose.mock.yml up
```

- API at **http://localhost:3001** (mock mode, pre-seeded data)
- Frontend at **http://localhost:5173**

---

## Full Stack

Starts the API, frontend, PostgreSQL 16, and Keycloak 23 together:

```bash
docker compose up
```

| Service | URL | Notes |
|---|---|---|
| API | http://localhost:3001 | Express backend |
| Web | http://localhost:80 | React frontend via Nginx |
| PostgreSQL | localhost:5432 | Database |
| Keycloak | http://localhost:8080 | Admin UI: `admin` / `admin` — **change immediately** |

After first start, run migrations:

```bash
docker compose exec api npm run db:migrate --workspace=apps/api

# Optional: seed sample data
docker compose exec api npm run db:seed --workspace=apps/api
```

---

## Updating

```bash
git pull
docker compose build
docker compose up -d
docker compose exec api npm run db:migrate --workspace=apps/api
```

---

## Individual Services

```bash
# Start only infrastructure (DB + Keycloak), run API locally
docker compose up db keycloak

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop everything
docker compose down

# Stop and remove volumes (wipes database)
docker compose down -v
```

---

## Container Images

Images are built and pushed to GitHub Container Registry on every merge to `main`:

```
ghcr.io/maxjr2/nextride/api:latest
ghcr.io/maxjr2/nextride/web:latest
```

Pull and run a specific version:

```bash
docker pull ghcr.io/maxjr2/nextride/api:latest
docker pull ghcr.io/maxjr2/nextride/web:latest
```

---

## Production Deployment

For production use, see the full [Deployment Guide](DEPLOYMENT.md) which covers environment configuration, Nginx setup, TLS, backups, and GDPR considerations.
