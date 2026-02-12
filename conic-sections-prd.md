# Conic Sections Explorable Explanations — PRD & Architecture Plan

## Project Overview

**What:** A modular set of interactive web pages that let high school students explore the reflective properties of conic sections — starting with the ellipse (matching a physical 3D-printed demo with quartz and laser pointer), then expanding to parabolas, hyperbolas, and the unified "conic family" view.

**Why:** The physical demo is compelling but static — one laser, one angle, one "wow." The digital companion lets students ask "what if?" What if I drag the laser? What if I change the shape? What if the foci move? What if this weren't an ellipse at all?

**Who:** High school geometry/precalculus students + their teacher. Dual-use: teacher-led projected demo AND independent student exploration.

**Where:** GitHub Pages. Link-out from Desmos activities or any LMS.

---

## Design Philosophy (from Bret Victor)

Three principles from the project's reference materials that should guide every implementation decision:

### 1. "The reader interacts if they want to go deeper"
Each page must **work as a static explanation** — readable, understandable text + clear diagrams. Interaction enhances but isn't required. This matters because some students will just read, and that's fine.

### 2. "Explorable examples, not sandboxes"
We're not dumping students into a blank canvas. The author (the teacher) provides structure, poses questions, and guides attention. The student responds by manipulating parameters. As Victor wrote: "Most interactive widgets dump the user in a sandbox and say 'figure it out for yourself.' Those are not explanations."

### 3. "Multiple synchronized representations"
Show the same phenomenon through different lenses simultaneously — the geometric view, the algebraic equation, the angle measurements, the ray paths. When a student drags a slider, ALL of these update. The "dance" between representations builds intuition.

---

## Glossary / Key Concepts to Demystify

These terms should be defined inline on the pages themselves (tooltip or inline expansion), but the implementing agent should understand them:

| Term | Plain English | Math Definition |
|------|--------------|-----------------|
| **Conic Section** | The curve you get when you slice a cone with a flat plane — like cutting a carrot at an angle gives you an oval | Intersection of a plane with a double-napped cone |
| **Ellipse** | An oval where every point keeps the same total distance to two special points | Set of points P where d(P,F₁) + d(P,F₂) = constant |
| **Foci** (singular: focus) | The two special points inside an ellipse. Pronounced "FOE-sigh" | The fixed points F₁ and F₂ in the definition |
| **Eccentricity** (e) | How "squished" the ellipse is. e=0 is a circle, e close to 1 is very elongated | e = c/a where c = distance from center to focus, a = semi-major axis |
| **Semi-major axis** (a) | Half the longest diameter of the ellipse | Half the distance across the widest part |
| **Semi-minor axis** (b) | Half the shortest diameter | Half the distance across the narrowest part |
| **Reflective Property** | A ray from one focus always bounces to the other focus — the angle in equals the angle out, measured against the tangent line | Focal radii at any point make equal angles with the tangent |
| **Tangent Line** | The line that just barely touches the curve at one point — like a ball balanced on a hill | Line that touches the curve at exactly one point locally |
| **Parabola** | The curve where every point is equidistant from a point (focus) and a line (directrix). U-shaped | Set of points P where d(P, F) = d(P, directrix) |
| **Hyperbola** | Two mirror-image curves where the *difference* of distances to two foci is constant | Set of points P where |d(P,F₁) - d(P,F₂)| = constant |
| **Directrix** | A reference line used to define parabolas and other conics | A fixed line L in the focus-directrix definition |

---

## Content Architecture: Modular Pages

Each page is a **standalone HTML file** — one topic, one file, independently deployable. This is intentional:

- **Easier to maintain** — fixing a bug on one page can't break another
- **AI-coding friendly** — an agent can work on one file without context of the whole project
- **Teacher flexibility** — can assign specific pages, reorder, skip
- **Progressive deployment** — ship Page 1, get feedback, iterate, ship Page 2

### Shared Resources (the only "coupling")
```
conic-explorables/
├── index.html              ← Landing/nav page
├── shared/
│   ├── styles.css          ← Common typography, layout, dark/light
│   ├── conic-math.js       ← Shared math utilities (see below)
│   ├── draw-utils.js       ← Canvas/SVG drawing helpers
│   └── interaction.js      ← Drag, slider, tooltip behaviors
├── 01-ellipse-reflection/
│   └── index.html          ← Self-contained page
├── 02-ellipse-construction/
│   └── index.html
├── 03-eccentricity/
│   └── index.html
├── 04-parabola-reflection/
│   └── index.html
├── 05-hyperbola-reflection/
│   └── index.html
├── 06-conic-family/
│   └── index.html
└── README.md
```

