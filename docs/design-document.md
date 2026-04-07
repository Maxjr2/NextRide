# Design Document

**An open-source, inclusive ride-matching platform for Radeln ohne Alter chapters**

*"Das Recht auf Wind in den Haaren" — The right to wind in your hair*

Version 0.1 · April 2026 · DRAFT

---

## 1. Vision & Context

### 1.1 What this is

NextRide is a web application that connects **volunteer trishaw pilots** with **riders** — elderly and mobility-impaired people who want to experience their city from the passenger seat of a rickshaw. Unlike the current CommonsBooking-based workflow (where a central calendar manages vehicle time slots), this app works more like a **matching platform**: both sides can initiate, and the system brings them together.

### 1.2 Why it's needed

Today, most Radeln ohne Alter chapters manage rides through phone calls, email, or centralized booking calendars. This creates bottlenecks:

- **Riders** (or their care facilities) must know the right person to call and when vehicles are available.
- **Pilots** offer availability to a coordinator, who manually matches them with requests.
- Spontaneous rides — a pilot with a free afternoon, a resident who wants to go out *now* — are nearly impossible to coordinate.

NextRide removes the coordinator bottleneck by letting both sides post directly:

- A **pilot** posts: *"I'm available Saturday 14:00–16:00 in Wersten with Flotte Lotte."*
- A **care facility** posts: *"Two residents of Matthias-Claudius-Haus would love a ride along the Rhine this week."*
- The platform matches, notifies, and confirms.

### 1.3 Design principles

1. **Inclusion first** — Every design decision starts with the question: *Can a person with limited vision, motor impairment, cognitive disability, or low digital literacy use this?*
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
| **Coordinator** | Chapter admin | Both | Both | Platform admin |

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
  → Optionally adds a note ("Gerne entlang des Rheins")
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
  → Adds resident first name(s) + any mobility notes
  → Submits

System:
  → Posts request to the "Ride Wishes" board
  → Notifies available pilots in the area
  → If a matching pilot offer already exists → suggests instant match
