# Running with a Real Database

Connect NextRide to PostgreSQL and Keycloak for a full production-like environment.

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16
- Keycloak 23+ with a `nextride` realm configured

For a quick way to get PostgreSQL and Keycloak running locally, use the provided Docker Compose file:

```bash
# Start only the infrastructure (DB + Keycloak), not the app
docker compose up db keycloak
```

---

## Setup

```bash
# 1. Configure the API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in DATABASE_URL, KEYCLOAK_ISSUER, etc.

# 2. Generate the Prisma client
npm run db:generate --workspace=apps/api

# 3. Run database migrations
npm run db:migrate --workspace=apps/api

# 4. (Optional) Seed sample data
npm run db:seed --workspace=apps/api

# 5. Start the API
npm run dev

# 6. Configure and start the frontend (separate terminal)
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env — fill in VITE_KEYCLOAK_URL, etc.
npm run dev --workspace=apps/web
```

---

## API Environment Variables

Edit `apps/api/.env`:

| Variable | Required | Example | Description |
|---|---|---|---|
| `MOCK_MODE` | — | `false` | Must be `false` (or unset) for real DB mode |
| `PORT` | — | `3001` | HTTP port |
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/nextride` | PostgreSQL connection string |
| `KEYCLOAK_ISSUER` | Yes | `http://localhost:8080/realms/nextride` | Keycloak realm issuer URL |
| `KEYCLOAK_AUDIENCE` | — | `nextride-api` | Expected JWT `aud` claim |
| `CORS_ORIGIN` | — | `http://localhost:5173` | Allowed CORS origin |
| `SMTP_HOST` | — | `smtp.example.com` | Leave empty to disable email |
| `LOG_LEVEL` | — | `info` | `debug` \| `info` \| `warn` \| `error` |

See [`apps/api/.env.example`](https://github.com/Maxjr2/nextride/blob/main/apps/api/.env.example) for the full reference.

---

## Frontend Environment Variables

Edit `apps/web/.env`:

| Variable | Required | Example | Description |
|---|---|---|---|
| `VITE_MOCK_MODE` | — | `false` | Must be `false` (or unset) |
| `VITE_API_URL` | — | `http://localhost:3001` | API base URL |
| `VITE_KEYCLOAK_URL` | Yes | `http://localhost:8080` | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | — | `nextride` | Keycloak realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | — | `nextride-web` | Keycloak public client ID |

---

## Keycloak Setup

### 1. Create the realm

In the Keycloak admin console (`http://localhost:8080`, default credentials: `admin` / `admin` — change immediately):

1. **Add realm** → name it `nextride`
2. **Realm Settings → General**: set Display Name to `NextRide`
3. **Realm Settings → Login**: enable "User registration" if riders should self-register

### 2. Create the API client

1. **Clients → Create client**
2. Client ID: `nextride-api`
3. Client authentication: **On** (confidential)
4. The API validates JWTs via JWKS — the client secret is not needed in `.env`

### 3. Create the frontend client

1. **Clients → Create client**
2. Client ID: `nextride-web`
3. Client authentication: **Off** (public)
4. Valid redirect URIs: `http://localhost:5173/*`
5. Web origins: `http://localhost:5173`

### 4. Create realm roles

Under **Realm roles → Create role**, add:

```
pilot    rider    facility    coordinator
```

Assign roles to users under **Users → [user] → Role mapping**.

The API derives the user's role from `realm_access.roles` in the JWT.

### 5. Pilot verification

Pilot accounts must be manually activated after in-person training. Only assign the `pilot` role once offline training is confirmed — the API blocks unverified pilots from posting or accepting rides.

---

## Database Commands

```bash
# Generate Prisma client (run after schema changes)
npm run db:generate --workspace=apps/api

# Create/apply migrations
npm run db:migrate --workspace=apps/api

# Seed sample data
npm run db:seed --workspace=apps/api

# Open Prisma Studio (visual DB browser)
npx prisma studio --schema=apps/api/prisma/schema.prisma
```

---

## Troubleshooting

**API returns 401 on all requests**
- Check `KEYCLOAK_ISSUER` matches exactly the `iss` claim in your JWTs
- Verify the JWKS endpoint is reachable: `curl $KEYCLOAK_ISSUER/protocol/openid-connect/certs`

**Database connection refused**
- Confirm `DATABASE_URL` in `.env` points to the correct host and port
- Check PostgreSQL is running: `docker compose ps db` or `systemctl status postgresql`

**Frontend shows blank page**
- Ensure `VITE_KEYCLOAK_URL` is set and Keycloak is running
- Check browser console for errors related to the Keycloak SDK
