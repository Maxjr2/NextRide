# Running Tests

All tests run in mock mode — no database, no Keycloak, no Docker required.

---

## Running Tests

```bash
# All workspaces
npm test

# API tests only
npm test --workspace=apps/api

# Watch mode (re-runs on file changes)
npm test --workspace=apps/api -- --watch

# With coverage report
npm test --workspace=apps/api -- --coverage

# Frontend tests
npm test --workspace=apps/web
```

---

## API Tests

API tests use **Jest** and **Supertest** and run entirely in-process against the mock repositories. Coverage is automatically uploaded as a GitHub Actions artifact on every CI run.

Test files live in `apps/api/src/__tests__/`.

```bash
# Run with verbose output
npm test --workspace=apps/api -- --verbose

# Run a specific test file
npm test --workspace=apps/api -- --testPathPattern=posts

# Run with CI mode (no watch, fails fast)
npm test --workspace=apps/api -- --ci
```

### Test requirements

- All PRs touching business logic must include test coverage
- Tests call services through the same interface as production — no internal shortcuts
- Role-based access must be tested (e.g., coordinator vs. pilot vs. rider permissions)

---

## Frontend Tests

Frontend tests use **Vitest** with **jest-axe** for accessibility assertions.

```bash
# Run once
npm test --workspace=apps/web

# Watch mode
npm run test:ui --workspace=apps/web

# Run with passWithNoTests (used in CI)
npm test --workspace=apps/web -- --passWithNoTests
```

### Accessibility testing

Every component test should include an axe assertion:

```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

See [Accessibility](ACCESSIBILITY.md) for full testing requirements.

---

## Linting

```bash
# Lint all workspaces
npm run lint

# Lint a specific workspace
npm run lint --workspace=apps/api
npm run lint --workspace=apps/web
```

---

## CI Pipeline

The GitHub Actions CI runs on every push to `main` or `claude/**` branches, and on PRs to `main`:

1. **Type check** — TypeScript validation for `shared`, `api`, and `web` packages
2. **Test** — API tests with coverage + frontend tests (parallel with type check)
3. **Build** — Only runs after type check and tests both pass
4. **Docker** — Builds and pushes container images (only on `main`)

CI blocks merging if any job fails, including axe accessibility violations.