**Why this structure over a SPA (Single Page App)?**

| Approach | Pros | Cons |
|----------|------|------|
| **Separate HTML files** (recommended) | Zero build step, AI-agent friendly, independent deploys, works offline, simple mental model | Some code duplication, no shared state between pages |
| **React SPA with router** | Shared components, transitions between sections, single codebase | Build step required, harder for non-dev teacher to modify, overkill for content |
| **Svelte/SvelteKit** | Best reactive model for this use case, small bundles, elegant | Learning curve for implementing agent, build step, less universal |

The recommendation is separate HTML files with a thin shared utility layer. The "coupling" is just a few JS utility files that handle the math and drawing — if one page needs to diverge, it can just copy and modify.

---

## Page-by-Page Specifications

### Page 1: Ellipse Reflection (The Hero Page) 🎯
**Priority: BUILD FIRST — this matches the physical demo**

**Opening:** Brief text explaining the setup — "Your teacher has a 3D-printed ellipse with a quartz crystal at one focus and a laser at the other. Here's why that works."

**Interactive Element 1: Single Ray Tracer**
- Canvas showing an ellipse with two marked foci (labeled F₁ and F₂)
- Student drags a ray direction from F₁
- Ray travels, hits the ellipse wall, reflects, and lands on F₂
- Show the tangent line at the hit point
- Show the incident angle and reflected angle (numerically, visually)
- "Discovery moment": no matter where they aim, it always hits F₂

**Interactive Element 2: Multi-Ray Burst**
- Button: "Fire rays in all directions"
- Animated burst of 20-30 rays emanating from F₁
- All converge on F₂ simultaneously (this is the "whoa" moment)
- Visual emphasis: rays arrive at F₂ at slightly different times because path lengths differ... except they DON'T differ (all paths = 2a). Optional: show distance labels.

**Interactive Element 3: Why Equal Angles?**
- Guided explanation with draggable point P on the ellipse
- Shows: tangent line at P, the two focal radii F₁P and F₂P
- Shows: angle of incidence = angle of reflection
- Text explains the connection to Heron's theorem / minimum path

**Teacher Mode Hooks:**
- A "present" toggle that hides explanation text, enlarges the canvas — pure visual demo
- A "challenge" prompt: "Can you find ANY angle where the ray misses F₂?"

**Key Math (for conic-math.js):**
```
// Ellipse parametric form
x(t) = a * cos(t)
y(t) = b * sin(t)

// Tangent at point (x₀, y₀) on ellipse x²/a² + y²/b² = 1
// Normal vector: (x₀/a², y₀/b²)
// Tangent vector: (-y₀/b², x₀/a²)  [perpendicular to normal]

// Reflection: reflect incident ray across tangent line
// v_reflected = v - 2(v · n̂)n̂  where n̂ is the unit normal

// Finding intersection of ray with ellipse:
// Parametric ray: P = origin + t * direction
// Substitute into ellipse equation, solve quadratic for t
```

---

### Page 2: Ellipse Construction — How Do You Even Make One?
**Priority: HIGH — grounds the definition before going further**

**Interactive Element 1: String-and-Pins Construction**
- Two draggable pins (foci) on the canvas
- A virtual "string" of fixed length connecting through a pencil point
- Student drags the pencil — it traces the ellipse
- The string length (= 2a) is shown and adjustable
- Shows: d(P, F₁) + d(P, F₂) = constant, updating in real-time

**Interactive Element 2: From Definition to Equation**
- Side-by-side: geometric view ↔ algebraic equation
- As student moves foci or changes string length, the equation updates
- Highlight which part of the equation corresponds to which geometric feature
- x²/a² + y²/b² = 1 with a, b labeled on the diagram

**Connection to Physical Demo:**
- Photo/diagram overlay showing where the quartz and laser sit relative to the equation

---

### Page 3: Eccentricity — From Circle to Needle
**Priority: MEDIUM — the "ladder of abstraction" page**

**Interactive Element 1: The Eccentricity Slider**
- Single slider: e from 0 to 0.99
- Ellipse morphs in real-time from perfect circle (e=0) to extremely elongated
- Foci visibly move apart as e increases
- Labels update: a, b, c, e values

