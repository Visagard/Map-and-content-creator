// Export mapy do PNG/WebP v libovolném rozlišení (až 8K). Renderuje na offscreen
// canvas ve world souřadnicích, nezávisle na aktuálním viewportu. Maskování
// (source-atop) běží na oddělené vrstvě terénu, aby textura neulpěla na vodě.
import type { MapDocument, EditorMode, WorldScene, DungeonScene } from './types';
import { catalogById } from './assetCatalog';
import { getEmojiCanvas } from './assetImages';
import { getArtCanvas } from './artAssets';
import { getTextureCanvas } from './textures';
import { useAssetLibStore } from '@/store/assetLibStore';

const ASSET_BASE = 80;
const COAST = 18;
const COAST_COLOR = 'rgba(8,26,40,0.55)';
const FLOOR = '#c7c1b0';
const WALL = '#15171c';
const WALL_W = 5;

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
      for (const id of doc.world.terrainOrder) {
        const s = doc.world.terrainStrokes[id];
        if (!s || s.kind === 'texture') continue;
        cxst.save();
        if (s.kind === 'erase') cxst.globalCompositeOperation = 'destination-out';
        cxst.strokeStyle = COAST_COLOR;
        strokePath(cxst, s.points, s.size + COAST * 2);
        cxst.restore();
      }
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
    applyWorldTransform(tx);
    for (const id of doc.world.terrainOrder) {
      const s = doc.world.terrainStrokes[id];
      if (!s) continue;
      tx.save();
      if (s.kind === 'texture') {
        const pat = tx.createPattern(getTextureCanvas(s.textureId), 'repeat');
        if (pat) {
          tx.globalCompositeOperation = 'source-atop';
          tx.strokeStyle = pat;
          strokePath(tx, s.points, s.size);
        }
      } else {
        if (s.kind === 'erase') tx.globalCompositeOperation = 'destination-out';
        tx.strokeStyle = s.kind === 'erase' ? '#000' : doc.world.landColor;
        strokePath(tx, s.points, s.size);
      }
      tx.restore();
    }
    // Slož terén nad vodu (1:1 kopie pixelů)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(tc, 0, 0);
    ctx.restore();
    drawAssets(ctx, doc.world);
  } else {
    if (opts.background !== 'transparent') {
      ctx.fillStyle = '#0e0f13';
      ctx.fillRect(minX, minY, W, H);
    }
    // Podlaha = chodby + místnosti (světlý kámen, splývají)
    ctx.fillStyle = FLOOR;
    for (const id of doc.dungeon.corridorOrder) {
      const c = doc.dungeon.corridors[id];
      if (!c) continue;
      ctx.strokeStyle = FLOOR;
      strokePath(ctx, c.points, c.width);
    }
    for (const id of doc.dungeon.roomOrder) {
      const r = doc.dungeon.rooms[id];
      if (!r) continue;
      ctx.fillRect(r.x, r.y, r.width, r.height);
    }
    // Mřížka jen na podlaze (ořez na místnosti), pod zdmi
    if (opts.grid) {
      const cell = doc.dungeon.grid.cellSize;
      ctx.save();
      ctx.beginPath();
      for (const id of doc.dungeon.roomOrder) {
        const r = doc.dungeon.rooms[id];
        if (r) ctx.rect(r.x, r.y, r.width, r.height);
      }
      ctx.clip();
      ctx.strokeStyle = 'rgba(20,24,32,0.4)';
      ctx.lineWidth = 1 / ratio;
      ctx.beginPath();
      for (let x = Math.ceil(minX / cell) * cell; x <= minX + W; x += cell) {
        ctx.moveTo(x, minY);
        ctx.lineTo(x, minY + H);
      }
      for (let y = Math.ceil(minY / cell) * cell; y <= minY + H; y += cell) {
        ctx.moveTo(minX, y);
        ctx.lineTo(minX + W, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    // Obvodové zdi místností (tučné tmavé) — Dungeon Scrawl styl
    ctx.lineJoin = 'miter';
    ctx.lineWidth = WALL_W;
    ctx.strokeStyle = WALL;
    for (const id of doc.dungeon.roomOrder) {
      const r = doc.dungeon.rooms[id];
      if (!r) continue;
      ctx.strokeRect(r.x, r.y, r.width, r.height);
    }
    drawAssets(ctx, doc.dungeon);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, opts.mime, opts.quality ?? 0.92));
  if (!blob) throw new Error('Export se nezdařil (toBlob vrátil null).');
  return { blob, width: cw, height: ch };
}
