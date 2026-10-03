// Magic item placement: for each level, keep the current spot if it satisfies every rule, else search the nearest spot
// that does. Rules (both orientations): a proof track (esqui, drawn from the pad end, inside the board) grabs the item
// and wins, also with two ±3 px wobbles; no vehicle's ordinary winning track and no naive straight line comes within
// NEAR px of the item; the item is clear of hazards, vents, cannons and power-ups.
// usage: node tests/spot.mjs --levels 2-2,11-11 --out file.json   (reads tests/data/solutions.json, tests/data/magic.json)
import fs from "fs"; import path from "path";
import { open, root } from "./lib.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const sols = JSON.parse(fs.readFileSync(path.join(root, "tests/data/solutions.json"), "utf8"));
const magic = JSON.parse(fs.readFileSync(path.join(root, "tests/data/magic.json"), "utf8"));
const levels = arg("levels", "1-50").split(",").flatMap(r => { const [a, b = a] = r.split("-").map(Number); return Array.from({ length: b - a + 1 }, (_, k) => a + k); });
const { browser, page, errors } = await open();
const out = await page.evaluate(({ sols, magic, levels, iters, maxTry }) => {
  bag = []; earned = new Set();
  const NEAR = 38;
  const run = (i, wp, spot) => {
    lvl = i; const st = processStroke([levelFor(i).start.slice(2), ...wp], joinAt(levelFor(i).start.slice(2)).dir); drawings[i] = st ? [st] : [];
    rebuild(); spawn(); arm(); tRun = 0; tHaz = 0; best = Infinity; stale = 0; state = "run"; __reason = "";
    const mg = levelFor(i).magic; let dmin = Infinity, n = 0;
    while (state === "run" && n++ < 45 / STEP) { update(STEP);
      if (n % 2 === 0) for (const [x, y] of VEH().probes.map(p => local(...p)).concat(car.w.map(w => [w.x, w.y]))) dmin = Math.min(dmin, Math.hypot(x - mg[0], y - mg[1])); }
    const r = { win: state === "win", magic: !!fx.magic, dmin, t: tRun, best }; state = "edit"; drawings[i] = []; return r;
  };
  const inside = q => [Math.min(W - 6, Math.max(6, q[0])), Math.min(H - 6, Math.max(6, q[1]))];
  const wob = (wp, seed) => { let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647 - .5; return wp.map((q, j) => j === wp.length - 1 ? q : [q[0] + r() * 6, q[1] + r() * 6]); };
  const rectDist = (x, y, [rx, ry, rw, rh]) => Math.hypot(x - Math.max(rx, Math.min(x, rx + rw)), y - Math.max(ry, Math.min(y, ry + rh)));
  const clear = (x, y, n) => { // portrait coordinates, level n (1-based)
    const S = LEVELS[n - 1];
    if (x < 35 || x > 665 || y < 35 || y > 965) return false;
    for (const h of S.haz) { const r = h.length > 4 ? [Math.min(h[0], h[0] + h[4]), Math.min(h[1], h[1] + h[5]), h[2] + Math.abs(h[4]), h[3] + Math.abs(h[5])] : h; if (rectDist(x, y, r) < 45) return false; }
    for (const f of S.fire || []) if (rectDist(x, y, f.slice(0, 4)) < 45) return false;
    for (const a of S.atk || []) if (Math.hypot(x - a[1], y - a[2]) < 70) return false;
    for (const it of S.items || []) if (Math.hypot(x - it[0], y - it[1]) < 55) return false;
    const [x1, y1, x2, y2] = S.start; if (rectDist(x, y, [Math.min(x1, x2) - 30, Math.min(y1, y2) - 60, Math.abs(x2 - x1) + 60, Math.abs(y2 - y1) + 120]) < 1) return false;
    const [gx, gy] = S.goal; if (Math.hypot(x - gx, y - gy) < 90) return false;
    return true;
  };
  const insertAt = (wp, spot, start) => { // put the spot into the waypoint list where it adds the least length
    const pts = [start, ...wp]; let bi = 1, bd = Infinity;
    for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k], d = Math.hypot(a[0] - spot[0], a[1] - spot[1]) + Math.hypot(b[0] - spot[0], b[1] - spot[1]) - Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < bd) { bd = d; bi = k; } }
    return [...wp.slice(0, bi - 1), spot, ...wp.slice(bi - 1)];
  };
  const prove = (i, L, n, spot, seedBase) => { // returns waypoints or null
    const start = levelFor(i).start.slice(2); rider.vh = 0; toughen();
    const starts = [0, 1, 2, 3, 4, 5].map(v => sols[`${v},${L},${n}`]).filter(Boolean).map(w => insertAt(w.map(inside), levelFor(i).magic.slice(0, 2), start));
    const fit = w => { let f = 0, last = null; for (const v of [w, wob(w, 7), wob(w, 99)]) { const r = run(i, v); if (r.magic && r.win) { f += 1; continue; } return f + (r.magic ? 1.2 : 1 - Math.min(r.dmin, 400) / 400) * .9 + (r.win ? .4 : 0); } return 3; };
    let rng = 1000 + n * 31 + L * 7 + seedBase; const rnd = () => (rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648;
    const g = () => { let u = 0; for (let q = 0; q < 6; q++) u += rnd(); return (u - 3) / 1.2; };
    for (const s0 of starts) {
      let wp = s0, fc = fit(wp);
      for (let it = 0; it < iters && fc < 3; it++) { const sg = it % 4 ? 10 : 30; const c = wp.map((q, j) => j === wp.length - 1 ? q : inside([q[0] + g() * sg, q[1] + g() * sg])); const f = fit(c); if (f >= fc) { wp = c; fc = f; } }
      if (fc >= 3) return wp;
    }
    return null;
  };
  const results = [];
  for (const n of levels) {
    const i = n - 1, kind = MAGIC_SPOTS[i][2], old = MAGIC_SPOTS[i].slice(0, 2), log = [];
    const cands = [old]; for (let r = 20; r <= 360; r += 20) for (let a = 0; a < 360; a += 360 / Math.max(8, Math.round(r / 12))) cands.push([Math.round(old[0] + Math.cos(a * Math.PI / 180) * r), Math.round(old[1] + Math.sin(a * Math.PI / 180) * r * 1.2)]);
    let found = null, tried = 0;
    for (const c of cands) {
      if (tried >= maxTry) break;
      if (!clear(c[0], c[1], n)) continue;
      MAGIC_SPOTS[i] = [c[0], c[1], kind]; for (const k in levelCache) delete levelCache[k];
      // spot must be clear of every ordinary track and the naive line, in both orientations
      let bad = false;
      for (const L of [0, 1]) { setLand(!!L);
        for (let v = 0; v < 6 && !bad; v++) { rider.vh = v; toughen(); const w = sols[`${v},${L},${n}`]; if (w) { const r = run(i, w); if (r.magic || r.dmin < NEAR) bad = true; } }
        rider.vh = 0; toughen(); const gl = levelFor(i).goal; if (!bad) { const r = run(i, [[gl[0], gl[1]]]); if (r.magic || r.dmin < NEAR) bad = true; } }
      if (bad) continue;
      tried++;
      const proof = {}; let ok = true;
      for (const L of [0, 1]) { setLand(!!L); const wp = prove(i, L, n, c, 0); if (!wp) { ok = false; break; } proof[L ? "land" : "port"] = wp; }
      if (ok) { found = { spot: c, ...proof, moved: c !== old }; break; }
    }
    setLand(false); rider.vh = 0; toughen();
    results.push({ n, kind, old, found, tried });
    if (!found) MAGIC_SPOTS[i] = [old[0], old[1], kind];
  }
  return results;
}, { sols, magic, levels, iters: +arg("iters", 500), maxTry: +arg("max", 40) });
for (const r of out) console.log(`fase ${r.n} ${r.kind}: ${r.found ? (r.found.moved ? `MOVIDO ${JSON.stringify(r.old)} -> ${JSON.stringify(r.found.spot)}` : "ponto mantido, prova refeita") : "SEM SOLUÇÃO"} (candidatos testados ${r.tried})`);
const o = arg("out"); if (o) fs.writeFileSync(o, JSON.stringify(out));
if (errors.length) console.log("JS errors", errors);
await browser.close();
