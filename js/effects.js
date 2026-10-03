// Crash effects: the rider breaks apart, drops and stains.
// ---- crash: the skier breaks apart and bleeds ----
function shatter() {
  const vx = (car.w[0].vx + car.w[1].vx) / 2, vy = (car.w[0].vy + car.w[1].vy) / 2;
  const power = clamp(Math.hypot(vx, vy) * .35, 160, 420);
  rag = VEH().parts.map(p => {
    const A = local(p.a[0], -p.a[1]), B = local(p.b[0], -p.b[1]), ang = Math.random() * Math.PI * 2, s = power * (.3 + Math.random() * .7);
    return { ...p, x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2, hx: (B[0] - A[0]) / 2, hy: (B[1] - A[1]) / 2,
      vx: vx * .5 + Math.cos(ang) * s, vy: vy * .5 + Math.sin(ang) * s - power * .4, av: (Math.random() - .5) * 16, bleed: p.bleed || 0 };
  });
  const [cx, cy] = local(VEH().mid[0], VEH().mid[1] + 4);
  for (let i = 0; i < 70; i++) {
    const ang = Math.random() * Math.PI * 2, s = Math.random() * power * 1.1;
    drops.push({ x: cx, y: cy, vx: vx * .3 + Math.cos(ang) * s, vy: vy * .3 + Math.sin(ang) * s - 120 });
  }
}
function stepRag(dt) {
  const h = dt / 3;
  for (let n = 0; n < 3; n++) for (const p of rag) {
    p.vy += G * h; p.x += p.vx * h; p.y += p.vy * h;
    const c = Math.cos(p.av * h), s = Math.sin(p.av * h);
    [p.hx, p.hy] = [p.hx * c - p.hy * s, p.hx * s + p.hy * c];
    const r = p.w / 2 + 1;
    for (const [ex, ey] of [[p.x + p.hx, p.y + p.hy], [p.x - p.hx, p.y - p.hy]]) {
      const t = touch(ex, ey, r); if (!t) continue;
      let nx = ex - t[0], ny = ey - t[1]; const d = t[2] || 1e-4; nx /= d; ny /= d;
      p.x += nx * (r - d); p.y += ny * (r - d);
      const vn = p.vx * nx + p.vy * ny;
      if (vn < 0) { p.vx -= nx * vn * 1.3; p.vy -= ny * vn * 1.3; p.vx *= .9; p.vy *= .9; p.av *= .7; }
    }
  }
  for (const p of rag) if (p.bleed > 0) {
    p.bleed -= dt;
    if (Math.random() < .55) drops.push({ x: p.x, y: p.y, vx: p.vx * .3 + (Math.random() - .5) * 60, vy: p.vy * .3 - Math.random() * 40 });
  }
  rag = rag.filter(p => p.y < H + 200);
}
function stepDrops(dt) {
  for (const d of drops) {
    d.vy += G * dt; d.x += d.vx * dt; d.y += d.vy * dt;
    const t = touch(d.x, d.y, 3), inHaz = L().haz.some(h => h.length < 5 && d.x > h[0] && d.x < h[0] + h[2] && d.y > h[1] && d.y < h[1] + h[3]);
    if (t || inHaz) { stains.push({ x: t ? t[0] : d.x, y: t ? t[1] : d.y, r: 1.5 + Math.random() * 3 }); d.dead = true; }
    else if (d.y > H + 20) d.dead = true;
  }
  drops = drops.filter(d => !d.dead);
  if (stains.length > 900) stains.splice(0, stains.length - 900);
}
