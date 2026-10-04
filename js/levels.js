// Level data: world size, the 50 levels, sections, magic item spots, per-orientation scaling, moving hazards.
// World units: 100 px = 1 m, portrait slope. The skier rides on two ski contact points joined by a rigid
// link (position-based dynamics); the body is drawn on top and only checked for hits.
let W = 700, H = 1000; const PX = 100, G = 9.81 * PX, R = 9, AXLE = 36, SUB = 5;
const CRASH_BASE = 750, VMAX = 2500, GOAL_R = 48, SPIN = 3.5, T_MAX = 40;
// Levels are authored for the 700×1000 portrait slope; sideways play stretches them to 1000×700.
// start: launch pad [x1,y1,x2,y2] (skier faces from 1 to 2); goal: [x,y]
// haz: deadly rects [x,y,w,h] — moving ones add [dx,dy,period s,phase 0..1] and sweep from x,y to x+dx,y+dy and back
// fire: flame vents [x,y,w,h,period s,lit 0..1,phase 0..1,nozzle] — the rect burns for the lit share of each period;
//   nozzle is the side the flames shoot from: 0 bottom, 1 top, 2 left, 3 right
// aval: [delay s, speed px/s, accel px/s²] — a snow front starts behind the pad and sweeps toward the goal
// atk: ["aguia", x, y, delay s, speed px/s] chases the skier; ["canhao", x, y, first shot s, every s, ball px/s] fires fireballs
//   aimed where the skier would be if it kept going straight
// items: [x, y, kind] — power-ups for this run only: "turbo" pushes for 3 s, "lento" brakes for 3 s,
//   "gelo" freezes everything that moves (and the clock that drives it) for 3 s
// Every level also hides one magic item (MAGIC_SPOTS below): it only counts if the rider grabs it and finishes alive
const LEVELS = [
  { name: "Primeira descida", start: [30,110,150,145], goal: [600,880], haz: [] },
  { name: "Desvio", start: [30,110,150,145], goal: [620,880], haz: [[0,620,320,50]] },
  { name: "Por baixo da ponte", start: [670,110,550,145], goal: [100,880], haz: [[0,0,280,520],[330,700,370,300]] },
  { name: "Funil", start: [30,110,150,145], goal: [410,880], haz: [[0,640,330,360],[480,640,220,360]] },
  { name: "Pedras", start: [30,110,150,145], goal: [620,880], haz: [[350,250,350,80],[0,700,330,300]] },
  { name: "Agulha", start: [30,110,150,145], goal: [620,900], haz: [[0,380,240,40],[350,380,350,40],[0,720,420,280]] },
  // moving obstacles from here on
  { name: "Vai e vem", start: [30,110,150,145], goal: [600,880], haz: [[100,420,110,40,330,0,2.6,0]] },
  { name: "Elevador", start: [30,110,150,145], goal: [620,880], haz: [[0,620,320,50],[470,520,90,40,0,320,2.2,.9]] },
  { name: "Portão", start: [30,110,150,145], goal: [410,880], haz: [[0,640,330,360],[480,640,220,360],[160,590,100,30,220,0,2.6,.18]] },
  { name: "Martelos", start: [30,110,150,145], goal: [600,880], haz: [[200,250,60,60,0,260,1.6,.85],[420,480,60,60,0,260,1.6,.35]] },
  { name: "Ponte levadiça", start: [670,110,550,145], goal: [100,880], haz: [[0,0,280,520],[330,700,370,300],[190,500,80,40,0,170,2.4,.05]] },
  { name: "Esteiras", start: [30,110,150,145], goal: [600,880], haz: [[0,300,120,30,520,0,3,.2],[0,520,120,30,520,0,3,.53],[0,740,120,30,520,0,3,.86]] },
  { name: "Agulha móvel", start: [30,110,150,145], goal: [620,900], haz: [[0,380,200,40,130,0,2.4,.15],[320,380,380,40,130,0,2.4,.15],[0,720,420,280]] },
  { name: "Chuva de pedras", start: [30,110,150,145], goal: [600,880], haz: [[230,-60,50,50,0,1000,1.8,.35],[420,-60,50,50,0,1000,1.8,.85]] },
  { name: "Correnteza", start: [30,110,150,145], goal: [600,880], haz: [[0,250,200,60],[0,560,240,60,440,0,3.2,.3]] },
  { name: "Pedras e martelos", start: [30,110,150,145], goal: [620,880], haz: [[350,250,350,80],[0,700,330,300],[340,600,60,60,220,0,1.6,.6],[560,640,60,60,0,140,1.4,.6]] },
  // second run: 17–21 are static again with new shapes, then everything moves
  { name: "Túnel", start: [30,110,150,145], goal: [620,870], haz: [[380,300,320,190],[0,760,360,240]] },
  { name: "Vale", start: [30,110,150,145], goal: [640,740], haz: [[450,280,250,370],[200,840,500,160]] },
  { name: "Contramão", start: [670,110,550,145], goal: [80,870], haz: [[0,0,310,520],[380,620,320,380]] },
  { name: "Montanha-russa", start: [30,110,150,145], goal: [640,420], haz: [[400,0,120,360],[0,700,700,300]] },
  { name: "Escadaria", start: [30,110,150,145], goal: [630,880], haz: [[0,330,150,670],[150,420,150,580],[300,630,150,370],[450,800,120,200],[280,0,420,215],[430,215,270,230],[580,445,120,205]] },
  { name: "Portas de correr", start: [30,110,150,145], goal: [620,880], haz: [[0,470,410,30,-320,0,2.4,.45],[470,470,230,30,320,0,2.4,.45],[0,760,530,30,-400,0,2,.6],[590,760,110,30,400,0,2,.6]] },
  { name: "Pêndulo", start: [30,110,150,145], goal: [620,870], haz: [[80,700,70,70,420,-420,2.4,.45],[500,250,70,70,-200,450,2,.925]] },
  { name: "Avalanche", start: [30,110,150,145], goal: [620,870], haz: [[250,-60,50,50,0,1100,1.8,.65],[340,-60,50,50,0,1100,2,.675],[450,-60,50,50,0,1100,1.7,.7],[560,-60,50,50,0,1100,2.2,.9]] },
  { name: "Pistões", start: [30,110,150,145], goal: [620,870], haz: [[290,-300,40,550,0,330,1.6,.2],[410,-150,40,600,0,330,1.4,.725],[530,0,40,600,0,300,1.2,.325]] },
  { name: "Elevadores", start: [30,420,150,455], goal: [640,880], haz: [[250,300,50,40,0,400,2,.475],[380,350,50,40,0,450,1.6,.15],[510,450,50,40,0,450,1.3,.95]] },
  { name: "Relógio", start: [30,110,150,145], goal: [620,870], haz: [[200,420,50,50,200,0,1.3,.3],[400,450,50,50,0,300,1.7,.025],[600,700,50,50,-250,0,1.1,.075],[250,800,50,50,0,-250,1.5,0]] },
  { name: "Tempestade", start: [30,110,150,145], goal: [620,880], haz: [[300,-60,45,45,0,1100,1.9,.9],[480,-60,45,45,0,1100,1.6,.75],[0,600,100,30,600,0,2.6,.75]] },
  { name: "Guilhotina", start: [30,110,150,145], goal: [620,870], haz: [[380,300,320,190],[0,760,360,240],[420,490,24,60,0,300,1.2,.6],[560,490,24,60,0,330,1,.85]] },
  { name: "Trânsito", start: [30,110,150,145], goal: [630,880], haz: [[0,330,120,30,580,0,2.4,.8],[580,540,120,30,-580,0,2,.125],[0,760,120,30,580,0,2.8,.6]] },
  { name: "Fresta", start: [30,110,150,145], goal: [630,880], haz: [[400,-750,30,1000,0,300,3.2,.625],[400,560,30,1000,0,300,3.2,.625]] },
  { name: "Contramão móvel", start: [670,110,550,145], goal: [80,870], haz: [[0,0,310,470],[380,670,320,330],[315,330,60,40,0,300,1.8,.15],[100,740,60,40,220,0,1.6,.2]] },
  { name: "Vale perigoso", start: [30,110,150,145], goal: [640,740], haz: [[450,280,250,370],[200,840,500,160],[450,660,40,40,0,140,1,.075],[560,660,40,40,0,140,.8,.425],[200,480,50,40,200,0,1.8,.075]] },
  { name: "Escada rolante", start: [30,110,150,145], goal: [630,880], haz: [[0,330,150,670],[150,420,150,580],[300,630,150,370],[450,800,120,200],[280,0,420,215],[430,215,270,230],[580,445,120,205],[340,215,30,30,0,330,1.4,.35],[500,445,30,30,0,330,1.2,.6]] },
  { name: "Vagonete", start: [30,110,150,145], goal: [640,420], haz: [[400,0,120,360],[0,700,700,300],[300,560,60,40,260,0,2.2,.25],[560,380,40,40,0,200,1.8,.7]] },
  { name: "Grande final", start: [30,110,150,145], goal: [630,880], haz: [[0,330,150,670],[150,420,150,580],[300,630,150,370],[450,800,120,200],[280,0,420,215],[430,215,270,230],[580,445,120,205],[340,-300,30,500,0,330,1.3,.025],[500,-70,30,500,0,330,1.1,.525],[200,-60,40,40,0,1100,1.7,.35]] },
  // modes: fire vents and fireballs, an avalanche on your tail, eagles and cannons that hunt the skier, then all at once
  { name: "Fogueira", start: [30,110,150,145], goal: [620,870], haz: [[400,420,120,120]], fire: [[290,300,60,320,1.8,.55,.95,0]], items: [[560,330,"turbo"]] },
  { name: "Lança-chamas", start: [30,110,150,145], goal: [620,870], haz: [], fire: [[80,300,280,50,1.6,.45,.05,2],[330,600,370,50,1.4,.5,.65,3]] },
  { name: "Vulcão", start: [30,110,150,145], goal: [640,420], haz: [[400,0,120,360],[0,700,700,300]], fire: [[430,430,100,270,1.8,.45,.8,0]], atk: [["canhao",60,660,1.3,1.4,450]] },
  { name: "Fornalha", start: [30,110,150,145], goal: [630,880], haz: [[0,330,150,670],[150,420,150,580],[300,630,150,370],[450,800,120,200],[280,0,420,215],[430,215,270,230],[580,445,120,205]], fire: [[320,420,50,210,1.5,.5,.75,0],[470,560,50,240,1.3,.5,.15,0]] },
  { name: "Onda branca", start: [30,110,150,145], goal: [620,880], haz: [], aval: [.8,300,600], items: [[300,375,"lento"]] },
  { name: "Fuga do túnel", start: [30,110,150,145], goal: [620,870], haz: [[380,300,320,190],[0,760,360,240]], aval: [.8,300,600] },
  { name: "Contramão gelada", start: [670,110,550,145], goal: [80,870], haz: [[0,0,310,520],[380,620,320,380]], aval: [.8,300,600], items: [[440,560,"turbo"]] },
  { name: "Vale da avalanche", start: [30,110,150,145], goal: [640,740], haz: [[450,280,250,370],[200,840,500,160]], aval: [.8,300,400], items: [[400,500,"gelo"]] },
  { name: "Águia", start: [30,110,150,145], goal: [640,420], haz: [[400,0,120,360],[0,700,700,300]], atk: [["aguia",80,300,.8,800]] },
  { name: "Canhão", start: [30,110,150,145], goal: [620,870], haz: [[400,420,120,120]], atk: [["canhao",650,600,1,1,900]], items: [[200,700,"gelo"]] },
  { name: "Ninho", start: [30,110,150,145], goal: [620,870], haz: [], atk: [["aguia",470,610,1.4,500],["aguia",80,320,.8,800]] },
  { name: "Bombardeio", start: [30,420,150,455], goal: [640,880], haz: [[380,300,50,40,0,450,1.6,.55]], atk: [["canhao",640,120,.3,1,500],["canhao",60,900,1.3,1.2,500]] },
  { name: "Inferno branco", start: [30,110,150,145], goal: [620,870], haz: [[400,420,120,120]], fire: [[380,560,60,260,1.6,.5,.45,0]], aval: [.8,300,600], atk: [["aguia",640,200,.4,700]], items: [[470,380,"turbo"]] },
  { name: "Fim do mundo", start: [30,110,150,145], goal: [630,880], haz: [[0,330,150,670],[150,420,150,580],[300,630,150,370],[450,800,120,200],[280,0,420,215],[430,215,270,230],[580,445,120,205]], fire: [[320,420,50,210,1.5,.5,.5,0]], aval: [.8,300,600], atk: [["canhao",660,120,.3,.6,450]], items: [[520,520,"gelo"]] },
];
const SECTIONS = [[0, "Clássicas"], [16, "Novas formas"], [36, "🔥 Fogo"], [40, "🏔 Avalanche"], [44, "🦅 Ataque"], [48, "☠ Tudo junto"]];
// one magic item per level, [x, y, kind] in portrait coordinates (null: none yet); kinds are in MAGIC
const MAGIC_SPOTS = LEVELS.map(() => null);
Object.assign(MAGIC_SPOTS, { 0: [330, 720, "bolha"], 1: [310, 560, "pena"], 2: [290, 880, "bolha"], 3: [404, 246, "capacete"], 4: [370, 760, "bolha"], 5: [480, 500, "pena"], 6: [390, 800, "bolha"], 7: [279, 414, "capacete"], 8: [440, 520, "bolha"], 9: [570, 400, "pena"], 10: [276, 897, "bolha"], 11: [410, 180, "capacete"], 12: [308, 629, "bolha"], 13: [330, 720, "pena"], 14: [370, 720, "capacete"], 15: [592, 519, "bolha"], 16: [410, 900, "pena"], 17: [363, 754, "bolha"], 18: [130, 590, "capacete"], 19: [550, 300, "dragao"], 20: [480, 700, "bolha"], 21: [470, 200, "pena"], 22: [410, 180, "bolha"], 23: [410, 180, "capacete"], 24: [330, 665, "bolha"], 25: [348, 891, "pena"], 26: [410, 276, "capacete"], 27: [470, 200, "bolha"], 28: [410, 900, "pena"], 29: [470, 280, "bolha"], 30: [484, 897, "capacete"], 31: [400, 148, "bolha"], 32: [335, 222, "pena"], 33: [420, 400, "capacete"], 34: [210, 440, "bolha"], 35: [657, 721, "dragao"], 36: [550, 580, "brasa"], 37: [450, 300, "brasa"], 38: [550, 300, "brasa"], 39: [420, 400, "cachecol"], 40: [347, 215, "cachecol"], 41: [330, 715, "cachecol"], 42: [327, 847, "cachecol"], 43: [295, 531, "apito"], 44: [650, 660, "brasa"], 45: [330, 252, "apito"], 46: [560, 380, "brasa"], 47: [290, 740, "cachecol"], 48: [497, 585, "capacete"], 49: [470, 700, "dragao"] });
let land = false; // sideways play
const LAND_PACE = .7;
const levelCache = {};
function levelFor(i) { // the level as played in the current orientation
  const key = land + ":" + i;
  if (!levelCache[key]) {
    const src = LEVELS[i], sx = land ? 1000 / 700 : 1, sy = land ? 700 / 1000 : 1;
    // sideways the slope is lower and the skier slower, so fire, avalanche and hunters run on a slower clock:
    // their times are divided by p and their speeds multiplied by it
    const p = land ? LAND_PACE : 1;
    levelCache[key] = { name: src.name,
      start: src.start.map((v, j) => v * (j % 2 ? sy : sx)), goal: [src.goal[0] * sx, src.goal[1] * sy],
      haz: src.haz.map(h => h.map((v, j) => j < 6 ? v * (j % 2 ? sy : sx) : v)),
      fire: (src.fire || []).map(f => f.map((v, j) => j < 4 ? v * (j % 2 ? sy : sx) : j === 4 ? v / p : v)),
      atk: (src.atk || []).map(a => a[0] === "aguia" ? [a[0], a[1] * sx, a[2] * sy, a[3] / p, a[4] * p]
        : [a[0], a[1] * sx, a[2] * sy, a[3] / p, a[4] / p, a[5] * p]),
      items: (src.items || []).map(([x, y, k]) => [x * sx, y * sy, k]),
      magic: MAGIC_SPOTS[i] && [MAGIC_SPOTS[i][0] * sx, MAGIC_SPOTS[i][1] * sy, MAGIC_SPOTS[i][2]] };
    if (src.aval) { // the front travels along pad end → goal; stretch its speed with that distance too
      const [, , px, py] = src.start, [gx, gy] = src.goal, k = Math.hypot((gx - px) * sx, (gy - py) * sy) / Math.hypot(gx - px, gy - py);
      levelCache[key].aval = [src.aval[0] / p, src.aval[1] * k * p, src.aval[2] * k * p * p];
    }
  }
  return levelCache[key];
}
let tHaz = 0; // obstacle clock: runs freely while drawing, restarts at 0 on Play so every run is the same
const lit = (f, t = tHaz) => (t / f[4] + f[6]) % 1 < f[5];
const warm = (f, t = tHaz) => !lit(f, t) && (t / f[4] + f[6]) % 1 > 1 - .45 / f[4]; // about to light
function hazAt(h, t = tHaz) {
  if (h.length < 5) return h;
  const k = (1 - Math.cos(2 * Math.PI * (t / h[6] + h[7]))) / 2;
  return [h[0] + h[4] * k, h[1] + h[5] * k, h[2], h[3]];
}
