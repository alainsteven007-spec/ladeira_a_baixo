// Track graph (rails), contacts and the rider physics step.
// Rails: while a contact rides the track — touching it, or hopping within HOVER px of it — it only feels the track
// it is on (the segments joined to it within RAIL px along the line), so a drawing that crosses itself works like a
// roller-coaster loop: the strands pass at different depths. Flying farther off, or off the end of a line, it feels
// every segment again, so it can fall onto the bottom of the loop or land on another stroke.
const RAIL = 60, HOVER = 40;
function rebuild() {
  segs = [];
  // one line at a time (the pad, then each stroke): consecutive segments of a line are linked to each other;
  // lines are joined only at their ends (strokes snap onto the pad end and onto each other's ends), never where
  // a line merely crosses itself or another one
  const ends = new Map(), key = (x, y) => Math.round(x * 2) + "," + Math.round(y * 2);
  const addLine = pts => {
    let prev = null;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], dx = pts[i][0] - x1, dy = pts[i][1] - y1, l2 = dx * dx + dy * dy;
      if (l2 < 1e-6) continue;
      const sg = { id: segs.length, x1, y1, dx, dy, l2, len: Math.sqrt(l2), next: [], headLinked: false, tailLinked: false,
        minx: Math.min(x1, x1 + dx) - R, maxx: Math.max(x1, x1 + dx) + R, miny: Math.min(y1, y1 + dy) - R, maxy: Math.max(y1, y1 + dy) + R };
      if (prev) { prev.next.push(sg.id); sg.next.push(prev.id); prev.tailLinked = sg.headLinked = true; }
      else (ends.get(key(x1, y1)) || ends.set(key(x1, y1), []).get(key(x1, y1))).push([sg, "head"]);
      segs.push(sg); prev = sg;
    }
    if (prev) { const k = key(prev.x1 + prev.dx, prev.y1 + prev.dy); (ends.get(k) || ends.set(k, []).get(k)).push([prev, "tail"]); }
  };
  const [x1, y1, x2, y2] = L().start;
  addLine([[x1, y1], [x2, y2]]);
  for (const st of drawings[lvl]) addLine(st);
  for (const group of ends.values()) for (const [sg, side] of group) for (const [o] of group) if (o !== sg) {
    if (!sg.next.includes(o.id)) sg.next.push(o.id);
    if (side === "head") sg.headLinked = true; else sg.tailLinked = true;
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
// The physics clock is fixed: update() always advances STEP seconds in SUB substeps, whatever the screen's frame
// rate (the main loop catches up with as many steps as it needs and draws in between). The same drawing gives the
// same ride on every device.
const STEP = 1 / 120;
// Energy: a track is passive, so riding it can never add energy (only the rocket and turbo do). Losses come from
// snow friction, air drag, and real hits: landing from the air or crossing a corner. Bending along a smooth curve
// loses nothing: the numeric loss of turning at each track point is given back. A corner is where the contact
// passes between segments that differ by more than CORNER; the track pipeline keeps those only where the player
// drew a sharp turn. A smooth curve tighter than ~70 px radius also makes the 36 px vehicle straddle more than
// STRADDLE, so very tight bends scrape a little speed off too.
const SKIN = 1; // a contact this close above the snow still counts as touching it (no micro-hops on a hand-drawn line)
const CORNER = 25 * Math.PI / 180, STRADDLE = 30 * Math.PI / 180, LAND_V = 30;
const bend = (s, t) => Math.acos(Math.min(1, Math.abs(s.dx * t.dx + s.dy * t.dy) / (s.len * t.len)));
function link(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, k = (d - AXLE) / d / 2;
  a.x += dx * k; a.y += dy * k; b.x -= dx * k; b.y -= dy * k;
}
function collide(w) {
  for (const s of feel(w)) {
    if (w.x < s.minx || w.x > s.maxx || w.y < s.miny || w.y > s.maxy) continue;
    const [qx, qy] = closest(w.x, w.y, s);
    let ex = w.x - qx, ey = w.y - qy, d = Math.hypot(ex, ey);
    if (d >= R + SKIN) continue;
    if (d < 1e-4) { const l = Math.sqrt(s.l2); ex = s.dy / l; ey = -s.dx / l; d = 0; } else { ex /= d; ey /= d; }
    w.c = true; w.nx = ex; w.ny = ey; w.rail = s.id;
    if (d >= R) continue; // resting within the skin: touching, nothing to push
    w.x += ex * (R - d); w.y += ey * (R - d);
    const vn = w.vx * ex + w.vy * ey; // approach speed before this step
    if (!w.pc && vn < -LAND_V) { w.hit = true; w.land = Math.min(w.land, vn); } // landing
    else if (w.pr != null && w.pr !== s.id && segs[w.pr] && bend(segs[w.pr], s) > CORNER) w.hit = true; // corner
    if (vn < -CRASH_V && state === "run") hurt("Pancada forte!", `Bateu a ${ms(-vn)} contra a neve. {quem} aguenta até ${ms(CRASH_V)}.`, "impact");
  }
}
// ½v² + g·height for both contacts (per unit mass; y grows downward)
const energy = () => car.w.reduce((e, w) => e + (w.vx * w.vx + w.vy * w.vy) / 2 - G * w.y, 0);
const kinetic = () => car.w.reduce((k, w) => k + (w.vx * w.vx + w.vy * w.vy) / 2, 0);
function physics(dt) {
  const n = Math.max(1, Math.round(dt / STEP * SUB)), h = dt / n, [a, b] = car.w, V = VEH();
  for (let s = 0; s < n; s++) {
    const e0 = energy();
    for (const w of car.w) {
      w.vy += G * h;
      const sp = Math.hypot(w.vx, w.vy); if (sp > VMAX) { w.vx *= VMAX / sp; w.vy *= VMAX / sp; }
      w.ox = w.x; w.oy = w.y; w.x += w.vx * h; w.y += w.vy * h;
      w.pc = w.c !== false; w.pr = w.rail; w.on = w.pc || railHold(w); w.c = false; w.hit = false; w.land = 0;
    }
    for (let it = 0; it < 3; it++) { link(a, b); collide(a); collide(b); }
    if (state !== "run") return;
    for (const w of car.w) { w.vx = (w.x - w.ox) / h; w.vy = (w.y - w.oy) / h; }
    if (V.bounce) for (const w of car.w) if (w.land < -150) { const k = -w.land * V.bounce; w.vx += w.nx * k; w.vy += w.ny * k; } // springy landing
    // energy bookkeeping (see above): never more than before; on a smooth ride, exactly as much as before
    // a hit: a landing, a contact crossing a corner, or the vehicle still straddling one (its two contacts on
    // segments more than STRADDLE apart: it pivots over the corner and that costs energy for real)
    const hit = car.w.some(w => w.hit) || a.c && b.c && segs[a.rail] && segs[b.rail] && bend(segs[a.rail], segs[b.rail]) > STRADDLE;
    const ke = kinetic(), gain = energy() - e0;
    if (ke > 1 && (gain > 0 || !hit)) {
      const f = Math.min(1.05, Math.sqrt(Math.max(0, ke - gain) / ke));
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
      const k = ((b.vx - a.vx) * px + (b.vy - a.vy) * py) * (1 - Math.exp(-(V.spin ?? SPIN) * h)) / 2;
      a.vx += px * k; a.vy += py * k; b.vx -= px * k; b.vy -= py * k;
    }
  }
}
