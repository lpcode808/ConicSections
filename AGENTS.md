# Agent Handoff Guide (Codex + Other Agents)

This repository is a static, multi-page conic sections explorable built for GitHub Pages.

## Project goals

- Keep each topic page independently deployable and debuggable.
- Preserve smooth UX for classroom projection and phone usage.
- Keep math logic in shared modules, not duplicated across pages.
- Preserve teacher-facing explanations and student-facing interactive prompts.

## Default Standing Instructions (Do Not Wait To Be Asked)

Treat these as always-on requirements for this repository:

1. **Logging is mandatory, not optional.**
   - Keep persistent telemetry active (`conic:telemetry:v1`).
   - Do not remove debug panel features (snapshot/toggle/download/clear).
   - Add meaningful event logs when introducing new controls/interactions.

2. **Teacher-first communication comes first in docs/UI copy.**
   - README top section should stay classroom/teacher oriented.
   - New pages/features must include plain-language explanation, teacher prompt, and key vocabulary.

3. **Ship-safe UX quality bar is required.**
   - Preserve keyboard focus visibility and mobile usability.
   - Run Playwright UX tests before handoff when possible.

4. **Regression prevention is part of done.**
   - If a bug is fixed, add/update a test and document the lesson in `docs/lessons-learned.md`.

5. **GitHub Pages readiness must be maintained.**
   - Keep workflows healthy (`deploy.yml`, `ux-tests.yml`).
   - Avoid changes that break static hosting assumptions.

## Architecture map

- `index.html` landing page
- `shared/explorable.js` page runtime: declarative params, URL state, reset, mapper, drag, RAF loop, debug mounting
- `shared/modules.js` module manifest (single source for the sequence) + progress strip renderer
- `shared/conic-math.js` geometry + reflection math
- `shared/draw-utils.js` canvas rendering utilities (incl. `drawHandle`, `drawSegmentBar`, `drawAngleArc`)
- `shared/interaction.js` pointer + URL state helpers
- `shared/debug.js` smoke checks + persistent telemetry + debug panel
- `shared/bootstrap.js` runtime loader guard for file://
- `<page>/index.html` page markup and pedagogy copy
- `<page>/app.js` page behavior module built on `createExplorable`

## Adding a new module (works beyond conics)

The runtime is concept-agnostic; only `conic-math.js` is conic-specific. To add a module:

1. Add an entry to `shared/modules.js` (`id`, `num`, `title`, `tag`, `blurb`). Progress strips on every page update automatically.
2. Create `<NN-slug>/index.html` from an existing page: hero question, `<nav class="progress-strip">` placeholder, canvas + `drag-hint`, controls with slider/output pairs, `start-here`, `look-for` KPIs, teaching-notes grid, `debugHost`, bootstrap script tag.
3. Create `<NN-slug>/app.js` calling `createExplorable({ id, moduleId, defaults, url, view, params, drag, render, smoke })`. Put new math in a shared module (e.g. `shared/trig-math.js`), not in the page.
4. Add a nav card to the landing page and a Playwright check for the page's core interaction.

Explorable design bar for every module (Bret Victor): one direct-manipulation gesture on the canvas itself (not just sliders), visible drag affordances (`drawHandle`), and the page's core invariant drawn live (e.g. `drawSegmentBar`), not only stated as text.

## Critical local-dev rule

Do not open pages with `file://` directly.

Why:
- Browser blocks ES module imports under `file://` with CORS origin `null`.

How to run correctly:

```bash
npm run dev
```

Then open `http://127.0.0.1:4173`.

## Logging and diagnostics conventions

- Every page must use `createDebugger("page-id")`.
- Every page should run at least 2 smoke checks at boot.
- Keep smoke checks deterministic and under ~5ms each.
- Keep console prefixes stable for grepability:
  - `[p1-ellipse]`
  - `[p2-construction]`
  - etc.
- `?debug=1` enables verbose logging without changing behavior.
- Every page should keep the debug panel mounted under controls.
- Telemetry is persistent and shared across reloads:
  - localStorage key: `conic:telemetry:v1`
  - global window mirror: `window.__CONIC_LOGS__`

## UX and pedagogy requirements

- Each page should include:
  - one clear plain-language concept statement
  - one teacher prompt
  - one student challenge/try-this prompt
  - key vocabulary terms
- Preserve touch-friendly controls and keyboard focus visibility.

## URL state conventions

- Persist interactive controls with `writeUrlState`.
- Parse with `readUrlState` defaults.
- Keep params short and stable (`e`, `a`, `theta`, etc.).

## UX regression expectations

Use Playwright tests before shipping UI changes.

Core commands:

```bash
npm install
npx playwright install
npm run test:ux
```

If another local server already occupies port 4173, run on a different port:

```bash
CONIC_TEST_PORT=4317 npm run test:ux
```

Page smoke checks (`logger.smoke`) are enforced: a `CHECK FAIL` in the console fails the clean-load Playwright tests.

Must-pass categories:
- Navigation links load expected pages.
- No uncaught page errors.
- No console CORS/module errors under HTTP.
- File protocol warning appears under `file://` (guard behavior).
- Core interaction updates URL state.

## Deployment

- GitHub Pages workflow: `.github/workflows/deploy.yml`
- UX CI workflow: `.github/workflows/ux-tests.yml`
- Deploy target is static artifact upload from repo root.

## Agent checklist before handoff

1. Run UX tests (or clearly report why not run).
2. Update docs if architecture or commands changed.
3. Keep `README.md`, `AGENTS.md`, and lesson notes aligned.
4. Add at least one lesson entry for incidents/regressions.
5. Verify logging/telemetry still works after UI changes.
