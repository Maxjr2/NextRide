# Quick Start (Mock Mode)

Zero infrastructure required — the API runs entirely in memory with pre-seeded sample data. No database, no Keycloak, no Docker needed.

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- npm (bundled with Node.js)

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/Maxjr2/nextride.git
cd nextride

# 2. Install all workspace dependencies
npm install

# 3. Configure the API for mock mode
cp apps/api/.env.example apps/api/.env
# Open apps/api/.env and set:  MOCK_MODE=true

# 4. Configure the frontend for mock mode
cp apps/web/.env.example apps/web/.env
# Open apps/web/.env and set:  VITE_MOCK_MODE=true

# 5. Start the API
npm run dev:mock

# 6. In a separate terminal, start the frontend
npm run dev --workspace=apps/web
```

- API: **http://localhost:3001**
- Frontend: **http://localhost:5173**

---

## Verify It's Working

```bash
# Health check
curl http://localhost:3001/health
# → { "status": "ok", "mockMode": true, "env": "development", ... }

# List all posts (as a coordinator)
curl http://localhost:3001/api/v1/posts \
  -H "Authorization: Bearer coord-001"

# Create a ride offer (as a pilot)
curl -X POST http://localhost:3001/api/v1/posts \
  -H "Authorization: Bearer pilot-001" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "offer",
    "vehicleId": "veh-lotte",
    "neighborhood": "Bilk",
    "date": "2026-05-01T10:00:00Z",
    "timeSlot": { "start": "10:00", "end": "12:00" },
    "passengerCount": 2
  }'
```

---

## Mock Mode Authentication

In mock mode, Keycloak is bypassed entirely. Pass any pre-seeded external ID as your Bearer token:

| Token | User | Role |
|---|---|---|
| `pilot-001` | Martin K. | pilot (advanced certification) |
| `rider-001` | Erna B. | rider |
| `facility-001` | Frau Schmidt | facility (Seniorenhaus Am Park) |
| `coord-001` | Klaus R. | coordinator |

**Role shortcuts** — impersonate the first user with that role:

```text
role:pilot  |  role:rider  |  role:facility  |  role:coordinator
```

```bash
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer role:coordinator"
```

Unknown tokens automatically create a new rider user.

---

## Frontend Mock Mode

With `VITE_MOCK_MODE=true`:

- The frontend skips Keycloak entirely
- Auto-logs in as the first mock user
- A **"Mock"** badge appears in the header to signal mock mode

To switch users while developing, change `VITE_MOCK_MODE` to a specific token (e.g., `pilot-001`) — or implement a user-switcher in your dev workflow.

---

## What's Pre-seeded

Mock mode starts with data from the project's proof-of-concept:

- 4 users (1 pilot, 1 rider, 1 facility, 1 coordinator)
- 3 vehicles (including "Flotte Lotte" and "Doppeltes Lottchen")
- 5 posts (mix of offers and requests)

Data is reset on every server restart — nothing is persisted to disk.

---

## Next Steps

- [Run with a real database](real-database.md) — connect PostgreSQL and Keycloak
- [Run tests](testing.md) — all tests use mock mode too, no infra needed
- [API reference](api-reference.md) — explore all available endpoints
