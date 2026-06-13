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

  const color = tool === 'erase' ? '#e06f6f' : tool === 'textureBrush' ? '#7fb86a' : '#c9913f';
  return (
    <Circle
      x={cursor.x}
      y={cursor.y}
      radius={size / 2}
      stroke={color}
      strokeWidth={1.5 / scale}
      dash={tool === 'erase' ? [6 / scale, 4 / scale] : undefined}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}
