'use client';

import { Layer, Line } from 'react-konva';
import { useDocumentStore } from '@/store/documentStore';
import type { EditorMode } from '@/lib/types';

/** Vrstva volných tahů perem/tužkou (řeky, cesty, hranice, poznámky). */
export default function InkLayer({ mode }: { mode: EditorMode }) {
  const ink = useDocumentStore((s) => (mode === 'world' ? s.doc.world.ink : s.doc.dungeon.ink));
  const order = useDocumentStore((s) => (mode === 'world' ? s.doc.world.inkOrder : s.doc.dungeon.inkOrder));
  return (
    <Layer listening={false}>
      {order.map((id) => {
        const k = ink[id];
        if (!k) return null;
        return (
          <Line
            key={id}
            points={k.points}
            stroke={k.color}
            strokeWidth={k.width}
            opacity={k.opacity}
            lineCap="round"
            lineJoin="round"
            tension={0.3}
            dash={k.dash ? [k.width * 2, k.width * 1.5] : undefined}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      })}
    </Layer>
  );
}
