# Accessibility Standards & Testing Guide

NextRide is built for users with visual impairments, motor limitations, cognitive disabilities, and low digital literacy. Accessibility is a core product requirement, not an enhancement.

---

## Standards

| Standard | Target |
|---|---|
| WCAG 2.2 Level AA | Minimum for all features |
| WCAG 2.2 Level AAA | Target for primary flows |
| Leichte Sprache | Available via toggle on all key screens |

---

## Design Requirements

### Contrast

- Body text: minimum 4.5:1 contrast ratio
- Large text and UI components: minimum 3:1
- High-contrast mode (black/yellow theme) available as a toggle; persisted in localStorage

Design tokens in `apps/web/tailwind.config.ts` enforce contrast ratios. Do not introduce new color values that bypass these tokens.

### Touch targets

- All interactive elements: minimum 48×48dp
- Primary action buttons: 56×64dp

### Cognitive load

- Maximum 3 steps per user flow
- No multi-column layouts
- One primary action per screen
- No countdown timers or urgency patterns

### Navigation

- Full keyboard navigation for all flows (no mouse or touch required)
- Tab order follows visual order
- Skip-to-content link (`<SkipLink />`) on every page
- Focus indicators always visible — never suppressed with `outline: none` without a custom replacement

### Screen readers

- Semantic HTML elements (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`)
- ARIA landmarks on every page
- `aria-live` regions for dynamic updates (new posts, match notifications)
- Descriptive `aria-label` on icon-only buttons
- `aria-pressed` on toggle buttons (Leichte Sprache, high-contrast)

---

## Leichte Sprache

Leichte Sprache (Easy Read German) is a simplified language register following [European easy-to-read guidelines](https://www.inclusion-europe.eu/easy-to-read/).

- Toggle is available in the header on every screen
- State persisted in localStorage (`nextride:leicht`)
- Implemented via conditional rendering — alternate text passed as the `leicht` prop
- Translations maintained as a separate i18n namespace
- **Reviews must be conducted by people with cognitive disabilities** following the peer-review model used by organizations like Lebenshilfe

When contributing Leichte Sprache content:
- Sentences: maximum 8 words
- One idea per sentence
- Active voice only
- No jargon or abbreviations
- Use concrete, familiar words

---

## Testing Tools

### Automated (CI-enforced)

| Tool | What it checks | Threshold |
|---|---|---|
| [jest-axe](https://github.com/nickcolley/jest-axe) | axe-core violations in component tests | 0 violations |
| [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Full-page accessibility score | ≥ 95 |
| Tailwind token validation | Color contrast ratios in design tokens | All tokens ≥ 4.5:1 (text), ≥ 3:1 (UI) |

CI blocks merging if axe or Lighthouse thresholds are not met.

### Manual (per release)

| Check | Frequency | Protocol |
|---|---|---|
| Screen reader smoke test | Quarterly | NVDA + Firefox on Windows; VoiceOver + Safari on macOS |
| Keyboard-only navigation | Per PR (for UI changes) | Complete all 4 main flows without mouse |
| Leichte Sprache review | Per release | Review by trained Leichte Sprache prüfer |
| Mobile magnification | Per release | Test at 200% zoom on iOS and Android |

### Running axe tests locally

```bash
# Run all tests (includes axe assertions)
npm test --workspace=apps/web

# Run in watch mode
npm run test:ui --workspace=apps/web
```

### Running Lighthouse locally

```bash
# Start the frontend
npm run build --workspace=apps/web
npm run preview --workspace=apps/web

# In another terminal
npx lhci autorun
```

---

## Component Checklist

When adding a new component or modifying an existing one, verify:

- [ ] Passes `toHaveNoViolations()` in jest-axe
- [ ] All interactive elements have visible focus styles
- [ ] Touch targets are at least 48×48dp
- [ ] Color is not the sole means of conveying information
- [ ] Error messages are associated with their inputs via `aria-describedby`
- [ ] Loading states announce to screen readers via `aria-live="polite"` or `role="status"`
- [ ] Modals trap focus and restore it on close
- [ ] Images have `alt` text (decorative images use `alt=""`)

---

## Known Limitations

- Push notifications: Web Push API accessibility varies by browser/OS — SMS fallback is the default for riders
- Map integration (planned): will require accessible alternatives to all visual map interactions
