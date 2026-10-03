// Rules: losses, hazards, attackers, items, magic, win/lose, dragon.
const WHY = { // {quem} = the chosen character's name, filled in when the card shows; title, text, what kind of harm (a magic guard can cancel it)
  haz: ["Bateu na pedra!", "{quem} encostou na área listrada. Desvie dela com a pista.", "haz"],
  fire: ["Queimou!", "Passou pelo fogo aceso. As chamas acendem e apagam: acerte o tempo mudando a pista.", "fire"],
  aguia: ["A águia pegou!", "A águia mergulhou em {quem}. Desça mais rápido que ela, ou passe longe do ninho.", "aguia"],
  bola: ["Bola de fogo!", "O canhão mira onde {quem} vai estar se seguir reto. Faça curvas para a bola errar.", "fire"],
  aval: ["Soterrado!", "A avalanche alcançou {quem}. Desenhe uma descida mais rápida.", "aval"],
};
function update(dt) {
  tRun += dt;
  for (const k of ["turbo", "lento", "gelo", "grace"]) fx[k] = Math.max(0, fx[k] - dt);
  physics(dt);
  if (state !== "run") return;
  const [a, b] = car.w, probes = VEH().probes.map(p => local(...p));
  const body = car.w.every(w => w.on || w.c) ? [...new Set([...feel(a), ...feel(b)])] : segs; // on the rails the body ignores crossing strands too
  if (probes.some(([px, py]) => touch(px, py, 2.5, body)) && hurt("Caiu de cabeça!", "O corpo de {quem} bateu na neve. Curvas fechadas e lombadas causam esse tombo.", "impact")) return;
  if (!fx.gelo) { tHaz += dt; moveAttackers(dt); } // the ice charm stops the world clock
  for (const d of dangers()) if (hits(d, probes)) { if (hurt(...WHY[d.why])) return; break; }
  const F = front();
  if (F && F.s > 0 && probes.concat(car.w.map(w => [w.x, w.y])).some(([px, py]) => (px - F.ox) * F.ux + (py - F.oy) * F.uy < F.s) && hurt(...WHY.aval)) return;
  pickUp(probes);
  if (car.w.some(w => w.y > H + 80 || w.x < -80 || w.x > W + 80)) return end("crash", "Despencou", "{quem} saiu da pista e caiu montanha abaixo.");
  vNow = (Math.hypot(a.vx, a.vy) + Math.hypot(b.vx, b.vy)) / 2;
  // the finish counts as soon as any part of the rider is inside the circle
  const [cx, cy] = local(...VEH().mid), [gx, gy] = L().goal, dist = Math.hypot(cx - gx, cy - gy);
  if (dist < GOAL_R || probes.concat(car.w.map(w => [w.x, w.y])).some(([px, py]) => Math.hypot(px - gx, py - gy) < GOAL_R)) return end("win", "Chegou inteiro!", `Levou ${sec(tRun)} e cruzou a chegada a ${ms(vNow)}.`);
  if (dist < best - 2) { best = dist; stale = 0; } else stale += dt; // stopped or rocking in a valley = no new closest approach
  if (stale > 3.5) return end("crash", "Não chegou lá", "{quem} perdeu o embalo. Só a gravidade empurra: a chegada precisa ficar mais baixa que o ponto mais alto do caminho.", false);
  if (tRun > T_MAX) return end("crash", "Tempo esgotado", `Passaram ${T_MAX} s e {quem} não chegou.`, false);
}
// a hit ends the run unless magic cancels it: a guard for that kind of harm, or a charge of bubble/helmet
// (after a charge the rider gets a moment to get clear)
function hurt(title, text, kind) {
  if (fx.guard.has(kind) || fx.grace > 0) return false;
  if (fx.shield > 0) {
    fx.shield--; fx.grace = GRACE;
    const [x, y] = local(VEH().mid[0], VEH().mid[1] + 30); floaters.push({ x, y, text: "A magia salvou!", key: "gold", life: 1 });
    return false;
  }
  end("crash", title, text); return true;
}
// everything that kills on touch right now: rects r [x,y,w,h] or circles c [x,y,radius]
function dangers() {
  const out = [];
  for (const h of L().haz) out.push({ r: hazAt(h), why: "haz" });
  if (!fx.guard.has("fire")) for (const f of L().fire) if (lit(f)) out.push({ r: f.slice(0, 4), why: "fire" });
  for (const a of L().atk) if (a[0] === "canhao") out.push({ r: [a[1] - 16, a[2] - 14, 32, 28], why: "haz" });
  if (!fx.guard.has("aguia")) for (const e of eagles) out.push({ c: [e.x, e.y, 15], why: "aguia" });
  if (!fx.guard.has("fire")) for (const o of balls) out.push({ c: [o.x, o.y, 10], why: "bola" });
  return out;
}
function hits(d, probes) {
  if (d.r) {
    const [hx, hy, hw, hh] = d.r;
    return car.w.some(w => (w.x - clamp(w.x, hx, hx + hw)) ** 2 + (w.y - clamp(w.y, hy, hy + hh)) ** 2 < R * R)
      || probes.some(([px, py]) => px > hx && px < hx + hw && py > hy && py < hy + hh);
  }
  const [cx, cy, r] = d.c;
  return car.w.some(w => Math.hypot(w.x - cx, w.y - cy) < r + R) || probes.some(([px, py]) => Math.hypot(px - cx, py - cy) < r);
}
// avalanche front: it starts behind the pad and runs along pad end → goal; s = how far it has come (-1 before it starts)
function front() {
  const v = L().aval; if (!v) return null;
  const [x1, y1, x2, y2] = L().start, [gx, gy] = L().goal, l = Math.hypot(gx - x2, gy - y2), ux = (gx - x2) / l, uy = (gy - y2) / l;
  const T = tHaz - v[0];
  return { ox: x1 - ux * 70, oy: y1 - uy * 70, ux, uy, s: T > 0 ? v[1] * T + v[2] * T * T / 2 : -1 };
}
function moveAttackers(dt) {
  const [cx, cy] = local(...VEH().mid), vx = (car.w[0].vx + car.w[1].vx) / 2, vy = (car.w[0].vy + car.w[1].vy) / 2;
  for (const e of eagles) {
    if (tHaz < e.delay || fx.guard.has("aguia")) continue; // the whistle keeps them on the nest
    const dx = cx - e.x, dy = cy - e.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, STEER * dt);
    e.vx += (dx / d * e.speed - e.vx) * k; e.vy += (dy / d * e.speed - e.vy) * k;
    e.x += e.vx * dt; e.y += e.vy * dt;
  }
  L().atk.forEach((a, i) => {
    if (a[0] !== "canhao") return;
    while (tHaz >= a[3] + shots[i] * a[4]) { // every shot that came due, aimed where the skier will be if it keeps going straight
      let tx = cx, ty = cy;
      for (let k = 0; k < 3; k++) { const fly = Math.hypot(tx - a[1], ty - a[2]) / a[5]; tx = cx + vx * fly; ty = cy + vy * fly; }
      const dx = tx - a[1], dy = ty - a[2], d = Math.hypot(dx, dy) || 1;
      balls.push({ x: a[1] + dx / d * 24, y: a[2] + dy / d * 24, vx: dx / d * a[5], vy: dy / d * a[5] });
      shots[i]++;
    }
  });
  for (const o of balls) { o.x += o.vx * dt; o.y += o.vy * dt; }
  balls = balls.filter(o => o.x > -60 && o.x < W + 60 && o.y > -60 && o.y < H + 60);
}
const ITEM_R = 22, ITEMS = {
  turbo: ["Turbo 3 s!", "hazard"], lento: ["Lento 3 s…", "slow"], gelo: ["Tudo congelado 3 s!", "ice"],
};
function pickUp(probes) {
  const pts = probes.concat(car.w.map(w => [w.x, w.y])), mg = L().magic;
  if (mg && !fx.magic && !earned.has(lvl) && pts.some(([px, py]) => Math.hypot(px - mg[0], py - mg[1]) < ITEM_R)) {
    fx.magic = mg[2]; // only kept if the rider finishes alive
    floaters.push({ x: mg[0], y: mg[1] - 26, text: `${MAGIC[mg[2]].name}! Chegue vivo para ficar`, key: "gold", life: 1.4 });
    if (!reduce) for (let k = 0; k < 24; k++) { const an = k / 24 * Math.PI * 2; parts.push({ x: mg[0], y: mg[1], vx: Math.cos(an) * 260, vy: Math.sin(an) * 260 - 120, life: 1, key: "gold", r: an }); }
  }
  L().items.forEach(([x, y, kind], i) => {
    if (taken.has(i) || !pts.some(([px, py]) => Math.hypot(px - x, py - y) < ITEM_R)) return;
    taken.add(i);
    fx[kind] = FX_T;
    floaters.push({ x, y: y - 24, text: ITEMS[kind][0], key: ITEMS[kind][1], life: 1 });
    if (!reduce) for (let k = 0; k < 18; k++) { const an = k / 18 * Math.PI * 2; parts.push({ x, y, vx: Math.cos(an) * 220, vy: Math.sin(an) * 220 - 120, life: .8, key: ITEMS[kind][1], r: an }); }
  });
}
function arm() { // fresh per-run magic so every Play starts the same
  const act = activeMagic();
  fx = { turbo: 0, lento: 0, gelo: 0, grace: 0, magic: null,
    shield: act.reduce((n, k) => n + (MAGIC[k].hits || 0), 0), guard: new Set(act.map(k => MAGIC[k].guard).filter(Boolean)) };
  eagles = L().atk.filter(a => a[0] === "aguia").map(a => ({ x: a[1], y: a[2], delay: a[3], speed: a[4], vx: 0, vy: 0 }));
  balls = []; shots = L().atk.map(() => 0); taken = new Set(); floaters = [];
}
function end(kind, title, text, boom = true, byDragon = false) {
  state = kind;
  if (kind === "win") {
    if (!reduce) burst(...(byDragon ? L().goal : local(...VEH().mid)));
    done.add(lvl); try { localStorage.setItem("ladeira-ski-done", JSON.stringify([...done])); } catch {}
    text += byDragon ? spendDragon() : settleMagic();
    renderLevels();
  } else if (boom) shatter();
  clearTimeout(endTimer);
  endTimer = setTimeout(() => showCard(kind, title, text), kind === "win" ? 650 : 1100);
  refresh();
}
// a ridden win spends the magic that was working in this level, then banks the item grabbed on the way
function settleMagic() {
  let note = "";
  const used = activeMagic();
  if (used.length) {
    bag = bag.filter(k => k === "dragao");
    note += ` ${used.map(k => MAGIC[k].name).join(" e ")} ${used.length > 1 ? "foram usados" : "foi usado"} nesta fase.`;
  }
  if (fx.magic) {
    const m = MAGIC[fx.magic];
    if (bag.length < BAG_MAX) {
      bag.push(fx.magic); earned.add(lvl);
      note += fx.magic === "dragao" ? ` Você ganhou um ${m.name}! Use quando quiser: ${m.note}.` : ` Você ganhou: ${m.name} (${m.note}). Vale na próxima fase que você jogar.`;
    } else note += ` Sua bolsa está cheia (máximo ${BAG_MAX}): ${m.name} ficou nesta fase. Use um item e volte para buscar.`;
  }
  saveMagic(); renderBag();
  return note;
}
function spendDragon() {
  bag.splice(bag.indexOf("dragao"), 1); saveMagic(); renderBag();
  return "";
}
// the dragon: carries the rider from the pad over the slope to the goal; spent only when it lands
let dragonT = 0, flown = false;
function sendDragon() {
  if (state !== "edit" || !bag.includes("dragao")) return;
  overlay.hidden = true; state = "dragon"; dragonT = 0; flown = true; refresh();
}
function dragonAt(u) { // position and heading on a high arc from the pad to the goal
  const [, , x2, y2] = L().start, [gx, gy] = L().goal;
  const P = [[x2, y2 - 40], [(x2 + gx) / 2, Math.max(70, Math.min(y2, gy) - 220)], [gx, gy - 26]];
  const at = j => (1 - u) ** 2 * P[0][j] + 2 * (1 - u) * u * P[1][j] + u * u * P[2][j];
  const sl = j => 2 * (1 - u) * (P[1][j] - P[0][j]) + 2 * u * (P[2][j] - P[1][j]);
  return { x: at(0), y: at(1), dx: sl(0) || 1e-6, dy: sl(1) };
}
function burst(x, y) {
  const keys = ["ok", "ink", "hazard", "car"];
  for (let i = 0; i < 46; i++) {
    const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 380;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 250, life: 1, key: keys[i % 4], r: Math.random() * 6 });
  }
}