**Interactive Element 2: Eccentricity + Reflection Combined**
- Same slider, but now also showing reflection rays
- Student discovers: at e=0 (circle), rays from center bounce back to center
- At high e, rays take dramatically different paths but still converge
- At extreme e, the ellipse is so narrow that reflections look almost like a straight corridor

**Real-World Connection Sidebar:**
- Earth's orbit: e ≈ 0.017 (nearly circular)
- Pluto's orbit: e ≈ 0.25 (noticeably elliptical)
- Halley's Comet: e ≈ 0.97 (extremely elongated)
- Whispering galleries: low eccentricity for even sound distribution
- Lithotripsy: specific eccentricity to focus shock waves on kidney stones

---

### Page 4: Parabola Reflection — The One-Focus Cousin
**Priority: MEDIUM-HIGH — natural next step, very satisfying**

**Interactive Element 1: Parallel Rays → Focus**
- Parabola with marked focus and directrix
- Rays come in parallel to the axis of symmetry
- All reflect through the single focus
- Student can tilt the incoming angle — only parallel rays converge perfectly

**Interactive Element 2: Focus → Parallel Rays (Reverse)**
- Point source at the focus
- Rays emanate, hit the parabola, and leave PARALLEL
- This is how flashlights and satellite dishes work

**Interactive Element 3: "What If the Ellipse Got Infinitely Long?"**
- Slider that morphs an ellipse (moving one focus to infinity) into a parabola
- This is the deep conceptual link — a parabola IS an ellipse where one focus went to infinity
- Directrix appears as the "ghost" of the infinitely distant focus

**Real-World Sidebar:**
- Satellite dishes, car headlights, solar cookers, radio telescopes

---

### Page 5: Hyperbola Reflection — The Divergent Sibling
**Priority: MEDIUM — completes the trifecta**

**Interactive Element 1: Ray Aimed at Hidden Focus**
- Hyperbola with two branches and two foci
- Ray aimed toward one focus (behind the curve) reflects toward the other focus
- Key difference from ellipse: rays don't converge, they DIVERGE from the second focus (or converge depending on perspective)

**Interactive Element 2: Cassegrain Telescope**
- Combined parabola + hyperbola system
- Light hits parabolic mirror → reflects toward parabola's focus → intercepted by hyperbolic mirror → redirected to eyepiece
- Animated ray trace through the whole system
- This is genuinely how many real telescopes work

**Conceptual Link:**
- "What if the Ellipse Got Sliced Too Steeply?"
- Eccentricity > 1 transition visualization

---

### Page 6: The Conic Family — Unified View
**Priority: LOW (capstone) — but architecturally important**

**Interactive Element 1: The Cone Slicer**
- 3D visualization (Three.js or CSS 3D transforms) of a double-napped cone
- Draggable cutting plane
- As the plane tilts, the intersection curve morphs: circle → ellipse → parabola → hyperbola
- The 2D cross-section is shown alongside

**Interactive Element 2: Eccentricity as Unifier**
- Single slider from e=0 to e=2
- e < 1: ellipse (shrinking to circle at 0)
- e = 1: parabola (the boundary case)
- e > 1: hyperbola
- All shown with their reflective properties active
- The student sees the SAME underlying math manifesting differently

**Interactive Element 3: Focus-Directrix Unification**
- All three conics defined by the same rule: distance to focus / distance to directrix = e
- Slider changes e, curve morphs continuously
- This is the "aha" that ties the whole series together

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                   LANDING PAGE                       │
│    "Conic Sections: Light, Shape, and Reflection"    │
│                                                      │
│    [Physical Demo Photo]                             │
│    Brief intro: "Your teacher showed you..."         │
│                                                      │
│    Navigation to all pages                           │
└───────┬──────────┬──────────┬──────────┬────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
   ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ ELLIPSE │ │PARABOLA│ │HYPRBOLA│ │ FAMILY │
   │ TRACK   │ │  (P4)  │ │  (P5)  │ │  (P6)  │
   └────┬────┘ └────────┘ └────────┘ └────────┘
        │
        ▼
   ┌─────────────────────┐
   │ P1: Reflection      │ ◄── START HERE (matches physical demo)
   │ "Why does the laser  │
   │  always hit the      │
   │  quartz?"            │
   └────────┬────────────┘
            │ "But what IS an ellipse?"
            ▼
   ┌─────────────────────┐
   │ P2: Construction     │
   │ "Build one yourself" │
   │ String + pins method │
   └────────┬────────────┘
            │ "What if I change the shape?"
            ▼
   ┌─────────────────────┐
   │ P3: Eccentricity    │
   │ "From circle to     │
   │  needle — and why   │
   │  it matters"        │
   └─────────────────────┘

