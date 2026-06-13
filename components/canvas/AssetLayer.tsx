'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { useAssetLibStore } from '@/store/assetLibStore';
import { catalogById } from '@/lib/assetCatalog';
import { getEmojiCanvas } from '@/lib/assetImages';
import type { EditorMode, PlacedAsset } from '@/lib/types';

const BASE = 80; // velikost delší strany prvku ve world px při scale=1

function useAssetImage(assetId: string): CanvasImageSource | null {
  const custom = useAssetLibStore((s) => (assetId.startsWith('usr:') ? s.images[assetId] : undefined));
  if (assetId.startsWith('usr:')) return custom ?? null;
  const cat = catalogById(assetId);
  return cat ? getEmojiCanvas(cat.emoji) : null;
}

function dimsFor(assetId: string, img: CanvasImageSource): { w: number; h: number } {
  if (assetId.startsWith('usr:') && img instanceof HTMLImageElement && img.naturalHeight) {
    const r = img.naturalWidth / img.naturalHeight;
    return r >= 1 ? { w: BASE, h: BASE / r } : { w: BASE * r, h: BASE };
  }
  return { w: BASE, h: BASE };
}

function AssetNode({
  asset,
  listening,
  onSelect,
  onChange,
  register,
}: {
  asset: PlacedAsset;
  listening: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<PlacedAsset>) => void;
  register: (id: string, node: Konva.Node | null) => void;
}) {
  const img = useAssetImage(asset.assetId);
  if (!img) return null;
  const { w, h } = dimsFor(asset.assetId, img);

  return (
    <KonvaImage
      ref={(node) => register(asset.id, node)}
      image={img}
      x={asset.x}
      y={asset.y}
      width={w}
      height={h}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={asset.rotation}
      scaleX={asset.scale * (asset.flipX ? -1 : 1)}
      scaleY={asset.scale}
      draggable={listening}
      listening={listening}
      perfectDrawEnabled={false}
      onPointerDown={(e) => {
        if (listening) {
          e.cancelBubble = true; // stejný (pointer) event jako Stage → nezruší výběr
          onSelect(asset.id);
        }
      }}
      onTap={() => listening && onSelect(asset.id)}
      onDragEnd={(e) => onChange(asset.id, { x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        // Transformer mění scaleX/scaleY; magnitudu uložíme jako scale, flip zachováme.
        onChange(asset.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scale: Math.max(0.05, Math.abs(node.scaleX())),
        });
      }}
    />
  );
}

export default function AssetLayer({ mode }: { mode: EditorMode }) {
  const assets = useDocumentStore((s) => (mode === 'world' ? s.doc.world.assets : s.doc.dungeon.assets));
  const order = useDocumentStore((s) => (mode === 'world' ? s.doc.world.assetOrder : s.doc.dungeon.assetOrder));
  const apply = useDocumentStore((s) => s.apply);

  const tool = useEditorStore((s) => s.tool);
  const selection = useEditorStore((s) => s.selection);
  const setSelection = useEditorStore((s) => s.setSelection);

  const listening = tool === 'select';
  const trRef = useRef<Konva.Transformer>(null);
  const nodes = useRef<Map<string, Konva.Node>>(new Map());

  const register = (id: string, node: Konva.Node | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  };

  // Připoj Transformer k aktuálně vybraným prvkům
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const selected = selection.map((id) => nodes.current.get(id)).filter((n): n is Konva.Node => !!n);
    tr.nodes(selected);
    tr.getLayer()?.batchDraw();
  }, [selection, order, listening]);

  const onChange = (id: string, patch: Partial<PlacedAsset>) => {
    apply('Úprava prvku', (d) => {
      const scene = mode === 'world' ? d.world : d.dungeon;
      const a = scene.assets[id];
      if (a) Object.assign(a, patch);
    });
  };

  return (
    <Layer listening={listening}>
      {order.map((id) => {
        const a = assets[id];
        if (!a) return null;
        return (
          <AssetNode
            key={id}
            asset={a}
            listening={listening}
            onSelect={(sid) => setSelection([sid])}
            onChange={onChange}
            register={register}
          />
        );
      })}
      {listening && (
        <Transformer
          ref={trRef}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          keepRatio
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          anchorStroke="#c9913f"
          anchorFill="#0b0d12"
          anchorSize={8}
          borderStroke="#c9913f"
          borderDash={[4, 3]}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 8 ? oldBox : newBox)}
        />
      )}
    </Layer>
  );
}
