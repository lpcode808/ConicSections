import { clamp, parabolaNormal, rayParabolaIntersection, reflectVector, normalize, add, scale } from "../shared/conic-math.js";
import {
  clear,
  drawGrid,
  drawAxes,
  drawParabola,
  drawPoint,
  drawLine,
  drawHandle
} from "../shared/draw-utils.js";
import { createExplorable } from "../shared/explorable.js";

const defaults = { p: 3, tilt: 0, mode: "in" };

const modeBtn = document.getElementById("modeBtn");
const modeText = document.getElementById("modeText");

// Locked at pointer-down: grabbing the focus adjusts p, anywhere else aims the light.
let dragTarget = null;

function applyDrag({ world, state }) {
  if (dragTarget === "focus" || state.mode === "out") {
    state.p = clamp(world.y, 1.2, 6);
  } else {
    // Point at where the light comes from; rays flow from there toward the dish.
    const dir = normalize({ x: -world.x, y: state.p - world.y });
    state.tilt = clamp(Math.atan2(dir.x, -dir.y), -0.7, 0.7);
  }
}

const { state, logger, setValues } = createExplorable({
  id: "p4-parabola",
  moduleId: "04-parabola-reflection",
  defaults,
  url: { p: 2, tilt: 3, mode: "raw" },
  view: { unitsWide: 26, center: { x: 0, y: 3.2 } },
  params: [
    { key: "p", slider: "pRange", output: "pOut" },
    {
      key: "tilt",
      slider: "tiltRange",
      output: "tiltOut",
      format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`
    }
  ],
  drag: {
    onStart(info) {
      const focusScreen = info.mapper.toScreen({ x: 0, y: info.state.p });
      const near = Math.hypot(info.screen.x - focusScreen.x, info.screen.y - focusScreen.y) < 22;
      dragTarget = near ? "focus" : "sky";
      applyDrag(info);
    },
    onMove(info) {
      applyDrag(info);
    }
  },
  onReset() {
    syncModeButton();
  },
  render({ ctx, mapper, rect, state }) {
    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const p = state.p;
    const focus = { x: 0, y: p };
    drawParabola(ctx, mapper, p, -13, 13, "#22c55e", 3);
    drawHandle(ctx, mapper, focus, "#60a5fa");
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
  },
  smoke: [
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
  ]
});

function syncModeButton() {
  const isOut = state.mode === "out";
  modeBtn.textContent = isOut ? "Mode: Focus -> Parallel" : "Mode: Parallel -> Focus";
  modeBtn.setAttribute("aria-pressed", String(isOut));
}

modeBtn.addEventListener("click", () => {
  setValues({ mode: state.mode === "in" ? "out" : "in" });
  syncModeButton();
  logger.event("mode.toggle", { mode: state.mode });
});

syncModeButton();
