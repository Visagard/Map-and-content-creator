// Export mapy do PNG/WebP v libovolném rozlišení (až 8K). Renderuje na offscreen
// canvas ve world souřadnicích, nezávisle na aktuálním viewportu. Maskování
// (source-atop) běží na oddělené vrstvě terénu, aby textura neulpěla na vodě.
import type { MapDocument, EditorMode, WorldScene, DungeonScene } from './types';
import { catalogById } from './assetCatalog';
import { getEmojiCanvas } from './assetImages';
import { getArtCanvas } from './artAssets';
import { getTextureCanvas } from './textures';
import { computeDungeonGeometry, drawDungeon } from './dungeonRender';
import { useAssetLibStore } from '@/store/assetLibStore';

const ASSET_BASE = 80;
const COAST_BANDS = [
  { w: 46, color: 'rgba(6,20,32,0.55)' },
  { w: 26, color: 'rgba(22,58,82,0.5)' },
  { w: 11, color: 'rgba(74,128,150,0.5)' },
];
const COAST_MAX = 46;

let paperGrain: HTMLCanvasElement | null = null;
function getPaperGrain(): HTMLCanvasElement {
  if (paperGrain) return paperGrain;
  const px = 256;
  const c = document.createElement('canvas');
  c.width = px;
  c.height = px;
  const g = c.getContext('2d')!;
  let seed = 99173;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 9000; i++) {
    const dark = rnd() < 0.5;
    g.fillStyle = dark ? `rgba(40,30,18,${0.05 + rnd() * 0.1})` : `rgba(255,245,220,${0.04 + rnd() * 0.08})`;
    g.fillRect((rnd() * px) | 0, (rnd() * px) | 0, 1, 1);
  }
  paperGrain = c;
  return c;
}

function resolveImage(assetId: string): CanvasImageSource | null {
  if (assetId.startsWith('usr:')) return useAssetLibStore.getState().images[assetId] ?? null;
  if (assetId.startsWith('art:')) return getArtCanvas(assetId);
  const c = catalogById(assetId);
  return c ? getEmojiCanvas(c.emoji) : null;
}

function assetDims(assetId: string, img: CanvasImageSource): { w: number; h: number } {
  if (assetId.startsWith('usr:') && img instanceof HTMLImageElement && img.naturalHeight) {
    const r = img.naturalWidth / img.naturalHeight;
    return r >= 1 ? { w: ASSET_BASE, h: ASSET_BASE / r } : { w: ASSET_BASE * r, h: ASSET_BASE };
  }
  return { w: ASSET_BASE, h: ASSET_BASE };
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function computeBounds(doc: MapDocument, mode: EditorMode): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  const ext = (x: number, y: number, r = 0) => {
    any = true;
    if (x - r < minX) minX = x - r;
    if (y - r < minY) minY = y - r;
    if (x + r > maxX) maxX = x + r;
    if (y + r > maxY) maxY = y + r;
  };
  const extAsset = (scene: WorldScene | DungeonScene) => {
    for (const id of scene.assetOrder) {
      const a = scene.assets[id];
      if (!a) continue;
      const img = resolveImage(a.assetId);
      const d = img ? assetDims(a.assetId, img) : { w: ASSET_BASE, h: ASSET_BASE };
      ext(a.x, a.y, Math.max(d.w, d.h) * a.scale * 0.75);
    }
  };

  if (mode === 'world') {
    for (const id of doc.world.terrainOrder) {
      const s = doc.world.terrainStrokes[id];
      if (!s) continue;
      const r = s.size / 2;
      for (let i = 0; i < s.points.length; i += 2) ext(s.points[i], s.points[i + 1], r);
    }
    extAsset(doc.world);
    for (const id of doc.world.labelOrder) {
      const l = doc.world.labels[id];
      if (!l) continue;
      const w2 = l.text.length * l.fontSize * 0.55;
      ext(l.x, l.y);
      ext(l.x + w2, l.y + l.fontSize);
    }
  } else {
    for (const id of doc.dungeon.roomOrder) {
      const r = doc.dungeon.rooms[id];
      if (!r) continue;
      ext(r.x, r.y);
      ext(r.x + r.width, r.y + r.height);
    }
    for (const id of doc.dungeon.corridorOrder) {
      const c = doc.dungeon.corridors[id];
      if (!c) continue;
      const r = c.width / 2;
      for (let i = 0; i < c.points.length; i += 2) ext(c.points[i], c.points[i + 1], r);
    }
    extAsset(doc.dungeon);
  }

  return any ? { minX, minY, maxX, maxY } : null;
}

