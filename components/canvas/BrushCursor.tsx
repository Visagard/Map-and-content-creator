'use client';

import { Circle } from 'react-konva';
import { useEditorStore } from '@/store/editorStore';

/**
 * Ghost kruh = náhled velikosti štětce u kurzoru. Vlastní komponenta s úzkou
 * subscription, takže se při pohybu myší překresluje jen tento kruh.
 */
export default function BrushCursor() {
  const tool = useEditorStore((s) => s.tool);
  const size = useEditorStore((s) => s.brush.size);
  const scale = useEditorStore((s) => s.camera.scale);
  const cursor = useEditorStore((s) => s.cursor);

  const isBrush = tool === 'landBrush' || tool === 'textureBrush' || tool === 'erase';
  if (!isBrush || !cursor) return null;

  const erasing = tool === 'erase';
  return (
    <Circle
      x={cursor.x}
      y={cursor.y}
      radius={size / 2}
      stroke={erasing ? '#e06f6f' : '#c9913f'}
      strokeWidth={1.5 / scale}
      dash={erasing ? [6 / scale, 4 / scale] : undefined}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}
