# Conic Sections Explorable Explanations

> Explorable math that lets students drag before they derive — light, shape, and reflection made tangible. A six-module interactive curriculum on conic sections, designed for both classroom projection and independent student exploration.

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

This is a static, dependency-light site: vanilla HTML/CSS/JS pages load shared ES modules for math, canvas drawing, URL state, and telemetry. There is no backend, build step, or external runtime service required for normal use.

### Local Dev

Do not open pages with `file://`.

Use:

```bash
npm install
npx playwright install
npm run dev
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

The project also includes a `file://` guard. If someone opens a page directly from Finder, the app shows a clear warning instead of letting ES module CORS errors flood the console.

### Structure

- `index.html` landing page
- `shared/explorable.js` page runtime (declarative controls, URL state, drag, render loop)
- `shared/modules.js` module manifest — single source for the sequence and progress strips
- `shared/conic-math.js` math + geometry logic
- `shared/draw-utils.js` canvas helpers (drag handles, invariant bars, angle arcs)
- `shared/interaction.js` pointer + URL state helpers
- `shared/debug.js` smoke checks + persistent telemetry
- `shared/bootstrap.js` file protocol guard + app module loader
- `01-ellipse-reflection/index.html` + `01-ellipse-reflection/app.js`
- `02-ellipse-construction/index.html` + `02-ellipse-construction/app.js`
- `03-eccentricity/index.html` + `03-eccentricity/app.js`
- `04-parabola-reflection/index.html` + `04-parabola-reflection/app.js`
- `05-hyperbola-reflection/index.html` + `05-hyperbola-reflection/app.js`
- `06-conic-family/index.html` + `06-conic-family/app.js`

The runtime in `shared/explorable.js` is concept-agnostic: a new module (including non-conic math topics) is a manifest entry, an HTML page, and an `app.js` that declares state, controls, a drag gesture, and a render function. See "Adding a new module" in `AGENTS.md`.

Every module supports direct manipulation on the diagram itself — drag the laser, the foci, the pencil point, the focus of the dish, the launch point, or the sample point P — with sliders as the keyboard-accessible equivalent. Core invariants are drawn live (the d1 + d2 = 2a "string" bar, equal reflection angles, the focus/directrix ratio bars), not just stated.

### Logging + Debugging

- Add `?debug=1` to any page for verbose logs.
- Each page includes a debug panel (snapshot/toggle/download/clear).
- Persistent telemetry key: `conic:telemetry:v1`.
- Telemetry stays local in the browser unless a user clicks **Download telemetry JSON**.
- The app does not call a backend API or send classroom interaction data over the network.

### UX Tests

Run:

```bash
npm run test:ux
```

The Playwright suite starts the same static dev server used locally and runs desktop + mobile smoke checks for:

- page/module loading
- navigation and bonus route visibility
- console/page errors
- URL state updates and persisted toggles
- accessible diagram names and live status text
- keyboard slider interaction
- mobile overflow
- `file://` guard behavior

### Deployment

- GitHub Pages workflow: `.github/workflows/deploy.yml`
- UX workflow: `.github/workflows/ux-tests.yml`
- Pages source should be set to **GitHub Actions**
- Deploy target is the repository root as a static artifact. Keep relative links and ES module imports compatible with GitHub Pages subpaths.

Target repo: [https://github.com/lpcode808/ConicSections](https://github.com/lpcode808/ConicSections)

### Known Limitations

- Canvas diagrams are visual-first. Each page provides labeled controls, live text summaries, and teacher notes, but the full geometric drawing is not a text-native proof.
- Dragging on canvas is pointer-based; equivalent slider controls remain keyboard reachable for the core state changes.
- Telemetry uses `localStorage`, so private browsing modes or storage restrictions may keep only runtime logs.
