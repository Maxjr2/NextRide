# NextRide — Design Document

**An open-source, inclusive ride-matching platform for Radeln ohne Alter chapters**

_"Das Recht auf Wind in den Haaren" — The right to wind in your hair_

Version 0.1 · April 2026 · DRAFT

---

## 1. Vision & Context

### 1.1 What this is

NextRide is a web application that connects **volunteer trishaw pilots** with **riders** — elderly and mobility-impaired people who want to experience their city from the passenger seat of a rickshaw. Unlike the current CommonsBooking-based workflow (where a central calendar manages vehicle time slots), this app works more like a **matching platform**: both sides can initiate, and the system brings them together.

### 1.2 Why it's needed

Today, most Radeln ohne Alter chapters manage rides through phone calls, email, or centralized booking calendars. This creates bottlenecks:

- **Riders** (or their care facilities) must know the right person to call and when vehicles are available.
- **Pilots** offer availability to a coordinator, who manually matches them with requests.
- Spontaneous rides — a pilot with a free afternoon, a resident who wants to go out _now_ — are nearly impossible to coordinate.

NextRide removes the coordinator bottleneck by letting both sides post directly:

- A **pilot** posts: _"I'm available Saturday 14:00–16:00 in Wersten with Flotte Lotte."_
- A **care facility** posts: _"Two residents of Matthias-Claudius-Haus would love a ride along the Rhine this week."_
- The platform matches, notifies, and confirms.

### 1.3 Design principles

1. **Inclusion first** — Every design decision starts with the question: _Can a person with limited vision, motor impairment, cognitive disability, or low digital literacy use this?_
2. **Commons spirit** — Open source (GPL-compatible), no commercial transactions, community-governed.
3. **Trust through structure** — Pilots must be verified and trained. Ride requests from care facilities carry institutional trust. Safety is non-negotiable.
4. **Simplicity over features** — A small, well-designed feature set beats a comprehensive one that nobody can navigate.
5. **Bilingual-ready** — German-first, but architected for i18n from day one.

### 1.4 Scope

This document describes the **v1 scope**: a single Radeln ohne Alter chapter (e.g., Düsseldorf) with its vehicles, pilots, care facilities, and riders. The architecture anticipates multi-chapter deployment but does not implement it in v1.

---

## 2. User Roles & Permissions

### 2.1 Role model

| Role | Who | Can post | Can accept | Verified by |
|---|---|---|---|---|
| **Pilot** | Trained volunteer trishaw driver | Availability offers | Ride requests | Chapter coordinator (after in-person training) |
| **Rider** | Elderly or mobility-impaired person | Ride wishes | Pilot offers | Self-registration or care facility |
| **Facility** | Care home, residential facility, day center | Ride requests on behalf of residents | Pilot offers | Chapter coordinator |
| **Coordinator** | Chapter admin (e.g., Benjamin Freese) | Both | Both | Platform admin |

### 2.2 Key rules

- **Pilots must complete offline training** before their account is activated. The app does not replace the in-person orientation — it tracks training status and blocks unverified pilots from accepting or offering rides.
- **Facilities act as trusted proxies.** A care facility can post ride requests for multiple residents without those residents needing individual accounts. Resident names are visible only to the matched pilot and the facility, never publicly.
- **Riders can self-register**, but ride wishes from facility-backed riders carry higher trust signals in the matching algorithm.
- **Coordinators see everything**: all offers, requests, matches, and ride history. They can intervene, reassign, or cancel at any time.

### 2.3 Vehicle association

Pilots are certified for specific vehicles (e.g., "Doppeltes Lottchen" requires additional tandem training). The system enforces this: a pilot can only offer rides on vehicles they're cleared for.

---

## 3. Core User Flows

### 3.1 Pilot offers availability

```
Pilot opens app
  → Taps "Ich kann fahren" (I can ride)
  → Selects vehicle (only certified vehicles shown)
  → Picks date + time window (e.g., Sat 14:00–16:00)
  → Optionally adds a note ("Gerne entlang des Rheins" — happy to ride along the Rhine)
  → Submits

System:
  → Checks vehicle isn't already booked for that slot
  → Publishes offer to the "Available Rides" board
  → Notifies facilities and riders in matching neighborhoods
```

### 3.2 Facility requests a ride

