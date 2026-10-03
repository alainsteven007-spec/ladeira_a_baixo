// Track graph (rails), contacts and the rider physics step.
// Rails: while a contact rides the track — touching it, or hopping within HOVER px of it — it only feels the track
// it is on (the segments joined to it within RAIL px along the line), so a drawing that crosses itself works like a
// roller-coaster loop: the strands pass at different depths. Flying farther off, or off the end of a line, it feels
// every segment again, so it can fall onto the bottom of the loop or land on another stroke.
const RAIL = 60, HOVER = 40;
function rebuild() {
  segs = [];
  const add = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    if (l2 < 1e-6) return;
    segs.push({ id: segs.length, x1, y1, dx, dy, l2, len: Math.sqrt(l2), minx: Math.min(x1, x2) - R, maxx: Math.max(x1, x2) + R, miny: Math.min(y1, y2) - R, maxy: Math.max(y1, y2) + R });
  };
  add(...L().start);
  for (const st of drawings[lvl]) for (let i = 1; i < st.length; i++) add(st[i-1][0], st[i-1][1], st[i][0], st[i][1]);
  // segments are joined where they share an end point (strokes snap onto the pad and onto each other's ends)
  const at = new Map(), key = (x, y) => Math.round(x * 2) + "," + Math.round(y * 2);
  for (const sg of segs) for (const k of [key(sg.x1, sg.y1), key(sg.x1 + sg.dx, sg.y1 + sg.dy)]) (at.get(k) || at.set(k, []).get(k)).push(sg.id);
  for (const sg of segs) {
    const head = at.get(key(sg.x1, sg.y1)).filter(j => j !== sg.id), tail = at.get(key(sg.x1 + sg.dx, sg.y1 + sg.dy)).filter(j => j !== sg.id);
    sg.next = [...new Set([...head, ...tail])]; sg.headLinked = head.length > 0; sg.tailLinked = tail.length > 0;
  }
  for (const sg of segs) { // everything within RAIL along the line, both ways
    const dist = new Map([[sg.id, 0]]), todo = [sg.id];
    while (todo.length) {
      const c = todo.shift(), dc = dist.get(c);
      for (const j of segs[c].next) { const d = dc + segs[j].len; if (d <= RAIL && !(dist.get(j) <= d)) { dist.set(j, d); todo.push(j); } }
    }
    sg.near = [...dist.keys()].map(j => segs[j]);
  }
}
// what a contact can feel this substep: its rail if it is riding the track, else everything
const feel = w => w.on && w.rail != null && segs[w.rail] ? segs[w.rail].near : segs;
function railHold(w) { // off the snow but still just over its own line (a hop, a fast curve): keep the rail
  const s0 = segs[w.rail]; if (!s0) return false;
  let bd = Infinity, bs = null, bt = 0;
  for (const s of s0.near) {
    const t = clamp(((w.x - s.x1) * s.dx + (w.y - s.y1) * s.dy) / s.l2, 0, 1), d = Math.hypot(w.x - s.x1 - s.dx * t, w.y - s.y1 - s.dy * t);
    if (d < bd) { bd = d; bs = s; bt = t; }
  }
  if (bd > HOVER || bt <= 0 && !bs.headLinked || bt >= 1 && !bs.tailLinked) return false; // flew off, or past the end of the line
  w.rail = bs.id; return true;
}
function closest(px, py, s) {
  const t = clamp(((px - s.x1) * s.dx + (py - s.y1) * s.dy) / s.l2, 0, 1);
  return [s.x1 + s.dx * t, s.y1 + s.dy * t];
}
// nearest track point within r of (px,py): [qx, qy, dist] or null
function touch(px, py, r, list = segs) {
  let hit = null;
  for (const s of list) {
    if (px < s.minx - r || px > s.maxx + r || py < s.miny - r || py > s.maxy + r) continue;
    const [qx, qy] = closest(px, py, s), d = Math.hypot(px - qx, py - qy);
    if (d < r && (!hit || d < hit[2])) hit = [qx, qy, d];
  }
  return hit;
}

function spawn() {
  const [x1, y1, x2, y2] = L().start, l = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / l, dy = (y2 - y1) / l;
  let nx = dy, ny = -dx; if (ny > 0) { nx = -nx; ny = -ny; }
  const ax = x1 + dx * 16 + nx * (R + .5), ay = y1 + dy * 16 + ny * (R + .5);
  car = { s: Math.sign(dx) || 1, w: [{ x: ax, y: ay, vx: 0, vy: 0, rail: 0, on: true }, { x: ax + dx * AXLE, y: ay + dy * AXLE, vx: 0, vy: 0, rail: 0, on: true }] };
}
function basis() {
  const [a, b] = car.w, l = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / l, uy = (b.y - a.y) / l;
  return { ux, uy, nx: car.s * uy, ny: -car.s * ux }; // n = the skier's "up"
}
function local(x, y) { const a = car.w[0], f = basis(); return [a.x + f.ux * x + f.nx * y, a.y + f.uy * x + f.ny * y]; }

