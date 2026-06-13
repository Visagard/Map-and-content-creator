'use client';

import { Shape } from 'react-konva';
import type Konva from 'konva';
import { getTextureCanvas } from '@/lib/textures';

/**
 * Vykreslí texturovaný tah. Volá se uvnitř Konva sceneFunc, takže má aktivní
 * transformaci kamery (kreslíme ve world souřadnicích) i nastavené
 * globalCompositeOperation='source-atop' → tah se objeví jen na pevnině.
 * `opacity` umožní postupné vrstvení biomů, `softness` rozostří okraj tahu
 * (měkké prolínání biomů jako v Inkarnate). Feather je v world jednotkách,
 * takže vypadá stejně při každém zoomu.
 */
export function paintTextureStroke(
  context: Konva.Context,
  shape: Konva.Shape,
  points: number[],
  size: number,
  textureId: string,
  opacity = 1,
  softness = 0,
): void {
  if (points.length < 2) return;
  const ctx = (context as unknown as { _context: CanvasRenderingContext2D })._context;
  const pattern = ctx.createPattern(getTextureCanvas(textureId), 'repeat');
  if (!pattern) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  if (softness > 0) {
    const scale = shape.getStage()?.scaleX() ?? 1;
    const pr = shape.getLayer()?.getCanvas()?.getPixelRatio?.() ?? 1;
    const blur = softness * size * 0.45 * scale * pr; // world → device px
    if (blur > 0.5) ctx.filter = `blur(${blur}px)`;
  }
  ctx.strokeStyle = pattern;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  if (points.length <= 2) ctx.lineTo(points[0] + 0.01, points[1] + 0.01);
  ctx.stroke();
  ctx.restore();
}

/** Vyplní obdélník texturou (pattern v world souřadnicích). Pro podklad pevniny
 *  se source-atop → textura pokryje celou souš, ne vodu. */
export function paintTextureFill(
  context: Konva.Context,
  x: number,
  y: number,
  w: number,
  h: number,
  textureId: string,
): void {
  const ctx = (context as unknown as { _context: CanvasRenderingContext2D })._context;
  const pattern = ctx.createPattern(getTextureCanvas(textureId), 'repeat');
  if (!pattern) return;
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, w, h);
}

/** Podklad pevniny — souš se vždy texturuje (jako v Inkarnate). */
export function BaseGround({ view, textureId }: { view: { left: number; top: number; right: number; bottom: number }; textureId: string }) {
  return (
    <Shape
      globalCompositeOperation="source-atop"
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(ctx) => paintTextureFill(ctx, view.left, view.top, view.right - view.left, view.bottom - view.top, textureId)}
    />
  );
}

export default function TextureStroke({
  points,
  size,
  textureId,
  opacity = 1,
  softness = 0,
}: {
  points: number[];
  size: number;
  textureId: string;
  opacity?: number;
  softness?: number;
}) {
  return (
    <Shape
      globalCompositeOperation="source-atop"
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(ctx, shape) => paintTextureStroke(ctx, shape, points, size, textureId, opacity, softness)}
    />
  );
}
