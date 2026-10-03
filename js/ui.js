// Interface: cards, level menu, orientation, bag, picker, buttons, keys.
// ---- UI ----
const overlay = $("#overlay");
function showCard(kind, title, text) {
  const last = lvl === LEVELS.length - 1;
  $("#card").dataset.kind = kind;
  const who = s => s.replaceAll("{quem}", CHAR().name);
  $("#cTitle").textContent = who(title);
  $("#cText").textContent = who(text) + (kind === "win" && last ? " Você venceu todas as fases!" : "");
  $("#next").hidden = !(kind === "win" && !last);
  overlay.hidden = false;
  ($("#next").hidden ? $("#retry") : $("#next")).focus();
}
function reset() {
  clearTimeout(endTimer); overlay.hidden = true;
  state = "edit"; parts = []; rag = []; drops = []; stains = []; tRun = 0; flown = false; spawn(); arm(); refresh();
}
function play() {
  if (state !== "edit") return reset();
  spawn(); arm(); tRun = 0; tHaz = 0; best = Infinity; stale = 0; vNow = 0; state = "run"; refresh();
}
function select(i) { lvl = i; cleared = null; rebuild(); reset(); renderLevels(); }
function undo() {
  if (state !== "edit") return;
  if (drawings[lvl].length) drawings[lvl].pop();
  else if (cleared) { drawings[lvl] = cleared; cleared = null; }
  rebuild(); refresh();
}
function clearAll() {
  if (state !== "edit" || !drawings[lvl].length) return;
  cleared = drawings[lvl]; drawings[lvl] = []; rebuild(); refresh();
}
// ↔ something moves · ✦ its magic item is still out there · ★ its magic item was won
function optText(l, i) {
  const moves = l.haz.some(h => h.length > 4) || l.fire || l.atk || l.aval;
  const magic = MAGIC_SPOTS[i] ? earned.has(i) ? " ★" : " ✦" : "";
  return `${i + 1}. ${l.name}${moves ? " ↔" : ""}${magic}${done.has(i) ? "  ✓" : ""}`;
}
function renderLevels() {
  $("#lvlBtn").textContent = optText(LEVELS[lvl], lvl) + "  ▾";
  $("#lvList").replaceChildren(...SECTIONS.flatMap(([from, title], k) => {
    const to = SECTIONS[k + 1]?.[0] ?? LEVELS.length, grid = document.createElement("div");
    grid.className = "lvsec";
    for (let i = from; i < to; i++) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = optText(LEVELS[i], i); b.setAttribute("aria-current", i === lvl);
      b.onclick = () => { closeLevels(); select(i); };
      grid.append(b);
    }
    return [Object.assign(document.createElement("h3"), { textContent: title }), grid];
  }));
}
function openLevels() {
  if (state !== "edit") reset();
  $("#lvlMenu").hidden = false;
  const cur = $("#lvList").querySelector('[aria-current="true"]');
  const box = cur.closest(".pk"); box.scrollTop = cur.offsetTop - box.clientHeight / 2; // not scrollIntoView: it would scroll the turned page too
  cur.focus({ preventScroll: true });
}
const closeLevels = () => { $("#lvlMenu").hidden = true; $("#lvlBtn").focus(); };
$("#lvlBtn").onclick = openLevels;
$("#lvClose").onclick = closeLevels;
$("#lvlMenu").onclick = e => { if (e.target.id === "lvlMenu") closeLevels(); };
function orient() { // sideways mode on a portrait screen = turn the app so the phone can be held sideways
  const r = document.documentElement.style;
  r.setProperty("--vw", innerWidth + "px"); r.setProperty("--vh", innerHeight + "px");
  document.body.classList.toggle("turn", land && innerHeight > innerWidth);
}
function setLand(on) {
  land = on; W = land ? 1000 : 700; H = land ? 700 : 1000; drawings = sketches[land];
  try { localStorage.setItem("ladeira-land", land ? "1" : "0"); } catch {}
  $(".app").classList.toggle("land", land);
  $("#turn").textContent = land ? "⟳ Em pé" : "⟳ Deitar";
  orient(); fit(); select(lvl);
}
$("#turn").onclick = () => setLand(!land);
addEventListener("resize", orient);
function magicIcon(c, kind) {
  const g = c.getContext("2d"), st = getComputedStyle(document.documentElement), P = {};
  for (const n of ["paper", "graphite", "muted", "ink", "gold", "glass", "fire", "hazard", "ice", "slow", "ok", "bad", "car"]) P[n] = st.getPropertyValue("--" + n).trim();
  g.setTransform(c.width / 30, 0, 0, c.width / 30, 15 * c.width / 30, 15 * c.width / 30);
  paintMagic(g, P, kind, 0);
}
function renderBag() {
  const slots = [];
  for (let i = 0; i < BAG_MAX; i++) {
    const k = bag[i], dragon = k === "dragao", el = document.createElement(dragon ? "button" : "div");
    el.className = "slot " + (k ? "full" : "empty");
    if (!k) { el.textContent = "vazio"; el.title = "Espaço livre na bolsa"; slots.push(el); continue; }
    const c = document.createElement("canvas"); c.width = c.height = 60;
    el.append(c, Object.assign(document.createElement("span"), { textContent: dragon ? "Usar dragão" : MAGIC[k].name }));
    el.title = dragon ? `${MAGIC[k].name}: ${MAGIC[k].note}.` : `${MAGIC[k].name}: ${MAGIC[k].note}. Vale nesta fase e é gasto quando você vencer.`;
    el.setAttribute("aria-label", dragon ? "Usar dragão" : `${MAGIC[k].name}, vale nesta fase`);
    if (dragon) { el.type = "button"; el.onclick = sendDragon; el.disabled = state !== "edit"; }
    magicIcon(c, k); slots.push(el);
  }
  $("#bag").replaceChildren(...slots);
}
function refresh() {
  const [x1, y1, x2, y2] = L().start, drop = L().goal[1] - (y1 + y2) / 2;
  let ink = 0; for (const st of drawings[lvl]) for (let i = 1; i < st.length; i++) ink += Math.hypot(st[i][0] - st[i-1][0], st[i][1] - st[i-1][1]);
  $("#info").textContent = `Fase ${lvl + 1}/${LEVELS.length} · ${L().name}`;
  $("#more").textContent = ` · desnível ${m(drop)} · pista ${m(ink)} · aguenta pancada até ${ms(CRASH_V)} · itens mágicos ${earned.size}/${MAGIC_SPOTS.filter(Boolean).length}`;
  const edit = state === "edit";
  $("#play").textContent = edit ? "▶ Play" : state === "run" || state === "dragon" ? "■ Parar" : "↺ Redesenhar";
  renderBag();
  $("#undo").disabled = !edit || (!drawings[lvl].length && !cleared);
  $("#clear").disabled = !edit || !drawings[lvl].length;
  cv.classList.toggle("busy", !edit);
}
// ---- character and vehicle picker ----
const dots = n => "●".repeat(n) + "○".repeat(5 - n);
function preview(c, ch, vh) { // the rider on a short slope, sized to the card
  const g = c.getContext("2d"), d = devicePixelRatio || 1, w = c.clientWidth || 96, h = c.clientHeight || 72;
  c.width = Math.round(w * d); c.height = Math.round(h * d);
  cs = getComputedStyle(document.documentElement);
  const C = {}; for (const n of ["paper", "graphite", "glass", "gold", "car", "hazard", "fire", "muted"]) C[n] = css(n);
  const k = w / 96;
  g.setTransform(d * k, 0, 0, d * k, 0, 0); g.fillStyle = C.paper; g.fillRect(0, 0, 96, 72);
  const an = .22; g.strokeStyle = C.muted; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 46); g.lineTo(96, 46 + 96 * Math.tan(an)); g.stroke();
  g.translate(24, 46 + 24 * Math.tan(an) - 9 * Math.cos(an)); g.rotate(an); g.scale(.9, .9);
  paintRider(g, palette(C, ch), ch, vh);
}
function card(label, sub, pressed, onPick) {
  const b = document.createElement("button"), c = document.createElement("canvas");
  b.className = "opt"; b.type = "button"; b.setAttribute("aria-pressed", pressed);
  b.append(c, Object.assign(document.createElement("span"), { textContent: label }));
  if (sub) b.append(Object.assign(document.createElement("small"), { textContent: sub }));
  b.onclick = onPick; return [b, c];
}
function renderPicker() {
  const chars = CHARACTERS.map((ch, i) => card(ch.name, "", i === rider.ch, () => pickRider({ ch: i })));
  const vehs = VEHICLES.map((vh, i) => card(vh.name, `vel ${dots(vh.rate[0])}\nres ${dots(vh.rate[1])}`, i === rider.vh, () => pickRider({ vh: i })));
  $("#chars").replaceChildren(...chars.map(([b]) => b)); $("#vehs").replaceChildren(...vehs.map(([b]) => b));
  vehs.forEach(([b]) => b.querySelector("small").style.whiteSpace = "pre");
  chars.forEach(([, c], i) => preview(c, CHARACTERS[i], VEH())); vehs.forEach(([, c], i) => preview(c, CHAR(), VEHICLES[i]));
  const v = VEH(), h = ["", "rente ao chão", "baixa", "normal"][v.rate[2]];
  $("#vnote").textContent = `${v.name}: ${v.note} Aguenta pancada até ${ms(CRASH_BASE + v.tough)}. Altura: ${h}.`;
  $("#who").textContent = `${CHAR().name} · ${VEH().name}`;
}
function pickRider(change) {
  Object.assign(rider, change); toughen();
  try { localStorage.setItem("ladeira-rider", JSON.stringify(rider)); } catch {}
  renderPicker(); refresh();
}
function openPicker() {
  if (state !== "edit") reset();
  $("#picker").hidden = false; renderPicker();
  $("#picker").querySelector('[aria-pressed="true"]').focus();
}
const closePicker = () => { $("#picker").hidden = true; $("#who").focus(); };
$("#who").onclick = openPicker;
$("#pkOk").onclick = closePicker;
$("#picker").onclick = e => { if (e.target.id === "picker") closePicker(); };
$("#play").onclick = play;
$("#undo").onclick = undo;
$("#clear").onclick = clearAll;
$("#retry").onclick = reset;
$("#next").onclick = () => select(lvl + 1);
addEventListener("keydown", e => {
  if (!$("#picker").hidden) { if (e.key === "Escape") closePicker(); return; }
  if (!$("#lvlMenu").hidden) { if (e.key === "Escape") closeLevels(); return; }
  if (e.target.closest?.("button") && (e.key === " " || e.key === "Enter")) return;
  if (e.code === "Space") { e.preventDefault(); play(); }
  else if (e.key.toLowerCase() === "z") undo();
  else if (e.key === "Escape" && state !== "edit") reset();
});
