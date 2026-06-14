'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, Maximize2, Frame } from 'lucide-react';
import Konva from 'konva';
import { Stage, Layer, Line, Rect, Shape } from 'react-konva';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { useAssetLibStore } from '@/store/assetLibStore';
import BrushCursor from './BrushCursor';
import AssetLayer from './AssetLayer';
import LabelLayer from './LabelLayer';
import TextureStroke, { paintTextureStroke, BaseGround } from './TextureStroke';
import { computeDungeonGeometry, drawDungeon } from '@/lib/dungeonRender';
import { computeBounds } from '@/lib/exportMap';
import { getSeaShimmer } from '@/lib/textures';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const SCALE_MIN = 0.05;
const SCALE_MAX = 16;

// Pobřeží = soustředné hloubkové pásy vody kolem pevniny (mělčina → hloubka),
// vzhled à la Inkarnate. Kreslí se od nejširšího (nejtmavšího) po nejužší (mělčina).
const COAST_BANDS = [
  { w: 46, color: 'rgba(6,20,32,0.55)' },
  { w: 26, color: 'rgba(22,58,82,0.5)' },
  { w: 12, color: 'rgba(74,128,150,0.5)' },
  { w: 4, color: 'rgba(214,196,150,0.6)' }, // písčitá pláž u břehu
];
const COAST_MAX = 46;

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

function GridLayer({ view, baseCell, scale, color }: { view: ViewRect; baseCell: number; scale: number; color: string }) {
  const lines = useMemo(() => {
    let cell = baseCell;
    while ((view.right - view.left) / cell > 240) cell *= 2;
    const strokeWidth = 1 / scale;
    const out: React.ReactNode[] = [];
    const startX = Math.floor(view.left / cell) * cell;
    const startY = Math.floor(view.top / cell) * cell;
    for (let x = startX; x <= view.right; x += cell) {
      out.push(
        <Line key={`v${x}`} points={[x, view.top, x, view.bottom]} stroke={color} strokeWidth={strokeWidth} listening={false} perfectDrawEnabled={false} />,
      );
    }
    for (let y = startY; y <= view.bottom; y += cell) {
      out.push(
        <Line key={`h${y}`} points={[view.left, y, view.right, y]} stroke={color} strokeWidth={strokeWidth} listening={false} perfectDrawEnabled={false} />,
      );
    }
    return out;
  }, [view.left, view.top, view.right, view.bottom, baseCell, scale, color]);
  return <Layer listening={false}>{lines}</Layer>;
}

