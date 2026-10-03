// Track pipeline: what the finger drew → the curve the rider rides, which is also exactly what is drawn on screen.
// raw points → drop repeats → Catmull-Rom through sparse samples (fast flicks) → even spacing → find intended
// corners → Gaussian smoothing between corners (finger jitter out, shape kept) → fillet where a stroke continues
// the pad or another stroke. A smooth stroke ends up with a few degrees of turn per vertex, so the physics sees a
// curve; a corner the player meant (a sharp turn over a short stretch) stays a corner.
const TRACK = {
  step: 4,          // px between track points
  sigma: 2,         // smoothing width, in points (≈ 8 px): removes finger tremor, keeps bumps the size of the rider
  cornerTurn: 30,   // degrees of turn within ±cornerWin points that count as a corner the player meant
  cornerWin: 5,
  filletMax: 75,    // a stroke that leaves a joint at less than this angle is blended into the line it continues
};
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const unit = (a, b) => { const d = dist(a, b) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
const turnDeg = (u, v) => Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1)) * 180 / Math.PI;

// centripetal Catmull-Rom between p1 and p2 (u in 0..1): no loops or cusps on uneven samples
function catmull(p0, p1, p2, p3, u) {
  const k = (a, b) => Math.max(1e-3, Math.sqrt(dist(a, b)));
  const t1 = k(p0, p1), t2 = t1 + k(p1, p2), t3 = t2 + k(p2, p3), t = t1 + (t2 - t1) * u;
  const mix = (a, b, ta, tb) => { const f = (t - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
  const a1 = mix(p0, p1, 0, t1), a2 = mix(p1, p2, t1, t2), a3 = mix(p2, p3, t2, t3);
  return mix(mix(a1, a2, 0, t2), mix(a2, a3, t1, t3), t1, t2);
}
// fill gaps longer than `gap` with a curve through the neighbouring samples
function densify(p, gap = 8) {
  const out = [p[0]];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1], d = dist(a, b);
    if (d > gap) {
      const p0 = p[i - 1] || [2 * a[0] - b[0], 2 * a[1] - b[1]], p3 = p[i + 2] || [2 * b[0] - a[0], 2 * b[1] - a[1]];
      const n = Math.ceil(d / (gap / 2));
      for (let k = 1; k < n; k++) out.push(catmull(p0, a, b, p3, k / n));
    }
    out.push(b);
  }
  return out;
}
// points every `step` px of arc length; first and last points kept
function resample(p, step) {
  const out = [[p[0][0], p[0][1]]];
  let need = step;
  for (let i = 1; i < p.length; i++) {
    let x = p[i - 1][0], y = p[i - 1][1], d = dist(p[i - 1], p[i]);
    while (d >= need) {
      const f = need / d; x += (p[i][0] - x) * f; y += (p[i][1] - y) * f;
      out.push([x, y]); d -= need; need = step;
    }
    need -= d;
  }
  const e = p[p.length - 1];
  if (out.length > 1 && dist(out[out.length - 1], e) < step * .35) out[out.length - 1] = [e[0], e[1]];
  else out.push([e[0], e[1]]);
  return out;
}
// indices where the stroke turns sharply over a short stretch (local maxima of the turn)
function corners(p) {
  const k = TRACK.cornerWin, n = p.length, turn = new Array(n).fill(0), out = [];
  for (let i = 1; i < n - 1; i++) {
    const a = Math.max(0, i - k), b = Math.min(n - 1, i + k);
    if (dist(p[a], p[i]) < 1 || dist(p[i], p[b]) < 1) continue;
    turn[i] = turnDeg(unit(p[a], p[i]), unit(p[i], p[b]));
  }
  for (let i = 1; i < n - 1; i++) {
    if (turn[i] < TRACK.cornerTurn) continue;
    let top = true;
    for (let j = Math.max(1, i - k); j <= Math.min(n - 2, i + k); j++) if (turn[j] > turn[i] || turn[j] === turn[i] && j < i) { top = false; break; }
    if (top) out.push(i);
  }
  return out;
}
// Gaussian smoothing of evenly spaced points; both ends stay put (odd reflection keeps the end tangents)
function smoothRun(p, sigma) {
  const n = p.length;
  if (n < 3) return p.map(q => [q[0], q[1]]);
  const r = Math.ceil(sigma * 2.5), w = [];
  for (let j = -r; j <= r; j++) w.push(Math.exp(-j * j / (2 * sigma * sigma)));
  const at = j => {
    if (j < 0) { const q = p[Math.min(n - 1, -j)]; return [2 * p[0][0] - q[0], 2 * p[0][1] - q[1]]; }
    if (j >= n) { const q = p[Math.max(0, 2 * (n - 1) - j)]; return [2 * p[n - 1][0] - q[0], 2 * p[n - 1][1] - q[1]]; }
    return p[j];
  };
  const out = [[p[0][0], p[0][1]]];
  for (let i = 1; i < n - 1; i++) {
    let x = 0, y = 0, s = 0;
    for (let j = -r; j <= r; j++) { const q = at(i + j), f = w[j + r]; x += q[0] * f; y += q[1] * f; s += f; }
    out.push([x / s, y / s]);
  }
  out.push([p[n - 1][0], p[n - 1][1]]);
  return out;
}
// replace the start of a stroke that continues another line with a curve that leaves the joint along `dir`
function fillet(p, dir) {
  const n = p.length;
  if (n < 4) return p;
  const lead = unit(p[0], p[Math.min(3, n - 1)]), ang = turnDeg(dir, lead);
  if (ang < 2 || ang > TRACK.filletMax) return p;
  let len = 0; for (let i = 1; i < n; i++) len += dist(p[i - 1], p[i]);
  const want = Math.min(clamp(ang * .8, 10, 48), len * .4);
  let m = 1, s = 0;
  while (m < n - 2 && s + dist(p[m - 1], p[m]) < want) { s += dist(p[m - 1], p[m]); m++; }
  s += dist(p[m - 1], p[m]);
  const P0 = p[0], P1 = p[m], T1 = unit(p[m - 1], p[Math.min(n - 1, m + 1)]);
  const steps = Math.max(2, Math.round(s / TRACK.step)), out = [P0];
  for (let k = 1; k < steps; k++) { // cubic Hermite, tangents scaled by the chord
    const t = k / steps, t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    out.push([0, 1].map(j => h00 * P0[j] + h10 * s * dir[j] + h01 * P1[j] + h11 * s * T1[j]));
  }
  return out.concat(p.slice(m));
}
// the whole pipeline; `dir` is the travel direction of the line this stroke continues (or null)
function processStroke(raw, dir = null) {
  const clean = [raw[0]];
  for (const q of raw) if (dist(clean[clean.length - 1], q) >= 1.5) clean.push(q);
  if (clean.length < 2) return null;
  const even = resample(densify(clean), TRACK.step);
  if (even.length < 2) return null;
  const cut = [0, ...corners(even), even.length - 1];
  let out = [];
  for (let c = 0; c < cut.length - 1; c++) {
    const run = smoothRun(even.slice(cut[c], cut[c + 1] + 1), TRACK.sigma);
    out = out.concat(c ? run.slice(1) : run);
  }
  return dir ? fillet(out, dir) : out;
}
// where a new stroke starting at p would join: the pad end or another stroke's end within 40 px, with the
// direction the rider travels when it gets there
function joinAt(p) {
  const [x1, y1, x2, y2] = L().start;
  const ends = [[[x2, y2], unit([x1, y1], [x2, y2])]];
  for (const st of drawings[lvl]) if (st.length > 1) ends.push([st[st.length - 1], unit(st[Math.max(0, st.length - 4)], st[st.length - 1])]);
  let best = null, bd = 40;
  for (const [q, dir] of ends) { const d = dist(p, q); if (d < bd) { bd = d; best = { at: [q[0], q[1]], dir }; } }
  return best;
}