SUGGESTED SEQUENCE (but not enforced):
P1 → P2 → P3 → P4 → P5 → P6

Each page is independently accessible.
Teacher can assign any subset in any order.
```

---

## Shared Math Library (conic-math.js) — Key Functions

This is the foundational code that every page draws from. Getting this right early means every subsequent page is faster to build.

```javascript
// === ELLIPSE ===

// Parametric point on ellipse
ellipsePoint(a, b, t)
// Returns {x, y} for parameter t ∈ [0, 2π]

// Normal vector at point on ellipse (points outward)
ellipseNormal(a, b, x, y)
// Returns unit normal {nx, ny}

// Tangent vector at point on ellipse
ellipseTangent(a, b, x, y)
// Returns unit tangent {tx, ty}

// Find where a ray intersects the ellipse
// Returns the FARTHER intersection (for internal reflections)
rayEllipseIntersection(origin, direction, a, b)
// Returns {x, y, t_param} or null

// Reflect a direction vector across a normal
reflectVector(direction, normal)
// Returns reflected direction {dx, dy}

// Compute eccentricity from a, b
eccentricity(a, b)
// Returns e = sqrt(1 - b²/a²)

// Compute foci positions from a, b (centered at origin)
fociPositions(a, b)
// Returns [{x: -c, y: 0}, {x: c, y: 0}] where c = sqrt(a²-b²)


// === PARABOLA ===

// Parametric point: y = x²/(4p) where p = focal length
parabolaPoint(p, t)

// Normal and tangent at point
parabolaNormal(p, x, y)
parabolaTangent(p, x, y)

// Ray-parabola intersection
rayParabolaIntersection(origin, direction, p)


// === HYPERBOLA ===

// Parametric point: x = a*cosh(t), y = b*sinh(t)
hyperbolaPoint(a, b, t)

// Normal, tangent, intersection — analogous to ellipse


// === UNIFIED ===

// Generate conic from eccentricity and semi-latus rectum
// This is the function that lets you smoothly morph between conics
conicPoint(e, l, theta)
// Uses polar form: r = l / (1 + e*cos(θ))
// e < 1 → ellipse, e = 1 → parabola, e > 1 → hyperbola
```

---

## Interaction Patterns (interaction.js)

### Draggable Points
Students drag foci, drag points on the curve, drag the laser direction. Use pointer events (not mouse events) for touch support.

```
Pointer down → record start position
Pointer move → update position, trigger recalculation, re-render
Pointer up → finalize

