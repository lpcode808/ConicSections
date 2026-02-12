  import {
    add,
    scale,
    normalize,
    sub,
    reflectVector,
    hyperbolaNormal,
    rayHyperbolaIntersection
  } from "../shared/conic-math.js";
  import {
    setupHiDPICanvas,
    worldToScreenFactory,
    clear,
    drawGrid,
    drawAxes,
    drawHyperbola,
    drawPoint,
    drawLine
  } from "../shared/draw-utils.js";
  import { readUrlState, writeUrlState, bindSliderWithNumber } from "../shared/interaction.js";
  import { createDebugger, mountDebugPanel } from "../shared/debug.js";

  const logger = createDebugger("p5-hyperbola");
  const defaults = { a: 4, b: 2.6, aim: 0.2 };
  const state = readUrlState(defaults);

  const aRange = document.getElementById("aRange");
  const bRange = document.getElementById("bRange");
  const aimRange = document.getElementById("aimRange");
  const canvas = document.getElementById("scene");
  const resetBtn = document.getElementById("resetBtn");

  aRange.value = state.a;
  bRange.value = state.b;
  aimRange.value = state.aim;

  bindSliderWithNumber({
    slider: aRange,
    output: document.getElementById("aOut"),
    precision: 2,
    onInput: (v) => {
      state.a = v;
      persist();
    }
  });
  bindSliderWithNumber({
    slider: bRange,
    output: document.getElementById("bOut"),
    precision: 2,
    onInput: (v) => {
      state.b = v;
      persist();
    }
  });
  bindSliderWithNumber({
    slider: aimRange,
    output: document.getElementById("aimOut"),
    precision: 2,
    onInput: (v) => {
      state.aim = v;
      persist();
    }
  });

  resetBtn.addEventListener("click", () => {
    Object.assign(state, defaults);
    aRange.value = state.a;
    bRange.value = state.b;
    aimRange.value = state.aim;
    aRange.dispatchEvent(new Event("input", { bubbles: true }));
    bRange.dispatchEvent(new Event("input", { bubbles: true }));
    aimRange.dispatchEvent(new Event("input", { bubbles: true }));
    persist();
    logger.event("reset.defaults", { ...state });
  });

  function persist() {
    writeUrlState({ a: state.a.toFixed(2), b: state.b.toFixed(2), aim: state.aim.toFixed(2) });
    logger.dbg("state.persist", state);
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const ctx = setupHiDPICanvas(canvas);
    const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 34);

    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const a = state.a;
    const b = state.b;
    drawHyperbola(ctx, mapper, a, b);

    const c = Math.sqrt(a * a + b * b);
    const fL = { x: -c, y: 0 };
    const fR = { x: c, y: 0 };
    drawPoint(ctx, mapper, fL, "#fb923c", 6, "F1");
    drawPoint(ctx, mapper, fR, "#60a5fa", 6, "F2");

    drawLine(ctx, mapper, { x: -20, y: (-b / a) * -20 }, { x: 20, y: (-b / a) * 20 }, "#64748b", 1.4, [7, 6]);
    drawLine(ctx, mapper, { x: -20, y: (b / a) * -20 }, { x: 20, y: (b / a) * 20 }, "#64748b", 1.4, [7, 6]);

    const origin = { x: 16, y: state.aim };
    const aimed = normalize(sub(fL, origin));
    const hit = rayHyperbolaIntersection(origin, aimed, a, b);
    if (hit && hit.x > 0) {
      const n = hyperbolaNormal(a, b, hit.x, hit.y);
      const out = reflectVector(aimed, n);
      drawPoint(ctx, mapper, hit, "#facc15", 5, "P");
      drawLine(ctx, mapper, origin, hit, "#facc15", 2.3);
      drawLine(ctx, mapper, hit, add(hit, scale(out, 26)), "#facc15", 2.3);
      drawLine(ctx, mapper, hit, add(hit, scale(normalize(sub(fR, hit)), 28)), "rgba(96,165,250,0.45)", 1.4, [6, 6]);
    }

    document.getElementById("info").textContent = `Eccentricity e = ${(Math.sqrt(1 + (b * b) / (a * a))).toFixed(3)} (>1)`;

    requestAnimationFrame(render);
  }

  mountDebugPanel({
    target: document.getElementById("debugHost"),
    namespace: "p5-hyperbola",
    getState: () => ({ ...state })
  });

  logger.info("page.init", { ...state });

  logger.smoke([
    {
      name: "hyperbola eccentricity > 1",
      run: () => Math.sqrt(1 + (state.b * state.b) / (state.a * state.a)) > 1
    },
    {
      name: "focus distance formula",
      run: () => Math.abs(Math.sqrt(state.a * state.a + state.b * state.b) ** 2 - (state.a * state.a + state.b * state.b)) < 1e-8
    }
  ]);

  requestAnimationFrame(render);
