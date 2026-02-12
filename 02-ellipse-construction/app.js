  import { clamp, distance, ellipsePoint, fociPositions } from "../shared/conic-math.js";
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
  import { makeDraggable, readUrlState, writeUrlState, bindSliderWithNumber } from "../shared/interaction.js";
  import { createDebugger, mountDebugPanel } from "../shared/debug.js";

  const logger = createDebugger("p2-construction");
  const defaults = { c: 3, a: 7.8, t: 0.8 };
  const state = readUrlState(defaults);
  if (state.a <= state.c + 0.25) state.a = state.c + 0.25;

  const canvas = document.getElementById("scene");
  const cRange = document.getElementById("cRange");
  const aRange = document.getElementById("aRange");
  const tRange = document.getElementById("tRange");
  const resetBtn = document.getElementById("resetBtn");

  cRange.value = state.c;
  aRange.value = state.a;
  tRange.value = state.t;

  bindSliderWithNumber({
    slider: cRange,
    output: document.getElementById("cOut"),
    precision: 2,
    onInput: (v) => {
      state.c = v;
      if (state.a <= state.c + 0.25) {
        state.a = state.c + 0.25;
        aRange.value = state.a;
      }
      persist();
    }
  });

  bindSliderWithNumber({
    slider: aRange,
    output: document.getElementById("aOut"),
    precision: 2,
    onInput: (v) => {
      state.a = Math.max(v, state.c + 0.25);
      aRange.value = state.a;
      persist();
    }
  });

  const tSync = bindSliderWithNumber({
    slider: tRange,
    output: document.getElementById("tOut"),
    precision: 2,
    format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`,
    onInput: (v) => {
      state.t = v;
      persist();
    }
  });

  makeDraggable({
    element: canvas,
    onMove(pos) {
      const rect = canvas.getBoundingClientRect();
      const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 24);
      const w = mapper.toWorld(pos);
      const [f1, f2] = [{ x: -state.c, y: 0 }, { x: state.c, y: 0 }];
      const p = ellipsePoint(state.a, Math.sqrt(state.a * state.a - state.c * state.c), state.t);
      const distF1 = Math.hypot(pos.x - mapper.toScreen(f1).x, pos.y - mapper.toScreen(f1).y);
      const distF2 = Math.hypot(pos.x - mapper.toScreen(f2).x, pos.y - mapper.toScreen(f2).y);
      const distP = Math.hypot(pos.x - mapper.toScreen(p).x, pos.y - mapper.toScreen(p).y);

      if (Math.min(distF1, distF2) < 18) {
        state.c = clamp(Math.abs(w.x), 0.2, 8);
        if (state.a <= state.c + 0.25) state.a = state.c + 0.25;
        cRange.value = state.c;
        aRange.value = state.a;
      } else if (distP < 22) {
        const b = Math.sqrt(state.a * state.a - state.c * state.c);
        state.t = Math.atan2(w.y / b, w.x / state.a);
        tRange.value = state.t;
        tSync();
      }
      persist();
    }
  });

  resetBtn.addEventListener("click", () => {
    Object.assign(state, defaults);
    cRange.value = state.c;
    aRange.value = state.a;
    tRange.value = state.t;
    cRange.dispatchEvent(new Event("input", { bubbles: true }));
    aRange.dispatchEvent(new Event("input", { bubbles: true }));
    tRange.dispatchEvent(new Event("input", { bubbles: true }));
    persist();
    logger.event("reset.defaults", { ...state });
  });

  function persist() {
    writeUrlState({ c: state.c.toFixed(2), a: state.a.toFixed(2), t: state.t.toFixed(3) });
    logger.dbg("state.persist", state);
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const ctx = setupHiDPICanvas(canvas);
    const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 24);

    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const c = state.c;
    const a = state.a;
    const b = Math.sqrt(Math.max(0.1, a * a - c * c));
    const [f1, f2] = [{ x: -c, y: 0 }, { x: c, y: 0 }];
    const p = ellipsePoint(a, b, state.t);

    drawEllipse(ctx, mapper, a, b, "#38bdf8", 3);
    drawLine(ctx, mapper, f1, p, "#f97316", 2);
    drawLine(ctx, mapper, p, f2, "#60a5fa", 2);
    drawPoint(ctx, mapper, f1, "#f97316", 6, "F1");
    drawPoint(ctx, mapper, f2, "#60a5fa", 6, "F2");
    drawPoint(ctx, mapper, p, "#facc15", 6, "P");

    const d1 = distance(p, f1);
    const d2 = distance(p, f2);
    const sum = d1 + d2;

    document.getElementById("aval").textContent = a.toFixed(3);
    document.getElementById("bval").textContent = b.toFixed(3);
    document.getElementById("cval").textContent = c.toFixed(3);
    document.getElementById("eval").textContent = (c / a).toFixed(3);
    document.getElementById("equation").textContent = `x^2/${(a * a).toFixed(2)} + y^2/${(b * b).toFixed(2)} = 1`;
    document.getElementById("sumLabel").textContent = `d(P,F1)+d(P,F2) = ${sum.toFixed(3)}; target 2a = ${(2 * a).toFixed(3)}`;

    requestAnimationFrame(render);
  }

  mountDebugPanel({
    target: document.getElementById("debugHost"),
    namespace: "p2-construction",
    getState: () => ({ ...state })
  });

  logger.info("page.init", { ...state });

  logger.smoke([
    {
      name: "ellipse sum property near 2a",
      run: () => {
        const a = 7;
        const c = 3;
        const b = Math.sqrt(a * a - c * c);
        const [f1, f2] = [{ x: -c, y: 0 }, { x: c, y: 0 }];
        const p = ellipsePoint(a, b, 1.1);
        const s = distance(p, f1) + distance(p, f2);
        return Math.abs(s - 2 * a) < 1e-4;
      }
    },
    {
      name: "state bounds valid",
      run: () => state.a > state.c && state.c > 0
    }
  ]);

  requestAnimationFrame(render);