```
Facility staff opens app
  → Taps "Fahrt anfragen" (Request a ride)
  → Enters number of passengers (1 or 2)
  → Selects preferred date/time or marks "flexibel"
  → Optionally names a destination or route wish
  → Adds resident first name(s) + any mobility notes (e.g., "Rollstuhl­transfer nötig")
  → Submits

System:
  → Posts request to the "Ride Wishes" board
  → Notifies available pilots in the area
  → If a matching pilot offer already exists → suggests instant match
```

### 3.3 Matching & confirmation

Matching is **manual-with-suggestions**, not fully automatic. The platform suggests matches but a human (pilot, facility, or coordinator) confirms.

```
Pilot sees a ride request that fits their availability
  → Taps "Ich übernehme das" (I'll take this)
  → System creates a tentative match
  → Facility receives notification → confirms or declines
  → On confirmation: both parties see ride details (time, pickup address, route, passenger info)
```

The reverse also works: a rider or facility sees a pilot offer and taps to request that slot.

### 3.4 Ride day

```
Morning of ride:
  → Both parties receive a reminder (push notification or SMS)
  → Pilot sees pickup address + any accessibility notes

After ride:
  → Pilot marks ride as completed
  → Optional: both sides leave a short note ("Wonderful tour through Bilk!")
  → Ride is logged for chapter statistics
```

### 3.5 Cancellation

Either party can cancel. The system distinguishes between:

- **Early cancellation** (>24h before): no friction, offer/request returns to the board.
- **Late cancellation** (<24h): a brief reason is requested (not mandatory). Coordinator is notified. Repeated late cancellations trigger a gentle coordinator follow-up.

---

## 4. UX & Accessibility

### 4.1 Inclusive design commitments

The target user group includes people with visual impairments, motor limitations, cognitive disabilities, and low digital literacy. This is not a nice-to-have — it is the core product requirement.

| Principle | Implementation |
|---|---|
| **WCAG 2.2 AA minimum, AAA target** | All text meets 4.5:1 contrast. Interactive elements meet 3:1. Focus indicators are always visible. |
| **Large touch targets** | Minimum 48×48 dp for all interactive elements. Primary actions (post ride, accept ride) use 56×64 dp buttons. |
| **Reduced cognitive load** | Maximum 3 steps per flow. No multi-column layouts. One primary action per screen. |
| **Screen reader first** | Semantic HTML throughout. All images have descriptive alt text. ARIA landmarks and live regions for dynamic updates. |
| **Leichte Sprache option** | A toggle for "Leichte Sprache" (Easy Read German) — simplified language following the European easy-to-read guidelines — available on all key screens. |
| **No time pressure** | No countdown timers, no "book in the next 5 minutes" patterns. Offers remain open until someone accepts. |
| **High-contrast mode** | A system-aware dark/light toggle plus a dedicated high-contrast theme (black/yellow). |
| **Keyboard-only navigation** | Every flow completable without a mouse or touch. Tab order follows visual order. Skip-to-content links on every page. |

### 4.2 Screen structure

The app uses a **single-level tab navigation** with four sections:

```
┌──────────────────────────────────────────────┐
│  [Fahrten]    [Anbieten]   [Meine]   [Mehr]  │
│   Rides        Offer       My Rides   More    │
└──────────────────────────────────────────────┘
```

- **Fahrten** — The shared board. Shows both pilot offers ("Available rides") and ride wishes ("Ride requests") in a single chronological feed, filterable by date and neighborhood. Each card shows: date, time, neighborhood, vehicle (with photo), and a large action button.
- **Anbieten** — The posting screen. Auto-detects user role and shows the appropriate form (pilot offer vs. ride request). Minimal fields, large inputs, inline validation.
- **Meine Fahrten** — Personal ride history. Upcoming confirmed rides at top. Past rides below. Status badges: _angefragt_ (requested), _bestätigt_ (confirmed), _abgeschlossen_ (completed), _abgesagt_ (cancelled).
- **Mehr** — Profile, settings, Leichte Sprache toggle, help, contact coordinator, about/imprint.

### 4.3 Key screen: the ride card

Every ride (offer or request) appears as a card. Cards are the central UI element:

