// Board rendering: grid, hazards, fire, cannons, eagles, avalanche, items.
// ---- rendering ----
function fit() {
  const s = Math.max(.1, Math.min(board.clientWidth / W, board.clientHeight / H)), d = devicePixelRatio || 1;
  cv.style.width = W * s + "px"; cv.style.height = H * s + "px";
  cv.width = Math.round(W * s * d); cv.height = Math.round(H * s * d);
}
new ResizeObserver(fit).observe(board);

let hazPat = null, hazKey = "";
function hazard(c1, c2) {
  if (hazKey !== c1 + c2) {
    const p = document.createElement("canvas"); p.width = p.height = 20;
    const g = p.getContext("2d");
    g.fillStyle = c1; g.fillRect(0, 0, 20, 20); g.strokeStyle = c2; g.lineWidth = 5; g.beginPath();
    for (let i = -20; i <= 40; i += 10) { g.moveTo(i, 20); g.lineTo(i + 20, 0); }
    g.stroke(); hazPat = ctx.createPattern(p, "repeat"); hazKey = c1 + c2;
  }
  return hazPat;
}
function line(pts, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = ctx.lineJoin = "round";
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
function label(text, x, y, color, size, paper, align = "center") {
  ctx.font = `700 ${size}px ${css("f-hand")}`; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.lineWidth = 5; ctx.strokeStyle = paper; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
let cs = null;
const css = n => cs.getPropertyValue("--" + n).trim();

function draw() {
  cs = getComputedStyle(document.documentElement);
  const C = {};
  for (const n of ["paper", "grid", "grid-major", "ink", "graphite", "muted", "car", "glass", "hazard", "ok", "bad", "skin", "pants", "blood",
    "fire", "gold", "ice", "slow", "snow", "snow-edge"]) C[n] = css(n);
  const now = performance.now() / 1000;
  const k = cv.width / W, hair = W / (cv.clientWidth || W);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

  // engineering-pad grid: 20 cm minor, 1 m major
  for (const [step, color] of [[20, C.grid], [100, C["grid-major"]]]) {
    ctx.strokeStyle = color; ctx.lineWidth = hair; ctx.beginPath();
    for (let x = step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = step; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }

  for (const hz of L().haz) {
    if (hz.length > 4) { // travel lane of a moving obstacle
      ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
      ctx.strokeRect(Math.min(hz[0], hz[0] + hz[4]), Math.min(hz[1], hz[1] + hz[5]), hz[2] + Math.abs(hz[4]), hz[3] + Math.abs(hz[5]));
      ctx.restore();
    }
    const [x, y, w, h] = hazAt(hz);
    ctx.fillStyle = hazard(C.hazard, C.graphite + "55"); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = C.graphite; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  }
  drawFire(C, now);
  for (const a of L().atk) if (a[0] === "canhao") drawCannon(C, a);
  // scale bar
  line([[24, H - 30], [124, H - 30]], C.muted, 2);
  line([[24, H - 36], [24, H - 24]], C.muted, 2); line([[124, H - 36], [124, H - 24]], C.muted, 2);
  ctx.font = `500 13px ${css("f-mono")}`; ctx.fillStyle = C.muted; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("1 m    g = 9,81 m/s²", 34, H - 48);

  // goal
  const [gx, gy] = L().goal;
  ctx.fillStyle = C.ok; ctx.globalAlpha = .13; ctx.beginPath(); ctx.arc(gx, gy, GOAL_R, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.setLineDash([8, 7]); ctx.strokeStyle = C.ok; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(gx, gy, GOAL_R, 0, 7); ctx.stroke(); ctx.restore();
  const flx = gx + 4, fy = gy - GOAL_R - 4;
  line([[flx, fy], [flx, fy - 40]], C.graphite, 2.5);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? C.paper : C.graphite; ctx.fillRect(flx + i * 6, fy - 40 + j * 6, 6, 6); }
  ctx.strokeStyle = C.graphite; ctx.lineWidth = 1.5; ctx.strokeRect(flx, fy - 40, 24, 18);
  const right = gx > W - 160;
  label("CHEGADA", right ? gx - 6 : gx + 34, fy - 12, C.ok, 20, C.paper, right ? "right" : "left");

  // start pad
  const [x1, y1, x2, y2] = L().start;
  line([[x1, y1], [x2, y2]], C.graphite, 6);
  label("INÍCIO", (x1 + x2) / 2, Math.max(16, Math.min(y1, y2) - 72), C.graphite, 20, C.paper);

  for (const st of drawings[lvl]) line(st, C.ink, 4);
  if (stroke) line(stroke, C.ink, 4);
  if (state === "edit" && !drawings[lvl].length && !stroke) {
    label("Arraste o dedo para desenhar", W / 2, H / 2 - 18, C.muted, 30, C.paper);
    label("a pista do INÍCIO até a CHEGADA", W / 2, H / 2 + 22, C.muted, 30, C.paper);
  }

  L().items.forEach(([x, y, kind], i) => taken.has(i) || drawItem(C, x, y, kind, now));
  const mg = L().magic;
  if (mg && !earned.has(lvl) && !fx?.magic && !flown) drawMagicSpot(C, mg, now);
  ctx.fillStyle = C.blood;
  for (const s of stains) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
  if (flown) drawDragonFlight(C, now); else if (rag.length) drawRag(C); else drawSkier(C, now);
  for (const e of eagles) drawEagle(C, e, now);
  for (const o of balls) drawBall(C, o);
  drawAval(C, now);
  if (fx?.gelo > 0) { ctx.fillStyle = C.ice; ctx.globalAlpha = .1; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  ctx.fillStyle = C.blood;
  for (const d of drops) { ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, 7); ctx.fill(); }

  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = C[p.key];
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-3, -2, 6, 4); ctx.restore();
  }
  ctx.globalAlpha = 1;

  if (state !== "edit" && !flown) {
    ctx.font = `500 20px ${css("f-mono")}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const t = `t ${sec(tRun)}   v ${ms(vNow)}`;
    ctx.lineWidth = 5; ctx.strokeStyle = C.paper; ctx.strokeText(t, W / 2, 26); ctx.fillStyle = C.graphite; ctx.fillText(t, W / 2, 26);
    const on = [["turbo", "TURBO", "hazard"], ["lento", "LENTO", "slow"], ["gelo", "GELO", "ice"]].filter(([k]) => fx[k] > 0)
      .map(([k, name, key]) => [`${name} ${sec(fx[k])}`, key]);
    if (fx.shield) on.push([`PROTEÇÃO ×${fx.shield}`, "gold"]);
    for (const k of activeMagic()) if (MAGIC[k].guard) on.push([MAGIC[k].name.toUpperCase(), "gold"]);
    ctx.font = `500 16px ${css("f-mono")}`;
    on.forEach(([text, key], i) => { const y = 52 + i * 22; ctx.strokeText(text, W / 2, y); ctx.fillStyle = C[key]; ctx.fillText(text, W / 2, y); });
  }
  for (const f of floaters) { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2)); label(f.text, f.x, f.y, C[f.key], 24, C.paper); }
  ctx.globalAlpha = 1;
}
// flame vent: nozzle on one side of its rect, flames across it while lit, a sputter just before
function drawFire(C, now) {
  for (const f of L().fire) {
    const [x, y, w, h, , , , side] = f, on = lit(f), hot = warm(f);
    ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = on ? C.fire : C.muted; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); ctx.restore();
    ctx.save(); // local frame: nozzle along y = 0, flames toward +y
    if (side === 0) ctx.transform(1, 0, 0, -1, x, y + h); else if (side === 1) ctx.transform(1, 0, 0, 1, x, y);
    else if (side === 2) ctx.transform(0, 1, 1, 0, x, y); else ctx.transform(0, 1, -1, 0, x + w, y);
    const across = side < 2 ? w : h, along = side < 2 ? h : w, n = Math.max(2, Math.round(across / 18)), hw = across / n * .7;
    if (on || hot) for (const [key, sc] of [["fire", 1], ["hazard", .55]]) {
      ctx.fillStyle = C[key]; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const cx = (i + .5) * across / n, len = (on ? along - 10 : along * .16) * (.78 + .22 * Math.sin(now * 15 + i * 1.7)) * sc, ww = hw * sc;
        ctx.moveTo(cx - ww, 10); ctx.quadraticCurveTo(cx - ww, 10 + len * .6, cx + Math.sin(now * 9 + i) * ww * .5, 10 + len);
        ctx.quadraticCurveTo(cx + ww, 10 + len * .6, cx + ww, 10);
      }
      ctx.fill();
    }
    ctx.fillStyle = C.graphite; ctx.fillRect(0, 0, across, 10);
    ctx.fillStyle = on || hot ? C.fire : C.muted; for (let i = 0; i < n; i++) ctx.fillRect((i + .5) * across / n - 3, 7, 6, 3);
    ctx.restore();
  }
}
function drawCannon(C, a) {
  const [cx, cy] = car ? local(...VEH().mid) : [W / 2, H / 2], an = Math.atan2(cy - a[2], cx - a[1]);
  ctx.save(); ctx.translate(a[1], a[2]);
  ctx.save(); ctx.rotate(an); ctx.fillStyle = C.graphite; ctx.fillRect(0, -6, 26, 12); ctx.fillStyle = C.fire; ctx.fillRect(22, -6, 4, 12); ctx.restore();
  ctx.fillStyle = C.graphite; ctx.beginPath(); ctx.arc(0, 4, 14, Math.PI, 0); ctx.lineTo(16, 14); ctx.lineTo(-16, 14); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawBall(C, o) {
  const sp = Math.hypot(o.vx, o.vy) || 1;
  for (let k = 3; k >= 1; k--) { ctx.globalAlpha = .18 * (4 - k); ctx.fillStyle = C.fire; ctx.beginPath(); ctx.arc(o.x - o.vx / sp * k * 9, o.y - o.vy / sp * k * 9, 10 - k * 2, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.fillStyle = C.fire; ctx.beginPath(); ctx.arc(o.x, o.y, 10, 0, 7); ctx.fill();
  ctx.fillStyle = C.hazard; ctx.beginPath(); ctx.arc(o.x + 2, o.y - 2, 5, 0, 7); ctx.fill();
}
function drawEagle(C, e, now) {
  const hunting = tHaz >= e.delay && state !== "edit", flap = Math.sin(now * (hunting ? 20 : 5) + e.delay * 3);
  ctx.save(); ctx.translate(e.x, e.y + (hunting ? 0 : Math.sin(now * 2.5) * 3)); ctx.scale(e.vx < -1 ? -1 : 1, 1);
  ctx.fillStyle = C.graphite; ctx.strokeStyle = C.graphite; ctx.lineWidth = 2;
  for (const s of [1, -1]) { // wings
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-8 * s, -14 * flap * s - 4, -22, -10 * flap); ctx.quadraticCurveTo(-10, 0, 4, 2); ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(0, 2, 12, 6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(-19, -2); ctx.lineTo(-19, 7); ctx.closePath(); ctx.fill(); // tail
  ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(12, -3, 5.5, 0, 7); ctx.fill(); ctx.stroke(); // white head
  ctx.fillStyle = C.hazard; ctx.beginPath(); ctx.moveTo(16, -4); ctx.lineTo(23, -1); ctx.lineTo(16, 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = hunting ? C.bad : C.graphite; ctx.beginPath(); ctx.arc(13.5, -4.5, 1.6, 0, 7); ctx.fill();
  ctx.restore();
}
// avalanche: a wall of snow behind the front line; before it starts, a marker shows where it will come from
function drawAval(C, now) {
  const F = front(); if (!F) return;
  const px = -F.uy, py = F.ux;
  if (state === "edit" || F.s < 0) {
    const [x1, y1, x2, y2] = L().start;
    label(`AVALANCHE em ${sec(L().aval[0])}`, (x1 + x2) / 2 + 10, Math.max(y1, y2) + 46, C.bad, 18, C.paper);
    return;
  }
  const cx = F.ox + F.ux * F.s, cy = F.oy + F.uy * F.s, big = 3000;
  const puffs = new Path2D(); // lumpy, rolling edge
  for (let k = -70; k <= 70; k++) {
    const q = k * 20, r = 15 + 7 * Math.sin(k * 1.9 + now * 7), bx = cx + px * q, by = cy + py * q;
    if (bx < -40 || bx > W + 40 || by < -40 || by > H + 40) continue;
    puffs.moveTo(bx + r, by); puffs.arc(bx, by, r, 0, 7);
  }
  ctx.strokeStyle = C["snow-edge"]; ctx.lineWidth = 4; ctx.stroke(puffs); // rim first, so only the outer edge survives the fill
  ctx.fillStyle = C.snow; ctx.fill(puffs);
  ctx.beginPath(); ctx.moveTo(cx + px * big, cy + py * big); ctx.lineTo(cx - px * big, cy - py * big);
  ctx.lineTo(cx - px * big - F.ux * big, cy - py * big - F.uy * big); ctx.lineTo(cx + px * big - F.ux * big, cy + py * big - F.uy * big); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.graphite; // tumbling rocks in the snow
  for (let k = -8; k <= 8; k++) { const q = k * 85 + 30 * Math.sin(now * 3 + k), d = 30 + 25 * (((k * 7 + 3) % 4 + 4) % 4); ctx.beginPath(); ctx.arc(cx + px * q - F.ux * d, cy + py * q - F.uy * d, 4 + (k & 3), 0, 7); ctx.fill(); }
}
function drawItem(C, x, y, kind, now) {
  const key = ITEMS[kind][1], pulse = 1 + .15 * Math.sin(now * 5 + x * .01);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = C[key]; ctx.globalAlpha = .22; ctx.beginPath(); ctx.arc(0, 0, 21 * pulse, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = C[key]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.stroke();
  ctx.fillStyle = C[key]; ctx.strokeStyle = C.graphite; ctx.lineWidth = 1.5; ctx.beginPath();
  if (kind === "turbo") { ctx.moveTo(3, -12); ctx.lineTo(-7, 2); ctx.lineTo(-1, 2); ctx.lineTo(-4, 12); ctx.lineTo(7, -3); ctx.lineTo(1, -3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (kind === "lento") { ctx.moveTo(-11, 7); ctx.lineTo(10, 7); ctx.quadraticCurveTo(12, 1, 7, 2); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-1, -1, 7, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-1, -1, 3.5, 0, 5); ctx.stroke(); }
  else { ctx.strokeStyle = C[key]; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const an = i * Math.PI / 3, c = Math.cos(an) * 11, s = Math.sin(an) * 11; ctx.moveTo(-c, -s); ctx.lineTo(c, s); } ctx.stroke(); }
  ctx.restore();
}
// colours for one character: theme tokens resolved, plus the vehicle materials
function palette(C, ch) {
  const c = v => v && v.startsWith("--") ? css(v.slice(2)) : v;
  return { ...C, jacket: c(ch.jacket), pants: c(ch.pants), skin: c(ch.skin), hat: c(ch.hat), hair: c(ch.hair || ch.hat),
    gear: C.graphite, wood: "#a0612f", tube: "#e2452f", metal: "#8d96a3" };
}
