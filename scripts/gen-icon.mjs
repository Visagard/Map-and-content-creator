// Generátor ikony aplikace → build/icon.png (512×512, RGBA).
// Čistý Node, bez závislostí. Kreslí kompasovou růžici (zlatá na obsidiánu)
// se supersamplingem pro hladké hrany. electron-builder z PNG vyrobí .ico/.icns.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'build', 'icon.png');

const SIZE = 512;
const SS = 4; // supersample
const N = SIZE * SS;

const OBSIDIAN = [13, 16, 22];
const GOLD = [201, 145, 63];
const GOLD_HI = [222, 176, 104];
const DIM = [120, 88, 38];

const hi = new Uint8ClampedArray(N * N * 4); // hi-res, RGBA, opaque overwrite

const dist = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

function inRoundRect(x, y, x0, y0, w, h, rad) {
  const x1 = x0 + w;
  const y1 = y0 + h;
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const r = Math.min(rad, w / 2, h / 2);
  if (x < x0 + r && y < y0 + r) return dist(x, y, x0 + r, y0 + r) <= r;
  if (x > x1 - r && y < y0 + r) return dist(x, y, x1 - r, y0 + r) <= r;
  if (x < x0 + r && y > y1 - r) return dist(x, y, x0 + r, y1 - r) <= r;
  if (x > x1 - r && y > y1 - r) return dist(x, y, x1 - r, y1 - r) <= r;
  return true;
}

// diamant (kosočtverec) se středem v (cx,cy), poloosami a (x) a b (y), volitelně rotovaný
function inDiamond(x, y, cx, cy, a, b, rot = 0) {
  let dx = x - cx;
  let dy = y - cy;
  if (rot) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    [dx, dy] = [dx * c - dy * s, dx * s + dy * c];
  }
  return Math.abs(dx) / a + Math.abs(dy) / b <= 1;
}

const cx = N / 2;
const cy = N / 2;
const rOuter = 0.40 * N;
const ringT = 0.022 * N;

for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    let col = null; // null = průhledné pozadí

    if (inRoundRect(x, y, 0, 0, N, N, 0.20 * N)) col = OBSIDIAN;

    if (col) {
      const d = dist(x, y, cx, cy);
      // hlavní 4cípá růžice (svislý + vodorovný diamant)
      if (
        inDiamond(x, y, cx, cy, 0.078 * N, 0.36 * N) ||
        inDiamond(x, y, cx, cy, 0.36 * N, 0.078 * N)
      ) {
        col = GOLD;
      }
      // diagonální tlumené cípy
      if (
        inDiamond(x, y, cx, cy, 0.05 * N, 0.26 * N, Math.PI / 4) ||
        inDiamond(x, y, cx, cy, 0.26 * N, 0.05 * N, Math.PI / 4)
      ) {
        if (col === OBSIDIAN) col = DIM;
      }
      // vnější prstenec
      if (Math.abs(d - rOuter) <= ringT / 2) col = GOLD;
      // střed
      if (d <= 0.065 * N) col = GOLD_HI;
      if (d <= 0.032 * N) col = OBSIDIAN;
    }

    const i = (y * N + x) * 4;
    if (col) {
      hi[i] = col[0];
      hi[i + 1] = col[1];
      hi[i + 2] = col[2];
      hi[i + 3] = 255;
    } else {
      hi[i + 3] = 0;
    }
  }
}

// Downsample SS×SS → 512×512 (premultiplikované, kvůli korektním okrajům)
const out = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const i = ((y * SS + sy) * N + (x * SS + sx)) * 4;
        const aa = hi[i + 3];
        r += hi[i] * aa;
        g += hi[i + 1] * aa;
        b += hi[i + 2] * aa;
        a += aa;
      }
    }
    const oi = (y * SIZE + x) * 4;
    out[oi] = a ? Math.round(r / a) : 0;
    out[oi + 1] = a ? Math.round(g / a) : 0;
    out[oi + 2] = a ? Math.round(b / a) : 0;
    out[oi + 3] = Math.round(a / (SS * SS));
  }
}

// --- PNG enkodér (RGBA, 8-bit) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(buf, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    buf.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, encodePNG(out, SIZE, SIZE));
console.log(`✓ Ikona vygenerována: ${path.relative(process.cwd(), OUT)} (${SIZE}×${SIZE})`);
