  import { parabolaNormal, rayParabolaIntersection, reflectVector, normalize, add, scale } from "../shared/conic-math.js";
  import {
    setupHiDPICanvas,
    worldToScreenFactory,
    clear,
    drawGrid,
    drawAxes,
    drawParabola,
    drawPoint,
    drawLine
  } from "../shared/draw-utils.js";
  import { readUrlState, writeUrlState, bindSliderWithNumber } from "../shared/interaction.js";
  import { createDebugger, mountDebugPanel } from "../shared/debug.js";

  const logger = createDebugger("p4-parabola");
  const defaults = { p: 3, tilt: 0, mode: "in" };
  const state = readUrlState(defaults);

  const canvas = document.getElementById("scene");
  const pRange = document.getElementById("pRange");
  const tiltRange = document.getElementById("tiltRange");
  const modeBtn = document.getElementById("modeBtn");
  const resetBtn = document.getElementById("resetBtn");
  const modeText = document.getElementById("modeText");

  pRange.value = state.p;
  tiltRange.value = state.tilt;

  function syncModeButton() {
    const isOut = state.mode === "out";
    modeBtn.textContent = isOut ? "Mode: Focus -> Parallel" : "Mode: Parallel -> Focus";
    modeBtn.setAttribute("aria-pressed", String(isOut));
  }

  bindSliderWithNumber({
    slider: pRange,
    output: document.getElementById("pOut"),
    precision: 2,
    onInput: (v) => {
      state.p = v;
      persist();
    }
  });
  bindSliderWithNumber({
    slider: tiltRange,
    output: document.getElementById("tiltOut"),
    precision: 2,
    format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`,
    onInput: (v) => {
      state.tilt = v;
      persist();
    }
  });

  modeBtn.addEventListener("click", () => {
    state.mode = state.mode === "in" ? "out" : "in";
    syncModeButton();
    persist();
    logger.event("mode.toggle", { mode: state.mode });
  });

  resetBtn.addEventListener("click", () => {
    Object.assign(state, defaults);
    pRange.value = state.p;
    tiltRange.value = state.tilt;
    pRange.dispatchEvent(new Event("input", { bubbles: true }));
    tiltRange.dispatchEvent(new Event("input", { bubbles: true }));
    syncModeButton();
    persist();
    logger.event("reset.defaults", { ...state });
  });

  function persist() {
    writeUrlState({ p: state.p.toFixed(2), tilt: state.tilt.toFixed(3), mode: state.mode });
    logger.dbg("state.persist", state);
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const ctx = setupHiDPICanvas(canvas);
    const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 26, { x: 0, y: 3.2 });

    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const p = state.p;
    const focus = { x: 0, y: p };
    drawParabola(ctx, mapper, p, -13, 13, "#22c55e", 3);
    drawPoint(ctx, mapper, focus, "#60a5fa", 6, "Focus");
    drawLine(ctx, mapper, { x: -18, y: -p }, { x: 18, y: -p }, "#a1a1aa", 1.5, [7, 6]);

    const count = 10;
    const incoming = normalize({ x: Math.sin(state.tilt), y: -Math.cos(state.tilt) });
    const endline = normalize({ x: -incoming.y, y: incoming.x });

    for (let i = 0; i < count; i += 1) {
      const offset = -9 + (i / (count - 1)) * 18;
      if (state.mode === "in") {
        const start = add({ x: 0, y: 14 }, scale(endline, offset));
        const hit = rayParabolaIntersection(start, incoming, p);
        if (!hit) continue;
        const normal = parabolaNormal(p, hit.x);
        const out = reflectVector(incoming, normal);
        drawLine(ctx, mapper, start, hit, "#facc15", 2);
        drawLine(ctx, mapper, hit, add(hit, scale(out, 26)), "#facc15", 2);
      } else {
        const xOnCurve = -10 + (i / (count - 1)) * 20;
        const yOnCurve = (xOnCurve * xOnCurve) / (4 * p);
        const hit = { x: xOnCurve, y: yOnCurve };
        const fromFocus = normalize({ x: hit.x - focus.x, y: hit.y - focus.y });
        const normal = parabolaNormal(p, hit.x);
        const out = reflectVector(fromFocus, normal);
        drawLine(ctx, mapper, focus, hit, "#facc15", 2);
        drawLine(ctx, mapper, hit, add(hit, scale(out, 24)), "#facc15", 2);
      }
    }

    modeText.textContent =
      state.mode === "in"
        ? "Parallel rays arrive and converge near focus."
        : "Rays from focus depart nearly parallel.";

    requestAnimationFrame(render);
  }

  mountDebugPanel({
    target: document.getElementById("debugHost"),
    namespace: "p4-parabola",
    getState: () => ({ ...state })
  });

  logger.info("page.init", { ...state });
  syncModeButton();

  logger.smoke([
    {
      name: "focus-directrix distance match for parabola point",
      run: () => {
        const p = 3;
        const x = 4;
        const y = (x * x) / (4 * p);
        const dFocus = Math.hypot(x, y - p);
        const dLine = Math.abs(y + p);
        return Math.abs(dFocus - dLine) < 1e-8;
      }
    },
    {
      name: "mode state is valid",
      run: () => state.mode === "in" || state.mode === "out"
    }
  ]);

  requestAnimationFrame(render);
