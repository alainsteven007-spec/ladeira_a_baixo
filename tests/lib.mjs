// Test harness: loads the real game in headless Chromium and exposes helpers that run the game's own code.
// In the page: __sandbox(start, goal, opts) adds a test level; __draw(raw, opts) turns raw finger points into a
// stroke through the game's pipeline (snapping to the pad like a player would); __ride(maxT) runs the physics on
// its fixed clock and returns the outcome plus a trace.
import { createRequire } from "module";
import path from "path"; import { fileURLToPath } from "url";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function open(opts = {}) {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: opts.viewport || { width: 520, height: 900 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route("**/fonts.googleapis.com/**", r => r.abort());
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto("file://" + (process.env.HTML || path.join(root, "index.html")));
  await page.waitForTimeout(200);
  if (opts.live) return { browser, page, errors };
  await page.evaluate(() => {
    loop = () => {};
    window.__reason = "";
    end = (kind, title) => { state = kind; __reason = title; };
    // raw points along a polyline every `step` px with optional finger tremor (deterministic)
    window.__finger = (pts, step = 6, jitter = 0, seed = 1) => {
      let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647 - .5;
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
        for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n + (k < n || i < pts.length - 1 ? rnd() * jitter * 2 : 0), y0 + (y1 - y0) * k / n + (k < n || i < pts.length - 1 ? rnd() * jitter * 2 : 0)]);
      }
      return out;
    };
    window.__sandbox = (start, goal, extra = {}) => {
      LEVELS.push({ name: "teste", start, goal, haz: [], ...extra }); MAGIC_SPOTS.push(null);
      for (const s of [sketches.false, sketches.true]) s.push([]);
      lvl = LEVELS.length - 1; for (const k in levelCache) delete levelCache[k];
      W = extra.W || 1e5; H = extra.H || 1e5; drawings[lvl] = []; return lvl;
    };
    window.__draw = raw => { const j = joinAt(raw[0]); const r = j ? [j.at, ...raw.slice(1)] : raw; const s = processStroke(r, j?.dir); if (s) drawings[lvl].push(s); return s; };
    window.__ride = (maxT = 30, every = 1) => {
      rebuild(); spawn(); arm(); tRun = 0; tHaz = 0; best = Infinity; stale = 0; vNow = 0; state = "run"; __reason = "";
      const trace = []; let n = 0;
      while (state === "run" && n < maxT / STEP) {
        update(STEP); n++;
        if (n % every === 0) { const [a, b] = car.w; trace.push({ t: tRun, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: (Math.hypot(a.vx, a.vy) + Math.hypot(b.vx, b.vy)) / 200, c: !!(a.c || b.c), up: basis().ny < 0 }); }
      }
      const r = { state, reason: __reason, t: tRun, trace, w: car.w.map(w => ({ x: w.x, y: w.y, vx: w.vx, vy: w.vy })) };
      state = "edit"; rag = []; drops = []; stains = []; parts = []; return r;
    };
  });
  return { browser, page, errors };
}

// tiny assertion collector
export function checker(title) {
  const rows = []; let fail = 0;
  const check = (name, ok, detail = "") => { rows.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); if (!ok) fail++; };
  const report = () => { console.log(`\n== ${title}`); for (const r of rows) console.log(r); console.log(`${rows.length - fail}/${rows.length} passed`); return fail; };
  return { check, report };
}
