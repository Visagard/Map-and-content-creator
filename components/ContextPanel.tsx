'use client';

import { useEditorStore } from '@/store/editorStore';
import { BRUSH_LIMITS } from '@/store/editorStore';
import { toolById } from '@/lib/tools';

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/5 px-4 py-3.5">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {title}
      </h3>
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

export default function ContextPanel() {
  const mode = useEditorStore((s) => s.mode);
  const tool = useEditorStore((s) => s.tool);
  const def = toolById(tool);

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

      {tool === 'textureBrush' && (
        <PanelSection title="Textury">
          <p className="text-xs text-ink-400">Knihovna textur přijde ve fázi F4 (Landmass Masking).</p>
        </PanelSection>
      )}

      {tool === 'asset' && (
        <PanelSection title="Knihovna assetů">
          <p className="text-xs text-ink-400">
            Drag-and-drop import a razítkování přijde ve fázi F5.
          </p>
        </PanelSection>
      )}

      <PanelSection title={mode === 'world' ? 'World Mode' : 'Dungeon Mode'}>
        <p className="text-xs leading-relaxed text-ink-400">
          {mode === 'world'
            ? 'Maluj pevninu štětcem, pak na ni nanášej textury. Voda zůstane vždy nedotčená díky maskování.'
            : 'Kresli místnosti a chodby na grid. Procedurální generátor přijde ve fázi F5.'}
        </p>
      </PanelSection>
    </aside>
  );
}
