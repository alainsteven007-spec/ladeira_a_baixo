// Art: magic item icons, the dragon, the rider and its vehicle.
// ---- magic art: item icons (centred, radius 13) and the dragon (facing +x, saddle at (0,-12)) ----
function paintMagicIcon(g, P, kind, t) {
  t = t || 0;
  g.save();
  g.lineJoin = "round"; g.lineCap = "round"; g.lineWidth = 1.4;
  g.strokeStyle = P.graphite;
  const sc = { capacete: .86, cachecol: .9, apito: .88, dragao: .86, brasa: .9, pena: .9 }[kind] || 1;
  g.scale(sc, sc); g.lineWidth = 1.4 / sc * Math.min(1, sc + .1);
  const PI = Math.PI, ink = P.graphite, cream = "#f7f2e2";
  const fs = (c) => { g.fillStyle = c; g.fill(); g.stroke(); };
  const dot = (x, y, r, c, line) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = c; g.fill(); if (line) g.stroke(); };

  if (kind === "bolha") {
    const k = 1 + .03 * Math.sin(t * 3);
    g.beginPath(); g.arc(0, 0, 11.5 * k, 0, 7);
    g.fillStyle = P.glass; g.globalAlpha = .45; g.fill(); g.globalAlpha = 1; g.stroke();
    g.strokeStyle = P.ice; g.lineWidth = 1.8; g.beginPath(); g.arc(0, 0, 8.6 * k, .15 * PI, .85 * PI); g.stroke();
    g.strokeStyle = P.slow; g.globalAlpha = .6; g.beginPath(); g.arc(0, 0, 8.6 * k, 1.1 * PI, 1.3 * PI); g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = "#fff"; g.lineWidth = 2.6; g.beginPath(); g.arc(0, 0, 8 * k, 1.12 * PI, 1.58 * PI); g.stroke();
    dot(5.2, -6.2, 1.5, "#fff");
  } else if (kind === "capacete") {
    g.beginPath(); g.moveTo(-11, 6); g.lineTo(-11, 1); g.arc(0, 1, 11, PI, 0); g.lineTo(11, 6); g.closePath(); fs(P.gold);
    g.beginPath(); g.roundRect(-12.5, 4, 25, 5, 1.5); fs("#b07e00");
    g.beginPath(); g.moveTo(3, -1); g.lineTo(11, -1); g.lineTo(11, 4); g.lineTo(3, 4); g.closePath(); fs(P.glass);
    g.beginPath(); g.moveTo(-1.5, -9.8); g.lineTo(-1.5, 4); g.stroke();
    for (const [x, y] of [[-8, -1.5], [-5.5, -6], [6, -7.2]]) dot(x, y, 1.7, cream, true);
    const sp = (Math.sin(t * 4) + 1) / 2; g.fillStyle = "#fff"; g.globalAlpha = .5 + .5 * sp;
    g.fillRect(-9.5, -4.5, 1.2, 1.2); g.globalAlpha = 1;
  } else if (kind === "pena") {
    g.save(); g.rotate(-.78 + .06 * Math.sin(t * 2));
    g.beginPath(); g.moveTo(0, -13); g.bezierCurveTo(9, -8, 8, 4, 0, 8); g.bezierCurveTo(-8, 4, -9, -8, 0, -13); g.closePath();
    fs(P.ice);
    g.strokeStyle = "#fff"; g.lineWidth = 1.1; g.beginPath();
    for (const y of [-8, -4, 0, 4]) { const w = y < -6 ? 4.5 : 6; g.moveTo(0, y + 2); g.lineTo(-w, y - 1.5); g.moveTo(0, y + 2); g.lineTo(w, y - 1.5); }
    g.stroke();
    g.strokeStyle = ink; g.lineWidth = 1.8; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, 14); g.stroke();
    g.restore();
  } else if (kind === "brasa") {
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(-8, -12); g.quadraticCurveTo(-8, -3, -.5, -2.5); g.moveTo(8, -12); g.quadraticCurveTo(8, -3, .5, -2.5); g.stroke();
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(0, -4); g.lineTo(8, 0); g.lineTo(7, 8); g.lineTo(0, 12.5); g.lineTo(-7, 8); g.lineTo(-8, 0); g.closePath(); fs(P.fire);
    const f = 1 + .08 * Math.sin(t * 9);
    g.beginPath(); g.moveTo(0, -3.5 + (1 - f) * 20); g.quadraticCurveTo(5.5, 3, 3.5, 6.5); g.quadraticCurveTo(0, 9.5, -3.5, 6.5); g.quadraticCurveTo(-5, 3, 0, -3.5 + (1 - f) * 20);
    g.fillStyle = P.hazard; g.fill();
    g.fillStyle = cream; g.beginPath(); g.ellipse(0, 6, 1.6, 1.9, 0, 0, 7); g.fill();
  } else if (kind === "cachecol") {
    const stripe = (a, b) => ([a, b]);
    g.save(); // hanging tail with fringe
    g.translate(5, 0); g.rotate(-.12);
    g.beginPath(); g.rect(-3.5, -2, 7, 12); g.fillStyle = P.bad; g.fill();
    g.fillStyle = cream; g.fillRect(-3.5, 2, 7, 2.6); g.fillRect(-3.5, 7, 7, 2.6);
    g.beginPath(); g.rect(-3.5, -2, 7, 12); g.stroke();
    g.lineWidth = 1.2; g.beginPath(); for (const x of [-2.5, 0, 2.5]) { g.moveTo(x, 10); g.lineTo(x, 13); } g.stroke();
    g.restore();
    g.lineCap = "butt";
    g.strokeStyle = ink; g.lineWidth = 10.6; g.beginPath(); g.moveTo(-11, -4); g.quadraticCurveTo(0, 5, 11, -4); g.stroke();
    g.strokeStyle = P.bad; g.lineWidth = 8; g.beginPath(); g.moveTo(-11, -4); g.quadraticCurveTo(0, 5, 11, -4); g.stroke();
    g.strokeStyle = cream; g.lineWidth = 2.6;
    for (const u of [.2, .5, .8]) { const x = -11 + 22 * u, y = (1 - u) * (1 - u) * -4 + 2 * u * (1 - u) * 5 + u * u * -4; g.beginPath(); g.moveTo(x, y - 3.6); g.lineTo(x, y + 3.6); g.stroke(); }
    g.lineCap = "round";
  } else if (kind === "apito") {
    g.save(); g.rotate(-.18);
    g.beginPath(); g.arc(-8.5, -9.8, 2.8, 0, 7); g.lineWidth = 1.6; g.stroke(); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-12, -2); g.lineTo(1, -2); g.lineTo(1, 4); g.lineTo(-12, 4); g.closePath(); fs(P.hazard);
    g.beginPath(); g.arc(4.5, 2, 7.5, 0, 7); fs(P.hazard);
    g.beginPath(); g.arc(4.5, 2, 3.4, 0, 7); fs(P.paper);
    g.fillStyle = ink; g.fillRect(-6, -2.4, 4, 1.6);
    g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.beginPath(); g.arc(4.5, 2, 5.4, 1.15 * PI, 1.45 * PI); g.stroke();
    g.restore();
    const a = (Math.sin(t * 6) + 1) / 2; g.strokeStyle = P.hazard; g.lineWidth = 1.6; g.globalAlpha = .55 + .45 * a;
    g.beginPath(); g.moveTo(5, -10); g.lineTo(8, -12.5); g.moveTo(9, -7); g.lineTo(12.2, -8.2); g.stroke(); g.globalAlpha = 1;
  } else if (kind === "dragao") {
    const body = "#35b08c", dark = "#1f7d66", bone = "#f3dc9c", sy = Math.sin(t * 5) * .8;
    g.beginPath(); g.moveTo(-3, -9); g.lineTo(-7.5, -14); g.lineTo(-7, -7); g.closePath(); fs(bone); // horn
    g.beginPath(); g.moveTo(-9, 3); g.lineTo(-13, 7); g.lineTo(-7, 8); g.closePath(); fs(P.hazard);  // frill
    g.beginPath(); g.moveTo(-8, -6); g.bezierCurveTo(-4, -12, 6, -10, 8, -5); g.bezierCurveTo(14, -4, 14, 4, 9, 6);
    g.bezierCurveTo(7, 10, -3, 11, -8, 7); g.bezierCurveTo(-12, 3, -12, -3, -8, -6); g.closePath(); fs(body);
    g.beginPath(); g.moveTo(5, 6); g.bezierCurveTo(9, 7.5, 12, 6, 12, 3.5); g.bezierCurveTo(10, 5.5, 7, 4.5, 5, 6); g.fillStyle = bone; g.fill();
    dot(10.5, -.2, .9, dark);
    dot(1, -3, 3, "#fff", true); dot(1.8, -3, 1.5, ink); dot(2.3, -3.6, .5, "#fff");
    g.strokeStyle = P.fire; g.globalAlpha = .9; g.lineWidth = 1.6; g.beginPath();
    g.moveTo(12.5, 0 + sy); g.quadraticCurveTo(14, -3 + sy, 13, -6 + sy); g.stroke(); g.globalAlpha = 1;
  }
  g.restore();
}

