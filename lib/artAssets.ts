// Profesionální vektorové assety kreslené v kódu (žádné soubory, jednotný styl
// mapových „stampů" jako Inkarnate / Dungeon Scrawl). Každý se vyrenderuje do
// cache canvasu jednou a sdílí se mezi všemi instancemi.
import { normalize, type CategoryId } from './assetCatalog';

export interface ArtAsset {
  id: string; // 'art:<slug>'
  name: string;
  category: CategoryId;
  tags: string[];
  draw: (ctx: CanvasRenderingContext2D, s: number) => void;
}

const OUT = '#241b12'; // jednotný tmavý obrys

// — paleta —
const COL = {
  trunk: '#6e4a29',
  trunkD: '#523619',
  pine: '#356b4d',
  pineD: '#244f39',
  pineL: '#4b8a66',
  leaf: '#4a7a3c',
  leafD: '#365c2c',
  leafL: '#629a4f',
  stone: '#9a948799',
  rock: '#8e9299',
  rockD: '#6b7079',
  rockL: '#aab0b8',
  snow: '#eef3f8',
  snowD: '#cfdae8',
  wood: '#8a5a32',
  woodD: '#664022',
  woodL: '#a87a48',
  roof: '#7c3b33',
  roofD: '#5c2a24',
  roofL: '#9c5049',
  wall: '#cdbf9e',
  wallD: '#a89878',
  metal: '#aab2bb',
  metalD: '#7c848d',
  gold: '#d9b24a',
  goldD: '#a8842a',
  fire: '#f08a34',
  fireL: '#ffd35a',
  fireC: '#fff0b0',
  water: '#3a7fb0',
  waterD: '#2c6390',
  dark: '#1b1510',
  bone: '#e6e0cf',
  boneD: '#bfb39a',
  cloth: '#b8463f',
  clothD: '#8e322d',
};

function path(ctx: CanvasRenderingContext2D, pts: number[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}
function fs(ctx: CanvasRenderingContext2D, fill: string, ow: number, stroke = true) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUT;
    ctx.lineWidth = ow;
    ctx.stroke();
  }
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// soft kontaktní stín pod stampem
function shadow(ctx: CanvasRenderingContext2D, s: number, cx = 0.5, cy = 0.9, rx = 0.32, ry = 0.07) {
  ctx.save();
  ctx.translate(cx * s, cy * s);
  ctx.scale(rx * s, ry * s);
  circle(ctx, 0, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();
  ctx.restore();
}

const ow = (s: number) => s * 0.022;

// ————————————————————————————————— STROMY —————————————————————————————————
function pine(ctx: CanvasRenderingContext2D, s: number, snow = false) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s);
  path(ctx, [cx - s * 0.045, s * 0.72, cx + s * 0.045, s * 0.72, cx + s * 0.045, s * 0.9, cx - s * 0.045, s * 0.9]);
  fs(ctx, COL.trunk, o);
  const tier = (yTop: number, yBot: number, hw: number) => {
    path(ctx, [cx, yTop * s, cx + hw * s, yBot * s, cx - hw * s, yBot * s]);
    fs(ctx, COL.pine, o);
    path(ctx, [cx, yTop * s, cx - hw * 0.5 * s, yBot * s, cx - hw * s, yBot * s]);
    fs(ctx, COL.pineD, o, false);
  };
  tier(0.5, 0.78, 0.26);
  tier(0.32, 0.58, 0.21);
  tier(0.14, 0.4, 0.16);
  if (snow) {
    path(ctx, [cx, 0.14 * s, cx + 0.08 * s, 0.24 * s, cx - 0.08 * s, 0.24 * s]);
    fs(ctx, COL.snow, o * 0.7, false);
  }
}
function oak(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s);
  path(ctx, [cx - s * 0.05, s * 0.6, cx + s * 0.05, s * 0.6, cx + s * 0.05, s * 0.9, cx - s * 0.05, s * 0.9]);
  fs(ctx, COL.trunk, o);
  // koruna z překrývajících se kruhů
  ctx.beginPath();
  for (const [dx, dy, r] of [
    [-0.16, -0.02, 0.2],
    [0.16, -0.02, 0.2],
    [0, -0.18, 0.24],
    [-0.1, -0.12, 0.18],
    [0.1, -0.12, 0.18],
  ] as const) {
    ctx.moveTo((0.5 + dx) * s + r * s, (0.4 + dy) * s);
    ctx.arc((0.5 + dx) * s, (0.4 + dy) * s, r * s, 0, Math.PI * 2);
  }
  fs(ctx, COL.leaf, o);
  circle(ctx, 0.42 * s, 0.32 * s, 0.14 * s);
  ctx.fillStyle = COL.leafL;
  ctx.fill();
}
function deadTree(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s);
  ctx.beginPath();
  ctx.moveTo(cx, 0.92 * s);
  ctx.lineTo(cx, 0.3 * s);
  ctx.moveTo(cx, 0.55 * s);
  ctx.lineTo(cx - 0.16 * s, 0.38 * s);
  ctx.moveTo(cx, 0.45 * s);
  ctx.lineTo(cx + 0.18 * s, 0.3 * s);
  ctx.moveTo(cx, 0.62 * s);
  ctx.lineTo(cx + 0.12 * s, 0.52 * s);
  ctx.strokeStyle = COL.trunkD;
  ctx.lineWidth = o * 2.2;
  ctx.lineCap = 'round';
  ctx.stroke();
}
function bush(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.3, 0.06);
  ctx.beginPath();
  for (const [x, y, r] of [
    [0.32, 0.62, 0.18],
    [0.68, 0.62, 0.18],
    [0.5, 0.5, 0.22],
  ] as const) {
    ctx.moveTo(x * s + r * s, y * s);
    ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2);
  }
  fs(ctx, COL.leaf, o);
  circle(ctx, 0.44 * s, 0.46 * s, 0.1 * s);
  ctx.fillStyle = COL.leafL;
  ctx.fill();
}
function palm(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s);
  ctx.beginPath();
  ctx.moveTo(cx - 0.03 * s, 0.9 * s);
  ctx.quadraticCurveTo(cx + 0.06 * s, 0.55 * s, cx - 0.02 * s, 0.34 * s);
  ctx.lineTo(cx + 0.05 * s, 0.34 * s);
  ctx.quadraticCurveTo(cx + 0.12 * s, 0.55 * s, cx + 0.05 * s, 0.9 * s);
  ctx.closePath();
  fs(ctx, COL.wood, o);
  for (const a of [-0.9, -0.4, 0.1, 0.6, 1.1]) {
    ctx.beginPath();
    ctx.moveTo(cx, 0.34 * s);
    ctx.quadraticCurveTo(cx + Math.cos(a) * 0.2 * s, 0.34 * s + Math.sin(a) * 0.1 * s - 0.06 * s, cx + Math.cos(a) * 0.34 * s, 0.34 * s + Math.sin(a) * 0.16 * s + 0.02 * s);
    ctx.strokeStyle = COL.leaf;
    ctx.lineWidth = o * 2.4;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  circle(ctx, cx, 0.33 * s, o * 1.4);
  ctx.fillStyle = COL.leafD;
  ctx.fill();
}
function cactus(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s, 0.5, 0.9, 0.18, 0.05);
  rrect(ctx, cx - 0.07 * s, 0.32 * s, 0.14 * s, 0.58 * s, 0.07 * s);
  fs(ctx, COL.pineL, o);
  rrect(ctx, cx - 0.22 * s, 0.5 * s, 0.1 * s, 0.22 * s, 0.05 * s);
  fs(ctx, COL.pineL, o);
  rrect(ctx, cx + 0.12 * s, 0.44 * s, 0.1 * s, 0.26 * s, 0.05 * s);
  fs(ctx, COL.pineL, o);
}
function mushroomBig(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s, 0.5, 0.88, 0.2, 0.05);
  rrect(ctx, cx - 0.1 * s, 0.5 * s, 0.2 * s, 0.4 * s, 0.08 * s);
  fs(ctx, COL.bone, o);
  ctx.beginPath();
  ctx.moveTo(cx - 0.3 * s, 0.52 * s);
  ctx.quadraticCurveTo(cx, 0.16 * s, cx + 0.3 * s, 0.52 * s);
  ctx.closePath();
  fs(ctx, COL.cloth, o);
  for (const [x, r] of [[0.4, 0.04], [0.55, 0.05], [0.62, 0.035]] as const) {
    circle(ctx, x * s, 0.4 * s, r * s);
    ctx.fillStyle = COL.bone;
    ctx.fill();
  }
}

