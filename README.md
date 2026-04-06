# NextRide

**Ride-matching platform for [Radeln ohne Alter](https://www.radelnohnealter.de/) chapters.**

NextRide connects volunteer trishaw pilots with elderly and mobility-impaired riders — replacing phone trees and spreadsheets with a simple, accessibility-first web app.

> **Status:** Early development — API and frontend complete, hardening in progress.

---

## Table of Contents

- [Quick Start (Mock Mode)](#quick-start-mock-mode)
- [Architecture](#architecture)
- [Frontend](#frontend)
- [API Reference](#api-reference)
- [Mock Mode](#mock-mode)
- [Running with a Real Database](#running-with-a-real-database)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Docker](#docker)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start (Mock Mode)

Zero infrastructure required — runs entirely in memory with pre-seeded sample data.

```bash
# 1. Clone
git clone https://github.com/Maxjr2/nextride.git
cd nextride

# 2. Install dependencies
npm install

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and set MOCK_MODE=true

cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env and set VITE_MOCK_MODE=true

# 4. Start the API
npm run dev:mock

# 5. In a separate terminal, start the frontend
npm run dev --workspace=apps/web
```

The API runs at **http://localhost:3001** and the frontend at **http://localhost:5173**.

Test the API:
```bash
# Health check
curl http://localhost:3001/health

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

## Architecture

```text
nextride/
├── apps/
│   ├── api/                   Node.js + Express + TypeScript backend
│   │   ├── prisma/            Database schema (PostgreSQL via Prisma)
│   │   └── src/
│   │       ├── config/        App config, logger, DI container
│   │       ├── middleware/    Auth (Keycloak JWT / mock), validation, errors
│   │       ├── repositories/  Data access layer
│   │       │   ├── interfaces.ts   Contracts (IPostRepository, etc.)
│   │       │   ├── prisma/         Real DB implementations
│   │       │   └── mock/           In-memory implementations
│   │       ├── services/      Business logic (PostService, MatchService, …)
│   │       ├── routes/        Express routers per resource
│   │       ├── websocket/     Real-time event broadcast (ws)
│   │       └── notifications/ Email (SMTP) + mock console logger
│   └── web/                   React + TypeScript frontend (PWA)
│       └── src/
│           ├── api/           API client functions (posts, matches, vehicles, users)
│           ├── auth/          Keycloak / mock auth context
│           ├── components/    Shared accessible UI components
│           ├── features/      Feature-specific components (posts, matches)
│           ├── hooks/         Custom hooks (useWebSocket, …)
│           └── pages/         Top-level page components
└── packages/
    └── shared/                TypeScript types + Zod schemas
                               (used by both API and frontend)
```

### Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| **Repository pattern** | Interface → Prisma impl + Mock impl | Swap infra without touching business logic; zero-infra dev mode |
| **Mock mode** | `MOCK_MODE=true` env var | Full API usable with no DB/Keycloak — great for local dev and CI |
| **Auth** | Keycloak (OpenID Connect, RS256 JWT) | Self-hostable, battle-tested RBAC; mock fallback for dev |
| **Validation** | Zod schemas in `@nextride/shared` | Shared between API and frontend; runtime + compile-time safety |
| **Real-time** | `ws` WebSocket on `/ws` | Lightweight; broadcasts typed domain events to all connected clients |
| **Notifications** | `INotificationService` interface | SMTP in production; console logger in mock/dev — swap without code changes |
| **Accessibility** | WCAG 2.2 AA minimum | Core product requirement, not an afterthought — see [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) |

---

## Frontend

The frontend is a React 18 + TypeScript PWA using Tailwind CSS, React Query, and React Router.

### Running the frontend

```bash
# Development (against a running API)
npm run dev --workspace=apps/web

# Development with mock auth (no Keycloak required)
npm run dev:mock --workspace=apps/web

# Build for production
npm run build --workspace=apps/web
```

### Frontend features

- **Fahrten** — Shared board of pilot offers and ride requests, filterable by date and neighborhood
- **Anbieten** — Post a ride offer (pilots) or ride request (riders/facilities)
- **Meine Fahrten** — Personal ride history with status badges
- **Mehr** — Profile, settings, Leichte Sprache toggle, high-contrast mode

### Accessibility features

- WCAG 2.2 AA compliant (AAA target)
- Keyboard-only navigation for all flows
- Screen reader optimized (semantic HTML, ARIA landmarks, live regions)
- Leichte Sprache (Easy Read German) toggle on all key screens
- High-contrast mode (black/yellow theme)
- Skip-to-content link on every page
- Minimum 48×48dp touch targets; 56×64dp for primary actions

### Frontend environment variables

See [`apps/web/.env.example`](apps/web/.env.example) for the full reference.

| Variable | Default | Description |
|---|---|---|
| `VITE_MOCK_MODE` | `false` | Skip Keycloak; auto-login as first mock user |
| `VITE_API_URL` | `http://localhost:3001` | API base URL |
| `VITE_KEYCLOAK_URL` | — | e.g. `http://localhost:8080` |
| `VITE_KEYCLOAK_REALM` | `nextride` | Keycloak realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | `nextride-web` | Keycloak public client ID |

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

All endpoints require `Authorization: Bearer <token>`. See [Mock Mode](#mock-mode) for token format during development.

### Posts

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/posts` | any | List posts. Filter by `type`, `status`, `neighborhood`, `date`, `authorId` |
| `POST` | `/posts` | any | Create offer (pilot) or request (rider/facility) |
| `GET` | `/posts/:id` | any | Get post by ID |
| `PATCH` | `/posts/:id` | author, coordinator | Update post fields or status |
| `DELETE` | `/posts/:id` | author, coordinator | Cancel a post |

**Query parameters for `GET /posts`:**

| Param | Type | Example |
|---|---|---|
| `type` | `offer` \| `request` | `?type=offer` |
| `status` | `open` \| `matched` \| `confirmed` \| `completed` \| `cancelled` | `?status=open` |
| `neighborhood` | string | `?neighborhood=Bilk` |
| `date` | ISO date | `?date=2026-05-01` |
| `page` | number | `?page=2` |
| `pageSize` | number (max 100) | `?pageSize=10` |

### Matches

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/matches` | any | List matches. Filter by `status`, `postId` |
| `POST` | `/matches` | coordinator | Propose a match between an offer and a request |
| `GET` | `/matches/:id` | any | Get match by ID |
| `POST` | `/matches/:id/confirm` | pilot, rider, coordinator | Confirm your side of the match |
| `POST` | `/matches/:id/cancel` | participant, coordinator | Cancel a match (body: `{ reason?: string }`) |
| `POST` | `/matches/:id/complete` | pilot, coordinator | Mark ride as completed |

**Match status flow:**
```text
proposed → (pilot + rider both confirm) → confirmed → completed
         → (either side cancels)        → cancelled
```

### Vehicles

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/vehicles` | any | List all active vehicles |
| `GET` | `/vehicles/mine` | pilot | List own vehicles |
| `GET` | `/vehicles/:id` | any | Get vehicle by ID |
| `POST` | `/vehicles` | pilot | Register a new vehicle |
| `PATCH` | `/vehicles/:id` | owner, coordinator | Update vehicle |

### Users

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/users/me` | any | Get own profile |
| `PATCH` | `/users/me` | any | Update display name, phone, notification prefs |
| `GET` | `/users` | coordinator | List all users |
| `GET` | `/users/:id` | coordinator | Get any user |

### Facilities

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/facilities` | any | List active facilities |
| `GET` | `/facilities/:id` | any | Get facility by ID |
| `POST` | `/facilities` | coordinator | Create facility |
| `PATCH` | `/facilities/:id` | coordinator | Update facility |

### Response format

**Success:**
```json
{ "data": { ... } }
```

**Paginated list:**
```json
{ "data": [...], "total": 42, "page": 1, "pageSize": 20 }
```

**Error:**
```json
{ "error": { "code": "POST_NOT_FOUND", "message": "Post not found" } }
```

### WebSocket

Connect to `ws://localhost:3001/ws` to receive real-time events:

```json
{ "type": "post:new", "payload": { ... }, "timestamp": "2026-04-04T12:00:00.000Z" }
```

Event types: `post:new` · `post:updated` · `post:cancelled` · `match:proposed` · `match:confirmed` · `match:cancelled` · `match:completed`

### Health

```http
GET /health
→ { "status": "ok", "mockMode": true, "env": "development", "timestamp": "..." }
```

---

## Mock Mode

Set `MOCK_MODE=true` to run the entire API with no external dependencies.

**What mock mode does:**
- Replaces Prisma repositories with in-memory equivalents
- Skips Keycloak JWT verification — uses simple Bearer token lookup
- Replaces SMTP email with console logging
- Pre-seeds data from the POC (4 users, 3 vehicles, 5 posts)

**Authentication in mock mode:**

Use any of the pre-seeded external IDs as your Bearer token:

| Token | User | Role |
|---|---|---|
| `pilot-001` | Martin K. | pilot (advanced certification) |
| `rider-001` | Erna B. | rider |
| `facility-001` | Frau Schmidt | facility (Seniorenhaus Am Park) |
| `coord-001` | Klaus R. | coordinator |

Role shortcuts (impersonate first user with that role):
```text
role:pilot  |  role:rider  |  role:facility  |  role:coordinator
```

Example:
```bash
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer role:coordinator"
```

Unknown tokens auto-create a new rider user.

**Frontend mock mode:**

Set `VITE_MOCK_MODE=true` in `apps/web/.env`. The frontend skips Keycloak and auto-logs in as the first mock user. A "Mock" badge appears in the header.

---

## Running with a Real Database

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Keycloak 23+ with a `nextride` realm configured

### Setup

```bash
cp apps/api/.env.example apps/api/.env
# Fill in DATABASE_URL, KEYCLOAK_ISSUER, etc.

# Generate Prisma client
npm run db:generate --workspace=apps/api

# Run migrations
npm run db:migrate --workspace=apps/api

# Seed sample data
npm run db:seed --workspace=apps/api

# Start API
npm run dev

# Start frontend (in a separate terminal)
cp apps/web/.env.example apps/web/.env
# Fill in VITE_KEYCLOAK_URL, etc.
npm run dev --workspace=apps/web
```

### Keycloak setup

Create a realm named `nextride` and assign these realm roles to users:
`pilot` · `rider` · `facility` · `coordinator`

The API derives the user's role from `realm_access.roles` in the JWT. The frontend uses a public client named `nextride-web` (no secret required).

---

## Running Tests

```bash
# All tests
npm test

# API tests only
npm test --workspace=apps/api

# Watch mode
npm test --workspace=apps/api -- --watch

# Coverage
npm test --workspace=apps/api -- --coverage

# Frontend tests
npm test --workspace=apps/web
```

Tests run entirely in mock mode — no database or Keycloak required.

---

## Environment Variables

### API (`apps/api/.env`)

See [`apps/api/.env.example`](apps/api/.env.example) for the full reference.

| Variable | Default | Description |
|---|---|---|
| `MOCK_MODE` | `false` | Skip DB + Keycloak; use in-memory data |
| `PORT` | `3001` | HTTP port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `KEYCLOAK_ISSUER` | — | e.g. `http://localhost:8080/realms/nextride` |
| `KEYCLOAK_AUDIENCE` | `nextride-api` | Expected JWT audience |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin |
| `SMTP_HOST` | — | Leave empty to disable email |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in ms |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |

### Frontend (`apps/web/.env`)

See [`apps/web/.env.example`](apps/web/.env.example) for the full reference.

| Variable | Default | Description |
|---|---|---|
| `VITE_MOCK_MODE` | `false` | Skip Keycloak; auto-login as mock user |
| `VITE_API_URL` | `http://localhost:3001` | API base URL |
| `VITE_KEYCLOAK_URL` | — | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | `nextride` | Keycloak realm |
| `VITE_KEYCLOAK_CLIENT_ID` | `nextride-web` | Keycloak public client ID |

---

## Docker

### Mock mode (no infrastructure needed)

```bash
docker compose -f docker-compose.mock.yml up
```

### Full stack (Postgres + Keycloak + API + Web)

```bash
docker compose up
```

This starts PostgreSQL, Keycloak, the API, and the web frontend. Keycloak admin UI is at http://localhost:8080 (admin / admin).

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide. In short:

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make changes — all PRs touching business logic should include tests
4. Run `npm test` and `npm run lint` locally
5. Open a pull request

**Issue labels:**
`a11y` · `feature` · `bug` · `good-first-issue` · `backend` · `frontend`

All UI contributions must maintain WCAG 2.2 AA accessibility and include axe-core test coverage. See [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) for standards and tooling.

---

## License

[AGPL-3.0](LICENSE) — copyleft; modified versions must share source code.