```

### 3.3 Matching & confirmation

Matching is **manual-with-suggestions**, not fully automatic. The platform suggests matches but a human confirms.

```
Pilot sees a ride request that fits their availability
  → Taps "Ich übernehme das" (I'll take this)
  → System creates a tentative match
  → Facility receives notification → confirms or declines
  → On confirmation: both parties see ride details
```

The reverse also works: a rider or facility sees a pilot offer and taps to request that slot.

### 3.4 Ride day

```
Morning of ride:
  → Both parties receive a reminder (push notification or SMS)
  → Pilot sees pickup address + any accessibility notes

After ride:
  → Pilot marks ride as completed
  → Optional: both sides leave a short note
  → Ride is logged for chapter statistics
```

### 3.5 Cancellation

Either party can cancel. The system distinguishes:

- **Early cancellation** (>24h before): no friction, offer/request returns to the board.
- **Late cancellation** (<24h): a brief reason is requested (not mandatory). Coordinator is notified. Repeated late cancellations trigger a gentle coordinator follow-up.

---

## 4. UX & Accessibility

### 4.1 Inclusive design commitments

The target user group includes people with visual impairments, motor limitations, cognitive disabilities, and low digital literacy. This is not a nice-to-have — it is the core product requirement.

| Principle | Implementation |
|---|---|
| **WCAG 2.2 AA minimum, AAA target** | All text meets 4.5:1 contrast. Interactive elements meet 3:1. Focus indicators always visible. |
| **Large touch targets** | Minimum 48×48dp for all interactive elements. Primary actions use 56×64dp buttons. |
| **Reduced cognitive load** | Maximum 3 steps per flow. No multi-column layouts. One primary action per screen. |
| **Screen reader first** | Semantic HTML throughout. All images have descriptive alt text. ARIA landmarks and live regions for dynamic updates. |
| **Leichte Sprache option** | Toggle for simplified Easy Read German on all key screens. |
| **No time pressure** | No countdown timers, no urgency patterns. Offers remain open until someone accepts. |
| **High-contrast mode** | System-aware dark/light toggle plus dedicated high-contrast theme (black/yellow). |
| **Keyboard-only navigation** | Every flow completable without a mouse or touch. Skip-to-content links on every page. |

### 4.2 Notification strategy

Over-notification is a major accessibility barrier. The app uses a tiered model:

| Event | In-app | Push/SMS | Email |
|---|---|---|---|
| New match suggestion | ✓ | ✓ (if enabled) | — |
| Ride confirmed | ✓ | ✓ | ✓ |
| Ride reminder (morning of) | ✓ | ✓ | — |
| Cancellation | ✓ | ✓ | ✓ |
| New offer/request in my area | ✓ | — | Weekly digest |

Users choose their preferred channel at onboarding. SMS is the default for riders (many elderly users don't use push notifications). Facilities receive email.

---

## 5. Data Model

### 5.1 Core entities

```
User ──────── Post ──────── Match ──────── RideLog
               │
           Vehicle
               │
          Facility
```

**Post** is the central entity. Every ride offer and ride request is a Post. Matching connects an offer Post to a request Post.

**Key fields:**

- `Post.type` — `offer` | `request`
- `Post.status` — `open` → `matched` → `confirmed` → `completed` | `cancelled`
- `Match.status` — `proposed` → `confirmed` → `completed` | `cancelled`
- `User.trainingStatus` — `pending` → `trained` → `active` | `inactive`

### 5.2 Privacy & data minimization

- **Resident names** are stored as first names only, associated with a facility. Visible only to the matched pilot, facility, and coordinator — never publicly.
- **Location data**: pickup addresses are revealed only after match confirmation, never on the public board.
- **Ride logs** are anonymized after 12 months (names replaced with IDs) for statistical purposes.
- **GDPR compliance**: full data export and deletion on request. Consent is granular (separate consent for notifications, ride logging, statistical use).

---

## 6. Technical Architecture

See [System Architecture](architecture.md) for the full technical overview.

---

## 7. Why Not a WordPress Plugin?

CommonsBooking's WordPress approach works well for its use case: embedding a booking calendar into an existing organizational website. NextRide has different requirements. A bidirectional matching model with role-based access, real-time notifications, and facility proxy accounts is more naturally modeled as a standalone application. That said, the project should offer a **WordPress embed widget** so chapters can surface the ride board on their existing sites.

---

## 8. Open-Source & Community

### License

**AGPL-3.0** — chosen over GPL to ensure that hosted/modified versions also share their source code. This aligns with the CommonsBooking (GPL-2.0) spirit while providing stronger copyleft protection for a web application.

### Contribution model

- Issues labeled by type: `a11y`, `feature`, `bug`, `good-first-issue`, `leichte-sprache`
- All UI contributions must include axe-core test coverage
- Leichte Sprache translations reviewed by people with cognitive disabilities
- Code of Conduct based on the Contributor Covenant

### Relationship to CommonsBooking

NextRide is not a fork of CommonsBooking — it's a new project for a different interaction model. However, the projects should be allies:

- A future **CommonsBooking integration** could sync vehicle availability between both systems
- Shared **GBFS feed** compatibility for mobility data exchange
- Cross-promotion in the freie Lastenräder and Radeln ohne Alter communities

---

## 9. What's Out of Scope for v1

- Multi-chapter / multi-tenant deployment
- Native mobile apps (PWA covers mobile use cases for now)
- Automated matching (v1 uses human-confirmed matching)
- Payment or donation processing
- Route planning / map integration (future: OpenStreetMap-based)
- Gamification — intentionally omitted to avoid extrinsic motivation patterns that conflict with the volunteer ethos

---

## 10. Open Questions

1. **SMS costs**: SMS notifications are important for elderly riders but cost money. Should the project use a donated SMS gateway, or partner with a provider willing to sponsor a nonprofit?
2. **Pilot identity verification**: How much identity verification is appropriate? Current model relies on in-person training as the trust anchor. Should the app add photo ID upload?
3. **Offline fallback**: For riders without smartphones, should the system support a phone-in flow where a coordinator enters requests on their behalf?
4. **Data hosting jurisdiction**: For GDPR compliance, should community instances be restricted to EU-hosted servers?

---

*This document is a living draft. Contributions, corrections, and questions are welcome.*
