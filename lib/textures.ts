// Procedurálně generované dlaždicové textury (žádné soubory → offline, zdarma).
// Každá textura = malý opakovatelný canvas s base barvou + deterministickým šumem,
// použitelný jako CanvasPattern pro texturový štětec.

export interface TextureDef {
  id: string;
  name: string;
}

export const TEXTURES: TextureDef[] = [
  { id: 'grass', name: 'Tráva' },
  { id: 'forest', name: 'Les' },
  { id: 'sand', name: 'Písek' },
  { id: 'snow', name: 'Sníh' },
  { id: 'stone', name: 'Kámen' },
  { id: 'dirt', name: 'Hlína' },
  { id: 'swamp', name: 'Bažina' },
  { id: 'water', name: 'Jezero' },
  { id: 'ice', name: 'Led' },
  { id: 'lava', name: 'Láva' },
  { id: 'rock', name: 'Skála' },
  { id: 'tundra', name: 'Tundra' },
];

const PALETTE: Record<string, { base: string; dots: string[] }> = {
  grass: { base: '#4e7a3a', dots: ['#3d6630', '#5d8a45', '#6fa050', '#436e33'] },
  forest: { base: '#2f5530', dots: ['#24461f', '#3a6b3a', '#1c3a1a', '#315c31'] },
  sand: { base: '#d9c38a', dots: ['#c9b070', '#e6d3a0', '#cdb87e', '#d2bd82'] },
  snow: { base: '#e8eef5', dots: ['#d6e0ee', '#ffffff', '#cdd8e6', '#dbe6f0'] },
  stone: { base: '#8a8f98', dots: ['#74797f', '#9aa0a8', '#6b7077', '#82878f'] },
  dirt: { base: '#7a5a3a', dots: ['#6a4c30', '#8a6a46', '#5e442c', '#735436'] },
  swamp: { base: '#4a5a3a', dots: ['#3c4a30', '#566a44', '#2f3a26', '#445436'] },
  water: { base: '#2f6f9f', dots: ['#286089', '#3a7fb0', '#225278', '#2c6896'] },
  ice: { base: '#bcd6e8', dots: ['#a8c6dd', '#d4e6f2', '#9fbdd4', '#b3cfe3'] },
  lava: { base: '#b5421f', dots: ['#d65a2a', '#8a2f14', '#e87a35', '#a83a1b'] },
  rock: { base: '#6e6a66', dots: ['#5a5652', '#807c78', '#4e4a47', '#666260'] },
  tundra: { base: '#9aa28c', dots: ['#868e76', '#aab394', '#76806a', '#929a84'] },
};

const cache = new Map<string, HTMLCanvasElement>();

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getTextureCanvas(id: string): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;

  const p = PALETTE[id] ?? PALETTE.grass;
  const px = 96;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, px, px);

  // Deterministický PRNG → stabilní dlaždice (stejná při každém renderu)
  let seed = hashId(id);
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Dlaždice musí navazovat → tečky u okraje překresli i na protější stranu
  const dot = (x: number, y: number, color: string, s: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);
    if (x + s > px) ctx.fillRect(x - px, y, s, s);
    if (y + s > px) ctx.fillRect(x, y - px, s, s);
    if (x + s > px && y + s > px) ctx.fillRect(x - px, y - px, s, s);
  };

  const count = 1100;
  for (let i = 0; i < count; i++) {
    const x = (rnd() * px) | 0;
    const y = (rnd() * px) | 0;
    const color = p.dots[(rnd() * p.dots.length) | 0];
    const s = 1 + ((rnd() * 2) | 0);
    dot(x, y, color, s);
  }

  cache.set(id, canvas);
  return canvas;
}