```
╔══════════════════════════════════════════════╗
║  🚲  PILOT BIETET AN                        ║
║                                              ║
║  Samstag, 12. April · 14:00 – 16:00         ║
║  Wersten · Flotte Lotte                      ║
║                                              ║
║  "Gerne entlang des Rheins"                  ║
║                                              ║
║  ┌──────────────────────────────────────┐    ║
║  │        FAHRT ANFRAGEN               │    ║
║  └──────────────────────────────────────┘    ║
╚══════════════════════════════════════════════╝
```

- Role is indicated by color and label: blue for pilot offers, warm orange for ride wishes.
- The action button changes based on viewer role (pilot sees "Übernehmen," rider/facility sees "Anfragen").
- Cards are swipeable on mobile for quick accept/dismiss — but always with a visible button alternative.

### 4.4 Notification strategy

Over-notification is a major accessibility barrier. The app uses a **tiered notification model**:

| Event | In-app | Push/SMS | Email |
|---|---|---|---|
| New match suggestion | ✓ | ✓ (if enabled) | — |
| Ride confirmed | ✓ | ✓ | ✓ |
| Ride reminder (morning of) | ✓ | ✓ | — |
| Cancellation | ✓ | ✓ | ✓ |
| New offer/request in my area | ✓ | — | Weekly digest |

