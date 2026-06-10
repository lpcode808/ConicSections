export function setupHiDPICanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function worldToScreenFactory(width, height, scale, center = { x: 0, y: 0 }) {
  return {
    toScreen(p) {
      return {
        x: width / 2 + (p.x - center.x) * scale,
        y: height / 2 - (p.y - center.y) * scale
      };
    },
    toWorld(p) {
      return {
        x: (p.x - width / 2) / scale + center.x,
        y: -(p.y - height / 2) / scale + center.y
      };
    }
  };
}

export function clear(ctx, width, height, color = "#0b1221") {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

export function drawGrid(ctx, width, height, spacing = 40, color = "rgba(148,163,184,0.15)") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

export function drawAxes(ctx, mapper, width, height, color = "rgba(148,163,184,0.5)") {
  const p1 = mapper.toScreen({ x: -1e3, y: 0 });
  const p2 = mapper.toScreen({ x: 1e3, y: 0 });
  const p3 = mapper.toScreen({ x: 0, y: -1e3 });
  const p4 = mapper.toScreen({ x: 0, y: 1e3 });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillText("x", width - 14, p2.y - 6);
  ctx.fillText("y", p4.x + 6, 14);
}

export function drawPoint(ctx, mapper, p, color = "#eab308", radius = 5, label) {
  const sp = mapper.toScreen(p);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (label) {
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillText(label, sp.x + radius + 4, sp.y - radius - 2);
  }
}

export function drawLine(ctx, mapper, a, b, color = "#e2e8f0", width = 2, dash = []) {
  const p1 = mapper.toScreen(a);
  const p2 = mapper.toScreen(b);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawRay(ctx, mapper, origin, direction, length = 1000, color = "#facc15", width = 2) {
  const end = {
    x: origin.x + direction.x * length,
    y: origin.y + direction.y * length
  };
  drawLine(ctx, mapper, origin, end, color, width);
}

export function drawEllipse(ctx, mapper, a, b, color = "#38bdf8", width = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  const steps = 300;
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const p = mapper.toScreen({ x: a * Math.cos(t), y: b * Math.sin(t) });
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

export function drawParabola(ctx, mapper, p, xMin = -12, xMax = 12, color = "#22c55e", width = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  const steps = 250;
  for (let i = 0; i <= steps; i += 1) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = (x * x) / (4 * p);
    const sp = mapper.toScreen({ x, y });
    if (i === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  }
  ctx.stroke();
}

export function drawHyperbola(ctx, mapper, a, b, tMax = 2.4, color = "#f97316", width = 3) {
  const drawBranch = (sign) => {
    ctx.beginPath();
    const steps = 240;
    for (let i = 0; i <= steps; i += 1) {
      const t = -tMax + (i / steps) * (2 * tMax);
      const x = sign * a * Math.cosh(t);
      const y = b * Math.sinh(t);
      const sp = mapper.toScreen({ x, y });
      if (i === 0) ctx.moveTo(sp.x, sp.y);
      else ctx.lineTo(sp.x, sp.y);
    }
    ctx.stroke();
  };

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  drawBranch(1);
  drawBranch(-1);
}

export function drawAngleArc(ctx, mapper, center, v1, v2, radius = 0.8, color = "#4ade80", width = 2) {
  const c = mapper.toScreen(center);
  const pxPerUnit = mapper.toScreen({ x: 1, y: 0 }).x - mapper.toScreen({ x: 0, y: 0 }).x;
  const a1 = Math.atan2(-v1.y, v1.x);
  const a2 = Math.atan2(-v2.y, v2.x);
  // Always sweep the minor arc between the two directions.
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(c.x, c.y, radius * pxPerUnit, a1, a1 + diff, diff < 0);
  ctx.stroke();
}

// Dashed ring marking a point as draggable.
export function drawHandle(ctx, mapper, p, color = "#facc15", radiusPx = 11) {
  const sp = mapper.toScreen(p);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, radiusPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Screen-space stacked bar that makes an invariant visible: segments fill a
// track scaled to `max`, so a constant sum keeps the bar exactly full while
// the divider between segments slides.
export function drawSegmentBar(ctx, { x, y, width, height = 12 }, segments, { max, title } = {}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const scaleMax = max ?? total;
  ctx.save();
  ctx.font = "12px ui-sans-serif, system-ui";

  if (title) {
    ctx.fillStyle = "rgba(226,232,240,0.85)";
    ctx.fillText(title, x, y - 6);
  }

  ctx.fillStyle = "rgba(148,163,184,0.22)";
  ctx.fillRect(x, y, width, height);

  let cursor = x;
  for (const seg of segments) {
    const w = Math.max(0, (seg.value / scaleMax) * width);
    ctx.fillStyle = seg.color;
    ctx.fillRect(cursor, y, w, height);
    const text = seg.label ? `${seg.label} = ${seg.value.toFixed(2)}` : seg.value.toFixed(2);
    if (w > ctx.measureText(text).width + 12) {
      ctx.fillStyle = "rgba(15,23,42,0.92)";
      ctx.fillText(text, cursor + 6, y + height - 2);
    }
    cursor += w;
  }

  ctx.strokeStyle = "rgba(226,232,240,0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}
