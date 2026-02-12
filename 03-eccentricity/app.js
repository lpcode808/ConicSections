  import {
    sub,
    add,
    scale,
    fociPositions,
    ellipseNormal,
    rayEllipseIntersection,
    reflectVector,
    normalize
  } from "../shared/conic-math.js";
  import {
    setupHiDPICanvas,
    worldToScreenFactory,
    clear,
    drawGrid,
    drawAxes,
    drawEllipse,
    drawPoint,
    drawLine
  } from "../shared/draw-utils.js";
  import { readUrlState, writeUrlState, bindSliderWithNumber } from "../shared/interaction.js";
  import { createDebugger, mountDebugPanel } from "../shared/debug.js";

  const logger = createDebugger("p3-eccentricity");
  const defaults = { e: 0.3, theta: 0.7, a: 9 };
  const state = readUrlState(defaults);

  const eRange = document.getElementById("eRange");
  const thetaRange = document.getElementById("thetaRange");
  const canvas = document.getElementById("scene");
  const resetBtn = document.getElementById("resetBtn");

  eRange.value = state.e;
  thetaRange.value = state.theta;

  bindSliderWithNumber({
    slider: eRange,
    output: document.getElementById("eOut"),
    precision: 2,
    onInput: (v) => {
      state.e = v;
      persist();
    }
  });

  bindSliderWithNumber({
    slider: thetaRange,
    output: document.getElementById("thetaOut"),
    precision: 2,
    format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`,
    onInput: (v) => {
      state.theta = v;
      persist();
    }
  });

  resetBtn.addEventListener("click", () => {
    Object.assign(state, defaults);
    eRange.value = state.e;
    thetaRange.value = state.theta;
    eRange.dispatchEvent(new Event("input", { bubbles: true }));
    thetaRange.dispatchEvent(new Event("input", { bubbles: true }));
    persist();
    logger.event("reset.defaults", { ...state });
  });

  function persist() {
    writeUrlState({ e: state.e.toFixed(2), theta: state.theta.toFixed(3) });
    logger.dbg("state.persist", state);
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const ctx = setupHiDPICanvas(canvas);
    const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 24);

    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const a = state.a;
    const c = state.e * a;
    const b = a * Math.sqrt(Math.max(0.01, 1 - state.e * state.e));

    drawEllipse(ctx, mapper, a, b, "#38bdf8", 3);

    const [f1, f2] = fociPositions(a, b);
    drawPoint(ctx, mapper, f1, "#fb923c", 6, "F1");
    drawPoint(ctx, mapper, f2, "#60a5fa", 6, "F2");

    const dir = { x: Math.cos(state.theta), y: Math.sin(state.theta) };
    const hit = rayEllipseIntersection(f1, dir, a, b);
    if (hit) {
      const n = ellipseNormal(a, b, hit.x, hit.y);
      const out = reflectVector(dir, n);
      drawPoint(ctx, mapper, hit, "#facc15", 5, "P");
      drawLine(ctx, mapper, f1, hit, "#facc15", 2.5);
      drawLine(ctx, mapper, hit, add(hit, scale(out, 40)), "#facc15", 2.5);
      drawLine(ctx, mapper, hit, add(hit, scale(normalize(sub(f2, hit)), 40)), "rgba(96,165,250,0.45)", 1.5, [6, 6]);
      drawLine(ctx, mapper, add(hit, scale({ x: -n.y, y: n.x }, -4)), add(hit, scale({ x: -n.y, y: n.x }, 4)), "#a1a1aa", 2, [6, 6]);

      const total = Math.hypot(hit.x - f1.x, hit.y - f1.y) + Math.hypot(hit.x - f2.x, hit.y - f2.y);
      document.getElementById("paths").textContent = `F1->P->F2 path: ${total.toFixed(3)} vs 2a=${(2 * a).toFixed(3)}`;
    }

    document.getElementById("dims").textContent = `a=${a.toFixed(2)}, b=${b.toFixed(2)}, c=${c.toFixed(2)}, e=${state.e.toFixed(2)}`;

    requestAnimationFrame(render);
  }

  mountDebugPanel({
    target: document.getElementById("debugHost"),
    namespace: "p3-eccentricity",
    getState: () => ({ ...state })
  });

  logger.info("page.init", { ...state });

  logger.smoke([
    {
      name: "e=0 produces circle (b=a)",
      run: () => {
        const e = 0;
        const a = 9;
        const b = a * Math.sqrt(1 - e * e);
        return Math.abs(b - a) < 1e-9;
      }
    },
    {
      name: "e near 1 gives small b",
      run: () => {
        const e = 0.99;
        const a = 9;
        const b = a * Math.sqrt(1 - e * e);
        return b < 2;
      }
    }
  ]);

  requestAnimationFrame(render);