function paintDragon(g, P, t) {
  t = t || 0;
  const body = "#35b08c", dark = "#1f7d66", belly = "#f3dc9c", mem = "#f08a5d", memDark = "#c9603c", ink = P.graphite;
  const PI = Math.PI, w = 2 * PI * 3 * t, s = Math.sin(w);
  g.save();
  g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = ink; g.lineWidth = 1.6;
  const dir = a => [Math.cos(a), Math.sin(a)];
  const add = (p, a, l) => { const d = dir(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };
  const dotc = (x, y, r, c, line) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = c; g.fill(); if (line) g.stroke(); };
  const tri = (a, b, c, col) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fillStyle = col; g.fill(); g.stroke(); };
  const bez = (p0, p1, p2, u) => { const m = 1 - u; return [m * m * p0[0] + 2 * m * u * p1[0] + u * u * p2[0], m * m * p0[1] + 2 * m * u * p1[1] + u * u * p2[1]]; };

  // a wing: shoulder S, arm angle th, tips lag by `lag`; sc scales the length
  function wing(S, th, lag, sc, col, bone, arm) {
    const wrist = add(S, th, 25 * sc), a2 = th + lag;
    const tips = [add(wrist, a2 + .22, 37 * sc), add(wrist, a2 - .3, 34 * sc), add(wrist, a2 - .82, 27 * sc)];
    const root = [S[0] - 16, S[1] + 10];
    g.beginPath(); g.moveTo(S[0], S[1]); g.lineTo(wrist[0], wrist[1]); g.lineTo(tips[0][0], tips[0][1]);
    let prev = tips[0];
    for (const tp of [tips[1], tips[2], root]) {
      const mx = (prev[0] + tp[0]) / 2, my = (prev[1] + tp[1]) / 2;
      g.quadraticCurveTo(mx + (wrist[0] - mx) * .3, my + (wrist[1] - my) * .3, tp[0], tp[1]); prev = tp;
    }
    g.closePath(); g.fillStyle = col; g.fill(); g.stroke();
    g.lineWidth = 2.2; g.strokeStyle = ink; g.beginPath();
    for (const tp of tips) { g.moveTo(wrist[0], wrist[1]); g.lineTo(tp[0], tp[1]); }
    g.stroke();
    g.lineWidth = 1; g.strokeStyle = bone; g.beginPath();
    for (const tp of tips) { g.moveTo(wrist[0], wrist[1]); g.lineTo(tp[0], tp[1]); }
    g.stroke();
    g.lineWidth = 1.6; g.strokeStyle = ink;
    g.lineWidth = 7.4; g.beginPath(); g.moveTo(S[0], S[1]); g.lineTo(wrist[0], wrist[1]); g.stroke();
    g.lineWidth = 5; g.strokeStyle = arm; g.beginPath(); g.moveTo(S[0], S[1]); g.lineTo(wrist[0], wrist[1]); g.stroke();
    g.strokeStyle = ink; g.lineWidth = 1.6;
    const claw = add(wrist, th - 1.3, 7); // thumb claw
    tri([wrist[0] - 1.5, wrist[1] - 1.5], claw, [wrist[0] + 1.8, wrist[1] + 1.5], "#f3dc9c");
  }
  const thOf = (ph) => { const sn = Math.sin(ph); return [-1.86 - 1.72 * (1 - sn) / 2, -.55 * Math.cos(ph)]; };

  // far wing
  { const [th, lag] = thOf(w - .5); wing([4, -8], th + .12, lag, .9, memDark, dark, dark); }

  // tail: chain of discs, tapering, waving
  const tail = [];
  for (let i = 0; i <= 22; i++) {
    const u = i / 22;
    tail.push([-24 - 38 * u, 5 + 4 * u + 7 * u * Math.sin(u * 3.2 - t * 4.2)]);
  }
  const radAt = u => 8.5 - 6.3 * u;
  for (const pass of [0, 1]) for (let i = 0; i <= 22; i++) {
    const u = i / 22; dotc(tail[i][0], tail[i][1], radAt(u) + (pass ? 0 : 1.5), pass ? body : ink);
  }
  for (let i = 3; i <= 19; i += 3) { // tail spikes
    const u = i / 22, p = tail[i], q = tail[i - 1], r = tail[i + 1], tx = r[0] - q[0], ty = r[1] - q[1], l = Math.hypot(tx, ty), nx = ty / l, ny = -tx / l, rr = radAt(u) - .5, h = 5.5 - 3 * u;
    tri([p[0] - tx / l * 3 + nx * rr, p[1] - ty / l * 3 + ny * rr], [p[0] + nx * (rr + h) - tx / l * 2, p[1] + ny * (rr + h) - ty / l * 2], [p[0] + tx / l * 3 + nx * rr, p[1] + ty / l * 3 + ny * rr], P.hazard);
  }
  { // spade tip
    const p = tail[22], q = tail[20], tx = p[0] - q[0], ty = p[1] - q[1], l = Math.hypot(tx, ty), ux = tx / l, uy = ty / l;
    tri([p[0] + uy * 5 - ux, p[1] - ux * 5 - uy], [p[0] + ux * 8, p[1] + uy * 8], [p[0] - uy * 5 - ux, p[1] + ux * 5 - uy], P.fire);
  }

  // far legs
  g.strokeStyle = ink; for (const [x0, x1] of [[10, 15], [-17, -22]]) {
    g.lineWidth = 8.6; g.beginPath(); g.moveTo(x0 + 2, 9); g.lineTo(x1 + 4, 19); g.stroke();
    g.lineWidth = 6; g.strokeStyle = dark; g.beginPath(); g.moveTo(x0 + 2, 9); g.lineTo(x1 + 4, 19); g.stroke(); g.strokeStyle = ink;
  }

  // neck (behind the body edge)
  const n0 = [20, 0], n1 = [44, 0], n2 = [44, -18];
  for (const pass of [0, 1]) for (let i = 0; i <= 14; i++) {
    const p = bez(n0, n1, n2, i / 14), r = 10.5 - 3.2 * i / 14;
    dotc(p[0], p[1], r + (pass ? 0 : 1.5), pass ? body : ink);
  }
  // belly stripes along the neck
  g.lineWidth = 1.2; g.strokeStyle = belly; g.beginPath();
  for (let i = 2; i <= 12; i += 2) { const p = bez(n0, n1, n2, i / 14), q = bez(n0, n1, n2, (i + .6) / 14), r = 10.5 - 3.2 * i / 14; const tx = q[0] - p[0], ty = q[1] - p[1], l = Math.hypot(tx, ty); g.moveTo(p[0] + ty / l * r * .9, p[1] - tx / l * r * .9 + 0); g.lineTo(p[0] + ty / l * (r * .35), p[1] - tx / l * (r * .35)); }
  g.strokeStyle = ink; g.lineWidth = 1.6;

  // body: flat-backed rounded shape
  g.beginPath(); g.roundRect(-30, -10, 60, 28, [10, 10, 14, 14]); g.fillStyle = body; g.fill();
  g.save(); g.clip(); g.fillStyle = belly; g.beginPath(); g.ellipse(2, 20, 34, 12, 0, 0, 7); g.fill(); g.restore();
  g.beginPath(); g.roundRect(-30, -10, 60, 28, [10, 10, 14, 14]); g.stroke();
  g.lineWidth = 1.1; g.strokeStyle = dark; g.beginPath(); for (const x of [-18, -8, 2, 12]) { g.moveTo(x, 10); g.quadraticCurveTo(x + 2, 12.5, x + 5, 10.5); } g.stroke();
  g.strokeStyle = ink; g.lineWidth = 1.6;

  // saddle blanket (the game seats the rider on top of it)
  g.beginPath(); g.roundRect(-11, -11.5, 22, 4.5, 2); g.fillStyle = P.bad; g.fill(); g.stroke();

  // near legs
  for (const [x0, x1] of [[10, 15], [-17, -22]]) {
    g.strokeStyle = ink; g.lineWidth = 9.2; g.beginPath(); g.moveTo(x0, 9); g.lineTo(x1 + 3, 19.5); g.stroke();
    g.strokeStyle = body; g.lineWidth = 6.4; g.beginPath(); g.moveTo(x0, 9); g.lineTo(x1 + 3, 19.5); g.stroke();
    g.strokeStyle = ink; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(x1 + 6, 20.5, 5.4, 3, 0, 0, 7); g.fillStyle = body; g.fill(); g.stroke();
    g.fillStyle = belly; for (const dx of [2.5, 5.5, 8]) { g.beginPath(); g.arc(x1 + dx + 1, 22.2, .9, 0, 7); g.fill(); }
  }

  // head
  const hx = 50, hy = -22 + Math.sin(w) * .8;
  g.beginPath(); g.moveTo(hx - 4, hy - 7); g.lineTo(hx - 12, hy - 18); g.lineTo(hx - 1, hy - 9); g.closePath(); g.fillStyle = belly; g.fill(); g.stroke(); // horn
  tri([hx - 7, hy - 2], [hx - 18, hy - 6], [hx - 9, hy + 5], P.hazard); // ear fin
  g.beginPath(); g.ellipse(hx + 11, hy + 3, 12, 7.2, .06, 0, 7); g.fillStyle = body; g.fill(); g.stroke(); // snout
  g.beginPath(); g.ellipse(hx, hy, 10.5, 9.5, 0, 0, 7); g.fillStyle = body; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(hx + 11, hy + 3, 10, 5.6, .06, 0, 7); g.fillStyle = body; g.fill(); // hide seam
  g.fillStyle = belly; g.beginPath(); g.ellipse(hx + 10, hy + 7.4, 10, 2.6, .06, 0, 7); g.fill(); // chin
  g.strokeStyle = ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hx + 22, hy + 5); g.quadraticCurveTo(hx + 14, hy + 9.2, hx + 6, hy + 6.2); g.stroke(); // smile
  dotc(hx + 20, hy - .6, 1.2, ink); // nostril
  dotc(hx + 3, hy + 4.5, 2.6, "#ff9d8a"); // cheek
  g.globalAlpha = .55; g.fillStyle = "#ff9d8a"; g.beginPath(); g.arc(hx + 3, hy + 4.5, 2.6, 0, 7); g.fill(); g.globalAlpha = 1;
  g.lineWidth = 1.5; g.strokeStyle = ink; dotc(hx + 6, hy - 3, 4.2, "#fff", true); dotc(hx + 7.2, hy - 2.6, 2.3, ink); dotc(hx + 7.9, hy - 3.5, .8, "#fff");

  // near wing
  { const [th, lag] = thOf(w); wing([-5, -8], th, lag, 1, mem, belly, body); }

  g.restore();
}

