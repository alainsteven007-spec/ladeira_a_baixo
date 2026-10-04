// Live smoke test: the real loop, real pointer events. Draws a stroke with the mouse on level 1, presses Play and
// waits for the win card; then draws a bad stroke and expects a loss card. Checks no JS errors.
import { open, checker } from "./lib.mjs";
const { check, report } = checker("Jogo real — mouse, Play, vitória e derrota");
const { browser, page, errors } = await open({ live: true, viewport: { width: 520, height: 900 } });
const box = await page.locator("#cv").boundingBox();
const at = (wx, wy) => [box.x + wx / 700 * box.width, box.y + wy / 1000 * box.height];
const drag = async pts => { const [x0, y0] = at(...pts[0]); await page.mouse.move(x0, y0); await page.mouse.down(); for (const p of pts.slice(1)) { const [x, y] = at(...p); await page.mouse.move(x, y, { steps: 4 }); } await page.mouse.up(); };
const waitCard = async () => { await page.waitForSelector("#overlay:not([hidden])", { timeout: 15000 }).catch(() => {}); return page.evaluate(() => ({ title: $("#cTitle").textContent, kind: $("#card").dataset.kind })); };
await drag([[150, 145], [380, 520], [600, 880]]);
check("traço desenhado com o mouse entra na pista", await page.evaluate(() => drawings[lvl].length === 1 && drawings[lvl][0].length > 20));
await page.click("#play");
const win = await waitCard();
check("reta até a chegada vence no laço real", win.kind === "win", win.title);
await page.click("#retry");
await page.click("#clear");
check("Limpar apaga a pista", await page.evaluate(() => drawings[lvl].length === 0));
await drag([[150, 145], [200, 150], [260, 148]]);
await page.click("#play");
const lose = await waitCard();
check("traço curto cai e mostra derrota", lose.kind === "crash", lose.title);
const fps = await page.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(f) : r(n); }; requestAnimationFrame(f); }));
check("laço de desenho roda (quadros por segundo > 20 no headless)", fps > 20, fps + " fps");
check("sem erros de JavaScript", errors.length === 0, errors.join(" | "));
const fail = report(); await browser.close(); process.exit(fail ? 1 : 0);
