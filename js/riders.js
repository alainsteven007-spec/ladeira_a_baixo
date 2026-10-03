// Characters (looks) and vehicles (shape + ride parameters).
// Riders: a character (looks only) on a vehicle (changes the ride). Coordinates are local to the rider: x forward,
// y down from the rear contact; every vehicle rests on the same two contacts, (0,0) and (AXLE,0), with the snow at y = 9.
// parts are thick strokes from a to b, drawn intact and torn apart on a crash; k picks the colour from the character
// (jacket, pants, skin) or the vehicle (gear, wood, tube, metal); shape draws a vehicle piece along its a→b segment.
// probes are (forward, up) body points that must never touch the snow; mid is the body centre (goal, aim, effects).
// roll: snow friction px/s², drag: air drag 1/s, tough: extra crash speed px/s, thrust: push px/s² while on the snow.
const SIT = (dx, dy) => [ // seated rider shifted by (dx, dy): sled, rocket, tray
  { a: [8 + dx, -6 + dy], b: [24 + dx, -9 + dy], w: 5.5, k: "pants", bleed: 1 },
  { a: [24 + dx, -9 + dy], b: [37 + dx, -2 + dy], w: 5, k: "pants", bleed: 1 },
  { a: [8 + dx, -6 + dy], b: [11 + dx, -22 + dy], w: 8, k: "jacket", bleed: 1.6 },
  { a: [11 + dx, -20 + dy], b: [28 + dx, -11 + dy], w: 4.5, k: "jacket", bleed: 1 },
  { a: [12 + dx, -30 + dy], b: [12 + dx, -30 + dy], w: 11, k: "skin", head: true, bleed: 2 },
];
const STAND = [
  { a: [24, -4], b: [18, 6], w: 5, k: "pants", bleed: 1 },
  { a: [15, -14], b: [24, -4], w: 5.5, k: "pants", bleed: 1 },
  { a: [15, -14], b: [21, -30], w: 8, k: "jacket", bleed: 1.6 },
  { a: [21, -28], b: [31, -20], w: 4.5, k: "jacket", bleed: 1 },
  { a: [25, -38], b: [25, -38], w: 11, k: "skin", head: true, bleed: 2 },
];
const VEHICLES = [
  { id: "esqui", name: "Esqui", note: "O original: equilibrado em tudo.", rate: [3, 3, 3],
    roll: 25, drag: .04, tough: 0, thrust: 0, mid: [18, 20], head: [25, -38],
    parts: [{ a: [-10, 9], b: [53, 9], w: 3, k: "gear", shape: "ski" }, { a: [31, -20], b: [4, 7], w: 1.6, k: "gear" }, ...STAND],
    probes: [[25, 44], [30, 38], [21, 30], [13, 14], [31, 20]] },
  { id: "treno", name: "Trenó", note: "Baixinho e firme: aguenta pancadas mais fortes, mas desliza menos.", rate: [2, 4, 2],
    roll: 30, drag: .045, tough: 100, thrust: 0, mid: [16, 14], head: [12, -30],
    parts: [{ a: [-8, 8], b: [46, 8], w: 2.5, k: "gear", shape: "runner" }, { a: [-4, 1], b: [40, 1], w: 4.5, k: "wood" },
      ...SIT(0, 0), { a: [28, -11], b: [44, 2], w: 1.2, k: "gear" }],
    probes: [[12, 36], [11, 22], [24, 10], [28, 12]] },
  { id: "snowboard", name: "Snowboard", note: "Desliza muito, mas é frágil na queda.", rate: [4, 2, 3],
    roll: 16, drag: .035, tough: -50, thrust: 0, mid: [18, 20], head: [25, -38],
    parts: [{ a: [-12, 8], b: [50, 8], w: 4, k: "gear", shape: "board" }, ...STAND.slice(0, 3),
      { a: [21, -28], b: [34, -25], w: 4.5, k: "jacket", bleed: 1 }, { a: [19, -27], b: [8, -22], w: 4.5, k: "jacket", bleed: 1 }, STAND[4]],
    probes: [[25, 44], [30, 38], [21, 30], [13, 14], [34, 25], [8, 22]] },
  { id: "boia", name: "Boia", note: "Quase não se machuca, mas o ar segura: corre menos da avalanche.", rate: [2, 5, 3],
    roll: 27, drag: .06, tough: 200, thrust: 0, mid: [18, 18], head: [19, -33],
    parts: [{ a: [-9, -1], b: [45, -1], w: 17, k: "tube", shape: "ring" },
      { a: [16, -8], b: [32, -12], w: 5.5, k: "pants", bleed: 1 }, { a: [32, -12], b: [44, -6], w: 5, k: "pants", bleed: 1 },
      { a: [16, -8], b: [18, -25], w: 8, k: "jacket", bleed: 1.6 }, { a: [18, -23], b: [6, -11], w: 4.5, k: "jacket", bleed: 1 },
      { a: [19, -33], b: [19, -33], w: 11, k: "skin", head: true, bleed: 2 }],
    probes: [[19, 39], [18, 25], [32, 13], [6, 12]] },
  { id: "esquibunda", name: "Esquibunda", note: "Sentado numa tábua, rente ao chão: passa por vãos baixos, mas é lento.", rate: [1, 3, 1],
    roll: 34, drag: .045, tough: 50, thrust: 0, mid: [14, 11], head: [10, -24],
    parts: [{ a: [-8, 7], b: [46, 7], w: 4, k: "wood", shape: "tray" },
      { a: [6, -1], b: [23, -5], w: 5.5, k: "pants", bleed: 1 }, { a: [23, -5], b: [40, -1], w: 5, k: "pants", bleed: 1 },
      { a: [6, -1], b: [9, -16], w: 8, k: "jacket", bleed: 1.6 }, { a: [9, -14], b: [22, -6], w: 4.5, k: "jacket", bleed: 1 },
      { a: [10, -24], b: [10, -24], w: 11, k: "skin", head: true, bleed: 2 }],
    probes: [[10, 30], [9, 16], [23, 9], [22, 9]] },
  { id: "foguete", name: "Trenó-foguete", note: "Um foguete empurra enquanto encosta na neve. O mais rápido, e o mais frágil.", rate: [5, 1, 2],
    roll: 25, drag: .04, tough: -75, thrust: 70, mid: [16, 14], head: [12, -30],
    parts: [{ a: [-8, 8], b: [46, 8], w: 2.5, k: "gear", shape: "runner" }, { a: [-4, 1], b: [40, 1], w: 4.5, k: "metal" },
      { a: [-24, -6], b: [-4, -6], w: 9, k: "metal", shape: "rocket" }, ...SIT(0, 0)],
    probes: [[12, 36], [11, 22], [24, 10], [28, 12]] },
];
// looks only; a colour starting with -- is a theme token
const CHARACTERS = [
  { id: "rafa", name: "Rafa", jacket: "--car", pants: "--pants", skin: "--skin", hat: "--car", look: "gorro" },
  { id: "bia", name: "Bia", jacket: "#7b3fc4", pants: "#24304a", skin: "#c98c62", hat: "#f08cc0", hair: "#3b2416", look: "rabo" },
  { id: "ze", name: "Vô Zé", jacket: "#8a5a2b", pants: "#3f4a3a", skin: "#f3c8a8", hat: "#2f7d4a", hair: "#f4f4f4", look: "barba" },
  { id: "kai", name: "Kai", jacket: "#1f9a6b", pants: "#2a2a2a", skin: "#7a4a2c", hat: "#f2c230", hair: "#141414", look: "faixa" },
  { id: "pinguim", name: "Pinguim", jacket: "#22252b", pants: "#22252b", skin: "#22252b", hat: "#ff9a1f", look: "pinguim" },
];
let rider = { ch: 0, vh: 0 };
try { const r = JSON.parse(localStorage.getItem("ladeira-rider") || "{}"); if (CHARACTERS[r.ch]) rider.ch = r.ch; if (VEHICLES[r.vh]) rider.vh = r.vh; } catch {}
const VEH = () => VEHICLES[rider.vh], CHAR = () => CHARACTERS[rider.ch];
