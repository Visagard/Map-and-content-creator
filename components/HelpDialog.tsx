'use client';

import { X } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { TOOLS } from '@/lib/tools';

const GLOBAL: [string, string][] = [
  ['Tab', 'Přepnout World / Dungeon'],
  ['Ctrl+Z / Ctrl+Shift+Z', 'Zpět / Vpřed'],
  ['[ / ]', 'Zmenšit / zvětšit štětec'],
  ['Del / Esc', 'Smazat výběr / zrušit výběr'],
  ['Q / E', 'Otočit vybraný prvek (Select tool)'],
  ['Kolečko nad výběrem', 'Otočit vybraný prvek'],
  ['Ctrl+E', 'Export do PNG/WebP'],
  ['Mezerník + táhni', 'Posun plátna'],
  ['Kolečko myši', 'Zoom ke kurzoru'],
  ['?', 'Zobrazit/skrýt tuto nápovědu'],
];

function Row({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-stone-300">{label}</span>
      <kbd className="rounded bg-ink-700 px-1.5 py-0.5 text-[11px] font-medium text-stone-200 ring-1 ring-white/10">{k}</kbd>
    </div>
  );
}

export default function HelpDialog() {
  const open = useEditorStore((s) => s.helpOpen);
  const setOpen = useEditorStore((s) => s.setHelpOpen);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setOpen(false)}>
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-ink-800 p-5 shadow-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-parchment">Klávesové zkratky</h2>
          <button onClick={() => setOpen(false)} className="rounded p-1 text-ink-400 hover:text-stone-100">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
          <div>
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Nástroje</h3>
            {TOOLS.map((t) => (
              <Row key={t.id} k={t.shortcut} label={t.label} />
            ))}
          </div>
          <div>
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Obecné</h3>
            {GLOBAL.map(([k, label]) => (
              <Row key={k} k={k} label={label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
