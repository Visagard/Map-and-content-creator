// Dungeon Scrawl styl: místnosti + chodby se sloučí do jedné podlahy (rastr buněk)
// a zdi se vykreslí jako JEDEN obrys hranice podlaha/ne-podlaha (žádné vnitřní
// čáry mezi sousedními místnostmi) + vnitřní stín pro hloubku.
import type { DungeonScene } from './types';
import { getTextureCanvas } from './textures';

export const FLOOR = '#d7ceba';
export const WALL = '#14161b';
export const WALL_W = 7;
const GRID = 'rgba(40,44,54,0.42)';

export interface DungeonGeometry {
  cell: number;
  cells: Set<string>;
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

type SceneLike = Pick<DungeonScene, 'rooms' | 'roomOrder' | 'corridors' | 'corridorOrder'>;

export function computeDungeonGeometry(scene: SceneLike, cell: number): DungeonGeometry {
  const cells = new Set<string>();
  const mark = (cx: number, cy: number) => cells.add(cx + '|' + cy);

  for (const id of scene.roomOrder) {
    const r = scene.rooms[id];
    if (!r) continue;
    const x0 = Math.floor(r.x / cell);
    const y0 = Math.floor(r.y / cell);
    const x1 = Math.ceil((r.x + r.width) / cell);
    const y1 = Math.ceil((r.y + r.height) / cell);
    for (let cx = x0; cx < x1; cx++) for (let cy = y0; cy < y1; cy++) mark(cx, cy);
  }

  for (const id of scene.corridorOrder) {
    const c = scene.corridors[id];
    if (!c) continue;
    const half = c.width / 2;
    for (let i = 0; i + 3 < c.points.length; i += 2) {
      const ax = c.points[i];
      const ay = c.points[i + 1];
      const bx = c.points[i + 2];
      const by = c.points[i + 3];
      const cx0 = Math.floor((Math.min(ax, bx) - half) / cell);
      const cy0 = Math.floor((Math.min(ay, by) - half) / cell);
      const cx1 = Math.ceil((Math.max(ax, bx) + half) / cell);
      const cy1 = Math.ceil((Math.max(ay, by) + half) / cell);
      for (let cx = cx0; cx < cx1; cx++) {
        for (let cy = cy0; cy < cy1; cy++) {
          if (distToSeg((cx + 0.5) * cell, (cy + 0.5) * cell, ax, ay, bx, by) <= half + cell * 0.15) mark(cx, cy);
        }
      }
    }
  }

  return { cell, cells };
}

export interface DrawDungeonOpts {
  grid?: boolean;
  floorTexture?: boolean;
  /** world→device měřítko (camera.scale·pixelRatio živě, ratio v exportu) — pro stín v world jednotkách */
  scale?: number;
}

export function drawDungeon(ctx: CanvasRenderingContext2D, geom: DungeonGeometry, opts: DrawDungeonOpts = {}): void {
  const { cell, cells } = geom;
  if (cells.size === 0) return;
  const sc = opts.scale ?? 1;

  const arr: [number, number][] = [];
  let minCx = Infinity;
  let minCy = Infinity;
  let maxCx = -Infinity;
  let maxCy = -Infinity;
  for (const k of cells) {
    const sep = k.indexOf('|');
    const cx = +k.slice(0, sep);
    const cy = +k.slice(sep + 1);
    arr.push([cx, cy]);
    if (cx < minCx) minCx = cx;
    if (cy < minCy) minCy = cy;
    if (cx > maxCx) maxCx = cx;
    if (cy > maxCy) maxCy = cy;
  }
  const has = (cx: number, cy: number) => cells.has(cx + '|' + cy);
  const floorPath = () => {
    ctx.beginPath();
    for (const [cx, cy] of arr) ctx.rect(cx * cell, cy * cell, cell, cell);
  };

  ctx.save();

  // Vržený stín na podklad → dungeon „leží" na tmavém papíru (vzhled Dungeon Scrawl)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Math.min(cell * 0.55 * sc, 90);
  ctx.shadowOffsetX = Math.min(cell * 0.14 * sc, 26);
  ctx.shadowOffsetY = Math.min(cell * 0.2 * sc, 34);
  ctx.fillStyle = '#000';
  floorPath();
  ctx.fill();
  ctx.restore();

  // Podlaha (sloučené buňky; mírný přesah ruší šev mezi dlaždicemi)
  ctx.fillStyle = FLOOR;
  for (const [cx, cy] of arr) ctx.fillRect(cx * cell, cy * cell, cell + 0.6, cell + 0.6);

  // Jemná kamenná textura na podlaze
  if (opts.floorTexture !== false) {
    const pat = ctx.createPattern(getTextureCanvas('stone'), 'repeat');
    if (pat) {
      ctx.save();
      floorPath();
      ctx.clip();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = pat;
      ctx.fillRect(minCx * cell, minCy * cell, (maxCx - minCx + 1) * cell, (maxCy - minCy + 1) * cell);
      ctx.restore();
    }
  }

  // Mřížka jen na podlaze
  if (opts.grid) {
    ctx.save();
    floorPath();
    ctx.clip();
    ctx.strokeStyle = GRID;
    ctx.lineWidth = Math.max(0.5, cell * 0.022);
    ctx.beginPath();
    for (let cx = minCx; cx <= maxCx + 1; cx++) {
      ctx.moveTo(cx * cell, minCy * cell);
      ctx.lineTo(cx * cell, (maxCy + 1) * cell);
    }
    for (let cy = minCy; cy <= maxCy + 1; cy++) {
      ctx.moveTo(minCx * cell, cy * cell);
      ctx.lineTo((maxCx + 1) * cell, cy * cell);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Hraniční hrany podlaha/ne-podlaha = zdi
  const edges: [number, number, number, number][] = [];
  for (const [cx, cy] of arr) {
    if (!has(cx, cy - 1)) edges.push([cx * cell, cy * cell, (cx + 1) * cell, cy * cell]);
    if (!has(cx, cy + 1)) edges.push([cx * cell, (cy + 1) * cell, (cx + 1) * cell, (cy + 1) * cell]);
    if (!has(cx - 1, cy)) edges.push([cx * cell, cy * cell, cx * cell, (cy + 1) * cell]);
    if (!has(cx + 1, cy)) edges.push([(cx + 1) * cell, cy * cell, (cx + 1) * cell, (cy + 1) * cell]);
  }

  // Vnitřní stín zdí (ořezaný na podlahu → měkký pás dovnitř)
  ctx.save();
  floorPath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = WALL_W * 3;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  for (const e of edges) {
    ctx.moveTo(e[0], e[1]);
    ctx.lineTo(e[2], e[3]);
  }
  ctx.stroke();
  ctx.restore();

  // Ostrý obrys zdí
  ctx.strokeStyle = WALL;
  ctx.lineWidth = WALL_W;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const e of edges) {
    ctx.moveTo(e[0], e[1]);
    ctx.lineTo(e[2], e[3]);
  }
  ctx.stroke();

  ctx.restore();
}
