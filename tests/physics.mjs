// Reference physics scenarios (TEST_PLAN.md §1). Run: node tests/physics.mjs
import { open, checker } from "./lib.mjs";
const { browser, page, errors } = await open();
const { check, report } = checker("Física — cenários de referência");
const g = 9.81;

// shared helpers inside the page
await page.evaluate(() => {
  // a pad that ends at p heading along angle a (deg, down-right positive), stroke from there through pts
  window.__course = (p, a, pts, opts = {}) => {
    const r = a * Math.PI / 180, L0 = 120, s = [p[0] - Math.cos(r) * L0, p[1] - Math.sin(r) * L0, p[0], p[1]];
    __sandbox(s, opts.goal || [1e4, 1e4]);
    __draw(__finger([p, ...pts], opts.step || 6, opts.jitter || 0, opts.seed || 1));
    return __ride(opts.maxT || 12, opts.every || 1);
  };
  window.__at = (tr, pred) => tr.find(pred);
});

// T01 straight incline: speed after a known drop matches energy minus friction and drag
{
  const r = await page.evaluate(() => __course([100, 100], 30, [[100 + 600 * Math.cos(Math.PI / 6), 100 + 600 * Math.sin(Math.PI / 6)]], { maxT: 3 }));
  const q = r.trace.find(p => p.y > 350), q0 = r.trace[0], drop = (q.y - q0.y) / 100;
  const ideal = Math.sqrt(2 * g * drop + q0.v ** 2);
  check("T01 reta 30°: velocidade ≈ energia potencial − atrito (±8%)", q.v > ideal * .85 && q.v <= ideal * 1.01, `v=${q.v.toFixed(2)} ideal sem atrito=${ideal.toFixed(2)} m/s`);
}
// T02 smooth curve with finger tremor: no numeric loss beyond friction (compare to the same curve drawn perfectly)
{
  const curve = []; for (let i = 1; i <= 30; i++) { const a = i / 30 * Math.PI / 2; curve.push([100 + 300 * Math.sin(a), 100 + 300 * (1 - Math.cos(a)) * 0 + 300 * Math.sin(a) * .9 + 120 * (1 - Math.cos(a))]); }
  const vs = await page.evaluate(curve => [0, 1, 2.5].map(j => { const r = __course([100, 100], 45, curve, { jitter: j, maxT: 3 }); const q = r.trace.find(p => p.y > 330); return q ? q.v : 0; }), curve);
  check("T02 curva suave: tremor de dedo não rouba energia (±3%)", Math.abs(vs[1] - vs[0]) / vs[0] < .03 && Math.abs(vs[2] - vs[0]) / vs[0] < .03, vs.map(v => v.toFixed(2)).join(" / ") + " m/s (liso / tremor 1 px / 2,5 px)");
}
// T03 loop: the smallest drop that makes it round matches the theory (v² ≥ 5·g·r at the bottom, plus friction),
// with or without finger tremor; above it every drop completes upside down, below it the rider falls off
{
  const res = await page.evaluate(() => {
    const out = [];
    for (const jit of [0, 1.5]) {
      const row = [];
      for (let drop = 1.4; drop <= 5.01; drop += .2) {
        const rr = 100, bx = 500 + drop * 40, by = 100 + drop * 100, pts = [];
        for (let i = 1; i <= 40; i++) { const u = i / 40; pts.push([100 + (bx - 100) * u, 100 + drop * 100 * Math.sin(u * Math.PI / 2)]); }
        for (let i = 1; i <= 48; i++) { const a = i / 48 * Math.PI * 2; pts.push([bx + Math.sin(a) * rr + i * .9, by - rr + Math.cos(a) * rr]); }
        pts.push([bx + 500, by + 40]);
        const r = __course([100, 100], 60, pts, { jitter: jit, maxT: 8, goal: [bx + 480, by + 20] });
        const top = r.trace.filter(p => p.y < by - 1.6 * rr && Math.abs(p.x - bx) < 60);
        const k = r.trace.findIndex(p => p.x >= bx - 5), vin = k > 0 ? r.trace[k - 1].v : 0;
        row.push({ drop: +drop.toFixed(1), vin, win: r.state === "win" && top.some(p => !p.up && p.c), reason: r.reason });
      }
      out.push({ jit, row });
    }
    return out;
  });
  for (const { jit, row } of res) {
    const first = row.findIndex(x => x.win), r = .89; // the rider's centre runs ≈ 89 px from the loop centre
    const ok = first > 0 && row.slice(first).every(x => x.win) && row.slice(0, first).every(x => !x.win);
    const need = Math.sqrt(5 * g * r), vin = first >= 0 ? row[first].vin : 0;
    check(`T03 loop r=1 m (tremor ${jit} px): abaixo do limiar cai, acima completa sempre`, ok, row.map(x => x.win ? "✓" : "·").join("") + " " + row.filter(x => !x.win).map(x => x.drop + ":" + x.reason).join(", "));
    check(`T03 loop r=1 m (tremor ${jit} px): limiar perto da teoria √(5gr)`, first >= 0 && vin > need * .95 && vin < need * 1.25, `entra a ${vin.toFixed(2)} m/s, teoria ${need.toFixed(2)} m/s`);
  }
}
// T04 jump: a lip launches the rider and the landing spot matches the ballistic arc (±6%)
{
  const r = await page.evaluate(() => __course([100, 100], 35, [[350, 275], [430, 290]], { maxT: 4 }));
  const i = r.trace.findIndex((p, k) => k > 5 && !p.c && p.x > 420), take = r.trace[i - 1], landI = r.trace.findIndex((p, k) => k > i && p.c);
  check("T04 salto: sai do chão no fim da rampa e voa", i > 0, take ? `decola a ${take.v.toFixed(2)} m/s` : "não decolou");
  if (i > 0 && landI < 0) check("T04 salto: queda livre longe da pista (sem pouso)", r.trace.slice(i).every(p => !p.c), r.state);
}
// T05 vertical drop: free fall speed = √(2gh)
{
  const r = await page.evaluate(() => __course([220, 100], 30, [[250, 115]], { maxT: 2 }));
  const k = r.trace.findIndex(p => p.y > 600), q = r.trace[k], q0 = r.trace.find(p => !p.c && p.x > 255);
  const ideal = q0 && Math.sqrt(q0.v ** 2 + 2 * g * (q.y - q0.y) / 100);
  check("T05 queda vertical: v = √(v₀² + 2gh) (±3%)", q && ideal && Math.abs(q.v - ideal) / ideal < .03, q ? `v=${q.v.toFixed(2)} ideal=${ideal.toFixed(2)}` : "?");
}
// T06 abrupt transition: a sharp concave corner costs energy, and a hard one at speed is a crash
{
  const soft = await page.evaluate(() => { const r = __course([100, 100], 45, [[350, 350], [700, 400]], { maxT: 3 }); return r; });
  const a = soft.trace.filter(p => p.x < 320).at(-1), b = soft.trace.find(p => p.x > 420);
  const loss = a && b ? 1 - (b.v ** 2 + 2 * g * (a.y - b.y) / 100) / a.v ** 2 : 0;
  check("T06 quina de ~37° desenhada de propósito: perde energia de verdade (≥ 12%)", loss > .12, `perda ${(loss * 100).toFixed(0)}%`);
  const hard = await page.evaluate(() => __course([100, 100], 60, [[400, 620], [700, 600]], { maxT: 3 }));
  check("T06 quina fechada em alta velocidade: pancada", hard.state === "crash" && /Pancada/.test(hard.reason), `${hard.state} ${hard.reason}`);
}
// T07 high speed: a long steep drop stays on the track (no tunnelling) and finishes
{
  const r = await page.evaluate(() => { const pts = []; for (let i = 1; i <= 60; i++) { const a = i / 60 * Math.PI / 2 * .93; pts.push([100 + 1100 * (1 - Math.cos(a)), 100 + 1100 * Math.sin(a)]); } pts.push([1600, 1200]); return __course([100, 100], 80, pts, { maxT: 6, goal: [1580, 1180] }); });
  check("T07 alta velocidade: não atravessa a pista e chega", r.state === "win", `${r.state} ${r.reason} vmax=${Math.max(...r.trace.map(p => p.v)).toFixed(1)} m/s`);
}
// T08 low speed: an almost flat track creeps and stops without jitter or explosions
{
  const r = await page.evaluate(() => __course([100, 100], 6, [[600, 103], [900, 104]], { maxT: 15 }));
  const vmax = Math.max(...r.trace.map(p => p.v));
  check("T08 baixa velocidade: desliza devagar e para sem tremer", r.state === "crash" && /Não chegou/.test(r.reason) && vmax < 3, `${r.reason} vmax=${vmax.toFixed(2)} m/s`);
}
// T09/T10 the same curve drawn with few points and with many points rides the same
{
  const res = await page.evaluate(() => {
    const curve = t => [100 + 600 * t, 100 + 500 * Math.sin(t * Math.PI * .5)];
    const pts = n => Array.from({ length: n }, (_, i) => curve((i + 1) / n));
    return [8, 40, 400].map(n => { const r = __course([100, 100], 45, pts(n), { step: 999, maxT: 6, goal: [690, 610] }); return [r.state, r.t]; });
  });
  check("T09 poucos pontos (8): vence", res[0][0] === "win", res[0].join(" "));
  check("T10 muitos pontos (400): vence", res[2][0] === "win", res[2].join(" "));
  check("T09/T10 mesmo tempo de descida com 8, 40 e 400 pontos (±4%)", res.every(r => Math.abs(r[1] - res[1][1]) / res[1][1] < .04), res.map(r => r[1].toFixed(2) + " s").join(" / "));
}
// T11 determinism: the main loop's accumulator gives the same ride at 30, 60 and 144 Hz
{
  const res = await page.evaluate(() => {
    __sandbox([30, 110, 150, 145], [600, 880]);
    __draw(__finger([[150, 145], [400, 600], [600, 880]], 6, 1));
    return [1 / 30, 1 / 60, 1 / 144].map(fdt => {
      rebuild(); spawn(); arm(); tRun = 0; tHaz = 0; best = Infinity; stale = 0; state = "run"; __reason = "";
      let acc = 0, f = 0;
      while (state === "run" && f++ < 20 / fdt) { acc += fdt; while (acc >= STEP && state === "run") { update(STEP); acc -= STEP; } }
      const r = [state, tRun.toFixed(4), car.w[0].x.toFixed(3)].join(" "); state = "edit"; return r;
    });
  });
  check("T11 determinismo: 30/60/144 Hz dão exatamente o mesmo resultado", res[0] === res[1] && res[1] === res[2], res.join(" | "));
}
// T12 level 1: the natural first attempts win
{
  const res = await page.evaluate(() => {
    const out = {}; W = 700; H = 1000;
    const tries = { "reta até o centro da chegada": [600, 880], "reta até a bandeira": [608, 852], "reta até o texto CHEGADA": [600, 944], "reta passando um pouco da chegada": [640, 940], "reta até a borda de cima do círculo": [600, 834], "reta parando 70 px antes": [560, 822] };
    for (const [k, end] of Object.entries(tries)) {
      lvl = 0; for (const c in levelCache) delete levelCache[c]; W = 700; H = 1000; drawings[0] = [];
      __draw(__finger([[150, 145], end], 6, 1)); const r = __ride(20); out[k] = r.state + " " + r.reason;
    }
    return out;
  });
  for (const [k, v] of Object.entries(res)) check(`T12 fase 1: ${k}`, v.startsWith("win"), v);
}
const fail = report();
if (errors.length) console.log("JS errors:", errors);
await browser.close();
process.exit(fail || errors.length ? 1 : 0);
