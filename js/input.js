// Drawing input.
// ---- drawing input ----
function toWorld(e) {
  const r = cv.getBoundingClientRect(), turned = document.body.classList.contains("turn");
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  if (turned) [dx, dy] = [dy, -dx]; // undo the 90° CSS turn
  const w = turned ? r.height : r.width, h = turned ? r.width : r.height;
  return [(dx / w + .5) * W, (dy / h + .5) * H];
}
// a stroke that starts near the pad end or another stroke's end continues it, blended into its direction (no ledge)
let strokeJoin = null, strokeShape = null; // while drawing: the joint it continues, and the processed curve shown live
cv.addEventListener("pointerdown", e => {
  if (state !== "edit") return;
  e.preventDefault(); cv.setPointerCapture(e.pointerId);
  const p = toWorld(e); strokeJoin = joinAt(p);
  stroke = [strokeJoin ? strokeJoin.at : p]; strokeShape = null;
});
cv.addEventListener("pointermove", e => {
  if (!stroke) return;
  for (const ev of e.getCoalescedEvents?.() || [e]) {
    const p = toWorld(ev), q = stroke[stroke.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 1.5) stroke.push(p);
  }
  strokeShape = processStroke(stroke, strokeJoin?.dir);
});
const endStroke = () => {
  if (!stroke) return;
  const shape = processStroke(stroke, strokeJoin?.dir);
  if (shape && shape.length > 1) { drawings[lvl].push(shape); cleared = null; rebuild(); refresh(); }
  stroke = null; strokeShape = null; strokeJoin = null;
};
cv.addEventListener("pointerup", endStroke);
cv.addEventListener("pointercancel", endStroke);
