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
  { id: 'cobble', name: 'Dlažba' },
  { id: 'autumn', name: 'Podzim' },
  { id: 'darkgrass', name: 'Tmavá tráva' },
  { id: 'mud', name: 'Bahno' },
  { id: 'moss', name: 'Mech' },
  { id: 'savanna', name: 'Savana' },
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
  cobble: { base: '#8b8680', dots: ['#6f6a64', '#a39d95', '#5e5a55', '#7c7770'] },
  autumn: { base: '#9a6a30', dots: ['#b5803a', '#7c5424', '#c98f3f', '#86602c'] },
  darkgrass: { base: '#33502c', dots: ['#284022', '#3f6336', '#1f3219', '#365a2e'] },
  mud: { base: '#5e4a32', dots: ['#4c3b27', '#6e5840', '#3f3120', '#574326'] },
  moss: { base: '#4a5e2e', dots: ['#3a4c24', '#5c7440', '#2f3e1d', '#506838'] },
  savanna: { base: '#bdaa66', dots: ['#c9b870', '#9a8a4a', '#d6c386', '#a89a58'] },
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

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

let seaShimmer: HTMLCanvasElement | null = null;
/** Jemné vlnění moře — světlé/tmavé vodorovné šmouhy přes vodu (nízké krytí). */
export function getSeaShimmer(): HTMLCanvasElement {
  if (seaShimmer) return seaShimmer;
  const px = 180;
  const c = document.createElement('canvas');
  c.width = px;
  c.height = px;
  const ctx = c.getContext('2d')!;
  let seed = 7321;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const y = rnd() * px;
    const x = rnd() * px;
    const w = 16 + rnd() * 70;
    const light = rnd() < 0.6;
    ctx.strokeStyle = light
      ? `rgba(180,212,236,${0.03 + rnd() * 0.05})`
      : `rgba(8,28,46,${0.04 + rnd() * 0.06})`;
    ctx.lineWidth = 1 + rnd() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y - 2 + rnd() * 4, x + w, y);
    ctx.stroke();
  }
  seaShimmer = c;
  return c;
}

export function getTextureCanvas(id: string): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;

  const p = PALETTE[id] ?? PALETTE.grass;
  const px = 128; // větší dlaždice → méně viditelné opakování
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, px, px);

  // Deterministický PRNG → stabilní dlaždice
  let seed = hashId(id);
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Měkké malované skvrny (vykreslené i přes okraje → bezešvé dlaždicování)
  const blob = (x: number, y: number, r: number, hex: string, a: number) => {
    for (const ox of [-px, 0, px]) {
      for (const oy of [-px, 0, px]) {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, hexToRgba(hex, a));
        g.addColorStop(1, hexToRgba(hex, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  for (let i = 0; i < 46; i++) {
    blob(rnd() * px, rnd() * px, (0.08 + rnd() * 0.2) * px, p.dots[(rnd() * p.dots.length) | 0], 0.12 + rnd() * 0.22);
  }

  // Jemný zrnitý šum navrch
  for (let i = 0; i < 850; i++) {
    const x = (rnd() * px) | 0;
    const y = (rnd() * px) | 0;
    ctx.fillStyle = hexToRgba(p.dots[(rnd() * p.dots.length) | 0], 0.22 + rnd() * 0.4);
    ctx.fillRect(x, y, 1, 1);
  }

  cache.set(id, canvas);
  return canvas;
}
