# Lessons Learned

## 2026-06-09: Directrix drawn on the wrong side; smoke checks were not enforced

### What happened
Module 6 drew the directrix at `x = -l/e`, so the on-screen focus/directrix distance ratio never matched the advertised `e` (e.g. ratio 0.354 vs target 0.700). It shipped that way because the sample point was fixed at one angle and the mismatch read like a plausible number.

### Root cause
For the polar form `r = l / (1 + e·cosθ)` with the focus at the origin, the matching directrix is at `x = +l/e` (same side as the curve's nearest point). The sign was flipped. Separately, page smoke checks log `CHECK FAIL` via `console.error`, but the Playwright clean-load test only filtered for CORS/module/uncaught strings — a failing math check could not fail CI.

### Fix shipped
- Corrected the directrix to `x = +l/e` and added a smoke check asserting `d(P,focus)/d(P,directrix) = e` at several sample angles.
- Made module 6's sample point P draggable along the curve, so the claim is now checkable at every point, not one.
- Added `CHECK FAIL` and `Smoke test threw` to the Playwright console-error filter, so smoke-check regressions now fail the suite.

### Prevention
- When a page asserts a numeric invariant, draw or display it live and add a smoke check that computes it independently — direct manipulation surfaces wrong math that static samples hide.

## 2026-06-09: Playwright reused a stale server from another project

### What happened
The full UX suite failed on every test because an unrelated local server (another project) was already listening on port 4173, and `reuseExistingServer` pointed the tests at it.

### Fix shipped
- `playwright.config.js` now honors `CONIC_TEST_PORT`, e.g. `CONIC_TEST_PORT=4317 npm run test:ux`.

### Prevention
- If the whole suite fails at once on locator timeouts, first check what is actually being served on the test port.

## 2026-05-12: Hardening accessibility and UX regression coverage

### What happened
The app already had strong page-level smoke coverage, but several classroom-critical states were only visually exposed:
- canvas diagrams had no accessible names
- generated measurement text was not consistently marked as live status
- present/mode toggles changed behavior without exposing pressed state
- landing-page tests counted all navigation cards and missed the newer bonus route

### Root cause
The visual canvas workflow grew faster than the accessibility/test contracts around it. The app still worked, but assistive technology and regression tests had less structure than the UI itself.

### Fix shipped
- Added accessible names to interactive canvases and the cone-slice cue.
- Marked primary generated measurements as polite live status regions.
- Added `aria-pressed` state for present and parabola mode toggles.
- Improved small-screen control wrapping and touch target spacing.
- Expanded Playwright coverage for accessible diagrams, keyboard slider use, persisted toggle state, mobile overflow, and bonus navigation.

### Prevention
- When adding a new interactive page, include a named diagram, at least one live text summary for generated output, keyboard-reachable controls for core state, and a page-specific regression check.
- Keep landing-page tests scoped to the specific workflow section they mean to validate, especially when bonus/demo links are added.

## 2026-02-12: ES modules + file protocol CORS failure

### What happened
Opening pages directly with `file://` caused browser errors:
- `Access to script ... has been blocked by CORS policy`
- `origin 'null'`
- `ERR_FAILED` for shared module imports.

### Root cause
The pages rely on ES modules (`import ... from ...`). Browser security model blocks cross-file module loading from `file://` origins.

### Fix shipped
- Added `shared/bootstrap.js`.
- Page HTML now loads `app.js` through the bootstrap script.
- On `file://`, bootstrap blocks module startup and shows a clear runtime overlay with local server instructions.

### Prevention
- Added `AGENTS.md` local-dev rule: always run HTTP server.
- Added Playwright regression test that opens a page via `file://` and asserts warning overlay is shown.

### Follow-up guardrails
- Keep module code in page-local `app.js`, loaded only by bootstrap.
- Do not reintroduce direct `<script type="module">` blocks in page HTML.

## 2026-02-12: Bootstrap path resolution bug

### What happened
After introducing `shared/bootstrap.js`, page scripts did not execute under HTTP in early Playwright runs.

### Root cause
`new URL(moduleSrc, current.src)` resolved `./app.js` relative to `shared/bootstrap.js`, incorrectly pointing to `/shared/app.js`.

### Fix shipped
- Resolve page module paths against `document.baseURI` instead of script URL.

### Prevention
- Keep Playwright checks that verify page debug panel and URL-state interactions; these fail quickly if page `app.js` is not loaded.
