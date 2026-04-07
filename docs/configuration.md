# Configuration

NextRide is configured entirely via environment variables. Copy the example files and edit them before starting:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

---

## API (`apps/api/.env`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `MOCK_MODE` | `false` | — | Skip DB + Keycloak; use in-memory data |
| `NODE_ENV` | `development` | — | `development` \| `production` \| `test` |
| `PORT` | `3001` | — | HTTP port |
| `LOG_LEVEL` | `info` | — | `debug` \| `info` \| `warn` \| `error` |
| `DATABASE_URL` | — | Yes (non-mock) | PostgreSQL connection string |
| `KEYCLOAK_ISSUER` | — | Yes (non-mock) | e.g. `http://localhost:8080/realms/nextride` |
| `KEYCLOAK_AUDIENCE` | `nextride-api` | — | Expected `aud` claim in JWTs |
| `CORS_ORIGIN` | `http://localhost:5173` | — | Allowed CORS origin |
| `SMTP_HOST` | — | — | Leave empty to disable email |
| `SMTP_PORT` | `587` | — | SMTP port |
| `SMTP_USER` | — | — | SMTP username |
| `SMTP_PASS` | — | — | SMTP password |
| `SMTP_FROM` | — | — | Sender address, e.g. `NextRide <no-reply@example.org>` |
| `RATE_LIMIT_WINDOW_MS` | `60000` | — | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX` | `100` | — | Max requests per window per IP |

See [`apps/api/.env.example`](https://github.com/Maxjr2/nextride/blob/main/apps/api/.env.example) for the full annotated reference.

---

## Frontend (`apps/web/.env`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `VITE_MOCK_MODE` | `false` | — | Skip Keycloak; auto-login as first mock user |
| `VITE_API_URL` | `http://localhost:3001` | — | API base URL |
| `VITE_KEYCLOAK_URL` | — | Yes (non-mock) | Keycloak server URL, e.g. `http://localhost:8080` |
| `VITE_KEYCLOAK_REALM` | `nextride` | — | Keycloak realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | `nextride-web` | — | Keycloak public client ID |

See [`apps/web/.env.example`](https://github.com/Maxjr2/nextride/blob/main/apps/web/.env.example) for the full annotated reference.

!!! note "Vite environment variables"
    Variables prefixed with `VITE_` are embedded into the frontend bundle at build time. Do **not** put secrets in `apps/web/.env`.

---

## Mock Mode Quick Reference

To run without any external infrastructure:

**`apps/api/.env`:**
```dotenv
MOCK_MODE=true
```

**`apps/web/.env`:**
```dotenv
VITE_MOCK_MODE=true
```

---

## Production Configuration

See the [Deployment Guide](DEPLOYMENT.md#configuration) for production-ready `.env` examples with TLS, real PostgreSQL, and Keycloak.