// a magic item waiting on the slope: a gold halo with sparkles around its icon
function drawMagicSpot(C, [x, y, kind], now) {
  const pulse = 1 + .18 * Math.sin(now * 4 + x * .01);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = C.gold; ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(0, 0, 24 * pulse, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.stroke();
  for (let i = 0; i < 5; i++) { const an = now * 1.6 + i * Math.PI * .4, r = 26 + 3 * Math.sin(now * 5 + i); ctx.fillRect(Math.cos(an) * r - 2, Math.sin(an) * r - 2, 4, 4); }
  paintMagic(ctx, palette(C, CHAR()), kind, now);
  ctx.restore();
}
function paintMagic(g, P, kind, t) { // the art lives in paintMagicIcon; a plain token until it is there
  if (typeof paintMagicIcon === "function") return paintMagicIcon(g, P, kind, t);
  g.fillStyle = P.gold; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
}
function drawDragonFlight(C, now) {
  const u0 = Math.min(1, dragonT / DRAGON_T), u = u0 * u0 * (3 - 2 * u0), p = dragonAt(u), dir = Math.sign(p.dx);
  const P = palette(C, CHAR());
  ctx.save(); ctx.translate(p.x, p.y + (u0 >= 1 ? Math.sin(now * 3) * 4 : 0)); ctx.scale(dir, 1);
  ctx.rotate(clamp(Math.atan2(p.dy, Math.abs(p.dx)), -.5, .5) * .6);
  if (typeof paintDragon === "function") paintDragon(ctx, P, now);
  else { ctx.fillStyle = "#2f9e6e"; ctx.beginPath(); ctx.ellipse(0, 0, 55, 16, 0, 0, 7); ctx.fill(); }
  ctx.save(); ctx.translate(-16, -21); ctx.scale(.85, .85); paintRider(ctx, P, CHAR(), VEH(), now); ctx.restore();
  ctx.restore();
}
// one part between a and b in the current transform: a body part as an outlined thick stroke, or a vehicle piece
function paintPart(g, P, p, ax, ay, bx, by, t = 0) {
  g.lineCap = "round";
  if (p.head) {
    const r = p.w / 2;
    g.fillStyle = P.graphite; g.beginPath(); g.arc(ax, ay, r + 1.2, 0, 7); g.fill();
    g.fillStyle = P.skin; g.beginPath(); g.arc(ax, ay, r, 0, 7); g.fill();
    return;
  }
  if (p.shape) { // vehicle pieces are drawn along their own a→b frame (x along the piece, y down)
    const L = Math.hypot(bx - ax, by - ay) || 1;
    g.save(); g.translate(ax, ay); g.rotate(Math.atan2(by - ay, bx - ax));
    g.strokeStyle = P.graphite; g.fillStyle = P[p.k]; g.lineWidth = p.w;
    if (p.shape === "ski") { g.beginPath(); g.moveTo(0, 0); g.lineTo(L - 9, 0); g.quadraticCurveTo(L - 2, 0, L, -6); g.stroke(); }
    else if (p.shape === "runner") { g.beginPath(); g.moveTo(0, 0); g.lineTo(L - 10, 0); g.quadraticCurveTo(L + 2, 0, L - 2, -10); g.quadraticCurveTo(L - 6, -12, L - 8, -7); g.stroke();
      g.lineWidth = 2; g.beginPath(); for (const x of [6, L / 2, L - 14]) { g.moveTo(x, 0); g.lineTo(x, -7); } g.stroke(); }
    else if (p.shape === "board") { g.fillStyle = P.hat; g.lineWidth = 1.5; g.beginPath(); g.moveTo(4, -2); g.lineTo(L - 4, -2);
      g.quadraticCurveTo(L + 1, -2, L + 1, -6); g.lineTo(L - 3, 2); g.lineTo(3, 2); g.lineTo(-1, -6); g.quadraticCurveTo(-1, -2, 4, -2); g.fill(); g.stroke(); }
    else if (p.shape === "tray") { g.lineWidth = 1.5; g.beginPath(); g.roundRect(0, -p.w / 2, L, p.w, 2); g.fill(); g.stroke(); }
    else if (p.shape === "ring") {
      g.lineWidth = 1.6; g.beginPath(); g.ellipse(L / 2, 0, L / 2, p.w / 2, 0, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; g.beginPath(); g.ellipse(L / 2, -1, L / 2 - 6, p.w / 2 - 5, 0, Math.PI * 1.15, Math.PI * 1.75); g.stroke();
    } else if (p.shape === "rocket") {
      if (state === "run" && VEH().thrust) for (const [key, sc] of [["fire", 1], ["hazard", .55]]) { // exhaust
        const len = (14 + 6 * Math.sin(t * 40)) * sc; g.fillStyle = P[key];
        g.beginPath(); g.moveTo(0, -p.w / 2 * sc); g.quadraticCurveTo(-len * .6, 0, -len, 0); g.quadraticCurveTo(-len * .6, 0, 0, p.w / 2 * sc); g.fill();
      }
      g.fillStyle = P[p.k]; g.lineWidth = 1.5; g.beginPath(); g.roundRect(0, -p.w / 2, L, p.w, 3); g.fill(); g.stroke();
      g.fillStyle = P.car; g.beginPath(); g.moveTo(2, -p.w / 2); g.lineTo(-3, -p.w / 2 - 6); g.lineTo(8, -p.w / 2); g.closePath(); g.fill(); g.stroke();
    }
    g.restore(); return;
  }
  if (p.k !== "gear") { g.strokeStyle = P.graphite; g.lineWidth = p.w + 2.4; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
  g.strokeStyle = P[p.k]; g.lineWidth = p.w; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
}
// hat, hair and face for each look around the head centre (hx, hy), facing +x; the magic helmet goes on top
function paintHead(g, P, ch, hx, hy, helmet) {
  g.lineWidth = 1; g.strokeStyle = P.graphite;
  const cap = () => { g.fillStyle = P.hat; g.beginPath(); g.arc(hx, hy, 5.6, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); };
  const goggles = () => { g.fillStyle = P.glass; g.beginPath(); g.roundRect(hx + 1, hy - 1.5, 5, 3, 1); g.fill(); g.stroke(); };
  if (ch.look === "gorro") { cap(); g.beginPath(); g.arc(hx - 1, hy - 7.5, 2.2, 0, 7); g.fill(); goggles(); }
  else if (ch.look === "rabo") {
    g.fillStyle = P.hair; g.beginPath(); g.ellipse(hx - 8, hy + 1, 4.5, 2.4, .5, 0, 7); g.fill();
    g.beginPath(); g.arc(hx, hy, 5.7, Math.PI * .85, Math.PI * 1.6); g.lineTo(hx, hy); g.fill();
    cap(); goggles();
  } else if (ch.look === "barba") {
    g.fillStyle = P.hair; g.beginPath(); g.ellipse(hx + 2.5, hy + 3.4, 4.2, 3.2, 0, 0, 7); g.fill();
    g.fillStyle = P.hat; g.beginPath(); g.arc(hx, hy - 1, 5.8, Math.PI, 0); g.closePath(); g.fill(); g.fillRect(hx - 1, hy - 2, 9, 1.8);
    g.fillStyle = P.graphite; g.beginPath(); g.arc(hx + 3, hy, .9, 0, 7); g.fill();
  } else if (ch.look === "faixa") {
    g.fillStyle = P.hair; g.beginPath(); g.arc(hx, hy, 5.7, Math.PI * .9, Math.PI * 1.9); g.closePath(); g.fill();
    g.strokeStyle = P.hat; g.lineWidth = 2.2; g.beginPath(); g.moveTo(hx - 5, hy - 2.6); g.lineTo(hx + 5.4, hy - 2.6); g.stroke();
    g.lineWidth = 1; g.strokeStyle = P.graphite; goggles();
  } else if (ch.look === "pinguim") {
    g.fillStyle = "#f6f6f2"; g.beginPath(); g.ellipse(hx + 2.2, hy + .8, 3.4, 4, 0, 0, 7); g.fill();
    g.fillStyle = P.graphite; g.beginPath(); g.arc(hx + 3, hy - 1, 1, 0, 7); g.fill();
    g.fillStyle = P.hat; g.beginPath(); g.moveTo(hx + 4.5, hy - .5); g.lineTo(hx + 10, hy + 1.2); g.lineTo(hx + 4.5, hy + 2.6); g.closePath(); g.fill();
  }
  if (helmet) {
    g.fillStyle = P.gold; g.strokeStyle = P.graphite; g.lineWidth = 1.2;
    g.beginPath(); g.arc(hx, hy, 7.2, Math.PI * .95, Math.PI * 2.05); g.closePath(); g.fill(); g.stroke();
  }
}
// the whole rider in rider-local coordinates (x forward, y down from the rear contact)
function paintRider(g, P, ch, vh, t = 0, helmet = false) {
  for (const p of vh.parts) {
    paintPart(g, P, p, p.a[0], p.a[1], p.b[0], p.b[1], t);
    if (ch.look === "pinguim" && p.k === "jacket" && p.w === 8) { // white belly down the front of the torso
      g.strokeStyle = "#f6f6f2"; g.lineWidth = 3.4; g.beginPath(); g.moveTo(p.a[0] + 2.5, p.a[1] - 2); g.lineTo(p.b[0] + 2.5, p.b[1] + 3); g.stroke();
    }
  }
  paintHead(g, P, ch, vh.head[0], vh.head[1], helmet);
}
function drawSkier(C, now = 0) {
  const a = car.w[0], f = basis();
  ctx.save(); ctx.translate(a.x, a.y); ctx.transform(f.ux, f.uy, -f.nx, -f.ny, 0, 0); // local: x forward, y down
  if (fx?.grace > 0 && Math.floor(now * 12) % 2) ctx.globalAlpha = .35; // magic just took a hit
  const act = fx ? activeMagic() : [], P = palette(C, CHAR());
  paintRider(ctx, P, CHAR(), VEH(), now, fx?.shield > 0 && act.includes("capacete"));
  if (fx?.shield > 0 && act.includes("bolha")) { // the bubble wraps the rider
    const [mx, my] = VEH().mid;
    ctx.fillStyle = P.glass; ctx.globalAlpha *= .3; ctx.beginPath(); ctx.arc(mx, -my, 40, 0, 7); ctx.fill();
    ctx.globalAlpha /= .3; ctx.strokeStyle = P.ice; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}
function drawRag(C) {
  const P = palette(C, CHAR());
  for (const p of rag) paintPart(ctx, P, p, p.x + p.hx, p.y + p.hy, p.x - p.hx, p.y - p.hy);
  ctx.fillStyle = C.blood; // open wounds on the torn ends
  for (const p of rag) if (!p.head && !p.shape && p.k !== "gear" && p.k !== "wood" && p.k !== "metal") { ctx.beginPath(); ctx.arc(p.x + p.hx, p.y + p.hy, Math.min(3.2, p.w / 2), 0, 7); ctx.fill(); }
}
