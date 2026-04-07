# API Reference

**Base URL:** `http://localhost:3001/api/v1`

All endpoints require `Authorization: Bearer <token>`.

- In **production**, use a Keycloak-issued JWT.
- In **mock mode**, use a pre-seeded token like `pilot-001` or `coord-001`. See [Mock Mode](getting-started.md#mock-mode-authentication).

---

## Authentication

```http
Authorization: Bearer <token>
```

The API validates the token against Keycloak's JWKS endpoint. The user's role is derived from `realm_access.roles` in the JWT payload.

In mock mode, any of the pre-seeded external IDs work as tokens. Unknown tokens auto-create a new rider.

---

## Response Format

**Success (single resource):**
```json
{ "data": { ... } }
```

**Success (paginated list):**
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

**Error:**
```json
{
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "Post not found"
  }
}
```

---

## Endpoints by Resource

- **[Posts](api/posts.md)** — Ride offers and ride requests
- **[Matches](api/matches.md)** — Pairing an offer with a request
- **[Vehicles](api/vehicles.md)** — Chapter trishaw fleet
- **[Users & Facilities](api/users.md)** — User profiles and care facilities
- **[WebSocket](api/websocket.md)** — Real-time event stream

---

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "mockMode": true,
  "env": "development",
  "timestamp": "2026-04-04T12:00:00.000Z"
}
```

Use this endpoint for uptime monitoring.

---

## Rate Limiting

In production, the API applies rate limiting per IP:

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window duration in milliseconds |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per window |

Exceeding the limit returns `429 Too Many Requests`.
