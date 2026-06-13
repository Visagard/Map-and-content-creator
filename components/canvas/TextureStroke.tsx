'use client';

import { Shape } from 'react-konva';
import type Konva from 'konva';
import { getTextureCanvas } from '@/lib/textures';

/**
 * Vykreslí texturovaný tah. Volá se uvnitř Konva sceneFunc, takže má aktivní
 * transformaci kamery (kreslíme ve world souřadnicích) i nastavené
 * globalCompositeOperation='source-atop' → tah se objeví jen tam, kde už je
 * neprůhledná pevnina, do vody se nepřelije. Pattern je v souřadnicích plátna,
 * takže sousední tahy stejné textury bezešvě navazují.
 */
export function paintTextureStroke(
  context: Konva.Context,
  points: number[],
  size: number,
  textureId: string,
): void {
  if (points.length < 2) return;
  const ctx = (context as unknown as { _context: CanvasRenderingContext2D })._context;
  const pattern = ctx.createPattern(getTextureCanvas(textureId), 'repeat');
  if (!pattern) return;

  ctx.save();
  ctx.strokeStyle = pattern;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  if (points.length <= 2) ctx.lineTo(points[0] + 0.01, points[1] + 0.01); // klik = tečka
  ctx.stroke();
  ctx.restore();
}

export default function TextureStroke({
  points,
  size,
  textureId,
}: {
  points: number[];
  size: number;
  textureId: string;
}) {
  return (
    <Shape
      globalCompositeOperation="source-atop"
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(ctx) => paintTextureStroke(ctx, points, size, textureId)}
    />
  );
}