// ————————————————————————————————— TERÉN —————————————————————————————————
function mountain(ctx: CanvasRenderingContext2D, s: number, snow = true) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.38, 0.07);
  path(ctx, [0.5 * s, 0.14 * s, 0.86 * s, 0.84 * s, 0.14 * s, 0.84 * s]);
  fs(ctx, COL.rock, o);
  path(ctx, [0.5 * s, 0.14 * s, 0.86 * s, 0.84 * s, 0.5 * s, 0.84 * s]);
  fs(ctx, COL.rockD, o, false);
  if (snow) {
    path(ctx, [0.5 * s, 0.14 * s, 0.64 * s, 0.4 * s, 0.55 * s, 0.36 * s, 0.5 * s, 0.44 * s, 0.45 * s, 0.34 * s, 0.36 * s, 0.4 * s]);
    fs(ctx, COL.snow, o * 0.8);
  }
}
function mountains(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.44, 0.07);
  path(ctx, [0.28 * s, 0.34 * s, 0.54 * s, 0.86 * s, 0.02 * s, 0.86 * s]);
  fs(ctx, COL.rockD, o);
  path(ctx, [0.72 * s, 0.38 * s, 0.98 * s, 0.86 * s, 0.46 * s, 0.86 * s]);
  fs(ctx, COL.rockD, o);
  path(ctx, [0.5 * s, 0.2 * s, 0.8 * s, 0.86 * s, 0.2 * s, 0.86 * s]);
  fs(ctx, COL.rock, o);
  path(ctx, [0.5 * s, 0.2 * s, 0.62 * s, 0.42 * s, 0.5 * s, 0.38 * s, 0.38 * s, 0.42 * s]);
  fs(ctx, COL.snow, o * 0.8);
}
function hill(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.4, 0.06);
  ctx.beginPath();
  ctx.moveTo(0.1 * s, 0.78 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.28 * s, 0.9 * s, 0.78 * s);
  ctx.closePath();
  fs(ctx, COL.leaf, o);
  ctx.beginPath();
  ctx.moveTo(0.5 * s, 0.4 * s);
  ctx.quadraticCurveTo(0.72 * s, 0.5 * s, 0.9 * s, 0.78 * s);
  ctx.lineTo(0.5 * s, 0.78 * s);
  ctx.closePath();
  fs(ctx, COL.leafD, o, false);
}
function volcano(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.38, 0.07);
  path(ctx, [0.32 * s, 0.24 * s, 0.86 * s, 0.84 * s, 0.14 * s, 0.84 * s, 0.32 * s, 0.24 * s]);
  fs(ctx, COL.rockD, o);
  path(ctx, [0.3 * s, 0.26 * s, 0.46 * s, 0.26 * s, 0.5 * s, 0.34 * s, 0.26 * s, 0.34 * s]);
  fs(ctx, COL.fire, o, false);
  ctx.beginPath();
  ctx.moveTo(0.34 * s, 0.3 * s);
  ctx.quadraticCurveTo(0.4 * s, 0.5 * s, 0.5 * s, 0.6 * s);
  ctx.strokeStyle = COL.fireL;
  ctx.lineWidth = o * 1.6;
  ctx.stroke();
}
function rockPile(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.84, 0.32, 0.06);
  path(ctx, [0.2 * s, 0.8 * s, 0.34 * s, 0.5 * s, 0.5 * s, 0.66 * s, 0.42 * s, 0.8 * s]);
  fs(ctx, COL.rock, o);
  path(ctx, [0.46 * s, 0.8 * s, 0.66 * s, 0.42 * s, 0.84 * s, 0.62 * s, 0.8 * s, 0.8 * s]);
  fs(ctx, COL.rockL, o);
}
function crystal(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.22, 0.05);
  path(ctx, [0.5 * s, 0.14 * s, 0.66 * s, 0.5 * s, 0.5 * s, 0.86 * s, 0.34 * s, 0.5 * s]);
  fs(ctx, '#6f7bd6', o);
  path(ctx, [0.5 * s, 0.14 * s, 0.66 * s, 0.5 * s, 0.5 * s, 0.86 * s]);
  fs(ctx, '#525fc0', o, false);
}

// ———————————————————————————————— STAVBY ————————————————————————————————
function tower(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.24, 0.05);
  path(ctx, [0.36 * s, 0.34 * s, 0.64 * s, 0.34 * s, 0.62 * s, 0.88 * s, 0.38 * s, 0.88 * s]);
  fs(ctx, COL.wall, o);
  path(ctx, [0.5 * s, 0.34 * s, 0.64 * s, 0.34 * s, 0.62 * s, 0.88 * s, 0.5 * s, 0.88 * s]);
  fs(ctx, COL.wallD, o, false);
  // cimbuří
  for (let i = 0; i < 3; i++) {
    const x = (0.36 + i * 0.1) * s;
    ctx.fillStyle = COL.wall;
    ctx.fillRect(x, 0.28 * s, 0.06 * s, 0.07 * s);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = o;
    ctx.strokeRect(x, 0.28 * s, 0.06 * s, 0.07 * s);
  }
  rrect(ctx, 0.44 * s, 0.66 * s, 0.12 * s, 0.22 * s, 0.06 * s);
  fs(ctx, COL.woodD, o);
}
function house(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.34, 0.06);
  ctx.fillStyle = COL.wall;
  path(ctx, [0.24 * s, 0.5 * s, 0.76 * s, 0.5 * s, 0.76 * s, 0.88 * s, 0.24 * s, 0.88 * s]);
  fs(ctx, COL.wall, o);
  path(ctx, [0.18 * s, 0.52 * s, 0.5 * s, 0.24 * s, 0.82 * s, 0.52 * s]);
  fs(ctx, COL.roof, o);
  path(ctx, [0.5 * s, 0.24 * s, 0.82 * s, 0.52 * s, 0.5 * s, 0.52 * s]);
  fs(ctx, COL.roofD, o, false);
  rrect(ctx, 0.44 * s, 0.64 * s, 0.12 * s, 0.24 * s, 0.02 * s);
  fs(ctx, COL.woodD, o);
  ctx.fillStyle = COL.fireL;
  ctx.fillRect(0.3 * s, 0.58 * s, 0.08 * s, 0.08 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.3 * s, 0.58 * s, 0.08 * s, 0.08 * s);
}
function cottage(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.34, 0.06);
  path(ctx, [0.26 * s, 0.54 * s, 0.74 * s, 0.54 * s, 0.74 * s, 0.88 * s, 0.26 * s, 0.88 * s]);
  fs(ctx, COL.woodL, o);
  ctx.beginPath();
  ctx.moveTo(0.18 * s, 0.56 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.18 * s, 0.82 * s, 0.56 * s);
  ctx.closePath();
  fs(ctx, '#8a6a3a', o);
  rrect(ctx, 0.45 * s, 0.66 * s, 0.1 * s, 0.22 * s, 0.04 * s);
  fs(ctx, COL.woodD, o);
}
function castle(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.92, 0.44, 0.06);
  // hradba
  path(ctx, [0.16 * s, 0.5 * s, 0.84 * s, 0.5 * s, 0.84 * s, 0.88 * s, 0.16 * s, 0.88 * s]);
  fs(ctx, COL.wallD, o);
  // věže
  for (const x of [0.14, 0.72]) {
    path(ctx, [x * s, 0.34 * s, (x + 0.14) * s, 0.34 * s, (x + 0.14) * s, 0.88 * s, x * s, 0.88 * s]);
    fs(ctx, COL.wall, o);
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = COL.wall;
      ctx.fillRect((x + i * 0.08) * s, 0.29 * s, 0.05 * s, 0.06 * s);
      ctx.strokeStyle = OUT;
      ctx.lineWidth = o;
      ctx.strokeRect((x + i * 0.08) * s, 0.29 * s, 0.05 * s, 0.06 * s);
    }
  }
  // brána
  ctx.beginPath();
  ctx.moveTo(0.43 * s, 0.88 * s);
  ctx.lineTo(0.43 * s, 0.64 * s);
  ctx.arc(0.5 * s, 0.64 * s, 0.07 * s, Math.PI, 0);
  ctx.lineTo(0.57 * s, 0.88 * s);
  ctx.closePath();
  fs(ctx, COL.dark, o);
  // vlajka
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.beginPath();
  ctx.moveTo(0.21 * s, 0.34 * s);
  ctx.lineTo(0.21 * s, 0.18 * s);
  ctx.stroke();
  path(ctx, [0.21 * s, 0.18 * s, 0.34 * s, 0.22 * s, 0.21 * s, 0.26 * s]);
  fs(ctx, COL.cloth, o * 0.8);
}
function ruins(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.88, 0.36, 0.06);
  for (const [x, h] of [[0.26, 0.4], [0.5, 0.56], [0.72, 0.32]] as const) {
    path(ctx, [x * s, (0.88 - h) * s, (x + 0.12) * s, (0.88 - h) * s, (x + 0.12) * s, 0.88 * s, x * s, 0.88 * s]);
    fs(ctx, COL.stone.slice(0, 7), o);
  }
  ctx.fillStyle = COL.wallD;
  ctx.fillRect(0.22 * s, 0.84 * s, 0.64 * s, 0.06 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.22 * s, 0.84 * s, 0.64 * s, 0.06 * s);
}
function tent(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.88, 0.32, 0.06);
  path(ctx, [0.5 * s, 0.22 * s, 0.84 * s, 0.86 * s, 0.16 * s, 0.86 * s]);
  fs(ctx, COL.cloth, o);
  path(ctx, [0.5 * s, 0.22 * s, 0.84 * s, 0.86 * s, 0.5 * s, 0.86 * s]);
  fs(ctx, COL.clothD, o, false);
  path(ctx, [0.5 * s, 0.4 * s, 0.6 * s, 0.86 * s, 0.4 * s, 0.86 * s]);
  fs(ctx, COL.dark, o);
}
function well(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.26, 0.05);
  rrect(ctx, 0.32 * s, 0.56 * s, 0.36 * s, 0.32 * s, 0.04 * s);
  fs(ctx, COL.rock, o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.56 * s, 0.18 * s, 0.07 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.dark, o);
  // stříška
  path(ctx, [0.28 * s, 0.34 * s, 0.5 * s, 0.2 * s, 0.72 * s, 0.34 * s]);
  fs(ctx, COL.roof, o);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.beginPath();
  ctx.moveTo(0.33 * s, 0.34 * s);
  ctx.lineTo(0.33 * s, 0.56 * s);
  ctx.moveTo(0.67 * s, 0.34 * s);
  ctx.lineTo(0.67 * s, 0.56 * s);
  ctx.stroke();
}
function windmill(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.24, 0.05);
  path(ctx, [0.4 * s, 0.4 * s, 0.6 * s, 0.4 * s, 0.66 * s, 0.88 * s, 0.34 * s, 0.88 * s]);
  fs(ctx, COL.wall, o);
  const cx = 0.5 * s;
  const cy = 0.4 * s;
  for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    path(ctx, [cx, cy, cx + Math.cos(a + 0.2) * 0.26 * s, cy + Math.sin(a + 0.2) * 0.26 * s, cx + Math.cos(a) * 0.3 * s, cy + Math.sin(a) * 0.3 * s]);
    fs(ctx, COL.woodL, o * 0.8);
  }
  circle(ctx, cx, cy, 0.04 * s);
  fs(ctx, COL.woodD, o);
}
function signpost(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.16, 0.04);
  ctx.fillStyle = COL.wood;
  ctx.fillRect(0.46 * s, 0.34 * s, 0.08 * s, 0.56 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.46 * s, 0.34 * s, 0.08 * s, 0.56 * s);
  path(ctx, [0.5 * s, 0.36 * s, 0.84 * s, 0.36 * s, 0.92 * s, 0.46 * s, 0.84 * s, 0.56 * s, 0.5 * s, 0.56 * s]);
  fs(ctx, COL.woodL, o);
}
function statue(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.22, 0.05);
  ctx.fillStyle = COL.rockL;
  ctx.fillRect(0.36 * s, 0.78 * s, 0.28 * s, 0.12 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.36 * s, 0.78 * s, 0.28 * s, 0.12 * s);
  circle(ctx, 0.5 * s, 0.32 * s, 0.08 * s);
  fs(ctx, COL.rock, o);
  path(ctx, [0.42 * s, 0.4 * s, 0.58 * s, 0.4 * s, 0.6 * s, 0.78 * s, 0.4 * s, 0.78 * s]);
  fs(ctx, COL.rock, o);
}

