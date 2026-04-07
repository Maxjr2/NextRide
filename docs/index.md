# NextRide

**Ride-matching platform for [Radeln ohne Alter](https://www.radelnohnealter.de/) chapters.**

NextRide connects volunteer trishaw pilots with elderly and mobility-impaired riders — replacing phone trees and spreadsheets with a simple, accessibility-first web app.

> **Status:** Early development — API and frontend complete, hardening in progress.

---

## What is NextRide?

Most Radeln ohne Alter chapters manage rides through phone calls, email, or centralized booking calendars. This creates bottlenecks:

- **Riders** (or their care facilities) must know the right person to call and when vehicles are available.
- **Pilots** offer availability to a coordinator, who manually matches them with requests.
- Spontaneous rides — a pilot with a free afternoon, a resident who wants to go out *now* — are nearly impossible to coordinate.

NextRide removes the coordinator bottleneck by letting both sides post directly:

- A **pilot** posts: *"I'm available Saturday 14:00–16:00 in Wersten with Flotte Lotte."*
- A **care facility** posts: *"Two residents of Matthias-Claudius-Haus would love a ride along the Rhine this week."*
- The platform matches, notifies, and confirms.

---

## Key Features

| Feature | Description |
|---|---|
| **Ride board** | Shared board of pilot offers and ride requests, filterable by date and neighborhood |
| **Matching** | Manual-with-suggestions matching — humans confirm, platform facilitates |
| **Real-time updates** | WebSocket broadcast of new posts, matches, and status changes |
| **Mock mode** | Full API with zero infrastructure — no database or Keycloak required |
| **Accessibility-first** | WCAG 2.2 AA compliant, Leichte Sprache toggle, high-contrast mode |
| **PWA** | Progressive Web App — installable, offline-capable |

---

## User Roles

| Role | Who | Description |
|---|---|---|
| **Pilot** | Trained volunteer trishaw driver | Posts availability offers; must complete offline training |
| **Rider** | Elderly or mobility-impaired person | Posts ride wishes or accepts pilot offers |
| **Facility** | Care home, day center | Posts ride requests on behalf of residents |
| **Coordinator** | Chapter admin | Sees and manages everything; proposes matches |

---

## Quick Links

<div class="grid cards" markdown>

- :material-rocket-launch: **[Quick Start](getting-started.md)**  
  Zero infrastructure — running in 5 minutes with mock mode

- :material-api: **[API Reference](api-reference.md)**  
  REST endpoints, authentication, response format

- :material-server: **[Deployment](DEPLOYMENT.md)**  
  Self-host with Docker Compose or manually

- :material-human-handsup: **[Accessibility](ACCESSIBILITY.md)**  
  WCAG 2.2 standards, testing tools, component checklist

- :material-source-branch: **[Contributing](CONTRIBUTING.md)**  
  Development setup, requirements, PR checklist

- :material-file-document: **[Design Document](design-document.md)**  
  Vision, UX decisions, data model, open questions

</div>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS (PWA) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 via Prisma |
| Auth | Keycloak (OpenID Connect, RS256 JWT) |
| Real-time | WebSocket (`ws`) |
| Validation | Zod schemas (shared between API and frontend) |
| Monorepo | npm workspaces |

---

## License

[AGPL-3.0](https://github.com/Maxjr2/nextride/blob/main/LICENSE) — copyleft; modified versions must share source code.
