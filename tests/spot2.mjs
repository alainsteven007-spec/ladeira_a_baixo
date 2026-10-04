// Magic item placement (constructive): wandering winning tracks leave trails and a trail point far from every ordinary track becomes the spot, so a proof exists by construction. Rules as in spot.mjs.
// (unused) original: search the nearest spot
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
const out = await page.evaluate(({ sols, magic, levels, iters, tries, dmin, hz, hzm, near }) => {
  bag = []; earned = new Set();
  const NEAR = near, DMIN = dmin;
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
  const HZ = hz, HZM = hzm;
  const clear = (x, y, n) => { // portrait coordinates, level n (1-based)
    const S = LEVELS[n - 1];
    if (x < 35 || x > 665 || y < 35 || y > 965) return false;
    for (const h of S.haz) { const r = h.length > 4 ? [Math.min(h[0], h[0] + h[4]), Math.min(h[1], h[1] + h[5]), h[2] + Math.abs(h[4]), h[3] + Math.abs(h[5])] : h; if (rectDist(x, y, r) < (h.length > 4 ? HZM : HZ)) return false; }
    for (const f of S.fire || []) if (rectDist(x, y, f.slice(0, 4)) < HZ) return false;
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
  // constructive search: wandering winning tracks leave trails; a trail point far from every ordinary track is a spot with a proof
  const trail = (i, wp) => { // trajectory points of a run (every 0.1 s) and whether it won
    lvl = i; const st = processStroke([levelFor(i).start.slice(2), ...wp], joinAt(levelFor(i).start.slice(2)).dir); drawings[i] = st ? [st] : [];
    rebuild(); spawn(); arm(); tRun = 0; tHaz = 0; best = Infinity; stale = 0; state = "run"; __reason = "";
    const pts = [], body = []; let n = 0;
    while (state === "run" && n++ < 45 / STEP) { update(STEP); if (n % 12 === 0) { const [cx, cy] = local(...VEH().mid); pts.push([cx, cy]); for (const q of VEH().probes.map(p => local(...p))) body.push(q); for (const w of car.w) body.push([w.x, w.y]); } }
    const r = { win: state === "win", pts, body }; state = "edit"; drawings[i] = []; return r;
  };
  const results = [];
  for (const n of levels) {
    const i = n - 1, kind = MAGIC_SPOTS[i][2], old = MAGIC_SPOTS[i].slice(0, 2);
    setLand(false); rider.vh = 0; toughen(); for (const k in levelCache) delete levelCache[k];
    const T = []; for (let v = 0; v < 6; v++) { const w = sols[`${v},0,${n}`]; if (!w) continue; rider.vh = v; toughen(); T.push(...trail(i, w).body); }
    setLand(true); for (let v = 0; v < 6; v++) { const w = sols[`${v},1,${n}`]; if (!w) continue; rider.vh = v; toughen(); T.push(...trail(i, w).body.map(([x, y]) => [x * .7, y / .7])); } setLand(false); // sideways ordinary tracks, in portrait coordinates
    rider.vh = 0; toughen(); const gl = levelFor(i).goal; T.push(...trail(i, [[gl[0], gl[1]]]).body);
    const far = (x, y) => Math.min(...T.map(p => Math.hypot(p[0] - x, p[1] - y)));
    let rng = 4242 + n; const rnd = () => (rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648;
    const g = () => { let u = 0; for (let q = 0; q < 6; q++) u += rnd(); return (u - 3) / 1.2; };
    const base = sols[`0,0,${n}`].map(inside), found = []; let maxd = 0;
    let cur = base.map(q => [...q]);
    for (let k = 0; k < tries && found.length < 80; k++) { // random walk over winning tracks: each win is the next starting point
      let wp = cur.map(q => [...q]); const sg = 8 + rnd() * 30;
      if (rnd() < .08) { const j = Math.floor(rnd() * wp.length); wp.splice(j, 0, inside([wp[j][0] + g() * 60, wp[j][1] + g() * 60])); }
      wp = wp.map((q, j) => j === wp.length - 1 || rnd() < .5 ? q : inside([q[0] + g() * sg, q[1] + g() * sg]));
      const t = trail(i, wp); if (!t.win) continue;
      cur = wp;
      for (const [x, y] of t.pts) { const d = far(x, y); maxd = Math.max(maxd, d); if (d >= DMIN && clear(x, y, n)) found.push({ wp, spot: [Math.round(x), Math.round(y)], d }); }
    }
    found.sort((a, b) => a.d - b.d); // the closest-to-ordinary spots that still need a detour first
    for (let a = found.length - 1; a > 0; a--) if (found.slice(0, a).some(b => Math.hypot(b.spot[0] - found[a].spot[0], b.spot[1] - found[a].spot[1]) < 25)) found.splice(a, 1);
    let res = null, tried = 0; const why = { near: 0, port: 0, land: 0, by: {} };
    for (const f of found) {
      if (tried >= 60) break; tried++;
      MAGIC_SPOTS[i] = [f.spot[0], f.spot[1], kind]; for (const k in levelCache) delete levelCache[k];
      let bad = false;
      for (const L of [0, 1]) { setLand(!!L);
        for (let v = 0; v < 6 && !bad; v++) { rider.vh = v; toughen(); const w = sols[`${v},${L},${n}`]; if (w) { const r = run(i, w); if (r.magic || r.dmin < NEAR) { bad = true; const k = `v${v}${L ? 'L' : 'P'}`; why.by[k] = (why.by[k] || 0) + 1; } } }
        rider.vh = 0; toughen(); const q = levelFor(i).goal; if (!bad) { const r = run(i, [[q[0], q[1]]]); if (r.magic || r.dmin < NEAR) { bad = true; const k = `naive${L ? 'L' : 'P'}`; why.by[k] = (why.by[k] || 0) + 1; } } }
      if (bad) { why.near++; continue; }
      setLand(false); rider.vh = 0; toughen();
      const fitP = w => { let s = 0; for (const v of [w, wob(w, 7), wob(w, 99)]) { const r = run(i, v); if (!(r.magic && r.win)) return s + (r.magic ? 1.2 : 0.5); s++; } return 3; };
      if (fitP(f.wp) < 3) { why.port++; continue; }
      setLand(true); const sx = 1000 / 700, sy = 700 / 1000;
      const landStart = f.wp.map(q => inside([q[0] * sx, q[1] * sy]));
      const wl = (() => { // land proof: scaled track first, then the land ordinary tracks with a detour
        let wp = landStart, fc = (() => { let s = 0; for (const v of [wp, wob(wp, 7), wob(wp, 99)]) { const r = run(i, v); if (!(r.magic && r.win)) return s + (r.magic ? 1.2 : 0.5); s++; } return 3; })();
        for (let it = 0; it < iters && fc < 3; it++) { const sg = it % 4 ? 10 : 30; const c = wp.map((q, j) => j === wp.length - 1 ? q : inside([q[0] + g() * sg, q[1] + g() * sg]));
          let s = 0, f2 = 3; for (const v of [c, wob(c, 7), wob(c, 99)]) { const r = run(i, v); if (!(r.magic && r.win)) { f2 = s + (r.magic ? 1.2 : 0.5); break; } s++; }
          if (f2 >= fc) { wp = c; fc = f2; } }
        return fc >= 3 ? wp : null; })();
      if (!wl) { why.land++; continue; }
      res = { spot: f.spot, port: f.wp, land: wl, moved: true, d: Math.round(f.d) }; break;
    }
    setLand(false); rider.vh = 0; toughen();
    results.push({ n, kind, old, found: res, tried, cands: found.length, maxd: Math.round(maxd), why });
    if (!res) MAGIC_SPOTS[i] = [old[0], old[1], kind];
    console.log(`fase ${n} ${kind}: ${res ? `MOVIDO ${JSON.stringify(old)} -> ${JSON.stringify(res.spot)} (a ${res.d} px das pistas comuns)` : "SEM SOLUÇÃO"} (candidatos ${found.length}, testados ${tried})`);
  }
  return results;
}, { sols, magic, levels, iters: +arg("iters", 400), tries: +arg("tries", 600), dmin: +arg("dmin", 50), hz: +arg("hz", 45), hzm: +arg("hzm", 45), near: +arg("near", 38) });
for (const r of out) console.log(`fase ${r.n} ${r.kind}: ${r.found ? `MOVIDO ${JSON.stringify(r.old)} -> ${JSON.stringify(r.found.spot)} (a ${r.found.d} px das pistas comuns)` : "SEM SOLUÇÃO"} (candidatos ${r.cands}, testados ${r.tried}, maior desvio de uma pista vencedora ${r.maxd} px, descartes ${JSON.stringify(r.why)})`);
const o = arg("out"); if (o) fs.writeFileSync(o, JSON.stringify(out));
if (errors.length) console.log("JS errors", errors);
await browser.close();