// ———————————————————————————————— DUNGEON ————————————————————————————————
function chest(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.3, 0.06);
  rrect(ctx, 0.24 * s, 0.46 * s, 0.52 * s, 0.4 * s, 0.04 * s);
  fs(ctx, COL.wood, o);
  ctx.beginPath();
  ctx.moveTo(0.24 * s, 0.5 * s);
  ctx.arc(0.5 * s, 0.5 * s, 0.26 * s, Math.PI, 0);
  ctx.closePath();
  fs(ctx, COL.woodL, o);
  ctx.fillStyle = COL.metal;
  ctx.fillRect(0.46 * s, 0.42 * s, 0.08 * s, 0.2 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.46 * s, 0.42 * s, 0.08 * s, 0.2 * s);
  circle(ctx, 0.5 * s, 0.58 * s, 0.03 * s);
  fs(ctx, COL.gold, o);
}
function doorArch(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.beginPath();
  ctx.moveTo(0.3 * s, 0.88 * s);
  ctx.lineTo(0.3 * s, 0.4 * s);
  ctx.arc(0.5 * s, 0.4 * s, 0.2 * s, Math.PI, 0);
  ctx.lineTo(0.7 * s, 0.88 * s);
  ctx.closePath();
  fs(ctx, COL.stone.slice(0, 7), o);
  ctx.beginPath();
  ctx.moveTo(0.38 * s, 0.88 * s);
  ctx.lineTo(0.38 * s, 0.44 * s);
  ctx.arc(0.5 * s, 0.44 * s, 0.12 * s, Math.PI, 0);
  ctx.lineTo(0.62 * s, 0.88 * s);
  ctx.closePath();
  fs(ctx, COL.woodD, o);
  circle(ctx, 0.58 * s, 0.66 * s, 0.025 * s);
  fs(ctx, COL.gold, o * 0.7);
}
function barrel(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.88, 0.22, 0.05);
  ctx.beginPath();
  ctx.moveTo(0.34 * s, 0.4 * s);
  ctx.quadraticCurveTo(0.28 * s, 0.64 * s, 0.34 * s, 0.86 * s);
  ctx.lineTo(0.66 * s, 0.86 * s);
  ctx.quadraticCurveTo(0.72 * s, 0.64 * s, 0.66 * s, 0.4 * s);
  ctx.closePath();
  fs(ctx, COL.wood, o);
  ctx.strokeStyle = COL.metalD;
  ctx.lineWidth = o * 1.4;
  for (const y of [0.5, 0.64, 0.78]) {
    ctx.beginPath();
    ctx.moveTo(0.31 * s, y * s);
    ctx.lineTo(0.69 * s, y * s);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.4 * s, 0.16 * s, 0.05 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.woodL, o);
}
function crate(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.88, 0.24, 0.05);
  rrect(ctx, 0.28 * s, 0.4 * s, 0.44 * s, 0.46 * s, 0.03 * s);
  fs(ctx, COL.woodL, o);
  ctx.strokeStyle = COL.woodD;
  ctx.lineWidth = o * 1.2;
  ctx.beginPath();
  ctx.moveTo(0.28 * s, 0.4 * s);
  ctx.lineTo(0.72 * s, 0.86 * s);
  ctx.moveTo(0.72 * s, 0.4 * s);
  ctx.lineTo(0.28 * s, 0.86 * s);
  ctx.stroke();
}
function pillar(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.2, 0.05);
  ctx.fillStyle = COL.wallD;
  ctx.fillRect(0.34 * s, 0.82 * s, 0.32 * s, 0.08 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.34 * s, 0.82 * s, 0.32 * s, 0.08 * s);
  ctx.fillStyle = COL.wall;
  ctx.fillRect(0.4 * s, 0.24 * s, 0.2 * s, 0.58 * s);
  ctx.strokeRect(0.4 * s, 0.24 * s, 0.2 * s, 0.58 * s);
  ctx.fillStyle = COL.wallD;
  ctx.fillRect(0.36 * s, 0.18 * s, 0.28 * s, 0.08 * s);
  ctx.strokeRect(0.36 * s, 0.18 * s, 0.28 * s, 0.08 * s);
}
function brazier(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.18, 0.05);
  path(ctx, [0.4 * s, 0.6 * s, 0.6 * s, 0.6 * s, 0.56 * s, 0.88 * s, 0.44 * s, 0.88 * s]);
  fs(ctx, COL.metalD, o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.6 * s, 0.16 * s, 0.06 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.metal, o);
  ctx.beginPath();
  ctx.moveTo(0.4 * s, 0.58 * s);
  ctx.quadraticCurveTo(0.46 * s, 0.3 * s, 0.5 * s, 0.42 * s);
  ctx.quadraticCurveTo(0.54 * s, 0.3 * s, 0.6 * s, 0.58 * s);
  ctx.closePath();
  fs(ctx, COL.fire, o * 0.6, false);
  ctx.beginPath();
  ctx.moveTo(0.45 * s, 0.56 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.36 * s, 0.55 * s, 0.56 * s);
  ctx.closePath();
  ctx.fillStyle = COL.fireC;
  ctx.fill();
}
function skullPile(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.28, 0.05);
  ctx.strokeStyle = COL.boneD;
  ctx.lineWidth = o * 1.6;
  ctx.beginPath();
  ctx.moveTo(0.24 * s, 0.78 * s);
  ctx.lineTo(0.6 * s, 0.82 * s);
  ctx.moveTo(0.3 * s, 0.84 * s);
  ctx.lineTo(0.7 * s, 0.78 * s);
  ctx.stroke();
  circle(ctx, 0.44 * s, 0.6 * s, 0.16 * s);
  fs(ctx, COL.bone, o);
  circle(ctx, 0.4 * s, 0.58 * s, 0.035 * s);
  circle(ctx, 0.5 * s, 0.58 * s, 0.035 * s);
  ctx.fillStyle = COL.dark;
  ctx.fill();
  circle(ctx, 0.4 * s, 0.58 * s, 0.035 * s);
  ctx.fill();
}
function altar(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.3, 0.05);
  ctx.fillStyle = COL.rock;
  ctx.fillRect(0.3 * s, 0.5 * s, 0.4 * s, 0.4 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.3 * s, 0.5 * s, 0.4 * s, 0.4 * s);
  ctx.fillStyle = COL.rockL;
  ctx.fillRect(0.26 * s, 0.44 * s, 0.48 * s, 0.1 * s);
  ctx.strokeRect(0.26 * s, 0.44 * s, 0.48 * s, 0.1 * s);
  circle(ctx, 0.5 * s, 0.34 * s, 0.06 * s);
  fs(ctx, '#7d8ae0', o * 0.7);
}
function trapdoor(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.fillStyle = COL.woodD;
  ctx.fillRect(0.26 * s, 0.3 * s, 0.48 * s, 0.48 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.26 * s, 0.3 * s, 0.48 * s, 0.48 * s);
  ctx.strokeStyle = COL.wood;
  ctx.lineWidth = o * 1.2;
  for (const x of [0.38, 0.5, 0.62]) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.3 * s);
    ctx.lineTo(x * s, 0.78 * s);
    ctx.stroke();
  }
  circle(ctx, 0.66 * s, 0.54 * s, 0.05 * s);
  ctx.strokeStyle = COL.metal;
  ctx.lineWidth = o * 1.4;
  ctx.stroke();
}
function stairs(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  for (let i = 0; i < 5; i++) {
    const w = 0.6 - i * 0.08;
    const y = 0.3 + i * 0.1;
    ctx.fillStyle = i % 2 ? COL.wallD : COL.wall;
    ctx.fillRect((0.5 - w / 2) * s, y * s, w * s, 0.1 * s);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = o;
    ctx.strokeRect((0.5 - w / 2) * s, y * s, w * s, 0.1 * s);
  }
}

