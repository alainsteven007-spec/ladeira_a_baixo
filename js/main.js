// Main loop and start-up.
let last = performance.now(), acc = 0;
function loop(t) {
  const dt = Math.min((t - last) / 1000, .1); last = t;
  if (state === "run") { // fixed physics steps; the rider is drawn between the last two
    acc += dt;
    while (acc >= STEP && state === "run") { car.pw = car.w.map(w => [w.x, w.y]); update(STEP); acc -= STEP; }
  } else acc = 0;
  if (state === "edit") tHaz += dt;
  else if (state === "edit") tHaz += dt;
  else if (state === "dragon" && (dragonT += dt) >= DRAGON_T) end("win", "O dragão te levou!", "Voou direto até a chegada, sem um arranhão.", true, true);
  if (rag.length) stepRag(dt);
  if (drops.length) stepDrops(dt);
  for (const p of parts) { p.vy += G * .6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 8; p.life -= dt * .7; }
  parts = parts.filter(p => p.life > 0);
  for (const f of floaters) { f.y -= 40 * dt; f.life -= dt * .6; }
  floaters = floaters.filter(f => f.life > 0);
  if (state === "run" && car.pw) { // interpolate for screens faster than the physics clock
    const k = acc / STEP, keep = car.w.map(w => [w.x, w.y]);
    car.w.forEach((w, i) => { w.x = car.pw[i][0] + (w.x - car.pw[i][0]) * k; w.y = car.pw[i][1] + (w.y - car.pw[i][1]) * k; });
    draw();
    car.w.forEach((w, i) => { [w.x, w.y] = keep[i]; });
  } else draw();
  requestAnimationFrame(loop);
}

window.claude?.hot?.snapshot?.(() => ({ v: 3, lvl, land, sketches, done: [...done], rider }));
function start(d = {}) {
  if (d.v === 3 && d.sketches?.false?.length === LEVELS.length) { sketches.false = d.sketches.false; sketches.true = d.sketches.true; }
  if (d.v === 3 && Number.isInteger(d.lvl) && LEVELS[d.lvl]) lvl = d.lvl;
  if (d.v === 3) land = !!d.land;
  if (Array.isArray(d.done)) d.done.forEach(i => done.add(i));
  if (d.rider && CHARACTERS[d.rider.ch] && VEHICLES[d.rider.vh]) rider = d.rider;
  toughen(); $("#who").textContent = `${CHAR().name} · ${VEH().name}`;
  setLand(land); requestAnimationFrame(loop);
}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
