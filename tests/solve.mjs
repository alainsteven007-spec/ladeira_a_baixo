// Solvability proof: for every level × vehicle × orientation, find (or confirm) a track a player could draw that
// wins. A track is a few waypoints from the pad end, turned into a stroke by the game's own pipeline, and it must
// win as drawn and with two small hand wobbles (±3 px), so a proof is never a knife edge.
// usage: node tests/solve.mjs [--veh 0,1] [--land 0|1] [--levels 1-50] [--iters 1500] [--write]
// Reads/updates tests/data/solutions.json, keys "vehicle,land,level" (level 1-based).
import fs from "fs"; import path from "path";
import { open, root } from "./lib.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const file = path.join(root, "tests/data/solutions.json");
const sols = JSON.parse(fs.readFileSync(file, "utf8"));
const vehs = arg("veh", "0,1,2,3,4,5").split(",").map(Number);
const lands = arg("land") == null ? [0, 1] : [+arg("land")];
const [l0, l1] = arg("levels", "1-50").split("-").map(Number);
const iters = +arg("iters", 1500);
const { browser, page, errors } = await open();
const out = await page.evaluate(({ sols, vehs, lands, l0, l1, iters, SEED }) => {
  bag = []; earned = new Set();
  const draw = (i, wp) => { lvl = i; drawings[i] = []; const st = processStroke([levelFor(i).start.slice(2), ...wp], joinAt(levelFor(i).start.slice(2)).dir); drawings[i] = st ? [st] : []; };
  const run = (i, wp) => {
    draw(i, wp); rebuild(); spawn(); arm(); tRun = 0; tHaz = 0; best = Infinity; stale = 0; state = "run"; __reason = "";
    let n = 0; while (state === "run" && n++ < 45 / STEP) update(STEP);
    const r = { win: state === "win", t: tRun, b: best, reason: __reason }; state = "edit"; drawings[i] = []; return r;
  };
  const wob = (wp, seed) => { let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647 - .5; return wp.map((q, j) => j === wp.length - 1 ? q : [q[0] + r() * 6, q[1] + r() * 6]); };
  const fit = (i, wp) => { let f = 0; for (const v of [wp, wob(wp, 7), wob(wp, 99)]) { const r = run(i, v); if (!r.win) return f + (f ? 0 : Math.min(r.t, 5) / 5 - Math.min(r.b, 2000) / 2000); f++; } return f; };
  const rows = [];
  for (const v of vehs) { rider.vh = v; toughen();
    for (const L of lands) { setLand(!!L);
      for (let n = l0; n <= l1; n++) {
        const i = n - 1, inside = q => [Math.min(W - 6, Math.max(6, q[0])), Math.min(H - 6, Math.max(6, q[1]))];
        // candidates: this combo's proof, then the same level's proofs for other vehicles in this orientation
        const cands = [sols[`${v},${L},${n}`], ...[0, 1, 2, 3, 4, 5].filter(o => o !== v).map(o => sols[`${o},${L},${n}`])].filter(Boolean);
        let wp = null, fc = -1;
        for (const c of cands) { const w = c.map(inside), f = fit(i, w); if (f > fc) { wp = w; fc = f; } if (fc >= 3) break; }
        let rng = 11 + i * 7 + v * 131 + L * 977 + 7919 * SEED; const rnd = () => (rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648;
        const g = () => { let u = 0; for (let q = 0; q < 6; q++) u += rnd(); return (u - 3) / 1.2; };
        let it = 0;
        while (fc < 3 && it++ < iters) { const sg = it % 4 ? 12 : 35; const c = wp.map((q, j) => j === wp.length - 1 ? q : inside([q[0] + g() * sg, q[1] + g() * sg])); const f = fit(i, c); if (f >= fc) { wp = c; fc = f; } }
        const last = run(i, wp);
        rows.push({ key: `${v},${L},${n}`, ok: fc >= 3, fc: +fc.toFixed(2), it, why: last.win ? "" : last.reason, wp });
      }
    }
  }
  setLand(false);
  return rows;
}, { sols, vehs, lands, l0, l1, iters, SEED: +arg("seed", 0) });
const bad = out.filter(r => !r.ok);
console.log(`checked ${out.length}, solved ${out.length - bad.length}, failed ${bad.length}, re-solved ${out.filter(r => r.ok && r.it).length}`);
for (const r of bad) console.log(`  ${r.key}: ${r.why} fc=${r.fc}`);
if (process.argv.includes("--write")) {
  const cur = JSON.parse(fs.readFileSync(file, "utf8")); // re-read: parallel runs write different keys
  for (const r of out) if (r.ok) cur[r.key] = r.wp;
  fs.writeFileSync(file, JSON.stringify(cur));
}
const outFile = arg("out"); if (outFile) fs.writeFileSync(outFile, JSON.stringify(out));
if (errors.length) console.log("JS errors", errors);
await browser.close();
process.exit(bad.length || errors.length ? 1 : 0);