function drawFrame(ctx: CanvasRenderingContext2D, minX: number, minY: number, W: number, H: number) {
  const m = Math.min(W, H) * 0.022;
  ctx.save();
  ctx.strokeStyle = 'rgba(28,20,12,0.85)';
  ctx.lineWidth = Math.min(W, H) * 0.006;
  ctx.strokeRect(minX + m, minY + m, W - 2 * m, H - 2 * m);
  ctx.lineWidth = Math.min(W, H) * 0.002;
  ctx.strokeRect(minX + m * 1.7, minY + m * 1.7, W - 2 * m * 1.7, H - 2 * m * 1.7);
  ctx.restore();
}

function strokePath(ctx: CanvasRenderingContext2D, points: number[], width: number) {
  if (points.length < 2) return;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  if (points.length <= 2) ctx.lineTo(points[0] + 0.01, points[1] + 0.01);
  ctx.stroke();
}

function drawAssets(ctx: CanvasRenderingContext2D, scene: WorldScene | DungeonScene) {
  for (const id of scene.assetOrder) {
    const a = scene.assets[id];
    if (!a) continue;
    const img = resolveImage(a.assetId);
    if (!img) continue;
    const { w, h } = assetDims(a.assetId, img);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate((a.rotation * Math.PI) / 180);
    ctx.scale(a.scale * (a.flipX ? -1 : 1), a.scale);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

export interface ExportOptions {
  longEdge: number;
  mime: 'image/png' | 'image/webp';
  quality?: number;
  padding?: number;
  background?: 'scene' | 'transparent';
  grid?: boolean;
}

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
}

export function estimateExportSize(
  doc: MapDocument,
  mode: EditorMode,
  longEdge: number,
  padding = 64,
): { width: number; height: number } | null {
  const b = computeBounds(doc, mode);
  if (!b) return null;
  const W = b.maxX - b.minX + padding * 2;
  const H = b.maxY - b.minY + padding * 2;
  const ratio = longEdge / Math.max(W, H);
  return { width: Math.max(1, Math.round(W * ratio)), height: Math.max(1, Math.round(H * ratio)) };
}

export async function exportMap(doc: MapDocument, mode: EditorMode, opts: ExportOptions): Promise<ExportResult> {
  const b = computeBounds(doc, mode);
  if (!b) throw new Error('Mapa je prázdná — není co exportovat.');

  const pad = opts.padding ?? 64;
  const minX = b.minX - pad;
  const minY = b.minY - pad;
  const W = b.maxX - b.minX + pad * 2;
  const H = b.maxY - b.minY + pad * 2;
  const ratio = opts.longEdge / Math.max(W, H);
  const cw = Math.max(1, Math.round(W * ratio));
  const ch = Math.max(1, Math.round(H * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nepodařilo se vytvořit plátno pro export.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const applyWorldTransform = (c: CanvasRenderingContext2D) => c.setTransform(ratio, 0, 0, ratio, -minX * ratio, -minY * ratio);
  applyWorldTransform(ctx);

  if (mode === 'world') {
    if (opts.background !== 'transparent') {
      ctx.fillStyle = doc.world.waterStyle.color;
      ctx.fillRect(minX, minY, W, H);
    }
    // Pobřeží na vlastní vrstvě (erase nesmí prožrat vodu pod ním)
    const coast = document.createElement('canvas');
    coast.width = cw;
    coast.height = ch;
    const cxst = coast.getContext('2d');
    if (cxst) {
      applyWorldTransform(cxst);
      for (const band of COAST_BANDS) {
        cxst.strokeStyle = band.color;
        for (const id of doc.world.terrainOrder) {
          const s = doc.world.terrainStrokes[id];
          if (!s || s.kind !== 'land') continue;
          strokePath(cxst, s.points, s.size + band.w * 2);
        }
      }
      cxst.save();
      cxst.globalCompositeOperation = 'destination-out';
      cxst.strokeStyle = '#000';
      for (const id of doc.world.terrainOrder) {
        const s = doc.world.terrainStrokes[id];
        if (!s || s.kind !== 'erase') continue;
        strokePath(cxst, s.points, s.size + COAST_MAX * 2);
      }
      cxst.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(coast, 0, 0);
      ctx.restore();
    }
    // Terén na oddělené vrstvě → source-atop klipuje jen na pevninu, ne na vodu
    const tc = document.createElement('canvas');
    tc.width = cw;
    tc.height = ch;
    const tx = tc.getContext('2d');
    if (!tx) throw new Error('Nepodařilo se vytvořit vrstvu terénu.');
    tx.imageSmoothingEnabled = true;
    tx.imageSmoothingQuality = 'high';
    applyWorldTransform(tx);
    // průchod 1: pevnina + mazání (alfa maska)
    for (const id of doc.world.terrainOrder) {
      const s = doc.world.terrainStrokes[id];
      if (!s || s.kind === 'texture') continue;
      tx.save();
      if (s.kind === 'erase') tx.globalCompositeOperation = 'destination-out';
      tx.strokeStyle = s.kind === 'erase' ? '#000' : doc.world.landColor;
      strokePath(tx, s.points, s.size);
      tx.restore();
    }
    // podklad pevniny (source-atop → pokryje celou souš)
    const basePat = tx.createPattern(getTextureCanvas(doc.world.baseTextureId), 'repeat');
    if (basePat) {
      tx.save();
      tx.globalCompositeOperation = 'source-atop';
      tx.fillStyle = basePat;
      tx.fillRect(minX, minY, W, H);
      tx.restore();
    }
    // průchod 2: textury (source-atop, krytí + měkkost)
    for (const id of doc.world.terrainOrder) {
      const s = doc.world.terrainStrokes[id];
      if (!s || s.kind !== 'texture') continue;
      const pat = tx.createPattern(getTextureCanvas(s.textureId), 'repeat');
      if (!pat) continue;
      tx.save();
      tx.globalCompositeOperation = 'source-atop';
      tx.globalAlpha = s.opacity ?? 1;
      const soft = s.softness ?? 0;
      if (soft > 0) {
        const blur = soft * s.size * 0.45 * ratio;
        if (blur > 0.5) tx.filter = `blur(${blur}px)`;
      }
      tx.strokeStyle = pat;
      strokePath(tx, s.points, s.size);
      tx.restore();
    }
    // Slož terén nad vodu (1:1 kopie pixelů)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(tc, 0, 0);
    ctx.restore();
    drawAssets(ctx, doc.world);
    // Popisky
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    for (const id of doc.world.labelOrder) {
      const l = doc.world.labels[id];
      if (!l) continue;
      ctx.font = `bold ${l.fontSize}px Georgia, "Times New Roman", serif`;
      ctx.strokeStyle = '#f6f0e2';
      ctx.lineWidth = Math.max(1, l.fontSize * 0.14);
      ctx.fillStyle = l.color;
      l.text.split('\n').forEach((ln, i) => {
        const ly = l.y + i * l.fontSize;
        ctx.strokeText(ln, l.x, ly);
        ctx.fillText(ln, l.x, ly);
      });
    }
    // Jemná vinětace → „dokončený" vzhled mapy
    if (opts.background !== 'transparent') {
      const ccx = minX + W / 2;
      const ccy = minY + H / 2;
      const vg = ctx.createRadialGradient(ccx, ccy, Math.min(W, H) * 0.35, ccx, ccy, Math.max(W, H) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.26)');
      ctx.fillStyle = vg;
      ctx.fillRect(minX, minY, W, H);
      // Pergamenové zrno (v device prostoru → jemné nezávisle na zoomu)
      const pat = ctx.createPattern(getPaperGrain(), 'repeat');
      if (pat) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }
      drawFrame(ctx, minX, minY, W, H);
    }
  } else {
    if (opts.background !== 'transparent') {
      ctx.fillStyle = '#0e0f13';
      ctx.fillRect(minX, minY, W, H);
      // tmavý papírový podklad
      const pg = ctx.createPattern(getPaperGrain(), 'repeat');
      if (pg) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = pg;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }
    }
    // Sloučená podlaha + jeden obrys zdí (Dungeon Scrawl styl) + vržený stín
    const geom = computeDungeonGeometry(doc.dungeon, doc.dungeon.grid.cellSize);
    drawDungeon(ctx, geom, { grid: !!opts.grid, floorTexture: true, scale: ratio });
    drawAssets(ctx, doc.dungeon);
    if (opts.background !== 'transparent') drawFrame(ctx, minX, minY, W, H);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, opts.mime, opts.quality ?? 0.92));
  if (!blob) throw new Error('Export se nezdařil (toBlob vrátil null).');
  return { blob, width: cw, height: ch };
}
