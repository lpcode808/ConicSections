import { clamp, distance, ellipsePoint } from "../shared/conic-math.js";
import {
  clear,
  drawGrid,
  drawAxes,
  drawEllipse,
  drawPoint,
  drawLine,
  drawHandle,
  drawSegmentBar
} from "../shared/draw-utils.js";
import { createExplorable } from "../shared/explorable.js";

const defaults = { c: 3, a: 7.8, t: 0.8 };

// Locked at pointer-down so a fast drag cannot hop between handles.
let dragTarget = null;

function semiMinor(state) {
  return Math.sqrt(Math.max(0.1, state.a * state.a - state.c * state.c));
}

function pickTarget({ screen, mapper, state }) {
  const b = semiMinor(state);
  const p = ellipsePoint(state.a, b, state.t);
  const distTo = (wp) => {
    const sp = mapper.toScreen(wp);
    return Math.hypot(screen.x - sp.x, screen.y - sp.y);
  };
  if (Math.min(distTo({ x: -state.c, y: 0 }), distTo({ x: state.c, y: 0 })) < 22) return "focus";
  if (distTo(p) < 26) return "pencil";
  return null;
}

function applyDrag({ world, state }) {
  if (dragTarget === "focus") {
    state.c = clamp(Math.abs(world.x), 0.2, 8);
    if (state.a <= state.c + 0.25) state.a = state.c + 0.25;
  } else if (dragTarget === "pencil") {
    const b = semiMinor(state);
    const t = Math.atan2(world.y / b, world.x / state.a);
    state.t = (t + Math.PI * 2) % (Math.PI * 2);
  }
}

const { state, setValues } = createExplorable({
  id: "p2-construction",
  moduleId: "02-ellipse-construction",
  defaults,
  url: { c: 2, a: 2, t: 3 },
  view: { unitsWide: 24 },
  params: [
    {
      key: "c",
      slider: "cRange",
      output: "cOut",
      onChange(v, { state }) {
        if (state.a <= state.c + 0.25) state.a = state.c + 0.25;
      }
    },
    {
      key: "a",
      slider: "aRange",
      output: "aOut",
      onChange(v, { state }) {
        state.a = Math.max(v, state.c + 0.25);
      }
    },
    {
      key: "t",
      slider: "tRange",
      output: "tOut",
      format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`
    }
  ],
  drag: {
    onStart(info) {
      dragTarget = pickTarget(info);
      applyDrag(info);
    },
    onMove(info) {
      applyDrag(info);
    }
  },
  render({ ctx, mapper, rect, state }) {
    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const { c, a } = state;
    const b = semiMinor(state);
    const [f1, f2] = [{ x: -c, y: 0 }, { x: c, y: 0 }];
    const p = ellipsePoint(a, b, state.t);

    drawEllipse(ctx, mapper, a, b, "#38bdf8", 3);
    drawLine(ctx, mapper, f1, p, "#f97316", 2);
    drawLine(ctx, mapper, p, f2, "#60a5fa", 2);
    drawHandle(ctx, mapper, f1, "#f97316");
    drawHandle(ctx, mapper, f2, "#60a5fa");
    drawHandle(ctx, mapper, p, "#facc15");
    drawPoint(ctx, mapper, f1, "#f97316", 6, "F1");
    drawPoint(ctx, mapper, f2, "#60a5fa", 6, "F2");
    drawPoint(ctx, mapper, p, "#facc15", 6, "P");

    const d1 = distance(p, f1);
    const d2 = distance(p, f2);

    // The string laid out straight: same two segments as on the diagram.
    drawSegmentBar(
      ctx,
      { x: 16, y: rect.height - 26, width: rect.width - 32 },
      [
        { value: d1, color: "#f97316", label: "F1→P" },
        { value: d2, color: "#60a5fa", label: "P→F2" }
      ],
      { max: 2 * a, title: "The string, laid out straight — total length 2a never changes" }
    );

    document.getElementById("aval").textContent = a.toFixed(3);
    document.getElementById("bval").textContent = b.toFixed(3);
    document.getElementById("cval").textContent = c.toFixed(3);
    document.getElementById("eval").textContent = (c / a).toFixed(3);
    document.getElementById("equation").textContent = `x^2/${(a * a).toFixed(2)} + y^2/${(b * b).toFixed(2)} = 1`;
    document.getElementById("sumLabel").textContent = `d(P,F1)+d(P,F2) = ${(d1 + d2).toFixed(3)}; target 2a = ${(2 * a).toFixed(3)}`;
  },
  smoke: [
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
  ]
});

// Guard against URL states where the string is shorter than the pin spread.
if (state.a <= state.c + 0.25) setValues({ a: state.c + 0.25 });
