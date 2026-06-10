import {
  clamp,
  add,
  scale,
  normalize,
  sub,
  reflectVector,
  hyperbolaNormal,
  rayHyperbolaIntersection
} from "../shared/conic-math.js";
import {
  clear,
  drawGrid,
  drawAxes,
  drawHyperbola,
  drawPoint,
  drawLine,
  drawHandle
} from "../shared/draw-utils.js";
import { createExplorable } from "../shared/explorable.js";

const defaults = { a: 4, b: 2.6, aim: 0.2 };

createExplorable({
  id: "p5-hyperbola",
  moduleId: "05-hyperbola-reflection",
  defaults,
  url: { a: 2, b: 2, aim: 2 },
  view: { unitsWide: 34 },
  params: [
    { key: "a", slider: "aRange", output: "aOut" },
    { key: "b", slider: "bRange", output: "bOut" },
    { key: "aim", slider: "aimRange", output: "aimOut" }
  ],
  drag: {
    onMove({ world, state }) {
      state.aim = clamp(world.y, -2.8, 2.8);
    }
  },
  render({ ctx, mapper, rect, state }) {
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
    drawHandle(ctx, mapper, origin, "#facc15");
    drawPoint(ctx, mapper, origin, "#facc15", 5, "Launch");
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

    document.getElementById("info").textContent = `Eccentricity e = ${Math.sqrt(1 + (b * b) / (a * a)).toFixed(3)} (>1)`;
  },
  smoke: [
    {
      name: "hyperbola eccentricity > 1",
      run: () => Math.sqrt(1 + (defaults.b * defaults.b) / (defaults.a * defaults.a)) > 1
    },
    {
      name: "ray from launch point hits right branch",
      run: () => {
        const origin = { x: 16, y: 0.2 };
        const aimed = normalize(sub({ x: -Math.sqrt(4 * 4 + 2.6 * 2.6), y: 0 }, origin));
        const hit = rayHyperbolaIntersection(origin, aimed, 4, 2.6);
        return Boolean(hit && hit.x > 0);
      }
    }
  ]
});
