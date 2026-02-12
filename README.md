# Conic Sections Explorable Explanations

## Live Site

- **Open the interactive site:** [https://lpcode808.github.io/ConicSections/](https://lpcode808.github.io/ConicSections/)

## For Teachers

This project is a classroom-ready set of interactive conic sections explorations designed for:

- teacher-led projection demos
- student self-paced exploration
- quick assignment of specific pages (each module stands alone)

### What students can explore

- Ellipse reflection (focus-to-focus ray behavior)
- Ellipse construction (string-and-pins model)
- Eccentricity (circle to elongated ellipse)
- Parabola reflection (parallel rays and focus)
- Hyperbola reflection (divergent sibling behavior)
- Unified conic family view (eccentricity as unifier)

### How this was made

- Built from a PRD + architecture plan into a full static GitHub Pages site.
- Implemented as modular vanilla HTML/CSS/JS pages (no heavy framework required).
- Added debugging and regression testing to keep it reliable for classroom use.
- Added teacher-facing explanation blocks and prompts across pages.

## Technical Notes (For Developers)

### Local Dev

Do not open pages with `file://`.

Use:

```bash
npm install
npx playwright install
npm run dev
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

### Structure

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

### Logging + Debugging

- Add `?debug=1` to any page for verbose logs.
- Each page includes a debug panel (snapshot/toggle/download/clear).
- Persistent telemetry key: `conic:telemetry:v1`.

### UX Tests

Run:

```bash
npm run test:ux
```

### Deployment

- GitHub Pages workflow: `.github/workflows/deploy.yml`
- UX workflow: `.github/workflows/ux-tests.yml`
- Pages source should be set to **GitHub Actions**

Target repo: [https://github.com/lpcode808/ConicSections](https://github.com/lpcode808/ConicSections)
