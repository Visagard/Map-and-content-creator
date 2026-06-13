'use client';

import { useEditorStore } from '@/store/editorStore';
import { toolsForMode } from '@/lib/tools';

export default function ToolRail() {
  const mode = useEditorStore((s) => s.mode);
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const tools = toolsForMode(mode);

  return (
    <nav className="flex flex-col items-center gap-1 border-r border-white/5 bg-ink-900 py-2 shadow-rail">
      {tools.map((t) => {
        const Icon = t.icon;
        const active = tool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.shortcut}) — ${t.hint}`}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              active
                ? 'bg-ember/15 text-ember ring-1 ring-ember/40'
                : 'text-stone-400 hover:bg-ink-700 hover:text-stone-100'
            }`}
          >
            <Icon size={19} />
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-ember" />
            )}
            {/* Klávesová zkratka jako mini odznak */}
            <span className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] font-medium text-ink-400 group-hover:text-stone-500">
              {t.shortcut}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
