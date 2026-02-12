export const EPS = 1e-9;

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function len(v) {
  return Math.hypot(v.x, v.y);
}

export function normalize(v) {
  const l = len(v);
  if (l < EPS) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

export function distance(a, b) {
  return len(sub(a, b));
}

export function reflectVector(direction, normal) {
  const d = normalize(direction);
  const n = normalize(normal);
  const factor = 2 * dot(d, n);
  return normalize(sub(d, scale(n, factor)));
}

export function ellipsePoint(a, b, t) {
  return { x: a * Math.cos(t), y: b * Math.sin(t) };
}

export function ellipseGradient(a, b, x, y) {
  return { x: (2 * x) / (a * a), y: (2 * y) / (b * b) };
}

export function ellipseNormal(a, b, x, y) {
  return normalize(ellipseGradient(a, b, x, y));
}

export function ellipseTangent(a, b, x, y) {
  const n = ellipseNormal(a, b, x, y);
  return normalize({ x: -n.y, y: n.x });
}

export function eccentricity(a, b) {
  if (a <= 0 || b <= 0 || b > a) return NaN;
  return Math.sqrt(1 - (b * b) / (a * a));
}

export function fociPositions(a, b) {
  const c = Math.sqrt(Math.max(0, a * a - b * b));
  return [{ x: -c, y: 0 }, { x: c, y: 0 }];
}

export function rayEllipseIntersection(origin, direction, a, b, minT = 1e-6) {
  const d = normalize(direction);
  const ox = origin.x;
  const oy = origin.y;
  const dx = d.x;
  const dy = d.y;

  const A = (dx * dx) / (a * a) + (dy * dy) / (b * b);
  const B = (2 * ox * dx) / (a * a) + (2 * oy * dy) / (b * b);
  const C = (ox * ox) / (a * a) + (oy * oy) / (b * b) - 1;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;

  const root = Math.sqrt(disc);
  const t1 = (-B - root) / (2 * A);
  const t2 = (-B + root) / (2 * A);
  const candidates = [t1, t2].filter((t) => t > minT).sort((x, y) => x - y);
  if (!candidates.length) return null;
  const t = candidates[0];
  return { x: ox + dx * t, y: oy + dy * t, t };
}

export function parabolaPoint(p, x) {
  return { x, y: (x * x) / (4 * p) };
}

export function parabolaNormal(p, x) {
  // F(x, y) = y - x^2/(4p) = 0 => grad = (-x/(2p), 1)
  return normalize({ x: -x / (2 * p), y: 1 });
}

export function parabolaTangent(p, x) {
  const n = parabolaNormal(p, x);
  return { x: -n.y, y: n.x };
}

export function rayParabolaIntersection(origin, direction, p, minT = 1e-6) {
  const d = normalize(direction);
  const ox = origin.x;
  const oy = origin.y;
  const dx = d.x;
  const dy = d.y;

  const A = dx * dx;
  const B = 2 * ox * dx - 4 * p * dy;
  const C = ox * ox - 4 * p * oy;

  if (Math.abs(A) < EPS) {
    if (Math.abs(B) < EPS) return null;
    const t = -C / B;
    if (t <= minT) return null;
    return { x: ox + dx * t, y: oy + dy * t, t };
  }

  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  const t1 = (-B - root) / (2 * A);
  const t2 = (-B + root) / (2 * A);
  const candidates = [t1, t2].filter((t) => t > minT).sort((x, y) => x - y);
  if (!candidates.length) return null;
  const t = candidates[0];
  return { x: ox + dx * t, y: oy + dy * t, t };
}

export function hyperbolaPoint(a, b, t, branch = 1) {
  const c = Math.cosh(t);
  const s = Math.sinh(t);
  return { x: branch * a * c, y: b * s };
}

export function hyperbolaNormal(a, b, x, y) {
  // F(x,y)=x^2/a^2 - y^2/b^2 -1
  return normalize({ x: (2 * x) / (a * a), y: (-2 * y) / (b * b) });
}

export function rayHyperbolaIntersection(origin, direction, a, b, minT = 1e-6) {
  const d = normalize(direction);
  const ox = origin.x;
  const oy = origin.y;
  const dx = d.x;
  const dy = d.y;

  const A = (dx * dx) / (a * a) - (dy * dy) / (b * b);
  const B = (2 * ox * dx) / (a * a) - (2 * oy * dy) / (b * b);
  const C = (ox * ox) / (a * a) - (oy * oy) / (b * b) - 1;

  if (Math.abs(A) < EPS) {
    if (Math.abs(B) < EPS) return null;
    const t = -C / B;
    if (t <= minT) return null;
    return { x: ox + dx * t, y: oy + dy * t, t };
  }

  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  const t1 = (-B - root) / (2 * A);
  const t2 = (-B + root) / (2 * A);
  const candidates = [t1, t2].filter((t) => t > minT).sort((x, y) => x - y);
  if (!candidates.length) return null;
  const t = candidates[0];
  return { x: ox + dx * t, y: oy + dy * t, t };
}

export function conicPoint(e, l, theta) {
  const denom = 1 + e * Math.cos(theta);
  if (Math.abs(denom) < EPS) return null;
  const r = l / denom;
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
    r
  };
}

export function conicType(e) {
  if (Math.abs(e) < 1e-6) return "circle";
  if (e < 1) return "ellipse";
  if (Math.abs(e - 1) < 1e-6) return "parabola";
  return "hyperbola";
}

export function angleBetween(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  const c = clamp(dot(na, nb), -1, 1);
  return Math.acos(c);
}

export function projectPointToEllipse(p, a, b) {
  const theta = Math.atan2(p.y / b, p.x / a);
  return ellipsePoint(a, b, theta);
}

export function lineFromPoints(p1, p2) {
  // ax + by + c = 0
  const a = p1.y - p2.y;
  const b = p2.x - p1.x;
  const c = p1.x * p2.y - p2.x * p1.y;
  return { a, b, c };
}

export function distancePointToLine(point, line) {
  return Math.abs(line.a * point.x + line.b * point.y + line.c) / Math.hypot(line.a, line.b);
}