// ———————————————————————————————— ZNAČKY ————————————————————————————————
function flag(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.strokeStyle = COL.woodD;
  ctx.lineWidth = o * 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0.36 * s, 0.9 * s);
  ctx.lineTo(0.36 * s, 0.16 * s);
  ctx.stroke();
  path(ctx, [0.36 * s, 0.18 * s, 0.74 * s, 0.28 * s, 0.36 * s, 0.42 * s]);
  fs(ctx, COL.cloth, o);
}
function banner(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.fillStyle = COL.woodL;
  ctx.fillRect(0.28 * s, 0.2 * s, 0.44 * s, 0.05 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.28 * s, 0.2 * s, 0.44 * s, 0.05 * s);
  path(ctx, [0.34 * s, 0.25 * s, 0.66 * s, 0.25 * s, 0.66 * s, 0.78 * s, 0.5 * s, 0.68 * s, 0.34 * s, 0.78 * s]);
  fs(ctx, COL.cloth, o);
  circle(ctx, 0.5 * s, 0.46 * s, 0.07 * s);
  fs(ctx, COL.gold, o * 0.8);
}
function xMark(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.strokeStyle = '#c43b2f';
  ctx.lineWidth = o * 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0.3 * s, 0.3 * s);
  ctx.lineTo(0.7 * s, 0.7 * s);
  ctx.moveTo(0.7 * s, 0.3 * s);
  ctx.lineTo(0.3 * s, 0.7 * s);
  ctx.stroke();
}

// — rozšíření: příroda/terén —
function forestPatch(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.44, 0.07);
  const mini = (cx: number, by: number, hw: number, col: string) => {
    path(ctx, [cx * s, (by - hw * 1.7) * s, (cx + hw) * s, by * s, (cx - hw) * s, by * s]);
    fs(ctx, col, o);
  };
  mini(0.3, 0.74, 0.16, COL.pineD);
  mini(0.7, 0.72, 0.17, COL.pineD);
  mini(0.5, 0.62, 0.2, COL.pine);
  mini(0.5, 0.84, 0.14, COL.pineL);
}
function willow(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s);
  path(ctx, [cx - 0.04 * s, 0.62 * s, cx + 0.04 * s, 0.62 * s, cx + 0.04 * s, 0.9 * s, cx - 0.04 * s, 0.9 * s]);
  fs(ctx, COL.trunk, o);
  circle(ctx, cx, 0.42 * s, 0.26 * s);
  fs(ctx, COL.leaf, o);
  ctx.strokeStyle = COL.leafD;
  ctx.lineWidth = o * 1.2;
  ctx.lineCap = 'round';
  for (const dx of [-0.18, -0.08, 0.04, 0.14, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * s, 0.46 * s);
    ctx.quadraticCurveTo(cx + dx * s * 1.1, 0.62 * s, cx + dx * s, 0.72 * s);
    ctx.stroke();
  }
}
function reeds(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.strokeStyle = COL.leafD;
  ctx.lineWidth = o * 1.6;
  ctx.lineCap = 'round';
  for (const [x, h] of [[0.4, 0.5], [0.5, 0.62], [0.6, 0.46], [0.55, 0.56], [0.45, 0.58]] as const) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.9 * s);
    ctx.quadraticCurveTo((x + 0.04) * s, (0.9 - h * 0.6) * s, (x + 0.02) * s, (0.9 - h) * s);
    ctx.stroke();
  }
}
function flowers(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.88, 0.28, 0.05);
  for (const [x, y, i] of [[0.35, 0.62, 0], [0.5, 0.56, 1], [0.66, 0.62, 0], [0.43, 0.7, 1], [0.58, 0.7, 0]] as const) {
    ctx.strokeStyle = COL.leaf;
    ctx.lineWidth = o * 1.2;
    ctx.beginPath();
    ctx.moveTo(x * s, 0.88 * s);
    ctx.lineTo(x * s, y * s);
    ctx.stroke();
    circle(ctx, x * s, y * s, 0.05 * s);
    fs(ctx, i ? COL.cloth : COL.gold, o * 0.7);
  }
}
function dunes(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.44, 0.06);
  for (const [cx, cy, w] of [[0.32, 0.7, 0.3], [0.68, 0.66, 0.3], [0.5, 0.78, 0.34]] as const) {
    ctx.beginPath();
    ctx.moveTo((cx - w) * s, 0.86 * s);
    ctx.quadraticCurveTo(cx * s, (cy - 0.16) * s, (cx + w) * s, 0.86 * s);
    ctx.closePath();
    fs(ctx, '#d9c38a', o);
  }
}
function iceberg(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  path(ctx, [0.5 * s, 0.18 * s, 0.74 * s, 0.6 * s, 0.6 * s, 0.62 * s, 0.5 * s, 0.5 * s, 0.4 * s, 0.62 * s, 0.26 * s, 0.6 * s]);
  fs(ctx, COL.snow, o);
  path(ctx, [0.26 * s, 0.6 * s, 0.74 * s, 0.6 * s, 0.86 * s, 0.82 * s, 0.14 * s, 0.82 * s]);
  fs(ctx, '#bcd6e8', o);
}
function cliff(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.4, 0.06);
  path(ctx, [0.16 * s, 0.3 * s, 0.84 * s, 0.34 * s, 0.8 * s, 0.86 * s, 0.2 * s, 0.84 * s]);
  fs(ctx, COL.rock, o);
  path(ctx, [0.16 * s, 0.3 * s, 0.5 * s, 0.36 * s, 0.46 * s, 0.86 * s, 0.2 * s, 0.84 * s]);
  fs(ctx, COL.rockD, o, false);
  ctx.strokeStyle = COL.rockD;
  ctx.lineWidth = o;
  ctx.beginPath();
  ctx.moveTo(0.4 * s, 0.34 * s);
  ctx.lineTo(0.44 * s, 0.84 * s);
  ctx.moveTo(0.62 * s, 0.34 * s);
  ctx.lineTo(0.6 * s, 0.85 * s);
  ctx.stroke();
}
function waterfall(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  path(ctx, [0.2 * s, 0.16 * s, 0.8 * s, 0.16 * s, 0.8 * s, 0.86 * s, 0.2 * s, 0.86 * s]);
  fs(ctx, COL.rockD, o);
  ctx.fillStyle = COL.water;
  ctx.fillRect(0.4 * s, 0.18 * s, 0.2 * s, 0.66 * s);
  ctx.strokeStyle = '#bcd6e8';
  ctx.lineWidth = o;
  for (const x of [0.44, 0.5, 0.56]) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.2 * s);
    ctx.lineTo(x * s, 0.82 * s);
    ctx.stroke();
  }
}

// — rozšíření: stavby —
function village(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.92, 0.46, 0.06);
  const hut = (cx: number, cy: number, sc: number) => {
    ctx.save();
    ctx.translate(cx * s, cy * s);
    ctx.scale(sc, sc);
    ctx.fillStyle = COL.wall;
    ctx.fillRect(-0.12 * s, 0, 0.24 * s, 0.18 * s);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = o;
    ctx.strokeRect(-0.12 * s, 0, 0.24 * s, 0.18 * s);
    path(ctx, [-0.16 * s, 0.02 * s, 0, -0.12 * s, 0.16 * s, 0.02 * s]);
    fs(ctx, COL.roof, o);
    ctx.restore();
  };
  hut(0.32, 0.62, 0.9);
  hut(0.68, 0.6, 0.95);
  hut(0.5, 0.74, 1.05);
}
function lighthouse(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  const cx = 0.5 * s;
  shadow(ctx, s, 0.5, 0.9, 0.2, 0.05);
  path(ctx, [0.42 * s, 0.34 * s, 0.58 * s, 0.34 * s, 0.62 * s, 0.86 * s, 0.38 * s, 0.86 * s]);
  fs(ctx, COL.wall, o);
  ctx.fillStyle = COL.cloth;
  ctx.fillRect(0.4 * s, 0.5 * s, 0.2 * s, 0.1 * s);
  ctx.fillRect(0.39 * s, 0.68 * s, 0.22 * s, 0.1 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o * 0.8;
  ctx.strokeRect(0.4 * s, 0.5 * s, 0.2 * s, 0.1 * s);
  ctx.strokeRect(0.39 * s, 0.68 * s, 0.22 * s, 0.1 * s);
  rrect(ctx, 0.4 * s, 0.22 * s, 0.2 * s, 0.14 * s, 0.02 * s);
  fs(ctx, COL.metalD, o);
  circle(ctx, cx, 0.29 * s, 0.05 * s);
  fs(ctx, COL.fireC, o * 0.7);
}
function boat(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.beginPath();
  ctx.moveTo(0.2 * s, 0.6 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.86 * s, 0.8 * s, 0.6 * s);
  ctx.closePath();
  fs(ctx, COL.wood, o);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o * 1.4;
  ctx.beginPath();
  ctx.moveTo(0.5 * s, 0.6 * s);
  ctx.lineTo(0.5 * s, 0.2 * s);
  ctx.stroke();
  path(ctx, [0.5 * s, 0.22 * s, 0.74 * s, 0.5 * s, 0.5 * s, 0.5 * s]);
  fs(ctx, COL.cloth, o);
}
function standingStones(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.4, 0.06);
  for (const x of [0.26, 0.74]) {
    ctx.fillStyle = COL.rock;
    ctx.fillRect((x - 0.07) * s, 0.44 * s, 0.14 * s, 0.42 * s);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = o;
    ctx.strokeRect((x - 0.07) * s, 0.44 * s, 0.14 * s, 0.42 * s);
  }
  ctx.fillStyle = COL.rockL;
  ctx.fillRect(0.18 * s, 0.4 * s, 0.64 * s, 0.1 * s);
  ctx.strokeRect(0.18 * s, 0.4 * s, 0.64 * s, 0.1 * s);
}
function graveyard(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.4, 0.06);
  const stone = (x: number, y: number, sc: number) => {
    ctx.save();
    ctx.translate(x * s, y * s);
    ctx.scale(sc, sc);
    ctx.beginPath();
    ctx.moveTo(-0.08 * s, 0.1 * s);
    ctx.lineTo(-0.08 * s, -0.06 * s);
    ctx.arc(0, -0.06 * s, 0.08 * s, Math.PI, 0);
    ctx.lineTo(0.08 * s, 0.1 * s);
    ctx.closePath();
    fs(ctx, COL.stone.slice(0, 7), o);
    ctx.restore();
  };
  stone(0.32, 0.66, 1);
  stone(0.6, 0.62, 0.9);
  ctx.strokeStyle = COL.stone.slice(0, 7);
  ctx.lineWidth = o * 2.4;
  ctx.beginPath();
  ctx.moveTo(0.76 * s, 0.78 * s);
  ctx.lineTo(0.76 * s, 0.5 * s);
  ctx.moveTo(0.68 * s, 0.58 * s);
  ctx.lineTo(0.84 * s, 0.58 * s);
  ctx.stroke();
}
function fountain(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.32, 0.05);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.74 * s, 0.3 * s, 0.12 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.rock, o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.72 * s, 0.24 * s, 0.09 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.water, o);
  ctx.fillStyle = COL.rockL;
  ctx.fillRect(0.46 * s, 0.4 * s, 0.08 * s, 0.3 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.46 * s, 0.4 * s, 0.08 * s, 0.3 * s);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.42 * s, 0.12 * s, 0.05 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.rockL, o);
  ctx.strokeStyle = '#bcd6e8';
  ctx.lineWidth = o;
  ctx.beginPath();
  ctx.moveTo(0.5 * s, 0.4 * s);
  ctx.quadraticCurveTo(0.4 * s, 0.32 * s, 0.38 * s, 0.46 * s);
  ctx.moveTo(0.5 * s, 0.4 * s);
  ctx.quadraticCurveTo(0.6 * s, 0.32 * s, 0.62 * s, 0.46 * s);
  ctx.stroke();
}

