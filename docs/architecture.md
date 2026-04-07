# System Architecture

---

## Repository Structure

```
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

---

## High-Level Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│             │     │             │     │              │
│  Frontend   │────▶│   API       │────▶│  Database    │
│  (SPA/PWA)  │◀────│  (REST)     │◀────│  (Postgres)  │
│             │     │             │     │              │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    │ Notification│
                    │  Service    │
                    │             │
                    └─────────────┘
```

The frontend communicates with the API over REST (data) and WebSocket (real-time events). The API owns all business logic and is the sole writer to the database.

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| **Repository pattern** | Interface → Prisma impl + Mock impl | Swap infrastructure without touching business logic; zero-infra dev mode |
| **Mock mode** | `MOCK_MODE=true` env var | Full API usable with no DB or Keycloak — great for local dev and CI |
| **Auth** | Keycloak (OpenID Connect, RS256 JWT) | Self-hostable, battle-tested RBAC; mock fallback for development |
| **Validation** | Zod schemas in `@nextride/shared` | Shared between API and frontend; runtime + compile-time safety |
| **Real-time** | `ws` WebSocket on `/ws` | Lightweight; broadcasts typed domain events to all connected clients |
| **Notifications** | `INotificationService` interface | SMTP in production; console logger in mock/dev — swap without code changes |
| **Accessibility** | WCAG 2.2 AA minimum | Core product requirement, not an afterthought |

---

## Technology Choices

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React + TypeScript | Component-based, strong accessibility tooling (React Aria, axe-core). PWA-ready |
| **Styling** | Tailwind CSS + design tokens | Utility-first enables rapid accessible theming; tokens enforce contrast ratios |
| **API** | Node.js + Express (TypeScript) | Same language as frontend lowers contributor barrier for an open-source project |
| **Database** | PostgreSQL 16 | Mature, open source, strong spatial support (PostGIS) for future neighborhood/radius features |
| **ORM** | Prisma | Type-safe, excellent migration tooling, good open-source community |
| **Auth** | Keycloak (self-hosted) | Open source, supports institutional login (facilities), role management, MFA |
| **Notifications** | Nodemailer (email), gateway-agnostic SMS adapter, web push | Decoupled from core API for reliability and testability |
| **Hosting** | Docker Compose (self-hostable) | Chapters can deploy on their own infrastructure or a shared community instance |
| **CI/CD** | GitHub Actions | Free for open source. Runs linting, tests, and accessibility audits on every PR |

---

## Data Flow: Matching a Ride

```
Pilot opens app
  → Posts availability offer (POST /api/v1/posts)
  → WebSocket broadcasts "post:new" to all connected clients

Facility staff sees the offer
  → Requests a match (POST /api/v1/matches)
  → WebSocket broadcasts "match:proposed" to the pilot

Pilot confirms (POST /api/v1/matches/:id/confirm)
  → Facility confirms (POST /api/v1/matches/:id/confirm)
  → Both get full ride details; WebSocket broadcasts "match:confirmed"

Ride day → pilot marks complete (POST /api/v1/matches/:id/complete)
  → WebSocket broadcasts "match:completed"
  → Ride log recorded
```

---

## Frontend App Screens

The app uses a single-level tab navigation with four sections:

```
┌──────────────────────────────────────────────┐
│  [Fahrten]    [Anbieten]   [Meine]   [Mehr]  │
│   Rides        Offer       My Rides   More    │
└──────────────────────────────────────────────┘
```

- **Fahrten** — Shared board of pilot offers and ride requests, filterable by date and neighborhood
- **Anbieten** — Post a ride offer (pilots) or ride request (riders/facilities); auto-detects role
- **Meine Fahrten** — Personal ride history with status badges
- **Mehr** — Profile, settings, Leichte Sprache toggle, high-contrast mode

---

## Progressive Web App

The frontend is built as a PWA from day one:

- **Service worker** for offline access to upcoming rides and contact info
- **Web App Manifest** for home screen installation
- **Push notification** support (with SMS fallback for riders without smartphones)

When native apps become necessary, the REST API is ready. The recommended path is React Native or Capacitor for maximum code reuse.

---

## For the Full Design Rationale

See the [Design Document](design-document.md) for the complete vision, user flows, UX principles, data model, and open questions.