Critical: ALL dependent values update on EVERY move event.
No "submit" buttons. No lag. This is the Bret Victor principle.
Target: <16ms per update cycle (60fps).
```

### Sliders with Inline Values
For parameters like eccentricity, number of rays, animation speed. The numeric value appears next to the slider and is also directly editable (click to type).

### Hover-to-Reveal
Mousing over a ray path highlights the corresponding angle measurements. Mousing over an equation term highlights the corresponding geometric element. This is bidirectional — hover the geometry, see the algebra light up; hover the algebra, see the geometry light up.

### Animation Controls
Play/pause/step for animated sequences (ray burst, wave propagation). Scrubber timeline for stepping through animation frames. Speed control.

---

## Visual Design Guidelines

### Typography
- Clean sans-serif (system font stack or Inter)
- Math rendered with KaTeX (lightweight, fast) not MathJax (heavy, slow)
- Interactive values styled distinctly: colored, underlined, cursor changes to ew-resize

### Color Palette
- Ellipse/curve: bold stroke, dark on light / light on dark
- Focus F₁ (laser): warm red/orange
- Focus F₂ (quartz): cool blue/purple
- Rays: yellow-gold with slight glow effect
- Tangent line: dashed gray
- Angle arcs: green for incidence, green for reflection (same color = equal angles!)
- Background: off-white or dark mode toggle

### Canvas vs SVG Decision
| | Canvas (recommended for this project) | SVG |
|---|---|---|
| **Performance** | Excellent for many rays, animations | Slower with many elements |
| **Interaction** | Manual hit-testing needed | Native DOM events on elements |
| **Resolution** | Need to handle DPI manually | Automatically sharp |
| **Verdict** | Better for ray-tracing animations | Better for construction diagrams |

**Recommendation:** Use Canvas for ray-tracing pages (P1, P4, P5), SVG for construction/definition pages (P2, P3). The shared library should support both.

---

## Implementation Phases

### Phase 1: Foundation + Hero Page (Week 1-2)
**Goal: Deployable P1 that matches the physical demo**

- [ ] Set up repo with folder structure
- [ ] Build `conic-math.js` — ellipse functions only
- [ ] Build `draw-utils.js` — canvas rendering for ellipse + rays
- [ ] Build `interaction.js` — drag and slider behaviors  
- [ ] Build P1: Ellipse Reflection (all three interactive elements)
- [ ] Deploy to GitHub Pages
- [ ] Teacher reviews with students, collects feedback

**Why this order:** The shared libraries built for P1 are 70% of what's needed for all subsequent pages. And P1 is the most directly motivated by the physical demo — it has an immediate audience.

### Phase 2: Deepen the Ellipse (Week 3)
- [ ] Build P2: Construction (string-and-pins)
- [ ] Build P3: Eccentricity slider
- [ ] Add landing page with navigation
- [ ] Polish based on Phase 1 feedback

### Phase 3: Expand to Other Conics (Week 4-5)
- [ ] Extend `conic-math.js` with parabola + hyperbola functions
- [ ] Build P4: Parabola Reflection
- [ ] Build P5: Hyperbola Reflection
- [ ] Add "ellipse → parabola" morph transition

### Phase 4: Unify (Week 6)
- [ ] Build P6: Conic Family / Cone Slicer
- [ ] Add cross-page navigation and "suggested next" links
- [ ] Teacher guide / facilitation notes page
- [ ] Accessibility audit (keyboard nav, screen reader, color contrast)

---

## Technical Decisions for the Implementing Agent

### No Build Step
All pages are vanilla HTML + CSS + JS. No npm, no webpack, no React. Reasons:
- GitHub Pages serves static files directly
- Teacher can view-source and understand (or at least not be intimidated)
- Any AI coding agent can generate and edit a single HTML file
- Students on school Chromebooks won't hit any compatibility issues

### ES Modules for Shared Code
```html
<script type="module">
  import { ellipsePoint, rayEllipseIntersection } from '../shared/conic-math.js';
  import { drawEllipse, drawRay } from '../shared/draw-utils.js';
</script>
```
ES modules work natively in all modern browsers, no bundler needed.

### KaTeX for Math Rendering
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
```
KaTeX is ~5x faster than MathJax and renders identically for the math we need.

### Responsive Design
- Canvas/SVG should resize to container width
- On mobile: stack text above visualization (instead of side-by-side)
- Touch events via pointer events API (unified mouse + touch)
- Minimum touch target: 44px (Apple HIG guideline)

### URL State for Sharing
Each interactive should encode its state in URL parameters so a teacher can share a specific configuration: `?e=0.8&rays=12&showTangent=true`

---

## What Desmos Already Does Well (Don't Duplicate)

Desmos is excellent for:
- Graphing equations and seeing them update
- Slider-driven exploration of standard form equations
- Regression and data fitting

**Our pages should complement, not compete.** We handle:
- Ray tracing and reflection physics (Desmos can't do this natively)
- Animated multi-ray simulations
- Geometric construction (string method)
- 3D cone-slicing visualization
- Guided narrative with embedded interactives (explorable explanation format)

Consider adding "Open in Desmos" links where relevant — e.g., from P3 (eccentricity), link to a Desmos activity where students can manipulate the equation directly.

---

## Success Criteria

1. **The "Whoa" Test:** When a student drags the laser to 50+ different angles and every single ray hits F₂, they should feel surprise and then curiosity about *why*.

2. **The Static Reading Test:** A student who never interacts with anything should still learn from reading the text and viewing the default state of diagrams.

3. **The Teacher Projection Test:** On a projector in a bright classroom, the visualizations are visible, the text is readable, and the teacher can drive the interaction while talking.

4. **The Phone Test:** A student can meaningfully interact with P1 on their phone (touch drag the laser, see the reflection).

5. **The "What If" Test:** Each page should provoke at least one question that the student can answer by interacting — not by being told.

---

## Open Questions for Teacher Feedback After P1

- Is the pacing right? Too much text? Not enough?
- Do students try to interact without being told to, or do they need prompting?
- Is the connection to the physical demo clear?
- What questions do students ask that the page doesn't answer?
- Would a "challenge mode" (e.g., "predict where the ray goes before clicking") help?