// — rozšíření: dungeon —
function throne(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.26, 0.05);
  ctx.fillStyle = COL.stone.slice(0, 7);
  ctx.fillRect(0.34 * s, 0.3 * s, 0.32 * s, 0.56 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.34 * s, 0.3 * s, 0.32 * s, 0.56 * s);
  ctx.fillStyle = COL.cloth;
  ctx.fillRect(0.38 * s, 0.46 * s, 0.24 * s, 0.3 * s);
  ctx.strokeRect(0.38 * s, 0.46 * s, 0.24 * s, 0.3 * s);
  for (const x of [0.34, 0.62]) {
    circle(ctx, x * s, 0.3 * s, 0.04 * s);
    fs(ctx, COL.gold, o * 0.8);
  }
}
function bookshelf(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.fillStyle = COL.woodD;
  ctx.fillRect(0.26 * s, 0.2 * s, 0.48 * s, 0.66 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.26 * s, 0.2 * s, 0.48 * s, 0.66 * s);
  const cols = ['#7c3b33', '#356b4d', '#2c6390', '#a8842a'];
  for (let r = 0; r < 3; r++) {
    let x = 0.3;
    let k = r * 3;
    while (x < 0.69) {
      const bw = 0.03 + (k % 3) * 0.012;
      ctx.fillStyle = cols[k % cols.length];
      ctx.fillRect(x * s, (0.26 + r * 0.2) * s, bw * s, 0.16 * s);
      x += bw + 0.012;
      k++;
    }
    ctx.strokeStyle = COL.dark;
    ctx.lineWidth = o * 0.6;
    ctx.strokeRect(0.3 * s, (0.26 + r * 0.2) * s, 0.4 * s, 0.16 * s);
  }
}
function cauldron(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.24, 0.05);
  ctx.beginPath();
  ctx.arc(0.5 * s, 0.6 * s, 0.24 * s, 0, Math.PI);
  ctx.closePath();
  fs(ctx, COL.dark, o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.6 * s, 0.26 * s, 0.07 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.metalD, o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.6 * s, 0.2 * s, 0.05 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.pineL, o, false);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o * 1.6;
  ctx.beginPath();
  ctx.moveTo(0.36 * s, 0.78 * s);
  ctx.lineTo(0.34 * s, 0.86 * s);
  ctx.moveTo(0.64 * s, 0.78 * s);
  ctx.lineTo(0.66 * s, 0.86 * s);
  ctx.stroke();
}
function spikes(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  for (let i = 0; i < 5; i++) {
    const x = 0.2 + i * 0.15;
    path(ctx, [x * s, 0.8 * s, (x + 0.06) * s, 0.8 * s, (x + 0.03) * s, 0.4 * s]);
    fs(ctx, COL.metal, o);
  }
  ctx.fillStyle = COL.rockD;
  ctx.fillRect(0.16 * s, 0.78 * s, 0.68 * s, 0.08 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.16 * s, 0.78 * s, 0.68 * s, 0.08 * s);
}
function web(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.strokeStyle = 'rgba(232,232,238,0.85)';
  ctx.lineWidth = o * 0.8;
  ctx.beginPath();
  for (const a of [0, 0.4, 0.8, 1.2, Math.PI / 2]) {
    ctx.moveTo(0.1 * s, 0.1 * s);
    ctx.lineTo((0.1 + Math.cos(a) * 0.78) * s, (0.1 + Math.sin(a) * 0.78) * s);
  }
  ctx.stroke();
  ctx.beginPath();
  for (const r of [0.24, 0.44, 0.64]) {
    ctx.moveTo((0.1 + r) * s, 0.1 * s);
    ctx.arc(0.1 * s, 0.1 * s, r * s, 0, Math.PI / 2);
  }
  ctx.stroke();
}
function sarcophagus(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.26, 0.05);
  rrect(ctx, 0.34 * s, 0.2 * s, 0.32 * s, 0.66 * s, 0.06 * s);
  fs(ctx, COL.stone.slice(0, 7), o);
  circle(ctx, 0.5 * s, 0.36 * s, 0.07 * s);
  fs(ctx, COL.gold, o * 0.8);
  ctx.fillStyle = COL.goldD;
  ctx.fillRect(0.46 * s, 0.46 * s, 0.08 * s, 0.32 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o * 0.7;
  ctx.strokeRect(0.46 * s, 0.46 * s, 0.08 * s, 0.32 * s);
}
function portal(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.5 * s, 0.26 * s, 0.34 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.rockD, o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.5 * s, 0.18 * s, 0.26 * s, 0, 0, Math.PI * 2);
  fs(ctx, '#6f7bd6', o, false);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.5 * s, 0.1 * s, 0.16 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b3b9ee';
  ctx.fill();
}

