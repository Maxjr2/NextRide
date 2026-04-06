# Contributing to NextRide

Thank you for considering a contribution. NextRide is a community project for [Radeln ohne Alter](https://www.radelnohnealter.de/) chapters — every contribution, large or small, helps connect pilots with riders.

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) (v2.1). We are committed to a welcoming, inclusive environment. Harassment of any kind will not be tolerated.

---

## How to Contribute

### Report a bug

Open an issue with the `bug` label. Include:
- Steps to reproduce
- Expected vs. actual behavior
- Browser/OS if it's a frontend issue
- Relevant logs (redact any personal data)

### Request a feature

Open an issue with the `feature` label. Describe the problem you're solving, not just the solution. For accessibility features, use the `a11y` label.

### Submit a pull request

1. **Fork** the repository and clone your fork
2. **Create a branch**: `git checkout -b feat/your-feature` or `fix/your-bug`
3. **Make your changes** — see the sections below for specific requirements
4. **Test locally**: `npm test && npm run lint`
5. **Open a PR** against `main` with a clear description of what changed and why

---

## Development Setup

```bash
# Prerequisites: Node.js 20+

git clone https://github.com/YOUR_FORK/nextride.git
cd nextride
npm install

# Start the API in mock mode
cp apps/api/.env.example apps/api/.env
# Set MOCK_MODE=true in apps/api/.env
npm run dev:mock

# Start the frontend in mock mode (separate terminal)
cp apps/web/.env.example apps/web/.env
# Set VITE_MOCK_MODE=true in apps/web/.env
npm run dev --workspace=apps/web
```

See the [README](../README.md) for full setup instructions.

---

## Requirements by Area

### Backend (API)

- All business logic lives in `apps/api/src/services/`
- Data access goes through repository interfaces (`apps/api/src/repositories/interfaces.ts`) — never call Prisma directly from a service
- **All PRs touching business logic must include tests** in `apps/api/src/__tests__/`
- Tests run in mock mode — no database or Keycloak required
- New endpoints must handle auth (role checks) and validation (Zod schemas from `@nextride/shared`)

```bash
# Run API tests
npm test --workspace=apps/api

# Watch mode
npm test --workspace=apps/api -- --watch
```

### Frontend (React)

- Components live in `apps/web/src/components/` (shared) or `apps/web/src/features/` (feature-specific)
- Use the existing `Button`, `Modal`, `Spinner`, `StatusBadge` components — don't duplicate them
- API calls go through the typed client functions in `apps/web/src/api/`
- State management: React Query for server state, local `useState` for UI state

**All UI contributions must:**
- Pass `toHaveNoViolations()` with jest-axe
- Maintain WCAG 2.2 AA compliance — see [ACCESSIBILITY.md](ACCESSIBILITY.md)
- Use the design token classes from `tailwind.config.ts` (do not hardcode colors)
- Support Leichte Sprache via the `leicht` prop where user-facing text is rendered

```bash
# Run frontend tests
npm test --workspace=apps/web
```

### Shared package

- `packages/shared/src/types.ts` — TypeScript types shared by API and frontend
- `packages/shared/src/schemas.ts` — Zod schemas for validation
- Changes here affect both apps — update both if the shape changes

### Leichte Sprache

Leichte Sprache (Easy Read German) translations are peer-reviewed by people with cognitive disabilities. If you are adding or modifying Leichte Sprache content:

- Follow the [European easy-to-read guidelines](https://www.inclusion-europe.eu/easy-to-read/): short sentences, active voice, no jargon
- Label the PR with `leichte-sprache`
- A review by a trained Leichte Sprache prüfer is required before merge — the maintainers will arrange this

---

## Issue Labels

| Label | Meaning |
|---|---|
| `a11y` | Accessibility bug or improvement |
| `feature` | New functionality |
| `bug` | Something is broken |
| `good-first-issue` | Good entry point for new contributors |
| `backend` | API / server-side |
| `frontend` | React / UI |
| `leichte-sprache` | Involves Easy Read German content |
| `docs` | Documentation only |

---

## Commit Style

Use conventional commits:

```
feat: add vehicle availability filter to GET /posts
fix: correct role check on PATCH /matches/:id
docs: expand Keycloak setup in DEPLOYMENT.md
a11y: add aria-live region to match notification toast
test: cover MatchService.cancel with coordinator role
```

Keep the subject line under 72 characters. No period at the end.

---

## Pull Request Checklist

Before opening a PR:

- [ ] `npm test` passes locally
- [ ] `npm run lint` passes locally
- [ ] New business logic has test coverage
- [ ] New/modified UI components pass axe assertions
- [ ] WCAG 2.2 AA requirements met (contrast, touch targets, keyboard nav)
- [ ] Leichte Sprache text added where needed
- [ ] `.env.example` updated if new environment variables were added

---

## Relationship to CommonsBooking

NextRide is a new project — not a fork of CommonsBooking. Both serve the Radeln ohne Alter community in complementary ways. A future integration for syncing vehicle availability is planned. If you're working on CommonsBooking compatibility, use the `feature` label and mention it in the PR.
