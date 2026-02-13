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
    pool: false,
    present: false
  };
  const state = readUrlState(defaults);

  const canvas = document.getElementById("scene");
  const aRange = document.getElementById("aRange");
  const eRange = document.getElementById("eRange");
  const angleRange = document.getElementById("angleRange");
  const burstCount = document.getElementById("burstCount");
  const presentBtn = document.getElementById("presentBtn");
  const poolPresetBtn = document.getElementById("poolPresetBtn");
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

  poolPresetBtn.addEventListener("click", () => {
    state.a = 9.5;
    state.e = 0.68;
    state.theta = 0.45;
    state.burst = 36;
    state.pool = true;
    aRange.value = state.a;
    eRange.value = state.e;
    angleRange.value = state.theta;
    burstCount.value = state.burst;
    aRange.dispatchEvent(new Event("input", { bubbles: true }));
    eRange.dispatchEvent(new Event("input", { bubbles: true }));
    angleRange.dispatchEvent(new Event("input", { bubbles: true }));
    burstCount.dispatchEvent(new Event("input", { bubbles: true }));
    burstActive = true;
    burstT = 0;
    logger.event("pool.preset.apply", { ...state });
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
      pool: state.pool ? 1 : 0,
      present: state.present ? 1 : 0
    });
    logger.dbg("state.persist", state);
  }

  function drawPoolTable(ctx, mapper, a, b, f1, f2) {
    const steps = 300;
    ctx.fillStyle = "#4f301f";
    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * Math.PI * 2;
      const p = mapper.toScreen({ x: (a + 0.55) * Math.cos(t), y: (b + 0.55) * Math.sin(t) });
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#1e6c4a";
    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * Math.PI * 2;
      const p = mapper.toScreen({ x: a * Math.cos(t), y: b * Math.sin(t) });
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();

    const f1s = mapper.toScreen(f1);
    const f2s = mapper.toScreen(f2);

    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(f2s.x, f2s.y, 9, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i += 1) {
      const a0 = (i / 8) * Math.PI * 2;
      const p1 = { x: f1s.x + Math.cos(a0) * 4, y: f1s.y + Math.sin(a0) * 4 };
      const p2 = { x: f1s.x + Math.cos(a0) * 10, y: f1s.y + Math.sin(a0) * 10 };
      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(f1s.x, f1s.y, 4, 0, Math.PI * 2);
    ctx.fill();
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
    if (state.pool) {
      clear(ctx, rect.width, rect.height, "#0f172a");
    } else {
      drawGrid(ctx, rect.width, rect.height);
      drawAxes(ctx, mapper, rect.width, rect.height);
    }

    const a = state.a;
    const b = a * Math.sqrt(Math.max(0.02, 1 - state.e * state.e));
    const [f1, f2] = fociPositions(a, b);
    if (state.pool) {
      drawPoolTable(ctx, mapper, a, b, f1, f2);
    }
    drawEllipse(ctx, mapper, a, b, state.pool ? "rgba(245, 158, 11, 0.85)" : "#38bdf8");

    const path = singlePath(state.theta, a, b);
    if (path) {
      if (!state.pool) {
        drawPoint(ctx, mapper, path.f1, "#fb923c", 6, "F1");
        drawPoint(ctx, mapper, path.f2, "#60a5fa", 6, "F2");
      }
      drawPoint(ctx, mapper, path.hit, "#facc15", 5, "P");

      const rayColor = state.pool ? "rgba(255,255,255,0.92)" : "#facc15";
      drawLine(ctx, mapper, path.f1, path.hit, rayColor, 2.5);
      drawLine(ctx, mapper, path.hit, add(path.hit, scale(path.outDir, 40)), rayColor, 2.5);
      drawLine(ctx, mapper, path.hit, add(path.hit, scale(path.towardF2, 40)), "rgba(96,165,250,0.4)", 1.5, [5, 6]);

      if (!state.pool) {
        const tangent = { x: -path.normal.y, y: path.normal.x };
        drawLine(ctx, mapper, add(path.hit, scale(tangent, -4)), add(path.hit, scale(tangent, 4)), "#a1a1aa", 2, [6, 6]);
      }

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
        const burstColor = state.pool ? "rgba(255,255,255,0.28)" : "rgba(250,204,21,0.14)";
        drawLine(ctx, mapper, p.f1, p.hit, burstColor, 1);
        drawLine(ctx, mapper, p.hit, add(p.hit, scale(p.outDir, 20)), burstColor, 1);
        drawPoint(ctx, mapper, tip, state.pool ? "#ffffff" : "#fde047", 2.6);
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
    },
    {
      name: "focus-to-focus reflection samples",
      run: () => {
        const a = 8.5;
        const b = 6;
        for (let i = 0; i < 12; i += 1) {
          const theta = (Math.PI * 2 * i) / 12;
          const p = singlePath(theta, a, b);
          if (!p) return false;
          const err = angleBetween(p.outDir, p.towardF2);
          if (err > 0.002) return false;
        }
        return true;
      }
    }
  ]);

  requestAnimationFrame(drawFrame);