// — rozšíření: dungeon nábytek (top-down) —
function table(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  rrect(ctx, 0.24 * s, 0.32 * s, 0.52 * s, 0.36 * s, 0.04 * s);
  fs(ctx, COL.wood, o);
  ctx.strokeStyle = COL.woodD;
  ctx.lineWidth = o * 0.8;
  for (const y of [0.42, 0.5, 0.58]) {
    ctx.beginPath();
    ctx.moveTo(0.26 * s, y * s);
    ctx.lineTo(0.74 * s, y * s);
    ctx.stroke();
  }
}
function roundTable(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  circle(ctx, 0.5 * s, 0.5 * s, 0.24 * s);
  fs(ctx, COL.wood, o);
  circle(ctx, 0.5 * s, 0.5 * s, 0.1 * s);
  ctx.strokeStyle = COL.woodD;
  ctx.lineWidth = o * 0.8;
  ctx.stroke();
}
function bed(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  rrect(ctx, 0.3 * s, 0.22 * s, 0.4 * s, 0.56 * s, 0.05 * s);
  fs(ctx, COL.woodD, o);
  rrect(ctx, 0.32 * s, 0.36 * s, 0.36 * s, 0.4 * s, 0.03 * s);
  fs(ctx, '#6a7a9a', o);
  rrect(ctx, 0.33 * s, 0.24 * s, 0.34 * s, 0.12 * s, 0.04 * s);
  fs(ctx, COL.bone, o);
}
function chair(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  rrect(ctx, 0.38 * s, 0.4 * s, 0.24 * s, 0.24 * s, 0.03 * s);
  fs(ctx, COL.wood, o);
  rrect(ctx, 0.38 * s, 0.34 * s, 0.24 * s, 0.07 * s, 0.02 * s);
  fs(ctx, COL.woodD, o);
}
function rug(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  rrect(ctx, 0.2 * s, 0.3 * s, 0.6 * s, 0.4 * s, 0.02 * s);
  fs(ctx, COL.cloth, o);
  rrect(ctx, 0.27 * s, 0.37 * s, 0.46 * s, 0.26 * s, 0.02 * s);
  ctx.strokeStyle = COL.gold;
  ctx.lineWidth = o * 1.2;
  ctx.stroke();
  ctx.strokeStyle = COL.clothD;
  ctx.lineWidth = o * 0.8;
  for (let i = 0; i <= 9; i++) {
    const x = (0.2 + i * 0.0666) * s;
    ctx.beginPath();
    ctx.moveTo(x, 0.28 * s);
    ctx.lineTo(x, 0.3 * s);
    ctx.moveTo(x, 0.7 * s);
    ctx.lineTo(x, 0.72 * s);
    ctx.stroke();
  }
}
function weaponRack(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.fillStyle = COL.woodD;
  ctx.fillRect(0.28 * s, 0.7 * s, 0.44 * s, 0.06 * s);
  ctx.fillRect(0.28 * s, 0.3 * s, 0.44 * s, 0.05 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.28 * s, 0.7 * s, 0.44 * s, 0.06 * s);
  ctx.strokeRect(0.28 * s, 0.3 * s, 0.44 * s, 0.05 * s);
  ctx.strokeStyle = COL.metal;
  ctx.lineWidth = o * 1.6;
  for (const x of [0.36, 0.5, 0.64]) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.72 * s);
    ctx.lineTo(x * s, 0.26 * s);
    ctx.stroke();
  }
}
function anvil(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.22, 0.05);
  path(ctx, [0.3 * s, 0.5 * s, 0.74 * s, 0.5 * s, 0.62 * s, 0.58 * s, 0.5 * s, 0.58 * s, 0.5 * s, 0.7 * s, 0.4 * s, 0.7 * s, 0.4 * s, 0.58 * s, 0.34 * s, 0.58 * s]);
  fs(ctx, COL.metalD, o);
}
function sack(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.88, 0.2, 0.05);
  ctx.beginPath();
  ctx.moveTo(0.36 * s, 0.42 * s);
  ctx.quadraticCurveTo(0.3 * s, 0.86 * s, 0.5 * s, 0.86 * s);
  ctx.quadraticCurveTo(0.7 * s, 0.86 * s, 0.64 * s, 0.42 * s);
  ctx.closePath();
  fs(ctx, '#b09a6a', o);
  ctx.strokeStyle = COL.woodD;
  ctx.lineWidth = o;
  ctx.beginPath();
  ctx.moveTo(0.4 * s, 0.42 * s);
  ctx.lineTo(0.6 * s, 0.42 * s);
  ctx.stroke();
}
function pot(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.18, 0.05);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.6 * s, 0.18 * s, 0.22 * s, 0, 0, Math.PI * 2);
  fs(ctx, '#9a6a44', o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.42 * s, 0.12 * s, 0.04 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.dark, o);
}
function fireplace(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.fillStyle = COL.rock;
  ctx.fillRect(0.24 * s, 0.3 * s, 0.52 * s, 0.5 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.24 * s, 0.3 * s, 0.52 * s, 0.5 * s);
  ctx.fillStyle = COL.dark;
  ctx.fillRect(0.34 * s, 0.46 * s, 0.32 * s, 0.34 * s);
  ctx.strokeRect(0.34 * s, 0.46 * s, 0.32 * s, 0.34 * s);
  ctx.beginPath();
  ctx.moveTo(0.42 * s, 0.78 * s);
  ctx.quadraticCurveTo(0.46 * s, 0.56 * s, 0.5 * s, 0.66 * s);
  ctx.quadraticCurveTo(0.54 * s, 0.56 * s, 0.58 * s, 0.78 * s);
  ctx.closePath();
  fs(ctx, COL.fire, o * 0.6, false);
  ctx.beginPath();
  ctx.moveTo(0.46 * s, 0.78 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.62 * s, 0.54 * s, 0.78 * s);
  ctx.closePath();
  ctx.fillStyle = COL.fireC;
  ctx.fill();
}
function gate(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.fillStyle = COL.metalD;
  ctx.fillRect(0.26 * s, 0.22 * s, 0.48 * s, 0.07 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.26 * s, 0.22 * s, 0.48 * s, 0.07 * s);
  ctx.strokeStyle = COL.metal;
  ctx.lineWidth = o * 1.8;
  for (const x of [0.32, 0.42, 0.52, 0.62, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.29 * s);
    ctx.lineTo(x * s, 0.8 * s);
    ctx.stroke();
  }
  ctx.lineWidth = o;
  ctx.strokeStyle = COL.metalD;
  for (const y of [0.45, 0.62]) {
    ctx.beginPath();
    ctx.moveTo(0.3 * s, y * s);
    ctx.lineTo(0.72 * s, y * s);
    ctx.stroke();
  }
}
function lever(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.84, 0.16, 0.04);
  rrect(ctx, 0.4 * s, 0.62 * s, 0.2 * s, 0.16 * s, 0.03 * s);
  fs(ctx, COL.rock, o);
  ctx.strokeStyle = COL.woodD;
  ctx.lineWidth = o * 2;
  ctx.beginPath();
  ctx.moveTo(0.5 * s, 0.66 * s);
  ctx.lineTo(0.62 * s, 0.4 * s);
  ctx.stroke();
  circle(ctx, 0.62 * s, 0.38 * s, 0.05 * s);
  fs(ctx, COL.cloth, o * 0.8);
}
function cage(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.fillStyle = 'rgba(20,22,28,0.5)';
  ctx.fillRect(0.28 * s, 0.26 * s, 0.44 * s, 0.5 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.28 * s, 0.26 * s, 0.44 * s, 0.5 * s);
  ctx.strokeStyle = COL.metal;
  ctx.lineWidth = o * 1.2;
  for (const x of [0.36, 0.44, 0.52, 0.6, 0.68]) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.26 * s);
    ctx.lineTo(x * s, 0.76 * s);
    ctx.stroke();
  }
}
function candles(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.82, 0.16, 0.04);
  for (const [x, h] of [[0.4, 0.18], [0.5, 0.26], [0.6, 0.2]] as const) {
    ctx.fillStyle = COL.bone;
    ctx.fillRect((x - 0.025) * s, (0.78 - h) * s, 0.05 * s, h * s);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = o * 0.7;
    ctx.strokeRect((x - 0.025) * s, (0.78 - h) * s, 0.05 * s, h * s);
    circle(ctx, x * s, (0.78 - h - 0.02) * s, 0.018 * s);
    ctx.fillStyle = COL.fireL;
    ctx.fill();
  }
}
function bottles(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.84, 0.18, 0.04);
  const bottle = (x: number, col: string) => {
    rrect(ctx, (x - 0.03) * s, 0.5 * s, 0.06 * s, 0.26 * s, 0.02 * s);
    fs(ctx, col, o);
    ctx.fillStyle = col;
    ctx.fillRect((x - 0.012) * s, 0.44 * s, 0.024 * s, 0.08 * s);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = o * 0.6;
    ctx.strokeRect((x - 0.012) * s, 0.44 * s, 0.024 * s, 0.08 * s);
  };
  bottle(0.4, '#356b4d');
  bottle(0.5, '#7d8ae0');
  bottle(0.6, '#7c3b33');
}

