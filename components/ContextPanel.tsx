'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, RotateCcw, RotateCw, Wand2 } from 'lucide-react';
import { useEditorStore, BRUSH_LIMITS } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { toolById } from '@/lib/tools';
import { TEXTURES, getTextureCanvas, type TextureDef } from '@/lib/textures';
import { generateDungeon } from '@/lib/dungeonGenerator';
import AssetPanel from './AssetPanel';

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/5 px-4 py-3.5">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{title}</h3>
      {children}
    </section>
  );
}

function BrushSettings() {
  const size = useEditorStore((s) => s.brush.size);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  return (
    <PanelSection title="Štětec">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-400">Velikost</span>
        <span className="tabular-nums text-stone-200">{size}px</span>
      </div>
      <input
        type="range"
        min={BRUSH_LIMITS.min}
        max={BRUSH_LIMITS.max}
        value={size}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        className="range-ember mt-2"
      />
      <p className="mt-2 text-xs text-ink-400">Zkratky: [ zmenší · ] zvětší</p>
    </PanelSection>
  );
}

function TextureSwatch({ def, active, onClick }: { def: TextureDef; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(getTextureCanvas(def.id), 0, 0, c.width, c.height);
  }, [def.id]);
  return (
    <button
      onClick={onClick}
      title={def.name}
      className={`relative aspect-square overflow-hidden rounded-md ring-1 transition-shadow ${
        active ? 'ring-2 ring-ember' : 'ring-white/10 hover:ring-white/30'
      }`}
    >
      <canvas ref={ref} width={48} height={48} className="h-full w-full" />
      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-0.5 text-center text-[9px] text-stone-100">
        {def.name}
      </span>
    </button>
  );
}

