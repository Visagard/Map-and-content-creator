// Procedurální generátor dungeonu: nekolizní obdélníkové místnosti + L-chodby
// spojující nejbližší sousedy (MST přes středy). Výstup = běžné Room/Corridor
// entity → plně editovatelné a undoable jako jeden krok historie.
import type { Room, Corridor } from './types';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DungeonGenOptions {
  roomCount?: number;
  cell?: number;
  seed?: number;
}

export interface GeneratedDungeon {
  rooms: Room[];
  corridors: Corridor[];
}

export function generateDungeon(opts: DungeonGenOptions = {}): GeneratedDungeon {
  const cell = opts.cell ?? 48;
  const target = Math.max(1, opts.roomCount ?? 10);
  const seed = opts.seed ?? (Math.random() * 1e9) | 0;
  const rnd = mulberry32(seed);
  const ri = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

  const minC = 3;
  const maxC = 8;
  // Plocha pro rozmístění roste s počtem místností (v buňkách)
  const spread = Math.ceil(Math.sqrt(target)) * 12;

  const rooms: Room[] = [];
  let attempts = 0;
  while (rooms.length < target && attempts < target * 60) {
    attempts++;
    const w = ri(minC, maxC) * cell;
    const h = ri(minC, maxC) * cell;
    const x = ri(0, spread) * cell;
    const y = ri(0, spread) * cell;
    const pad = cell; // mezera mezi místnostmi
    const collides = rooms.some(
      (r) => !(x > r.x + r.width + pad || x + w + pad < r.x || y > r.y + r.height + pad || y + h + pad < r.y),
    );
    if (collides) continue;
    rooms.push({ id: crypto.randomUUID(), x, y, width: w, height: h });
  }

  const corridors: Corridor[] = [];
  if (rooms.length > 1) {
    const center = (r: Room) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
    const snap = (v: number) => Math.round(v / cell) * cell;
    const inTree = new Set<number>([0]);
    const rest = new Set<number>(rooms.map((_, i) => i).filter((i) => i !== 0));

    // Prim MST → každá místnost spojena, žádné cykly
    while (rest.size) {
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (const a of inTree) {
        for (const b of rest) {
          const ca = center(rooms[a]);
          const cb = center(rooms[b]);
          const d = (ca.x - cb.x) ** 2 + (ca.y - cb.y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = [a, b];
          }
        }
      }
      if (!best) break;
      const [a, b] = best;
      inTree.add(b);
      rest.delete(b);
      const ca = center(rooms[a]);
      const cb = center(rooms[b]);
      const ax = snap(ca.x);
      const ay = snap(ca.y);
      const bx = snap(cb.x);
      const by = snap(cb.y);
      // L-tvar, náhodný směr ohybu
      const points = rnd() < 0.5 ? [ax, ay, bx, ay, bx, by] : [ax, ay, ax, by, bx, by];
      corridors.push({ id: crypto.randomUUID(), points, width: Math.max(Math.round(cell * 0.7), 16) });
    }
  }

  return { rooms, corridors };
}
