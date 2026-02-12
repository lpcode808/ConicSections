# Lessons Learned

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