function TextureSettings() {
  const textureId = useEditorStore((s) => s.brush.textureId);
  const setBrushTexture = useEditorStore((s) => s.setBrushTexture);
  const opacity = useEditorStore((s) => s.brush.opacity);
  const softness = useEditorStore((s) => s.brush.softness);
  const setBrushOpacity = useEditorStore((s) => s.setBrushOpacity);
  const setBrushSoftness = useEditorStore((s) => s.setBrushSoftness);
  return (
    <PanelSection title="Textura">
      <div className="grid grid-cols-4 gap-1.5">
        {TEXTURES.map((t) => (
          <TextureSwatch key={t.id} def={t} active={textureId === t.id} onClick={() => setBrushTexture(t.id)} />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-stone-400">Krytí</span>
        <span className="tabular-nums text-stone-200">{Math.round(opacity * 100)}%</span>
      </div>
      <input
        type="range"
        min={5}
        max={100}
        value={Math.round(opacity * 100)}
        onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
        className="range-ember mt-1.5"
      />

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-stone-400">Měkkost okraje</span>
        <span className="tabular-nums text-stone-200">{Math.round(softness * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(softness * 100)}
        onChange={(e) => setBrushSoftness(Number(e.target.value) / 100)}
        className="range-ember mt-1.5"
      />

      <p className="mt-2 text-xs text-ink-400">
        Textura se nanáší jen na pevninu. Měkkost prolíná biomy, krytí vrství postupně.
      </p>
    </PanelSection>
  );
}

function DungeonGenerator() {
  const apply = useDocumentStore((s) => s.apply);
  const cell = useDocumentStore((s) => s.doc.dungeon.grid.cellSize);
  const [count, setCount] = useState(10);

  const generate = () => {
    const { rooms, corridors } = generateDungeon({ roomCount: count, cell });
    apply('Generování dungeonu', (d) => {
      d.dungeon.rooms = {};
      d.dungeon.roomOrder = [];
      d.dungeon.corridors = {};
      d.dungeon.corridorOrder = [];
      for (const r of rooms) {
        d.dungeon.rooms[r.id] = r;
        d.dungeon.roomOrder.push(r.id);
      }
      for (const c of corridors) {
        d.dungeon.corridors[c.id] = c;
        d.dungeon.corridorOrder.push(c.id);
      }
    });
  };

  return (
    <PanelSection title="Generátor dungeonu">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-400">Počet místností</span>
        <span className="tabular-nums text-stone-200">{count}</span>
      </div>
      <input
        type="range"
        min={4}
        max={24}
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        className="range-ember mt-2"
      />
      <button
        onClick={generate}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-ember py-2 text-sm font-semibold text-obsidian transition-opacity hover:opacity-90"
      >
        <Wand2 size={15} />
        Vygenerovat
      </button>
      <p className="mt-2 text-xs text-ink-400">Nahradí stávající místnosti a chodby. Vratné přes Ctrl+Z.</p>
    </PanelSection>
  );
}

function LabelEditor({ id }: { id: string }) {
  const apply = useDocumentStore((s) => s.apply);
  const label = useDocumentStore((s) => s.doc.world.labels[id]);
  const deleteAssets = useDocumentStore((s) => s.deleteAssets);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const [text, setText] = useState(label?.text ?? '');
  useEffect(() => {
    setText(label?.text ?? '');
  }, [id, label?.text]);
  if (!label) return null;

  const commitText = () => {
    if (text !== label.text) apply('Text popisku', (d) => { const l = d.world.labels[id]; if (l) l.text = text; });
  };
  const setSize = (n: number) => apply('Velikost popisku', (d) => { const l = d.world.labels[id]; if (l) l.fontSize = n; });
  const setColor = (c: string) => apply('Barva popisku', (d) => { const l = d.world.labels[id]; if (l) l.color = c; });

  return (
    <PanelSection title="Popisek">
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        className="w-full rounded-md bg-ink-800 p-2 text-sm text-stone-100 outline-none ring-1 ring-white/5 focus:ring-ember/40"
      />
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-stone-400">Velikost</span>
        <span className="tabular-nums text-stone-200">{Math.round(label.fontSize)}</span>
      </div>
      <input
        type="range"
        min={12}
        max={180}
        value={label.fontSize}
        onChange={(e) => setSize(Number(e.target.value))}
        className="range-ember mt-1.5"
      />
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-stone-400">Barva</span>
        <input type="color" value={label.color} onChange={(e) => setColor(e.target.value)} className="h-7 w-10 cursor-pointer rounded bg-transparent" />
      </div>
      <button
        onClick={() => {
          deleteAssets('world', [id]);
          clearSelection();
        }}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-red-900/40 py-2 text-sm text-red-300 hover:bg-red-900/60"
      >
        <Trash2 size={15} /> Smazat popisek
      </button>
      <p className="mt-2 text-xs text-ink-400">Dvojklik na popisek na plátně upraví text, tažením přesuneš.</p>
    </PanelSection>
  );
}

function SelectionProperties() {
  const mode = useEditorStore((s) => s.mode);
  const selection = useEditorStore((s) => s.selection);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const apply = useDocumentStore((s) => s.apply);
  const deleteAssets = useDocumentStore((s) => s.deleteAssets);
  const isLabel = useDocumentStore((s) => mode === 'world' && selection.length === 1 && !!s.doc.world.labels[selection[0]]);

  if (selection.length === 0) {
    return (
      <PanelSection title="Výběr">
        <p className="text-xs text-ink-400">Klikni na položený prvek pro výběr, posun, otočení a změnu velikosti. Del smaže.</p>
      </PanelSection>
    );
  }

  if (isLabel) return <LabelEditor id={selection[0]} />;

  const rotate = (delta: number) =>
    apply('Otočení prvku', (d) => {
      const scene = mode === 'world' ? d.world : d.dungeon;
      selection.forEach((id) => {
        const a = scene.assets[id];
        if (a) a.rotation = (a.rotation + delta) % 360;
      });
    });

  const remove = () => {
    deleteAssets(mode, selection);
    clearSelection();
  };

  return (
    <PanelSection title={`Výběr (${selection.length})`}>
      <div className="flex gap-1.5">
        <button onClick={() => rotate(-15)} className="flex-1 rounded-md bg-ink-700 py-1.5 text-stone-200 hover:bg-ink-600" title="Otočit o -15°">
          <RotateCcw size={15} className="mx-auto" />
        </button>
        <button onClick={() => rotate(15)} className="flex-1 rounded-md bg-ink-700 py-1.5 text-stone-200 hover:bg-ink-600" title="Otočit o +15°">
          <RotateCw size={15} className="mx-auto" />
        </button>
        <button onClick={remove} className="flex-1 rounded-md bg-red-900/40 py-1.5 text-red-300 hover:bg-red-900/60" title="Smazat (Del)">
          <Trash2 size={15} className="mx-auto" />
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-400">Rohové úchyty mění velikost, horní úchyt otáčí.</p>
    </PanelSection>
  );
}

export default function ContextPanel() {
  const mode = useEditorStore((s) => s.mode);
  const tool = useEditorStore((s) => s.tool);
  const def = toolById(tool);

  // Asset tool → celý panel patří knihovně prvků
  if (tool === 'asset') {
    return (
      <aside className="flex flex-col overflow-hidden border-l border-white/5 bg-ink-900 shadow-panel">
        <AssetPanel />
      </aside>
    );
  }

  const showsBrush = tool === 'landBrush' || tool === 'textureBrush' || tool === 'erase';

  return (
    <aside className="flex flex-col overflow-y-auto border-l border-white/5 bg-ink-900 shadow-panel">
      <PanelSection title="Nástroj">
        <div className="flex items-center gap-2.5">
          {def && <def.icon size={18} className="text-ember" />}
          <div>
            <div className="text-sm font-medium text-stone-100">{def?.label ?? tool}</div>
            <div className="text-xs text-ink-400">{def?.hint}</div>
          </div>
        </div>
      </PanelSection>

      {showsBrush && <BrushSettings />}
      {tool === 'textureBrush' && <TextureSettings />}
      {(tool === 'select' || tool === 'label') && <SelectionProperties />}
      {mode === 'dungeon' && <DungeonGenerator />}

      <PanelSection title={mode === 'world' ? 'World Mode' : 'Dungeon Mode'}>
        <p className="text-xs leading-relaxed text-ink-400">
          {mode === 'world'
            ? 'Maluj pevninu štětcem, pokládej prvky z knihovny (A). Textury a maskování přijdou v další fázi.'
            : 'Kresli místnosti a pokládej prvky z knihovny (A). Procedurální generátor přijde později.'}
        </p>
      </PanelSection>
    </aside>
  );
}
