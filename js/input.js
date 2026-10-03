// Drawing input.
// ---- drawing input ----
function toWorld(e) {
  const r = cv.getBoundingClientRect(), turned = document.body.classList.contains("turn");
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  if (turned) [dx, dy] = [dy, -dx]; // undo the 90° CSS turn
  const w = turned ? r.height : r.width, h = turned ? r.width : r.height;
  return [(dx / w + .5) * W, (dy / h + .5) * H];
}
cv.addEventListener("pointerdown", e => {
  if (state !== "edit") return;
  e.preventDefault(); cv.setPointerCapture(e.pointerId); stroke = [snap(toWorld(e))];
});
// a stroke that starts near the pad end or another stroke's end continues it seamlessly (no ledge to fall off)
function snap(p) {
  const ends = [L().start.slice(2), ...drawings[lvl].map(st => st[st.length - 1])];
  let best = p, bd = 40;
  for (const q of ends) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; best = [q[0], q[1]]; } }
  return best;
}
cv.addEventListener("pointermove", e => {
  if (!stroke) return;
  for (const ev of e.getCoalescedEvents?.() || [e]) {
    const p = toWorld(ev), q = stroke[stroke.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 6) stroke.push(p);
  }
});
const endStroke = () => {
  if (!stroke) return;
  if (stroke.length > 1) { drawings[lvl].push(stroke); cleared = null; rebuild(); refresh(); }
  stroke = null;
};
cv.addEventListener("pointerup", endStroke);
cv.addEventListener("pointercancel", endStroke);
