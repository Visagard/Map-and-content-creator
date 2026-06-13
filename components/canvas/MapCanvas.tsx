'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Line } from 'react-konva';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const SCALE_MIN = 0.05;
const SCALE_MAX = 16;

/** Drží-li uživatel mezerník (dočasný pan). */
function useSpaceHeld() {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        setHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return held;
}

interface ViewRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Adaptivní grid: kreslí jen viditelné čáry, při oddálení buňky zvětšuje. */
function GridLayer({
  view,
  baseCell,
  scale,
  color,
}: {
  view: ViewRect;
  baseCell: number;
  scale: number;
  color: string;
}) {
  const lines = useMemo(() => {
    let cell = baseCell;
    while ((view.right - view.left) / cell > 240) cell *= 2;

    const strokeWidth = 1 / scale; // 1px na obrazovce nezávisle na zoomu
    const out: React.ReactNode[] = [];
    const startX = Math.floor(view.left / cell) * cell;
    const startY = Math.floor(view.top / cell) * cell;

    for (let x = startX; x <= view.right; x += cell) {
      out.push(
        <Line
          key={`v${x}`}
          points={[x, view.top, x, view.bottom]}
          stroke={color}
          strokeWidth={strokeWidth}
          listening={false}
          perfectDrawEnabled={false}
        />,
      );
    }
    for (let y = startY; y <= view.bottom; y += cell) {
      out.push(
        <Line
          key={`h${y}`}
          points={[view.left, y, view.right, y]}
          stroke={color}
          strokeWidth={strokeWidth}
          listening={false}
          perfectDrawEnabled={false}
        />,
      );
    }
    return out;
  }, [view.left, view.top, view.right, view.bottom, baseCell, scale, color]);

  return <Layer listening={false}>{lines}</Layer>;
}

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);

  const mode = useEditorStore((s) => s.mode);
  const tool = useEditorStore((s) => s.tool);
  const camera = useEditorStore((s) => s.camera);
  const setCamera = useEditorStore((s) => s.setCamera);
  const setCursor = useEditorStore((s) => s.setCursor);
  const gridCell = useDocumentStore((s) => s.doc.dungeon.grid.cellSize);

  const spaceHeld = useSpaceHeld();
  const isPanTool = tool === 'pan' || spaceHeld;
  const panStart = useRef<{ px: number; py: number; camX: number; camY: number } | null>(null);

  // Měření kontejneru → rozměry Stage
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const view: ViewRect = useMemo(
    () => ({
      left: -camera.x / camera.scale,
      top: -camera.y / camera.scale,
      right: (size.width - camera.x) / camera.scale,
      bottom: (size.height - camera.y) / camera.scale,
    }),
    [camera.x, camera.y, camera.scale, size.width, size.height],
  );

  // Zoom ke kurzoru kolečkem
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const old = camera.scale;
    const worldX = (pointer.x - camera.x) / old;
    const worldY = (pointer.y - camera.y) / old;
    const factor = 1.1;
    const next = clamp(e.evt.deltaY > 0 ? old / factor : old * factor, SCALE_MIN, SCALE_MAX);
    setCamera({
      scale: next,
      x: pointer.x - worldX * next,
      y: pointer.y - worldY * next,
    });
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const middle = e.evt.button === 1;
    const left = e.evt.button === 0;
    if (middle || (left && isPanTool)) {
      const stage = stageRef.current;
      const p = stage?.getPointerPosition();
      if (!p) return;
      panStart.current = { px: p.x, py: p.y, camX: camera.x, camY: camera.y };
      setDragging(true);
      e.evt.preventDefault();
    }
    // Kreslicí nástroje (Land/Texture/Room…) se napojí ve fázi F3+.
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    if (!p) return;

    if (panStart.current) {
      setCamera({
        x: panStart.current.camX + (p.x - panStart.current.px),
        y: panStart.current.camY + (p.y - panStart.current.py),
      });
      return;
    }
    setCursor({
      x: (p.x - camera.x) / camera.scale,
      y: (p.y - camera.y) / camera.scale,
    });
  };

  const endPan = () => {
    panStart.current = null;
    setDragging(false);
  };

  const cursorClass = isPanTool
    ? dragging
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : 'cursor-default';

  const gridColor = mode === 'world' ? 'rgba(180,210,230,0.06)' : 'rgba(150,170,210,0.10)';
  const sceneEmpty = true; // ve fázi F2 je scéna vždy prázdná → ukaž uvítací hint

  return (
    <div ref={containerRef} className={`absolute inset-0 ${cursorClass}`}>
      {size.width > 0 && size.height > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={camera.x}
          y={camera.y}
          scaleX={camera.scale}
          scaleY={camera.scale}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endPan}
          onMouseLeave={() => {
            endPan();
            setCursor(null);
          }}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <GridLayer
            view={view}
            baseCell={mode === 'dungeon' ? gridCell : 256}
            scale={camera.scale}
            color={gridColor}
          />
          {/* Křížek v počátku (0,0) pro orientaci při posunu */}
          <Layer listening={false}>
            <Line
              points={[-12 / camera.scale, 0, 12 / camera.scale, 0]}
              stroke="rgba(201,145,63,0.5)"
              strokeWidth={1 / camera.scale}
              perfectDrawEnabled={false}
            />
            <Line
              points={[0, -12 / camera.scale, 0, 12 / camera.scale]}
              stroke="rgba(201,145,63,0.5)"
              strokeWidth={1 / camera.scale}
              perfectDrawEnabled={false}
            />
          </Layer>
        </Stage>
      )}

      {/* Uvítací overlay (HTML → ostrý, nezávislý na zoomu) */}
      {sceneEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="font-display text-2xl text-parchment/70">
              {mode === 'world' ? 'Namaluj svět' : 'Vykresli dungeon'}
            </div>
            <p className="mt-2 text-sm text-stone-400/70">
              {mode === 'world'
                ? 'Vyber štětec Pevnina (B) a začni malovat souš. Textury, voda a maskování přijdou v dalších fázích.'
                : 'Vyber nástroj Místnost (R) a kresli na grid. Procedurální generátor přijde později.'}
            </p>
            <p className="mt-3 text-xs text-ink-400">
              Tab přepíná World/Dungeon · Space+táhni posouvá · kolečko zoomuje
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
