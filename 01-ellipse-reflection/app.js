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
  angleBetween,
  distance
} from "../shared/conic-math.js";
import {
  clear,
  drawGrid,
  drawAxes,
  drawEllipse,
  drawPoint,
  drawLine,
  drawAngleArc,
  drawSegmentBar
} from "../shared/draw-utils.js";
import { createExplorable } from "../shared/explorable.js";

const defaults = {
  a: 9,
  e: 0.62,
  theta: 0.52,
  burst: 24,
  pool: false,
  present: false
};

const explainCard = document.getElementById("explainCard");
const presentBtn = document.getElementById("presentBtn");
const kpiDistance = document.getElementById("kpiDistance");
const kpiAngles = document.getElementById("kpiAngles");

let burstActive = false;
let burstT = 0;

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

const { state, logger, setValues } = createExplorable({
  id: "p1-ellipse",
  moduleId: "01-ellipse-reflection",
  defaults,
  url: { a: 2, e: 2, theta: 3, burst: 0, pool: "flag", present: "flag" },
  view: { unitsWide: 24 },
  params: [
    { key: "a", slider: "aRange", output: "aOut" },
    { key: "e", slider: "eRange", output: "eOut" },
    {
      key: "theta",
      slider: "angleRange",
      output: "angleOut",
      format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`
    },
    { key: "burst", slider: "burstCount", output: "burstOut", precision: 0 }
  ],
  drag: {
    onMove({ world, state }) {
      const b = state.a * Math.sqrt(1 - state.e * state.e);
      const [f1] = fociPositions(state.a, b);
      const v = sub(world, f1);
      const theta = Math.atan2(v.y, v.x);
      state.theta = (theta + Math.PI * 2) % (Math.PI * 2);
    }
  },
  onReset() {
    explainCard.style.display = "block";
    presentBtn.setAttribute("aria-pressed", "false");
  },
  getDebugState: () => ({ ...state, burstActive }),
  render({ ctx, mapper, rect, state, dt }) {
    clear(ctx, rect.width, rect.height, state.pool ? "#0f172a" : "#0b1221");
    if (!state.pool) {
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
        // Equal angles on either side of the normal, drawn rather than asserted.
        drawAngleArc(ctx, mapper, path.hit, scale(path.startDir, -1), path.normal, 1.5, "#4ade80");
        drawAngleArc(ctx, mapper, path.hit, path.normal, path.outDir, 1.5, "#4ade80");
      }

      const d1 = distance(path.hit, path.f1);
      const d2 = distance(path.hit, path.f2);
      drawSegmentBar(
        ctx,
        { x: 16, y: rect.height - 26, width: rect.width - 32 },
        [
          { value: d1, color: "#fb923c", label: "F1→P" },
          { value: d2, color: "#60a5fa", label: "P→F2" }
        ],
        { max: 2 * a, title: "The two ray segments always fill the same bar: d1 + d2 = 2a" }
      );

      kpiDistance.textContent = `Path length F1->P->F2: ${(d1 + d2).toFixed(3)} (should be close to 2a = ${(2 * a).toFixed(3)})`;
      kpiAngles.textContent = `Incident angle: ${path.iA.toFixed(2)}deg | Reflected angle: ${path.rA.toFixed(2)}deg`;
    }

    if (burstActive) {
      burstT += dt;
      const count = state.burst;
      const progress = clamp(burstT / 1.2, 0, 1);
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
  },
  smoke: [
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
  ]
});

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

presentBtn.addEventListener("click", () => {
  setValues({ present: !state.present });
  explainCard.style.display = state.present ? "none" : "block";
  presentBtn.setAttribute("aria-pressed", String(state.present));
  logger.event("present.toggle", { present: state.present });
});

document.getElementById("poolPresetBtn").addEventListener("click", () => {
  setValues({ a: 9.5, e: 0.68, theta: 0.45, burst: 36, pool: true });
  burstActive = true;
  burstT = 0;
  logger.event("pool.preset.apply", { ...state });
});

document.getElementById("burstBtn").addEventListener("click", () => {
  burstActive = true;
  burstT = 0;
  logger.event("burst.start", { rays: state.burst });
});

if (state.present) {
  explainCard.style.display = "none";
}
presentBtn.setAttribute("aria-pressed", String(state.present));
