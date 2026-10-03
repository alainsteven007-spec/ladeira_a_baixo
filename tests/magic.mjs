// Magic items: every level's item can be grabbed by a rider who then finishes alive (proof tracks, esqui, both
// orientations), and it is never grabbed by accident: no vehicle's ordinary winning track and no naive straight line
// from the pad to the goal touches it. With --solve, a failing proof is searched again (hill-climb).
// usage: node tests/magic.mjs [--levels 1-50] [--solve] [--write]
import fs from "fs"; import path from "path";
import { open, root } from "./lib.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const file = path.join(root, "tests/data/magic.json"), sols = JSON.parse(fs.readFileSync(path.join(root, "tests/data/solutions.json"), "utf8"));
const proofs = JSON.parse(fs.readFileSync(file, "utf8"));
const [l0, l1] = arg("levels", "1-50").split("-").map(Number);
const { browser, page, errors } = await open();
const res = await page.evaluate(({ proofs, sols, l0, l1, solve, iters }) => {
  bag = []; earned = new Set();
  const run = (i, wp) => {
    lvl = i; const st = processStroke([levelFor(i).start.slice(2), ...wp], joinAt(levelFor(i).start.slice(2)).dir); drawings[i] = st ? [st] : [];
    rebuild(); spawn(); arm(); tRun = 0; tHaz = 0; best = Infinity; stale = 0; state = "run"; __reason = "";
    let n = 0; while (state === "run" && n++ < 45 / STEP) update(STEP);
    const r = { win: state === "win", magic: !!fx.magic, t: tRun, reason: __reason, b: best }; state = "edit"; drawings[i] = []; return r;
  };
  const out = [];
  for (let n = l0; n <= l1; n++) {
    const i = n - 1, why = [], P = proofs[n] || {};
    for (const L of [0, 1]) {
      rider.vh = 0; toughen(); setLand(!!L);
      const key = L ? "land" : "port", mg = levelFor(i).magic;
      let wp = P[key], r = wp ? run(i, wp) : { win: false, magic: false, reason: "sem prova" };
      if (!(r.win && r.magic) && solve && wp) { // hill-climb: grab first, then finish
        const inside = q => [Math.min(W - 6, Math.max(6, q[0])), Math.min(H - 6, Math.max(6, q[1]))];
        const fit = w => { const x = run(i, w); let near = Infinity; return (x.magic ? 2 : 0) + (x.win ? 1 : 0) + (x.magic ? Math.min(x.t, 5) / 50 : 0); };
        let rng = 97 + i * 13 + L * 7; const rnd = () => (rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648;
        const g = () => { let u = 0; for (let q = 0; q < 6; q++) u += rnd(); return (u - 3) / 1.2; };
        let fc = fit(wp);
        for (let it = 0; it < iters && fc < 3; it++) { const sg = it % 4 ? 10 : 30; const c = wp.map((q, j) => j === wp.length - 1 ? q : inside([q[0] + g() * sg, q[1] + g() * sg])); const f = fit(c); if (f >= fc) { wp = c; fc = f; } }
        r = run(i, wp); if (r.win && r.magic) P[key] = wp;
      }
      if (!(r.win && r.magic)) why.push(`${L ? "deitado" : "em pé"}: prova falha (${r.magic ? "pegou, " : "não pegou, "}${r.win ? "venceu" : r.reason})`);
      for (let v = 0; v < 6; v++) { rider.vh = v; toughen(); const w = sols[`${v},${L},${n}`]; if (w && run(i, w).magic) why.push(`${L ? "deitado" : "em pé"}: pista normal do veículo ${v} pega o item`); }
      rider.vh = 0; toughen();
      const g = levelFor(i).goal; if (run(i, [[g[0], g[1]]]).magic) why.push(`${L ? "deitado" : "em pé"}: a reta ingênua pega o item`);
    }
    out.push({ n, ok: !why.length, why, proof: P });
  }
  setLand(false);
  return out;
}, { proofs, sols, l0, l1, solve: process.argv.includes("--solve"), iters: +arg("iters", 3000) });
const bad = res.filter(r => !r.ok);
console.log(`itens mágicos: ${res.length - bad.length}/${res.length} ok`);
for (const r of bad) console.log(`  fase ${r.n}: ${r.why.join("; ")}`);
const outF = arg("out"); if (outF) fs.writeFileSync(outF, JSON.stringify(Object.fromEntries(res.map(r => [r.n, r.proof]))));
if (process.argv.includes("--write")) { const cur = JSON.parse(fs.readFileSync(file, "utf8")); for (const r of res) cur[r.n] = r.proof; fs.writeFileSync(file, JSON.stringify(cur)); }
if (errors.length) console.log("JS errors", errors);
await browser.close();
process.exit(bad.length || errors.length ? 1 : 0);
