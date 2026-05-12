# Lessons Learned

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
