import { conicPoint, conicType, distancePointToLine, distance, lineFromPoints } from "../shared/conic-math.js";
import {
  clear,
  drawGrid,
  drawAxes,
  drawPoint,
  drawLine,
  drawHandle,
  drawSegmentBar
} from "../shared/draw-utils.js";
import { createExplorable } from "../shared/explorable.js";

const defaults = { e: 0.7, l: 4.2, theta: 0.8 };

const plane = document.getElementById("plane");

function validConicPoint(e, l, theta) {
  const p = conicPoint(e, l, theta);
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  if (p.r < 0 || Math.abs(p.x) > 40 || Math.abs(p.y) > 40) return null;
  return p;
}

createExplorable({
  id: "p6-family",
  moduleId: "06-conic-family",
  defaults,
  url: { e: 2, l: 2, theta: 3 },
  view: { unitsWide: 30 },
  params: [
    { key: "e", slider: "eRange", output: "eOut" },
    { key: "l", slider: "lRange", output: "lOut" },
    {
      key: "theta",
      slider: "thetaRange",
      output: "thetaOut",
      format: (v) => `${((v * 180) / Math.PI).toFixed(1)}deg`
    }
  ],
  drag: {
    onMove({ world, state }) {
      // Drag P anywhere along the curve; ignore angles where the curve escapes.
      const theta = Math.atan2(world.y, world.x);
      if (validConicPoint(state.e, state.l, theta)) state.theta = theta;
    }
  },
  render({ ctx, mapper, rect, state }) {
    clear(ctx, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    drawAxes(ctx, mapper, rect.width, rect.height);

    const e = state.e;
    const l = state.l;
    const focus = { x: 0, y: 0 };
    // For r = l / (1 + e·cos θ) with focus at the origin, the matching
    // directrix is at x = +l/e (same side as the curve's nearest point).
    const directrixX = l / Math.max(e, 0.01);

    drawLine(ctx, mapper, { x: directrixX, y: -20 }, { x: directrixX, y: 20 }, "#a1a1aa", 1.6, [7, 7]);
    drawPoint(ctx, mapper, focus, "#60a5fa", 6, "Focus");

    const points = [];
    const thetaMin = -Math.PI + 0.02;
    const thetaMax = Math.PI - 0.02;
    const steps = 1400;

    for (let i = 0; i <= steps; i += 1) {
      const theta = thetaMin + (i / steps) * (thetaMax - thetaMin);
      const p = validConicPoint(e, l, theta);
      if (p) points.push(p);
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

    const sample = validConicPoint(e, l, state.theta);
    if (sample) {
      drawHandle(ctx, mapper, sample, "#facc15");
      drawPoint(ctx, mapper, sample, "#facc15", 5, "P");
      drawLine(ctx, mapper, focus, sample, "#facc15", 1.9);
      drawLine(ctx, mapper, sample, { x: directrixX, y: sample.y }, "#f97316", 1.9);

      const dFocus = distance(sample, focus);
      const dLine = Math.max(1e-9, distancePointToLine(sample, lineFromPoints({ x: directrixX, y: -5 }, { x: directrixX, y: 5 })));
      document.getElementById("ratioLabel").textContent =
        `At P: d(focus) = ${dFocus.toFixed(2)}, d(directrix) = ${dLine.toFixed(2)}, ratio ${(dFocus / dLine).toFixed(3)} (target e = ${e.toFixed(3)})`;

      // Both distances drawn to the same scale: their ratio is the whole story.
      const barMax = Math.max(dFocus, dLine) * 1.15;
      drawSegmentBar(
        ctx,
        { x: 16, y: rect.height - 44, width: rect.width - 32, height: 9 },
        [{ value: dFocus, color: "#facc15", label: "P → focus" }],
        { max: barMax, title: "Drag P along the curve: the ratio of these bars stays e" }
      );
      drawSegmentBar(
        ctx,
        { x: 16, y: rect.height - 22, width: rect.width - 32, height: 9 },
        [{ value: dLine, color: "#f97316", label: "P → directrix" }],
        { max: barMax }
      );
    }

    const type = conicType(e);
    document.getElementById("typeLabel").textContent = `Type: ${type}`;

    // Visual cone-slicer cue linked to eccentricity.
    const tilt = -20 + (e / 2) * 55;
    plane.style.transform = `rotate(${tilt.toFixed(1)}deg)`;
  },
  smoke: [
    {
      name: "conic type transitions",
      run: () => conicType(0.4) === "ellipse" && conicType(1) === "parabola" && conicType(1.4) === "hyperbola"
    },
    {
      name: "sample conic point finite",
      run: () => {
        const p = conicPoint(defaults.e, defaults.l, 0.5);
        return !p || (Number.isFinite(p.x) && Number.isFinite(p.y));
      }
    },
    {
      name: "focus-directrix ratio equals e at sample points",
      run: () => {
        const e = 0.7;
        const l = 4.2;
        const directrixX = l / e;
        const line = lineFromPoints({ x: directrixX, y: -5 }, { x: directrixX, y: 5 });
        for (const theta of [0.3, 1.1, 2.0, -1.4]) {
          const p = conicPoint(e, l, theta);
          if (!p) return false;
          const ratio = distance(p, { x: 0, y: 0 }) / distancePointToLine(p, line);
          if (Math.abs(ratio - e) > 1e-6) return false;
        }
        return true;
      }
    }
  ]
});