Users choose their preferred channel at onboarding. SMS is the default for riders (many elderly users don't use push notifications). Facilities receive email.

### 4.5 Proxy posting for facilities

Facility staff see a streamlined posting flow optimized for posting multiple requests:

```
Facility dashboard:
  → List of known residents (first name + mobility profile, stored locally)
  → "Neue Fahrt anfragen" button per resident
  → Bulk request: "3 Bewohner möchten am Donnerstag fahren"
  → Matched rides appear in a facility-wide overview
```

Resident data (names, mobility notes) is entered by the facility and visible only to the matched pilot and the coordinator — never shown publicly on the board.

---

## 5. Technical Architecture

### 5.1 High-level overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│             │     │             │     │              │
│  Frontend   │────▶│   API       │────▶│  Database    │
│  (SPA)      │◀────│  (REST)     │◀────│  (Postgres)  │
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

### 5.2 Technology choices

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React + TypeScript | Component-based, strong accessibility tooling (React Aria, axe-core). PWA-ready for future native transition. |
| **Styling** | Tailwind CSS + custom design tokens | Utility-first enables rapid accessible theming. Design tokens enforce contrast ratios and spacing minimums. |
| **API** | Node.js + Express (TypeScript) | Same language as frontend lowers contributor barrier for an open-source project. |
| **Database** | PostgreSQL 16 | Mature, open source, strong spatial support (PostGIS) for future neighborhood/radius features. |
| **ORM** | Prisma | Type-safe, excellent migration tooling, good open-source community. |
| **Auth** | OpenID Connect via Keycloak (self-hosted) | Open source, supports institutional login (facilities), role management, MFA. |
| **Notifications** | Separate service: email (Nodemailer/SMTP), SMS (gateway-agnostic adapter), web push (web-push lib) | Decoupled from core API for reliability and testability. |
| **Hosting** | Docker Compose (self-hostable) | Chapters can deploy on their own infrastructure or use a shared community instance. Aligns with commons/sovereignty values. |
| **CI/CD** | GitHub Actions | Free for open source. Runs linting, tests, accessibility audits (axe, Lighthouse) on every PR. |

### 5.3 Why not a WordPress plugin (like CommonsBooking)?

CommonsBooking's WordPress approach works well for its use case: embedding a booking calendar into an existing organizational website. NextRide has different requirements. A bidirectional matching model with role-based access, real-time notifications, and facility proxy accounts is more naturally modeled as a standalone application. That said, the project should offer a **WordPress embed widget** so chapters can surface the ride board on their existing sites.

### 5.4 Future: native apps

The web frontend is built as a **Progressive Web App** from the start:

- Service worker for offline access to upcoming rides and contact info.
- Web App Manifest for home screen installation.
- Push notification support.

When native apps become necessary, the REST API is ready. The recommended path is **React Native** or **Capacitor** to maximize code reuse from the React web frontend.

---

## 6. Data Model

### 6.1 Core entities

```
┌──────────────┐       ┌──────────────┐
│    User       │       │   Vehicle    │
├──────────────┤       ├──────────────┤
│ id            │       │ id           │
│ role          │──┐    │ name         │
│ name          │  │    │ type         │
│ email         │  │    │ location     │
│ phone         │  │    │ seats        │
│ facility_id?  │  │    │ requires_    │
│ training_     │  │    │  cert_level  │
│  status       │  │    │ status       │
│ cert_levels[] │  │    └──────┬───────┘
│ neighborhoods │  │           │
└──────┬───────┘  │           │
       │          │           │
       │   ┌──────┴───────────┴───┐
       │   │       Post           │
       │   ├──────────────────────┤
       │   │ id                   │
       │   │ type (offer|request) │
       │   │ author_id → User     │
       │   │ vehicle_id? → Vehicle│
       │   │ date                 │
       │   │ time_start           │
       │   │ time_end             │
       │   │ neighborhood         │
       │   │ passenger_count      │
       │   │ route_wish?          │
       │   │ accessibility_notes? │
       │   │ status               │
       │   └──────────┬──────────┘
       │              │
       │     ┌────────┴────────┐
       │     │     Match       │
       │     ├─────────────────┤
       │     │ id              │
       │     │ post_offer_id   │
       │     │ post_request_id │
       │     │ status          │
       │     │ confirmed_at    │
       │     │ completed_at    │
       │     │ cancelled_at?   │
       │     │ cancel_reason?  │
       │     └────────┬────────┘
       │              │
       │     ┌────────┴────────┐
       │     │   RideLog       │
       │     ├─────────────────┤
       │     │ match_id        │
       │     │ pilot_note?     │
       │     │ rider_note?     │
       │     │ distance_km?    │
       │     │ duration_min?   │
       │     └─────────────────┘
       │
┌──────┴───────┐
│  Facility    │
├──────────────┤
│ id           │
│ name         │
│ address      │
│ contact_user │
│ residents[]  │
└──────────────┘
```

### 6.2 Key status flows

**Post status:** `open` → `matched` → `confirmed` → `completed` | `cancelled`

**Match status:** `proposed` → `confirmed` → `completed` | `cancelled`

**User training status:** `pending` → `trained` → `active` | `inactive`

### 6.3 Privacy & data minimization

- **Resident names** are stored as first names only, associated with a facility. They are visible only to the matched pilot, the facility, and the coordinator.
- **Location data**: pickup addresses are revealed only after match confirmation, never on the public board.
- **Ride logs** are anonymized after 12 months (names replaced with IDs) for statistical purposes.
- **GDPR compliance**: full data export and deletion on request. Consent is granular (separate consent for notifications, ride logging, statistical use).

---

## 7. API Design

### 7.1 Resource endpoints

```
Auth
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh

Posts (offers & requests)
  GET    /posts                    — list all open posts (filterable)
  GET    /posts/:id                — single post detail
  POST   /posts                    — create offer or request
  PATCH  /posts/:id                — update own post
  DELETE /posts/:id                — cancel/withdraw own post

Matches
  POST   /posts/:id/match          — propose a match
  PATCH  /matches/:id/confirm      — confirm a proposed match
  PATCH  /matches/:id/cancel       — cancel a match
  PATCH  /matches/:id/complete     — mark ride as completed
  POST   /matches/:id/note         — add a post-ride note

Vehicles
  GET    /vehicles                 — list chapter vehicles
  GET    /vehicles/:id/availability — open time slots

Users
  GET    /users/me                 — own profile
  PATCH  /users/me                 — update profile
  GET    /users/me/posts           — own posts
  GET    /users/me/rides           — own ride history

Facilities (facility & coordinator role)
  GET    /facilities/:id/residents — list residents
  POST   /facilities/:id/residents — add resident
  GET    /facilities/:id/rides     — facility ride overview

Coordinator (coordinator role)
  GET    /admin/stats              — chapter statistics
  GET    /admin/users              — manage users
  PATCH  /admin/users/:id/verify   — verify a pilot
```

### 7.2 Filtering & pagination

`GET /posts` supports query parameters:

- `type` — `offer` | `request`
- `date_from`, `date_to` — date range
- `neighborhood` — filter by area
- `status` — `open` | `matched` | `confirmed`
- `page`, `limit` — cursor-based pagination

### 7.3 Real-time updates

WebSocket connection at `/ws` pushes events to connected clients:

- `post:new` — a new offer or request in the user's area
- `match:proposed` — someone wants to match with the user's post
- `match:confirmed` — a match is confirmed
- `match:cancelled` — a match was cancelled

This avoids polling and enables instant feedback when, for example, a pilot accepts a ride request.

---

## 8. Accessibility Testing & CI

Every pull request must pass:

| Check | Tool | Threshold |
|---|---|---|
| Automated a11y audit | axe-core (via jest-axe) | 0 violations |
| Lighthouse accessibility | Lighthouse CI | Score ≥ 95 |
| Keyboard navigation | Cypress custom tests | All flows completable |
| Screen reader smoke test | Manual (quarterly) | Documented protocol with NVDA + VoiceOver |
| Color contrast | automated token validation | All tokens ≥ 4.5:1 (text), ≥ 3:1 (UI) |
| Leichte Sprache review | Manual (per release) | Review by trained Leichte Sprache prüfer |

The CI pipeline blocks merging if axe or Lighthouse thresholds are not met.

---

## 9. Open-Source & Community

### 9.1 License

**AGPL-3.0** — chosen over GPL to ensure that hosted/modified versions also share their source code. This aligns with the CommonsBooking (GPL-2.0) spirit while providing stronger copyleft protection for a web application.

### 9.2 Repository structure

```
nextride/
├── apps/
│   ├── web/              — React frontend (PWA)
│   └── api/              — Express API server
├── packages/
│   ├── shared/           — shared types, validation, i18n strings
│   └── ui/               — accessible component library
├── docker-compose.yml    — one-command local setup
├── docs/
│   ├── CONTRIBUTING.md
│   ├── ACCESSIBILITY.md  — accessibility standards & testing guide
│   └── DEPLOYMENT.md     — self-hosting guide for chapters
├── LICENSE               — AGPL-3.0
└── README.md
```

### 9.3 Contribution model

- **Issues** labeled by type (`a11y`, `feature`, `bug`, `good-first-issue`, `leichte-sprache`).
- **All UI contributions** must include axe-core test coverage.
- **Leichte Sprache** translations maintained as a separate i18n namespace, reviewed by people with cognitive disabilities (following the established peer-review model used by organizations like Lebenshilfe).
- **Code of Conduct** based on the Contributor Covenant, with explicit inclusion language.

### 9.4 Relationship to CommonsBooking

NextRide is not a fork of CommonsBooking — it's a new project for a different interaction model. However, the projects should be allies:

- A future **CommonsBooking integration** could sync vehicle availability between both systems (for chapters using both tools).
- Shared **GBFS feed** compatibility for mobility data exchange.
- Cross-promotion in the freie Lastenräder and Radeln ohne Alter communities.

---

## 10. Deployment & Hosting

### 10.1 Self-hosted (recommended for chapters)

```bash
git clone https://github.com/org/nextride.git
cp .env.example .env     # configure DB, SMTP, SMS gateway
docker compose up -d      # starts API, frontend, DB, Keycloak
```

Minimum requirements: 1 vCPU, 2 GB RAM, 20 GB storage. Runs on any VPS, Raspberry Pi 4+, or donated server.

### 10.2 Shared community instance

For chapters without technical capacity, a community-hosted instance at a shared domain (e.g., `nextride.org`) could offer multi-tenant deployment. This is a **post-v1 goal** that would require tenant isolation and a lightweight onboarding flow for new chapters.

---

## 11. What's Out of Scope for v1

- Multi-chapter / multi-tenant deployment
- Native mobile apps (PWA covers mobile use cases for now)
- Automated matching (v1 uses human-confirmed matching)
- Payment or donation processing
- Route planning / map integration (future: OpenStreetMap-based)
- Gamification (ride counts, badges) — intentionally omitted to avoid extrinsic motivation patterns that conflict with the volunteer ethos

---

## 12. Open Questions

1. **SMS costs**: SMS notifications are important for elderly riders but cost money. Should the project use a donated SMS gateway, or partner with a provider willing to sponsor a nonprofit?
2. **Pilot identity verification**: How much identity verification is appropriate? Current model relies on in-person training as the trust anchor. Should the app add photo ID upload?
3. **Offline fallback**: For riders without smartphones, should the system support a phone-in flow where a coordinator enters requests on their behalf?
4. **Data hosting jurisdiction**: For GDPR compliance, should community instances be restricted to EU-hosted servers?

---

_This document is a living draft. Contributions, corrections, and questions are welcome._