// ---- physics ----
function link(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, k = (d - AXLE) / d / 2;
  a.x += dx * k; a.y += dy * k; b.x -= dx * k; b.y -= dy * k;
}
function collide(w) {
  for (const s of feel(w)) {
    if (w.x < s.minx || w.x > s.maxx || w.y < s.miny || w.y > s.maxy) continue;
    const [qx, qy] = closest(w.x, w.y, s);
    let ex = w.x - qx, ey = w.y - qy, d = Math.hypot(ex, ey);
    if (d >= R) continue;
    if (d < 1e-4) { const l = Math.sqrt(s.l2); ex = s.dy / l; ey = -s.dx / l; d = 0; } else { ex /= d; ey /= d; }
    w.x += ex * (R - d); w.y += ey * (R - d); w.c = true; w.nx = ex; w.ny = ey; w.rail = s.id;
    const vn = w.vx * ex + w.vy * ey; // approach speed before this step
    if (vn < -100) impact = true;
    if (vn < -CRASH_V && state === "run") hurt("Pancada forte!", `Bateu a ${ms(-vn)} contra a neve. {quem} aguenta até ${ms(CRASH_V)}.`, "impact");
  }
}
// ½v² + g·height for both contacts (per unit mass; y grows downward)
const energy = () => car.w.reduce((e, w) => e + (w.vx * w.vx + w.vy * w.vy) / 2 - G * w.y, 0);
let impact = false;
function physics(dt) {
  const h = dt / SUB, [a, b] = car.w, V = VEH();
  for (let s = 0; s < SUB; s++) {
    const e0 = energy(); impact = false;
    for (const w of car.w) {
      w.vy += G * h;
      const sp = Math.hypot(w.vx, w.vy); if (sp > VMAX) { w.vx *= VMAX / sp; w.vy *= VMAX / sp; }
      w.ox = w.x; w.oy = w.y; w.x += w.vx * h; w.y += w.vy * h; w.on = w.c !== false || railHold(w); w.c = false;
    }
    for (let it = 0; it < 3; it++) { link(a, b); collide(a); collide(b); }
    if (state !== "run") return;
    for (const w of car.w) { w.vx = (w.x - w.ox) / h; w.vy = (w.y - w.oy) / h; }
    // a polyline bends in small kinks and each kink eats speed; give back that numeric loss so the
    // track behaves like a smooth, ideal slope. Real hits (impact) and the losses below still count.
    const e1 = energy(), ke = car.w.reduce((k, w) => k + (w.vx * w.vx + w.vy * w.vy) / 2, 0);
    if (!impact && e1 < e0 && ke > 1) {
      const f = Math.min(1.05, Math.sqrt((ke + e0 - e1) / ke));
      for (const w of car.w) { w.vx *= f; w.vy *= f; }
    }
    for (const w of car.w) {
      w.vx *= 1 - V.drag * h; w.vy *= 1 - V.drag * h;
      const push = (fx.turbo > 0 ? TURBO : 0) + (w.c ? V.thrust : 0), sp = Math.hypot(w.vx, w.vy);
      if (push && sp > 1) { w.vx += w.vx / sp * push * h; w.vy += w.vy / sp * push * h; }
      if (fx.lento > 0) { w.vx *= 1 - BRAKE * h; w.vy *= 1 - BRAKE * h; }
      if (w.c) { // snow friction along the surface
        const tx = -w.ny, ty = w.nx, vt = w.vx * tx + w.vy * ty, dv = Math.min(Math.abs(vt), V.roll * h) * Math.sign(vt);
        w.vx -= tx * dv; w.vy -= ty * dv;
      }
    }
    if (!a.c && !b.c) { // airborne: bleed off spin (arcade tweak, keeps jumps off curves playable)
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1, px = -(b.y - a.y) / l, py = (b.x - a.x) / l;
      const k = ((b.vx - a.vx) * px + (b.vy - a.vy) * py) * (1 - Math.exp(-SPIN * h)) / 2;
      a.vx += px * k; a.vy += py * k; b.vx -= px * k; b.vy -= py * k;
    }
  }
}
