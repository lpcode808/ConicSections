  import { conicPoint, conicType, distancePointToLine, distance, lineFromPoints } from "../shared/conic-math.js";
  import {
    setupHiDPICanvas,
    worldToScreenFactory,
    clear,
    drawGrid,
    drawAxes,
    drawPoint,
    drawLine
  } from "../shared/draw-utils.js";
  import { readUrlState, writeUrlState, bindSliderWithNumber } from "../shared/interaction.js";
  import { createDebugger, mountDebugPanel } from "../shared/debug.js";

  const logger = createDebugger("p6-family");
  const defaults = { e: 0.7, l: 4.2 };
  const state = readUrlState(defaults);

  const eRange = document.getElementById("eRange");
  const lRange = document.getElementById("lRange");
  const canvas = document.getElementById("scene");
  const plane = document.getElementById("plane");
  const resetBtn = document.getElementById("resetBtn");

  eRange.value = state.e;
  lRange.value = state.l;

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
    slider: lRange,
    output: document.getElementById("lOut"),
    precision: 2,
    onInput: (v) => {
      state.l = v;
      persist();
    }
  });

  resetBtn.addEventListener("click", () => {
    Object.assign(state, defaults);
    eRange.value = state.e;
    lRange.value = state.l;
    eRange.dispatchEvent(new Event("input", { bubbles: true }));
    lRange.dispatchEvent(new Event("input", { bubbles: true }));
    persist();
    logger.event("reset.defaults", { ...state });
  });

  function persist() {
    writeUrlState({ e: state.e.toFixed(2), l: state.l.toFixed(2) });
    logger.dbg("state.persist", state);
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const ctx = setupHiDPICanvas(canvas);
    const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 30);

    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const e = state.e;
    const l = state.l;
    const focus = { x: 0, y: 0 };
    const directrixX = -l / Math.max(e, 0.01);

    drawLine(ctx, mapper, { x: directrixX, y: -20 }, { x: directrixX, y: 20 }, "#a1a1aa", 1.6, [7, 7]);
    drawPoint(ctx, mapper, focus, "#60a5fa", 6, "Focus");

    const points = [];
    const thetaMin = -Math.PI + 0.02;
    const thetaMax = Math.PI - 0.02;
    const steps = 1400;

    for (let i = 0; i <= steps; i += 1) {
      const theta = thetaMin + (i / steps) * (thetaMax - thetaMin);
      const p = conicPoint(e, l, theta);
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      if (Math.abs(p.x) > 40 || Math.abs(p.y) > 40 || p.r < 0) continue;
      points.push(p);
    }

    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    points.forEach((p, idx) => {
      const sp = mapper.toScreen(p);
      if (idx === 0) ctx.moveTo(sp.x, sp.y);
      else ctx.lineTo(sp.x, sp.y);
    });
    ctx.stroke();

    const sample = conicPoint(e, l, 0.8);
    if (sample && sample.r > 0 && Math.abs(sample.x) < 40 && Math.abs(sample.y) < 40) {
      drawPoint(ctx, mapper, sample, "#facc15", 5, "P");
      drawLine(ctx, mapper, focus, sample, "#facc15", 1.9);
      drawLine(ctx, mapper, sample, { x: directrixX, y: sample.y }, "#f97316", 1.9);

      const ratio = distance(sample, focus) / Math.max(1e-9, distancePointToLine(sample, lineFromPoints({ x: directrixX, y: -5 }, { x: directrixX, y: 5 })));
      document.getElementById("ratioLabel").textContent = `At sample P, distance ratio is ${ratio.toFixed(3)} (target e=${e.toFixed(3)})`;
    }

    const type = conicType(e);
    document.getElementById("typeLabel").textContent = `Type: ${type}`;

    // Visual cone-slicer cue linked to eccentricity.
    const tilt = -20 + (e / 2) * 55;
    plane.style.transform = `rotate(${tilt.toFixed(1)}deg)`;

    requestAnimationFrame(render);
  }

  mountDebugPanel({
    target: document.getElementById("debugHost"),
    namespace: "p6-family",
    getState: () => ({ ...state })
  });

  logger.info("page.init", { ...state });

  logger.smoke([
    {
      name: "conic type transitions",
      run: () => conicType(0.4) === "ellipse" && conicType(1) === "parabola" && conicType(1.4) === "hyperbola"
    },
    {
      name: "sample conic point finite",
      run: () => {
        const p = conicPoint(state.e, state.l, 0.5);
        return !p || (Number.isFinite(p.x) && Number.isFinite(p.y));
      }
    }
  ]);

  requestAnimationFrame(render);