interface LiveStroke {
  kind: 'land' | 'erase' | 'texture';
  points: number[];
  size: number;
  textureId?: string;
  opacity?: number;
  softness?: number;
}

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const liveLineRef = useRef<Konva.Line>(null);
  const liveShapeRef = useRef<Konva.Shape>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);

  // --- store ---
  const mode = useEditorStore((s) => s.mode);
  const tool = useEditorStore((s) => s.tool);
  const camera = useEditorStore((s) => s.camera);
  const brushSize = useEditorStore((s) => s.brush.size);
  const textureId = useEditorStore((s) => s.brush.textureId);
  const brushOpacity = useEditorStore((s) => s.brush.opacity);
  const brushSoftness = useEditorStore((s) => s.brush.softness);
  const setCamera = useEditorStore((s) => s.setCamera);
  const setCursor = useEditorStore((s) => s.setCursor);
  const stampAssetId = useEditorStore((s) => s.stampAssetId);
  const stampRotation = useEditorStore((s) => s.stampRotation);
  const stampScale = useEditorStore((s) => s.stampScale);
  const stampScatter = useEditorStore((s) => s.stampScatter);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const setSelection = useEditorStore((s) => s.setSelection);
  const importFile = useAssetLibStore((s) => s.importFile);

  const apply = useDocumentStore((s) => s.apply);
  const worldAssetCount = useDocumentStore((s) => s.doc.world.assetOrder.length);
  const dungeonAssetCount = useDocumentStore((s) => s.doc.dungeon.assetOrder.length);
  const waterColor = useDocumentStore((s) => s.doc.world.waterStyle.color);
  const landColor = useDocumentStore((s) => s.doc.world.landColor);
  const baseTextureId = useDocumentStore((s) => s.doc.world.baseTextureId);
  const terrainStrokes = useDocumentStore((s) => s.doc.world.terrainStrokes);
  const terrainOrder = useDocumentStore((s) => s.doc.world.terrainOrder);
  const gridCell = useDocumentStore((s) => s.doc.dungeon.grid.cellSize);
  const rooms = useDocumentStore((s) => s.doc.dungeon.rooms);
  const roomOrder = useDocumentStore((s) => s.doc.dungeon.roomOrder);
  const corridors = useDocumentStore((s) => s.doc.dungeon.corridors);
  const corridorOrder = useDocumentStore((s) => s.doc.dungeon.corridorOrder);

  // --- interaction state ---
  const spaceHeld = useSpaceHeld();
  const isPanTool = tool === 'pan' || spaceHeld;
  const panStart = useRef<{ px: number; py: number; camX: number; camY: number } | null>(null);
  const liveStroke = useRef<LiveStroke | null>(null);
  const [stroking, setStroking] = useState(false);
  const roomStart = useRef<{ x: number; y: number } | null>(null);
  const [roomDraft, setRoomDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const corridorStart = useRef<{ x: number; y: number } | null>(null);
  const [corridorDraft, setCorridorDraft] = useState<number[] | null>(null);
  const corridorWidth = Math.max(Math.round(gridCell * 0.7), 16);

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

  const dungeonGeom = useMemo(
    () => computeDungeonGeometry({ rooms, roomOrder, corridors, corridorOrder }, gridCell),
    [rooms, roomOrder, corridors, corridorOrder, gridCell],
  );

  const toWorld = () => {
    const p = stageRef.current?.getPointerPosition();
    if (!p) return null;
    return { x: (p.x - camera.x) / camera.scale, y: (p.y - camera.y) / camera.scale };
  };

  // --- zoom ke kurzoru ---
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const old = camera.scale;
    const wx = (pointer.x - camera.x) / old;
    const wy = (pointer.y - camera.y) / old;
    const next = clamp(e.evt.deltaY > 0 ? old / 1.1 : old * 1.1, SCALE_MIN, SCALE_MAX);
    setCamera({ scale: next, x: pointer.x - wx * next, y: pointer.y - wy * next });
  };

  // --- commit helpers (každý = jeden krok historie) ---
  const finalizeStroke = () => {
    const s = liveStroke.current;
    liveStroke.current = null;
    setStroking(false);
    if (!s) return;
    if (s.points.length < 4) s.points.push(s.points[0] + 0.01, s.points[1] + 0.01); // klik = tečka
    const id = crypto.randomUUID();
    const label = s.kind === 'texture' ? 'Textura' : s.kind === 'erase' ? 'Mazání pevniny' : 'Tah pevninou';
    apply(label, (d) => {
      d.world.terrainStrokes[id] =
        s.kind === 'texture'
          ? { id, kind: 'texture', points: s.points, size: s.size, textureId: s.textureId!, opacity: s.opacity, softness: s.softness }
          : { id, kind: s.kind, points: s.points, size: s.size };
      d.world.terrainOrder.push(id);
    });
  };

  const finalizeRoom = () => {
    const draft = roomDraft;
    roomStart.current = null;
    setRoomDraft(null);
    if (!draft || draft.w < 1 || draft.h < 1) return;
    const id = crypto.randomUUID();
    apply('Místnost', (d) => {
      d.dungeon.rooms[id] = { id, x: draft.x, y: draft.y, width: draft.w, height: draft.h };
      d.dungeon.roomOrder.push(id);
    });
  };

  const finalizeCorridor = () => {
    const pts = corridorDraft;
    corridorStart.current = null;
    setCorridorDraft(null);
    if (!pts || pts.length < 4) return;
    if (Math.abs(pts[2] - pts[0]) < 1 && Math.abs(pts[3] - pts[1]) < 1) return;
    const id = crypto.randomUUID();
    apply('Chodba', (d) => {
      d.dungeon.corridors[id] = { id, points: pts, width: corridorWidth };
      d.dungeon.corridorOrder.push(id);
    });
  };

  const placeAsset = (assetId: string, x: number, y: number) => {
    let px = x;
    let py = y;
    if (mode === 'dungeon') {
      const h = gridCell / 2; // přichytávání na půlbuňky
      px = Math.round(x / h) * h;
      py = Math.round(y / h) * h;
    }
    const rotation = stampScatter ? Math.round(Math.random() * 360) : stampRotation;
    const scale = stampScatter ? stampScale * (0.7 + Math.random() * 0.6) : stampScale;
    const id = crypto.randomUUID();
    apply('Položení prvku', (d) => {
      const scene = mode === 'world' ? d.world : d.dungeon;
      scene.assets[id] = { id, assetId, x: px, y: py, rotation, scale, flipX: false };
      scene.assetOrder.push(id);
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const wx = (e.clientX - rect.left - camera.x) / camera.scale;
    const wy = (e.clientY - rect.top - camera.y) / camera.scale;

    const catId = e.dataTransfer.getData('text/cartographer-asset');
    if (catId) {
      placeAsset(catId, wx, wy);
      return;
    }
    // Soubory obrázků přetažené z disku → import do IndexedDB + položení
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    let i = 0;
    for (const f of files) {
      const id = await importFile(f);
      if (id) placeAsset(id, wx + i * 16, wy + i * 16);
      i++;
    }
  };

  // --- pointer handlers ---
  const handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const middle = e.evt.button === 1;
    const left = e.evt.button === 0;
    const w = toWorld();

    if (middle || (left && isPanTool)) {
      const p = stageRef.current?.getPointerPosition();
      if (!p) return;
      panStart.current = { px: p.x, py: p.y, camX: camera.x, camY: camera.y };
      setDragging(true);
      e.evt.preventDefault();
      return;
    }
    if (!left || !w) return;

    if (tool === 'select') {
      if (e.target === e.target.getStage()) clearSelection(); // klik do prázdna zruší výběr
      return;
    }
    if (tool === 'asset') {
      if (stampAssetId) placeAsset(stampAssetId, w.x, w.y);
      return;
    }
    if (mode === 'world' && tool === 'label') {
      const text = window.prompt('Text popisku:', 'Název');
      if (text) {
        const id = crypto.randomUUID();
        apply('Popisek', (d) => {
          d.world.labels[id] = { id, x: w.x, y: w.y, text, fontSize: 48, color: '#2a2018' };
          d.world.labelOrder.push(id);
        });
        setSelection([id]);
      }
      return;
    }

    if (mode === 'world' && (tool === 'landBrush' || tool === 'erase')) {
      liveStroke.current = { kind: tool === 'erase' ? 'erase' : 'land', points: [w.x, w.y], size: brushSize };
      setStroking(true);
    } else if (mode === 'world' && tool === 'textureBrush') {
      if (!textureId) return;
      liveStroke.current = {
        kind: 'texture',
        points: [w.x, w.y],
        size: brushSize,
        textureId,
        opacity: brushOpacity,
        softness: brushSoftness,
      };
      setStroking(true);
    } else if (mode === 'dungeon' && tool === 'room') {
      const snap = (v: number) => Math.round(v / gridCell) * gridCell;
      roomStart.current = { x: snap(w.x), y: snap(w.y) };
      setRoomDraft({ x: roomStart.current.x, y: roomStart.current.y, w: 0, h: 0 });
    } else if (mode === 'dungeon' && tool === 'corridor') {
      const snap = (v: number) => Math.round(v / gridCell) * gridCell;
      corridorStart.current = { x: snap(w.x), y: snap(w.y) };
      setCorridorDraft([corridorStart.current.x, corridorStart.current.y, corridorStart.current.x, corridorStart.current.y]);
    }
  };

  const handlePointerMove = () => {
    const p = stageRef.current?.getPointerPosition();
    if (!p) return;

    if (panStart.current) {
      setCamera({
        x: panStart.current.camX + (p.x - panStart.current.px),
        y: panStart.current.camY + (p.y - panStart.current.py),
      });
      return; // během panu kurzor neaktualizujeme (zbytečné store zápisy)
    }

    const w = { x: (p.x - camera.x) / camera.scale, y: (p.y - camera.y) / camera.scale };
    setCursor(w);

    if (liveStroke.current) {
      liveStroke.current.points.push(w.x, w.y);
      if (liveStroke.current.kind === 'texture') {
        liveShapeRef.current?.getLayer()?.batchDraw();
      } else {
        const line = liveLineRef.current;
        if (line) {
          line.points(liveStroke.current.points);
          line.getLayer()?.batchDraw();
        }
      }
      return;
    }

    if (corridorStart.current) {
      const snap = (v: number) => Math.round(v / gridCell) * gridCell;
      let ex = snap(w.x);
      let ey = snap(w.y);
      const sx = corridorStart.current.x;
      const sy = corridorStart.current.y;
      if (Math.abs(ex - sx) >= Math.abs(ey - sy)) ey = sy;
      else ex = sx;
      setCorridorDraft([sx, sy, ex, ey]);
      return;
    }

    if (roomStart.current) {
      const snap = (v: number) => Math.round(v / gridCell) * gridCell;
      const ex = snap(w.x);
      const ey = snap(w.y);
      const sx = roomStart.current.x;
      const sy = roomStart.current.y;
      setRoomDraft({ x: Math.min(sx, ex), y: Math.min(sy, ey), w: Math.abs(ex - sx), h: Math.abs(ey - sy) });
    }
  };

  const handlePointerUp = () => {
    if (panStart.current) {
      panStart.current = null;
      setDragging(false);
      return;
    }
    if (liveStroke.current) finalizeStroke();
    else if (roomStart.current) finalizeRoom();
    else if (corridorStart.current) finalizeCorridor();
  };

  const handlePointerLeave = () => {
    if (panStart.current) {
      panStart.current = null;
      setDragging(false);
    }
    if (liveStroke.current) finalizeStroke();
    else if (roomStart.current) finalizeRoom();
    else if (corridorStart.current) finalizeCorridor();
    setCursor(null);
  };

  // --- zoom ovládání ---
  const zoomAround = (sx: number, sy: number, next: number) => {
    const old = camera.scale;
    const wx = (sx - camera.x) / old;
    const wy = (sy - camera.y) / old;
    setCamera({ scale: next, x: sx - wx * next, y: sy - wy * next });
  };
  const zoomBy = (factor: number) =>
    zoomAround(size.width / 2, size.height / 2, clamp(camera.scale * factor, SCALE_MIN, SCALE_MAX));
  const fitToContent = () => {
    const b = computeBounds(useDocumentStore.getState().doc, mode);
    if (!b || size.width === 0) {
      setCamera({ x: size.width / 2, y: size.height / 2, scale: 1 });
      return;
    }
    const pad = 80;
    const W = b.maxX - b.minX + pad * 2;
    const H = b.maxY - b.minY + pad * 2;
    const scale = clamp(Math.min(size.width / W, size.height / H), SCALE_MIN, SCALE_MAX);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    setCamera({ scale, x: size.width / 2 - cx * scale, y: size.height / 2 - cy * scale });
  };

  // --- odvozené ---
  const isDrawingTool =
    (mode === 'world' && (tool === 'landBrush' || tool === 'erase' || tool === 'textureBrush')) ||
    (mode === 'dungeon' && (tool === 'room' || tool === 'corridor'));
  const cursorClass = isPanTool
    ? dragging
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : tool === 'asset' && stampAssetId
      ? 'cursor-copy'
      : tool === 'label'
        ? 'cursor-text'
        : isDrawingTool
          ? 'cursor-crosshair'
          : 'cursor-default';
  const gridColor = mode === 'world' ? 'rgba(180,210,230,0.06)' : 'rgba(20,24,32,0.45)';
  const sceneEmpty =
    mode === 'world'
      ? terrainOrder.length === 0 && worldAssetCount === 0
      : roomOrder.length === 0 && dungeonAssetCount === 0;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 touch-none ${cursorClass}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          {mode === 'world' ? (
            <>
              {/* Voda — vlastní vrstva pod terénem (klíč pro maskování v F4) */}
              <Layer listening={false}>
                <Rect x={view.left} y={view.top} width={view.right - view.left} height={view.bottom - view.top} fill={waterColor} perfectDrawEnabled={false} />
                <Shape
                  listening={false}
                  perfectDrawEnabled={false}
                  sceneFunc={(ctx) => {
                    const c = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
                    const pat = c.createPattern(getSeaShimmer(), 'repeat');
                    if (pat) {
                      c.fillStyle = pat;
                      c.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
                    }
                  }}
                />
              </Layer>
              {/* Pobřeží — soustředné hloubkové pásy pod terénem (mělčina → hloubka) */}
              <Layer listening={false}>
                {COAST_BANDS.map((band, bi) =>
                  terrainOrder.map((id) => {
                    const s = terrainStrokes[id];
                    if (!s || s.kind !== 'land') return null;
                    return (
                      <Line
                        key={`b${bi}-${id}`}
                        points={s.points}
                        stroke={band.color}
                        strokeWidth={s.size + band.w * 2}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                        perfectDrawEnabled={false}
                      />
                    );
                  }),
                )}
                {terrainOrder.map((id) => {
                  const s = terrainStrokes[id];
                  if (!s || s.kind !== 'erase') return null;
                  return (
                    <Line
                      key={`be-${id}`}
                      points={s.points}
                      stroke="#000"
                      strokeWidth={s.size + COAST_MAX * 2}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation="destination-out"
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                  );
                })}
              </Layer>
              {/* Terén — DVA průchody ve stejné vrstvě:
                  1) pevnina + mazání (definuje alfa masku pevniny)
                  2) textury se source-atop → drží se jen na pevnině, do vody se nepřelijí */}
              <Layer listening={false}>
                {/* průchod 1: pevnina / mazání (chronologicky) */}
                {terrainOrder.map((id) => {
                  const s = terrainStrokes[id];
                  if (!s || s.kind === 'texture') return null;
                  return (
                    <Line
                      key={id}
                      points={s.points}
                      stroke={s.kind === 'erase' ? '#000' : landColor}
                      strokeWidth={s.size}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={s.kind === 'erase' ? 'destination-out' : undefined}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                  );
                })}
                {stroking && liveStroke.current && liveStroke.current.kind !== 'texture' && (
                  <Line
                    ref={liveLineRef}
                    points={liveStroke.current.points}
                    stroke={liveStroke.current.kind === 'erase' ? '#000' : landColor}
                    strokeWidth={liveStroke.current.size}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={liveStroke.current.kind === 'erase' ? 'destination-out' : undefined}
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                )}

                {/* podklad pevniny — souš se vždy texturuje (source-atop) */}
                <BaseGround view={view} textureId={baseTextureId} />

                {/* průchod 2: textury (source-atop) */}
                {terrainOrder.map((id) => {
                  const s = terrainStrokes[id];
                  if (!s || s.kind !== 'texture') return null;
                  return (
                    <TextureStroke
                      key={id}
                      points={s.points}
                      size={s.size}
                      textureId={s.textureId}
                      opacity={s.opacity}
                      softness={s.softness}
                    />
                  );
                })}
                {stroking && liveStroke.current && liveStroke.current.kind === 'texture' && (
                  <Shape
                    ref={liveShapeRef}
                    globalCompositeOperation="source-atop"
                    listening={false}
                    perfectDrawEnabled={false}
                    sceneFunc={(ctx, shape) => {
                      const s = liveStroke.current;
                      if (s && s.kind === 'texture')
                        paintTextureStroke(ctx, shape, s.points, s.size, s.textureId!, s.opacity, s.softness);
                    }}
                  />
                )}
              </Layer>
            </>
          ) : (
            // Dungeon — sloučená podlaha + jeden obrys zdí (Dungeon Scrawl styl) + živý náhled
            <Layer listening={false}>
              <Shape
                sceneFunc={(ctx) =>
                  drawDungeon(
                    (ctx as unknown as { _context: CanvasRenderingContext2D })._context,
                    dungeonGeom,
                    { grid: true, scale: camera.scale * ((typeof window !== 'undefined' && window.devicePixelRatio) || 1) },
                  )
                }
                listening={false}
                perfectDrawEnabled={false}
              />
              {roomDraft && (roomDraft.w > 0 || roomDraft.h > 0) && (
                <Rect
                  x={roomDraft.x}
                  y={roomDraft.y}
                  width={roomDraft.w}
                  height={roomDraft.h}
                  fill="rgba(201,145,63,0.2)"
                  stroke="#c9913f"
                  strokeWidth={2 / camera.scale}
                  dash={[8 / camera.scale, 4 / camera.scale]}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
              {corridorDraft && (
                <Line
                  points={corridorDraft}
                  stroke="rgba(201,145,63,0.45)"
                  strokeWidth={corridorWidth}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
            </Layer>
          )}

          {mode === 'world' && <GridLayer view={view} baseCell={256} scale={camera.scale} color={gridColor} />}

          {/* Položené prvky (sdílené bitmapy, výběr/transform v Select toolu) */}
          <AssetLayer mode={mode} />

          {/* Popisky (jen World) */}
          {mode === 'world' && <LabelLayer />}

          {/* Overlay: počátek + ghost štětce */}
          <Layer listening={false}>
            <Line points={[-12 / camera.scale, 0, 12 / camera.scale, 0]} stroke="rgba(201,145,63,0.5)" strokeWidth={1 / camera.scale} perfectDrawEnabled={false} />
            <Line points={[0, -12 / camera.scale, 0, 12 / camera.scale]} stroke="rgba(201,145,63,0.5)" strokeWidth={1 / camera.scale} perfectDrawEnabled={false} />
            <BrushCursor />
          </Layer>
        </Stage>
      )}

      {sceneEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="font-display text-2xl text-parchment/70">{mode === 'world' ? 'Namaluj svět' : 'Vykresli dungeon'}</div>
            <p className="mt-2 text-sm text-stone-400/70">
              {mode === 'world'
                ? 'Vyber štětec Pevnina (B) a táhni po vodě. Gumou (E) maska zase mizí. Textury a maskování přijdou v další fázi.'
                : 'Vyber nástroj Místnost (R) a táhni — vznikne místnost zarovnaná na grid.'}
            </p>
            <p className="mt-3 text-xs text-ink-400">Tab přepíná World/Dungeon · Space+táhni posouvá · kolečko zoomuje · Ctrl+Z zpět</p>
          </div>
        </div>
      )}

      {/* Plovoucí ovládání zoomu */}
      <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-lg bg-ink-800/90 text-stone-300 shadow-panel ring-1 ring-white/10 backdrop-blur">
        <ZoomBtn title="Přiblížit (kolečko)" onClick={() => zoomBy(1.25)}>
          <Plus size={16} />
        </ZoomBtn>
        <button
          onClick={() => zoomAround(size.width / 2, size.height / 2, 1)}
          title="Reset na 100 %"
          className="border-y border-white/5 px-1 py-1 text-[10px] tabular-nums hover:bg-ink-700"
        >
          {Math.round(camera.scale * 100)}%
        </button>
        <ZoomBtn title="Oddálit (kolečko)" onClick={() => zoomBy(1 / 1.25)}>
          <Minus size={16} />
        </ZoomBtn>
        <ZoomBtn title="Přizpůsobit obsahu" onClick={fitToContent}>
          <Frame size={15} />
        </ZoomBtn>
        <ZoomBtn title="Reset pohledu" onClick={() => setCamera({ x: 0, y: 0, scale: 1 })}>
          <Maximize2 size={14} />
        </ZoomBtn>
      </div>
    </div>
  );
}

function ZoomBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="flex h-8 w-8 items-center justify-center hover:bg-ink-700">
      {children}
    </button>
  );
}