// — rozšíření 2 —
function stump(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.84, 0.22, 0.05);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.55 * s, 0.2 * s, 0.16 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.wood, o);
  ctx.fillStyle = COL.trunk;
  ctx.fillRect(0.3 * s, 0.55 * s, 0.4 * s, 0.18 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.beginPath();
  ctx.moveTo(0.3 * s, 0.55 * s);
  ctx.lineTo(0.3 * s, 0.73 * s);
  ctx.moveTo(0.7 * s, 0.55 * s);
  ctx.lineTo(0.7 * s, 0.73 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.55 * s, 0.12 * s, 0.09 * s, 0, 0, Math.PI * 2);
  ctx.strokeStyle = COL.trunkD;
  ctx.lineWidth = o * 0.8;
  ctx.stroke();
}
function mushrooms(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.24, 0.05);
  const cap = (x: number, y: number, r: number, col: string) => {
    rrect(ctx, (x - r * 0.35) * s, y * s, r * 0.7 * s, r * 1.2 * s, r * 0.2 * s);
    fs(ctx, COL.bone, o);
    ctx.beginPath();
    ctx.moveTo((x - r) * s, y * s);
    ctx.quadraticCurveTo(x * s, (y - r * 1.1) * s, (x + r) * s, y * s);
    ctx.closePath();
    fs(ctx, col, o);
  };
  cap(0.38, 0.62, 0.14, COL.cloth);
  cap(0.62, 0.6, 0.16, '#c97a2a');
  cap(0.5, 0.7, 0.12, COL.cloth);
}
function lilypads(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  for (const [x, y, r] of [[0.34, 0.46, 0.16], [0.62, 0.4, 0.18], [0.52, 0.66, 0.15]] as const) {
    ctx.beginPath();
    ctx.arc(x * s, y * s, r * s, 0.5, Math.PI * 2 + 0.1);
    ctx.lineTo(x * s, y * s);
    ctx.closePath();
    fs(ctx, COL.leaf, o);
  }
  circle(ctx, 0.62 * s, 0.4 * s, 0.04 * s);
  fs(ctx, COL.cloth, o * 0.7);
}
function vines(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.strokeStyle = COL.leafD;
  ctx.lineWidth = o * 1.4;
  ctx.lineCap = 'round';
  for (const x of [0.34, 0.5, 0.66]) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.14 * s);
    ctx.bezierCurveTo((x + 0.08) * s, 0.4 * s, (x - 0.08) * s, 0.6 * s, x * s, 0.86 * s);
    ctx.stroke();
  }
  for (const [x, y] of [[0.38, 0.34], [0.46, 0.56], [0.6, 0.46], [0.64, 0.7], [0.32, 0.7]] as const) {
    circle(ctx, x * s, y * s, 0.035 * s);
    ctx.fillStyle = COL.leaf;
    ctx.fill();
  }
}
function oasis(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.88, 0.34, 0.05);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.62 * s, 0.32 * s, 0.22 * s, 0, 0, Math.PI * 2);
  fs(ctx, '#d9c38a', o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.64 * s, 0.18 * s, 0.12 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.water, o);
  // palmička
  ctx.strokeStyle = COL.wood;
  ctx.lineWidth = o * 1.6;
  ctx.beginPath();
  ctx.moveTo(0.34 * s, 0.6 * s);
  ctx.quadraticCurveTo(0.3 * s, 0.4 * s, 0.34 * s, 0.3 * s);
  ctx.stroke();
  for (const a of [-0.8, -0.2, 0.4]) {
    ctx.beginPath();
    ctx.moveTo(0.34 * s, 0.3 * s);
    ctx.lineTo((0.34 + Math.cos(a) * 0.14) * s, (0.3 + Math.sin(a) * 0.1 - 0.04) * s);
    ctx.strokeStyle = COL.leaf;
    ctx.stroke();
  }
}
function geyser(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.78 * s, 0.2 * s, 0.08 * s, 0, 0, Math.PI * 2);
  fs(ctx, COL.rockD, o);
  ctx.beginPath();
  ctx.moveTo(0.42 * s, 0.76 * s);
  ctx.quadraticCurveTo(0.46 * s, 0.3 * s, 0.5 * s, 0.5 * s);
  ctx.quadraticCurveTo(0.54 * s, 0.3 * s, 0.58 * s, 0.76 * s);
  ctx.closePath();
  fs(ctx, 'rgba(200,225,240,0.85)', o * 0.6, false);
}
function marsh(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.66 * s, 0.34 * s, 0.18 * s, 0, 0, Math.PI * 2);
  fs(ctx, '#4a5a3a', o);
  ctx.strokeStyle = COL.leafD;
  ctx.lineWidth = o * 1.4;
  ctx.lineCap = 'round';
  for (const [x, h] of [[0.36, 0.3], [0.5, 0.4], [0.64, 0.32], [0.44, 0.36], [0.58, 0.38]] as const) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.66 * s);
    ctx.lineTo((x + 0.02) * s, (0.66 - h) * s);
    ctx.stroke();
  }
}
function dock(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.84, 0.36, 0.05);
  ctx.fillStyle = COL.wood;
  ctx.fillRect(0.3 * s, 0.4 * s, 0.4 * s, 0.16 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.3 * s, 0.4 * s, 0.4 * s, 0.16 * s);
  ctx.strokeStyle = COL.woodD;
  ctx.lineWidth = o * 0.8;
  for (const x of [0.4, 0.5, 0.6]) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0.4 * s);
    ctx.lineTo(x * s, 0.56 * s);
    ctx.stroke();
  }
  for (const x of [0.34, 0.66]) {
    ctx.fillStyle = COL.woodD;
    ctx.fillRect((x - 0.02) * s, 0.56 * s, 0.04 * s, 0.3 * s);
  }
}
function watchtower(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.2, 0.05);
  path(ctx, [0.4 * s, 0.4 * s, 0.6 * s, 0.4 * s, 0.66 * s, 0.86 * s, 0.34 * s, 0.86 * s]);
  fs(ctx, COL.wood, o);
  ctx.fillStyle = COL.woodD;
  ctx.fillRect(0.34 * s, 0.34 * s, 0.32 * s, 0.1 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.34 * s, 0.34 * s, 0.32 * s, 0.1 * s);
  path(ctx, [0.3 * s, 0.36 * s, 0.5 * s, 0.16 * s, 0.7 * s, 0.36 * s]);
  fs(ctx, COL.roof, o);
}
function obelisk(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.16, 0.05);
  path(ctx, [0.46 * s, 0.16 * s, 0.54 * s, 0.16 * s, 0.6 * s, 0.84 * s, 0.4 * s, 0.84 * s]);
  fs(ctx, COL.rockL, o);
  path(ctx, [0.5 * s, 0.16 * s, 0.54 * s, 0.16 * s, 0.6 * s, 0.84 * s, 0.5 * s, 0.84 * s]);
  fs(ctx, COL.rockD, o, false);
  circle(ctx, 0.5 * s, 0.4 * s, 0.03 * s);
  fs(ctx, COL.gold, o * 0.6);
}
function shrine(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.26, 0.05);
  for (const x of [0.34, 0.66]) {
    ctx.fillStyle = COL.rock;
    ctx.fillRect((x - 0.03) * s, 0.4 * s, 0.06 * s, 0.46 * s);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = o;
    ctx.strokeRect((x - 0.03) * s, 0.4 * s, 0.06 * s, 0.46 * s);
  }
  ctx.fillStyle = COL.rockL;
  ctx.fillRect(0.28 * s, 0.34 * s, 0.44 * s, 0.08 * s);
  ctx.strokeRect(0.28 * s, 0.34 * s, 0.44 * s, 0.08 * s);
  circle(ctx, 0.5 * s, 0.64 * s, 0.07 * s);
  fs(ctx, '#7d8ae0', o * 0.7);
}
function market(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.9, 0.3, 0.05);
  ctx.fillStyle = COL.wood;
  ctx.fillRect(0.3 * s, 0.5 * s, 0.4 * s, 0.36 * s);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.strokeRect(0.3 * s, 0.5 * s, 0.4 * s, 0.36 * s);
  // pruhovaná stříška
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? COL.cloth : COL.bone;
    path(ctx, [(0.26 + i * 0.096) * s, 0.5 * s, (0.26 + (i + 1) * 0.096) * s, 0.5 * s, (0.3 + (i + 1) * 0.088) * s, 0.36 * s, (0.3 + i * 0.088) * s, 0.36 * s]);
    fs(ctx, i % 2 ? COL.cloth : COL.bone, o * 0.6, false);
  }
  path(ctx, [0.26 * s, 0.5 * s, 0.74 * s, 0.5 * s, 0.7 * s, 0.36 * s, 0.3 * s, 0.36 * s]);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = o;
  ctx.stroke();
}
function rubble(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  for (const [x, y, r] of [[0.36, 0.6, 0.1], [0.56, 0.66, 0.12], [0.5, 0.5, 0.08], [0.66, 0.54, 0.07], [0.3, 0.7, 0.06]] as const) {
    path(ctx, [(x - r) * s, (y + r * 0.6) * s, x * s, (y - r) * s, (x + r) * s, y * s, (x + r * 0.4) * s, (y + r) * s]);
    fs(ctx, (x * 10 | 0) % 2 ? COL.rock : COL.rockL, o);
  }
}
function magicCircle(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.strokeStyle = '#7d8ae0';
  ctx.lineWidth = o * 1.2;
  circle(ctx, 0.5 * s, 0.5 * s, 0.32 * s);
  ctx.stroke();
  circle(ctx, 0.5 * s, 0.5 * s, 0.24 * s);
  ctx.stroke();
  // hvězda
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    const x = 0.5 * s + Math.cos(a) * 0.22 * s;
    const y = 0.5 * s + Math.sin(a) * 0.22 * s;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(125,138,224,0.9)';
  ctx.stroke();
}
function treasurePile(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.84, 0.28, 0.05);
  ctx.beginPath();
  ctx.moveTo(0.26 * s, 0.74 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.46 * s, 0.74 * s, 0.74 * s);
  ctx.closePath();
  fs(ctx, COL.gold, o);
  for (const [x, y] of [[0.4, 0.66], [0.5, 0.6], [0.6, 0.66], [0.46, 0.7], [0.56, 0.7]] as const) {
    circle(ctx, x * s, y * s, 0.035 * s);
    ctx.fillStyle = COL.goldD;
    ctx.stroke();
    ctx.fillStyle = '#f0d77a';
    ctx.fill();
  }
}
function lavaPool(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.6 * s, 0.34 * s, 0.22 * s, 0, 0, Math.PI * 2);
  fs(ctx, '#3a1a10', o);
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 0.6 * s, 0.26 * s, 0.16 * s, 0, 0, Math.PI * 2);
  fs(ctx, '#b5421f', o * 0.6, false);
  ctx.beginPath();
  ctx.ellipse(0.46 * s, 0.56 * s, 0.1 * s, 0.05 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = COL.fireL;
  ctx.fill();
}
function mushroomGlow(ctx: CanvasRenderingContext2D, s: number) {
  const o = ow(s);
  shadow(ctx, s, 0.5, 0.86, 0.2, 0.05);
  const cap = (x: number, y: number, r: number) => {
    ctx.fillStyle = '#cfe8e0';
    ctx.fillRect((x - r * 0.25) * s, y * s, r * 0.5 * s, r * s);
    ctx.beginPath();
    ctx.arc(x * s, y * s, r * s, Math.PI, 0);
    ctx.closePath();
    fs(ctx, '#56c8b0', o);
    circle(ctx, x * s, (y - r * 0.4) * s, r * 0.5 * s);
    ctx.fillStyle = 'rgba(160,255,235,0.5)';
    ctx.fill();
  };
  cap(0.4, 0.66, 0.12);
  cap(0.6, 0.62, 0.14);
  cap(0.52, 0.72, 0.1);
}

// ———————————————————————————————— REGISTR ————————————————————————————————
type Def = [slug: string, name: string, category: CategoryId, tags: string, draw: ArtAsset['draw']];

