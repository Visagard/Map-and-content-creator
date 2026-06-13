'use client';

import { Layer, Text } from 'react-konva';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';

/**
 * Vrstva textových popisků (názvy regionů/míst) ve World módu — jako labely
 * v Inkarnate. Serif font s bílým „halo" obrysem pro čitelnost na mapě.
 */
export default function LabelLayer() {
  const labels = useDocumentStore((s) => s.doc.world.labels);
  const order = useDocumentStore((s) => s.doc.world.labelOrder);
  const apply = useDocumentStore((s) => s.apply);
  const tool = useEditorStore((s) => s.tool);
  const setSelection = useEditorStore((s) => s.setSelection);

  const listening = tool === 'select' || tool === 'label';

  return (
    <Layer listening={listening}>
      {order.map((id) => {
        const l = labels[id];
        if (!l) return null;
        return (
          <Text
            key={id}
            x={l.x}
            y={l.y}
            text={l.text}
            fontSize={l.fontSize}
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="bold"
            fill={l.color}
            stroke="#f6f0e2"
            strokeWidth={Math.max(1, l.fontSize * 0.07)}
            fillAfterStrokeEnabled
            lineJoin="round"
            draggable={listening}
            listening={listening}
            perfectDrawEnabled={false}
            onPointerDown={(e) => {
              if (listening) {
                e.cancelBubble = true;
                setSelection([id]);
              }
            }}
            onDblClick={() => {
              const t = window.prompt('Text popisku:', l.text);
              if (t != null)
                apply('Úprava popisku', (d) => {
                  const ll = d.world.labels[id];
                  if (ll) ll.text = t;
                });
            }}
            onDragEnd={(e) =>
              apply('Posun popisku', (d) => {
                const ll = d.world.labels[id];
                if (ll) {
                  ll.x = e.target.x();
                  ll.y = e.target.y();
                }
              })
            }
          />
        );
      })}
    </Layer>
  );
}
