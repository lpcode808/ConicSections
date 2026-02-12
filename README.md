# Conic Sections Explorable Explanations

Static multi-page conic sections interactives for classroom projection and student self-study.

## Quick Start

Do not open pages with `file://`.

Run an HTTP server from project root:

```bash
npm install
npx playwright install
npm run dev
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Project Structure

- `index.html` landing page
- `shared/conic-math.js` math + geometry logic
- `shared/draw-utils.js` canvas helpers
- `shared/interaction.js` pointer + URL state helpers
- `shared/debug.js` smoke checks + persistent telemetry
- `shared/bootstrap.js` file protocol guard + app module loader
- `01-ellipse-reflection/index.html` + `01-ellipse-reflection/app.js`
- `02-ellipse-construction/index.html` + `02-ellipse-construction/app.js`
- `03-eccentricity/index.html` + `03-eccentricity/app.js`
- `04-parabola-reflection/index.html` + `04-parabola-reflection/app.js`
- `05-hyperbola-reflection/index.html` + `05-hyperbola-reflection/app.js`
- `06-conic-family/index.html` + `06-conic-family/app.js`

## Logging and Debugging

- Add `?debug=1` to any page for verbose logs.
- Every page mounts a Debug Panel with:
  - state snapshot logging
  - debug query toggle
  - telemetry download
  - telemetry clear
- Telemetry is persisted in localStorage key: `conic:telemetry:v1`.
- Global handlers capture window errors, unhandled rejections, and throttled interaction events.

## UX Test Suite (Playwright)

Run all UX regressions:

```bash
npm run test:ux
```

Coverage includes:
- cross-page load sanity
- no module/CORS issues over HTTP
- key interactions + URL state sync
- debug panel behavior
- mobile viewport checks
- `file://` regression warning behavior

## GitHub Pages Deployment

- Deployment workflow: `.github/workflows/deploy.yml`
- UX gate workflow: `.github/workflows/ux-tests.yml`

Set repo Pages source to **GitHub Actions**.

## Launch To GitHub Repo

Target repo:
- [lpcode808/ConicSections](https://github.com/lpcode808/ConicSections)

See `docs/github-launch.md` for exact push commands.
