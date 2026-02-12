  import {
    clamp,
    add,
    scale,
    sub,
    normalize,
    ellipseNormal,
    rayEllipseIntersection,
    reflectVector,
    fociPositions,
    angleBetween
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
  import { makeDraggable, readUrlState, writeUrlState, bindSliderWithNumber } from "../shared/interaction.js";
  import { createDebugger, mountDebugPanel } from "../shared/debug.js";

  const logger = createDebugger("p1-ellipse");
  const defaults = {
    a: 9,
    e: 0.62,
    theta: 0.52,
    burst: 24,
    present: false
  };
  const state = readUrlState(defaults);

  const canvas = document.getElementById("scene");
  const aRange = document.getElementById("aRange");
  const eRange = document.getElementById("eRange");
  const angleRange = document.getElementById("angleRange");
  const burstCount = document.getElementById("burstCount");
  const presentBtn = document.getElementById("presentBtn");
  const burstBtn = document.getElementById("burstBtn");
  const resetBtn = document.getElementById("resetBtn");
  const kpiDistance = document.getElementById("kpiDistance");
  const kpiAngles = document.getElementById("kpiAngles");

  aRange.value = state.a;
  eRange.value = state.e;
  angleRange.value = state.theta;
  burstCount.value = state.burst;

  let burstActive = false;
  let burstT = 0;
  let lastFrame = performance.now();

  const angleSync = bindSliderWithNumber({
    slider: angleRange,
    output: document.getElementById("angleOut"),
    precision: 2,
    format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`,
    onInput: (v) => {
      state.theta = v;
      persist();
    }
  });

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
    slider: eRange,
    output: document.getElementById("eOut"),
    precision: 2,
    onInput: (v) => {
      state.e = v;
      persist();
    }
  });

  bindSliderWithNumber({
    slider: burstCount,
    output: document.getElementById("burstOut"),
    precision: 0,
    onInput: (v) => {
      state.burst = Math.round(v);
      persist();
    }
  });

  presentBtn.addEventListener("click", () => {
    state.present = !state.present;
    document.getElementById("explainCard").style.display = state.present ? "none" : "block";
    persist();
    logger.event("present.toggle", { present: state.present });
  });

  burstBtn.addEventListener("click", () => {
    burstActive = true;
    burstT = 0;
    logger.event("burst.start", { rays: state.burst });
  });

  resetBtn.addEventListener("click", () => {
    Object.assign(state, defaults);
    aRange.value = state.a;
    eRange.value = state.e;
    angleRange.value = state.theta;
    burstCount.value = state.burst;
    aRange.dispatchEvent(new Event("input", { bubbles: true }));
    eRange.dispatchEvent(new Event("input", { bubbles: true }));
    angleRange.dispatchEvent(new Event("input", { bubbles: true }));
    burstCount.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("explainCard").style.display = "block";
    persist();
    logger.event("reset.defaults", { ...state });
  });

  makeDraggable({
    element: canvas,
    hitTest: () => true,
    onMove(pos) {
      const rect = canvas.getBoundingClientRect();
      const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 24);
      const world = mapper.toWorld(pos);
      const b = state.a * Math.sqrt(1 - state.e * state.e);
      const [f1] = fociPositions(state.a, b);
      const v = sub(world, f1);
      state.theta = Math.atan2(v.y, v.x);
      angleRange.value = state.theta;
      angleSync();
    }
  });

  function persist() {
    writeUrlState({
      a: state.a.toFixed(2),
      e: state.e.toFixed(2),
      theta: state.theta.toFixed(3),
      burst: state.burst,
      present: state.present ? 1 : 0
    });
    logger.dbg("state.persist", state);
  }

  function singlePath(theta, a, b) {
    const [f1, f2] = fociPositions(a, b);
    const startDir = { x: Math.cos(theta), y: Math.sin(theta) };
    const hit = rayEllipseIntersection(f1, startDir, a, b);
    if (!hit) return null;
    const normal = ellipseNormal(a, b, hit.x, hit.y);
    const outDir = reflectVector(startDir, normal);
    const towardF2 = normalize(sub(f2, hit));
    const iA = (angleBetween(scale(startDir, -1), normal) * 180) / Math.PI;
    const rA = (angleBetween(outDir, normal) * 180) / Math.PI;
    return { f1, f2, hit, normal, startDir, outDir, towardF2, iA, rA };
  }

  function drawFrame(ts) {
    const rect = canvas.getBoundingClientRect();
    const ctx = setupHiDPICanvas(canvas);
    const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / 24);
    const dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;

    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const a = state.a;
    const b = a * Math.sqrt(Math.max(0.02, 1 - state.e * state.e));
    drawEllipse(ctx, mapper, a, b);

    const path = singlePath(state.theta, a, b);
    if (path) {
      drawPoint(ctx, mapper, path.f1, "#fb923c", 6, "F1");
      drawPoint(ctx, mapper, path.f2, "#60a5fa", 6, "F2");
      drawPoint(ctx, mapper, path.hit, "#facc15", 5, "P");

      drawLine(ctx, mapper, path.f1, path.hit, "#facc15", 2.5);
      drawLine(ctx, mapper, path.hit, add(path.hit, scale(path.outDir, 40)), "#facc15", 2.5);
      drawLine(ctx, mapper, path.hit, add(path.hit, scale(path.towardF2, 40)), "rgba(96,165,250,0.4)", 1.5, [5, 6]);

      const tangent = { x: -path.normal.y, y: path.normal.x };
      drawLine(ctx, mapper, add(path.hit, scale(tangent, -4)), add(path.hit, scale(tangent, 4)), "#a1a1aa", 2, [6, 6]);

      const total = Math.hypot(path.hit.x - path.f1.x, path.hit.y - path.f1.y) + Math.hypot(path.hit.x - path.f2.x, path.hit.y - path.f2.y);
      kpiDistance.textContent = `Path length F1->P->F2: ${total.toFixed(3)} (should be close to 2a = ${(2 * a).toFixed(3)})`;
      kpiAngles.textContent = `Incident angle: ${path.iA.toFixed(2)}deg | Reflected angle: ${path.rA.toFixed(2)}deg`;
    }

    if (burstActive) {
      burstT += dt;
      const count = state.burst;
      const progress = clamp(burstT / 1.2, 0, 1);
      const [f1] = fociPositions(a, b);
      for (let i = 0; i < count; i += 1) {
        const theta = (i / count) * Math.PI * 2;
        const p = singlePath(theta, a, b);
        if (!p) continue;
        const len1 = Math.hypot(p.hit.x - p.f1.x, p.hit.y - p.f1.y);
        const travel = 18 * progress;
        const tip = travel <= len1 ? add(p.f1, scale(p.startDir, travel)) : add(p.hit, scale(p.outDir, travel - len1));
        drawLine(ctx, mapper, p.f1, p.hit, "rgba(250,204,21,0.14)", 1);
        drawLine(ctx, mapper, p.hit, add(p.hit, scale(p.outDir, 20)), "rgba(250,204,21,0.14)", 1);
        drawPoint(ctx, mapper, tip, "#fde047", 2.6);
      }
      if (progress >= 1) burstActive = false;
    }

    requestAnimationFrame(drawFrame);
  }

  if (state.present) {
    document.getElementById("explainCard").style.display = "none";
  }

  logger.info("page.init", { ...state });

  mountDebugPanel({
    target: document.getElementById("debugHost"),
    namespace: "p1-ellipse",
    getState: () => ({ ...state, burstActive })
  });

  logger.smoke([
    {
      name: "ellipse reflection intersection exists",
      run: () => {
        const a = 8;
        const b = 6;
        const [f1] = fociPositions(a, b);
        return Boolean(rayEllipseIntersection(f1, { x: 1, y: 0.2 }, a, b));
      }
    },
    {
      name: "url state parse works",
      run: () => typeof state.a === "number" && typeof state.e === "number"
    }
  ]);

  requestAnimationFrame(drawFrame);
