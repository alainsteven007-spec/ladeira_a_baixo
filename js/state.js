// Shared state, saved progress, magic bag, small helpers.
const $ = s => document.querySelector(s);
const cv = $("#cv"), ctx = cv.getContext("2d"), board = $("#board");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let lvl = 0, done = new Set(), cleared = null;
const sketches = { false: LEVELS.map(() => []), true: LEVELS.map(() => []) }; // one drawing per level per orientation
let drawings = sketches[false];
let segs = [], state = "edit", car = null, stroke = null, parts = [], rag = [], drops = [], stains = [];
let tRun = 0, best = 0, stale = 0, vNow = 0, endTimer = 0;
try { JSON.parse(localStorage.getItem("ladeira-ski-done") || "[]").forEach(i => done.add(i)); } catch {}
try { land = localStorage.getItem("ladeira-land") === "1"; } catch {}
// per run: power-up timers, magic charges and guards, attackers in flight, items already taken
const FX_T = 3, GRACE = 1.2, TURBO = 6 * PX, BRAKE = 1.8, STEER = 3;
let fx = null, eagles = [], balls = [], shots = [], taken = new Set(), floaters = [];
// Magic items: won by grabbing a level's item and finishing alive. The bag holds at most 2. Everything in it except
// the dragon works in the next level played and is spent only when that level is won (a crash spends nothing);
// the dragon waits until the player sends it. Magic never changes the physics, it only cancels a loss, so every
// level stays solvable without it. hits: blows it absorbs; guard: what can't hurt at all during the level.
const MAGIC = {
  bolha: { name: "Bolha", hits: 1, note: "aguenta 1 batida" },
  capacete: { name: "Capacete", hits: 3, note: "aguenta 3 batidas" },
  pena: { name: "Pena", guard: "impact", note: "pancadas e quedas não machucam" },
  brasa: { name: "Amuleto de brasa", guard: "fire", note: "fogo e bolas de fogo não queimam" },
  cachecol: { name: "Cachecol de neve", guard: "aval", note: "a avalanche passa sem soterrar" },
  apito: { name: "Apito", guard: "aguia", note: "as águias ficam no ninho" },
  dragao: { name: "Dragão", note: "leva direto à chegada; use quando quiser" },
};
const BAG_MAX = 2, DRAGON_T = 2.4;
let bag = [], earned = new Set();
try { bag = JSON.parse(localStorage.getItem("ladeira-bolsa") || "[]").filter(k => MAGIC[k]).slice(0, BAG_MAX); } catch {}
try { JSON.parse(localStorage.getItem("ladeira-magia") || "[]").forEach(i => earned.add(i)); } catch {}
const saveMagic = () => { try { localStorage.setItem("ladeira-bolsa", JSON.stringify(bag)); localStorage.setItem("ladeira-magia", JSON.stringify([...earned])); } catch {} };
const activeMagic = () => bag.filter(k => k !== "dragao"); // what this level's runs get
let CRASH_V = CRASH_BASE;
const toughen = () => { CRASH_V = CRASH_BASE + VEH().tough; };
toughen();

const L = () => levelFor(lvl);
const fmt = (v, d = 1) => v.toFixed(d).replace(".", ",");
const m = v => fmt(v / PX) + " m", ms = v => fmt(v / PX) + " m/s", sec = t => fmt(t) + " s";
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
