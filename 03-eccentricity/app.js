import {
  sub,
  add,
  scale,
  fociPositions,
  ellipseNormal,
  rayEllipseIntersection,
  reflectVector,
  normalize,
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

const defaults = { e: 0.3, theta: 0.7, a: 9 };

createExplorable({
  id: "p3-eccentricity",
  moduleId: "03-eccentricity",
  defaults,
  url: { e: 2, theta: 3 },
  view: { unitsWide: 24 },
  params: [
    { key: "e", slider: "eRange", output: "eOut" },
    {
      key: "theta",
      slider: "thetaRange",
      output: "thetaOut",
      format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`
    }
  ],
  drag: {
    onMove({ world, state }) {
      const b = state.a * Math.sqrt(Math.max(0.01, 1 - state.e * state.e));
      const [f1] = fociPositions(state.a, b);
      const v = sub(world, f1);
      state.theta = (Math.atan2(v.y, v.x) + Math.PI * 2) % (Math.PI * 2);
    }
  },
  render({ ctx, mapper, rect, state }) {
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
      drawAngleArc(ctx, mapper, hit, scale(dir, -1), n, 1.5, "#4ade80");
      drawAngleArc(ctx, mapper, hit, n, out, 1.5, "#4ade80");

      const d1 = distance(hit, f1);
      const d2 = distance(hit, f2);
      drawSegmentBar(
        ctx,
        { x: 16, y: rect.height - 26, width: rect.width - 32 },
        [
          { value: d1, color: "#fb923c", label: "F1→P" },
          { value: d2, color: "#60a5fa", label: "P→F2" }
        ],
        { max: 2 * a, title: "d1 + d2 = 2a holds at every eccentricity" }
      );

      document.getElementById("paths").textContent = `F1->P->F2 path: ${(d1 + d2).toFixed(3)} vs 2a=${(2 * a).toFixed(3)}`;
    }

    document.getElementById("dims").textContent = `a=${a.toFixed(2)}, b=${b.toFixed(2)}, c=${c.toFixed(2)}, e=${state.e.toFixed(2)}`;
  },
  smoke: [
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
  ]
});