const DEFS: Def[] = [
  ['pine', 'Borovice', 'priroda', 'strom les jehlicnan tree pine', (c, s) => pine(c, s)],
  ['pine-snow', 'Zasněžená borovice', 'priroda', 'strom snih tree winter', (c, s) => pine(c, s, true)],
  ['oak', 'Dub', 'priroda', 'strom listnaty tree oak', oak],
  ['dead-tree', 'Suchý strom', 'priroda', 'strom mrtvy dead tree', deadTree],
  ['bush', 'Keř', 'priroda', 'kere bush shrub', bush],
  ['palm', 'Palma', 'priroda', 'tropy palm tree', palm],
  ['cactus', 'Kaktus', 'priroda', 'poust cactus', cactus],
  ['mushroom', 'Velká houba', 'priroda', 'houba mushroom', mushroomBig],
  ['mountain', 'Hora', 'teren', 'hora mountain snih', (c, s) => mountain(c, s, true)],
  ['mountain-bare', 'Holá hora', 'teren', 'hora mountain', (c, s) => mountain(c, s, false)],
  ['mountains', 'Pohoří', 'teren', 'hory pohori mountains range', mountains],
  ['hill', 'Kopec', 'teren', 'kopec hill', hill],
  ['volcano', 'Sopka', 'teren', 'sopka volcano lava', volcano],
  ['rocks', 'Skály', 'teren', 'skala kameny rocks', rockPile],
  ['crystal', 'Krystal', 'teren', 'krystal crystal gem', crystal],
  ['tower', 'Věž', 'stavby', 'vez tower', tower],
  ['house', 'Dům', 'stavby', 'dum house home', house],
  ['cottage', 'Chalupa', 'stavby', 'chalupa chata cottage', cottage],
  ['castle', 'Hrad', 'stavby', 'hrad castle fortress', castle],
  ['ruins', 'Ruiny', 'stavby', 'ruiny ruins', ruins],
  ['tent', 'Stan', 'stavby', 'stan tabor tent camp', tent],
  ['well', 'Studna', 'stavby', 'studna well', well],
  ['windmill', 'Větrný mlýn', 'stavby', 'mlyn windmill', windmill],
  ['signpost', 'Rozcestník', 'stavby', 'cedule rozcestnik signpost', signpost],
  ['statue', 'Socha', 'stavby', 'socha statue', statue],
  ['chest', 'Truhla', 'dungeon', 'truhla poklad chest treasure', chest],
  ['door', 'Dveře', 'dungeon', 'dvere door', doorArch],
  ['barrel', 'Sud', 'dungeon', 'sud barrel', barrel],
  ['crate', 'Bedna', 'dungeon', 'bedna crate box', crate],
  ['pillar', 'Sloup', 'dungeon', 'sloup pilir column pillar', pillar],
  ['brazier', 'Koš s ohněm', 'dungeon', 'ohen pochoden brazier torch fire', brazier],
  ['skulls', 'Kosti', 'dungeon', 'lebka kosti bones skull', skullPile],
  ['altar', 'Oltář', 'dungeon', 'oltar altar', altar],
  ['trapdoor', 'Padací dveře', 'dungeon', 'poklop trapdoor hatch', trapdoor],
  ['stairs', 'Schody', 'dungeon', 'schody stairs', stairs],
  ['flag', 'Vlajka', 'znacky', 'vlajka flag', flag],
  ['banner', 'Korouhev', 'znacky', 'korouhev banner', banner],
  ['x-mark', 'Značka X', 'znacky', 'x poklad treasure mark', xMark],
  // rozšíření
  ['forest', 'Lesík', 'priroda', 'les lesik forest trees', forestPatch],
  ['willow', 'Vrba', 'priroda', 'strom vrba willow tree', willow],
  ['reeds', 'Rákosí', 'priroda', 'rakosi rakos reeds grass', reeds],
  ['flowers', 'Květiny', 'priroda', 'kvetiny louka flowers meadow', flowers],
  ['dunes', 'Duny', 'teren', 'poust duny dunes sand', dunes],
  ['iceberg', 'Ledovec', 'teren', 'led ledovec iceberg ice', iceberg],
  ['cliff', 'Útes', 'teren', 'utes plosina cliff plateau', cliff],
  ['waterfall', 'Vodopád', 'teren', 'vodopad waterfall', waterfall],
  ['village', 'Vesnice', 'stavby', 'vesnice osada village houses', village],
  ['lighthouse', 'Maják', 'stavby', 'majak lighthouse beacon', lighthouse],
  ['boat', 'Loďka', 'stavby', 'lod lodka clun boat ship', boat],
  ['standing-stones', 'Menhiry', 'stavby', 'menhiry kameny stones henge', standingStones],
  ['graveyard', 'Hřbitov', 'stavby', 'hrbitov hroby graveyard graves', graveyard],
  ['fountain', 'Fontána', 'stavby', 'fontana kasna fountain', fountain],
  ['throne', 'Trůn', 'dungeon', 'trun kreslo throne', throne],
  ['bookshelf', 'Knihovna', 'dungeon', 'knihovna police regal bookshelf books', bookshelf],
  ['cauldron', 'Kotlík', 'dungeon', 'kotlik kotel cauldron', cauldron],
  ['spikes', 'Bodce', 'dungeon', 'bodce hroty past spikes trap', spikes],
  ['web', 'Pavučina', 'dungeon', 'pavucina web cobweb', web],
  ['sarcophagus', 'Sarkofág', 'dungeon', 'sarkofag rakev sarcophagus', sarcophagus],
  ['portal', 'Portál', 'dungeon', 'portal brana portal gateway', portal],
  // dungeon nábytek a propy
  ['table', 'Stůl', 'dungeon', 'stul table furniture nabytek', table],
  ['round-table', 'Kulatý stůl', 'dungeon', 'stul kulaty round table', roundTable],
  ['bed', 'Postel', 'dungeon', 'postel bed furniture', bed],
  ['chair', 'Židle', 'dungeon', 'zidle chair stolicka', chair],
  ['rug', 'Koberec', 'dungeon', 'koberec rug carpet', rug],
  ['weapon-rack', 'Stojan na zbraně', 'dungeon', 'zbrane stojan weapon rack armory', weaponRack],
  ['anvil', 'Kovadlina', 'dungeon', 'kovadlina anvil forge kovarna', anvil],
  ['sack', 'Pytel', 'dungeon', 'pytel sack bag', sack],
  ['pot', 'Hrnec', 'dungeon', 'hrnec nadoba pot urn', pot],
  ['fireplace', 'Krb', 'dungeon', 'krb ohniste fireplace hearth', fireplace],
  ['gate', 'Mříž', 'dungeon', 'mriz brana gate portcullis', gate],
  ['lever', 'Páka', 'dungeon', 'paka paky lever switch', lever],
  ['cage', 'Klec', 'dungeon', 'klec cage prison', cage],
  ['candles', 'Svíčky', 'dungeon', 'svicky candle light', candles],
  ['bottles', 'Lahvičky', 'dungeon', 'lahvicky lektvary bottles potions', bottles],
  // rozšíření 2
  ['stump', 'Pařez', 'priroda', 'parez pen stump', stump],
  ['mushrooms', 'Houby', 'priroda', 'houby hriby mushrooms', mushrooms],
  ['lilypads', 'Lekníny', 'priroda', 'lekniny voda lilypad', lilypads],
  ['vines', 'Liány', 'priroda', 'liany brectan vines ivy', vines],
  ['oasis', 'Oáza', 'teren', 'oaza poust oasis', oasis],
  ['geyser', 'Gejzír', 'teren', 'gejzir geyser', geyser],
  ['marsh', 'Močál', 'teren', 'mocal bazina marsh swamp', marsh],
  ['dock', 'Molo', 'stavby', 'molo pristav dock pier', dock],
  ['watchtower', 'Hláska', 'stavby', 'hlaska vez watchtower', watchtower],
  ['obelisk', 'Obelisk', 'stavby', 'obelisk monolit', obelisk],
  ['shrine', 'Svatyně', 'stavby', 'svatyne oltar shrine', shrine],
  ['market', 'Stánek', 'stavby', 'stanek trh market stall', market],
  ['rubble', 'Suť', 'dungeon', 'sut kameni rubble debris', rubble],
  ['magic-circle', 'Magický kruh', 'dungeon', 'magicky kruh magic circle rune', magicCircle],
  ['treasure', 'Hromada zlata', 'dungeon', 'poklad zlato treasure pile gold', treasurePile],
  ['lava-pool', 'Jezírko lávy', 'dungeon', 'lava jezirko lava pool', lavaPool],
  ['mushroom-glow', 'Svítící houby', 'dungeon', 'houby svitici glow mushroom', mushroomGlow],
];

export const ART_ASSETS: ArtAsset[] = DEFS.map(([slug, name, category, tags, draw]) => ({
  id: `art:${slug}`,
  name,
  category,
  tags: tags.split(/\s+/),
  draw,
}));

const BY_ID = new Map(ART_ASSETS.map((a) => [a.id, a]));
export function artById(id: string): ArtAsset | undefined {
  return BY_ID.get(id);
}

const cache = new Map<string, HTMLCanvasElement>();
export function getArtCanvas(id: string, px = 384): HTMLCanvasElement | null {
  const key = `${id}@${px}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = artById(id);
  if (!def) return null;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  def.draw(ctx, px);
  // Objemové stínování (světlo shora) přes nakreslené pixely → assety působí plastičtěji
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, px * 0.1, 0, px * 0.92);
  g.addColorStop(0, 'rgba(255,250,238,0.14)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  ctx.restore();
  cache.set(key, canvas);
  return canvas;
}

export function searchArt(query: string, category: CategoryId | 'all'): ArtAsset[] {
  const q = normalize(query);
  return ART_ASSETS.filter((a) => {
    if (category !== 'all' && a.category !== category) return false;
    if (!q) return true;
    if (normalize(a.name).includes(q)) return true;
    return a.tags.some((t) => normalize(t).includes(q));
  });
}

export const ART_COUNT = ART_ASSETS.length;
