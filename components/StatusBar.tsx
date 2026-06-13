'use client';

import { useEditorStore } from '@/store/editorStore';
import { toolById } from '@/lib/tools';

export default function StatusBar() {
  const mode = useEditorStore((s) => s.mode);
  const tool = useEditorStore((s) => s.tool);
  const scale = useEditorStore((s) => s.camera.scale);
  const brushSize = useEditorStore((s) => s.brush.size);
  const cursor = useEditorStore((s) => s.cursor);
  const resetCamera = useEditorStore((s) => s.resetCamera);

  const def = toolById(tool);

  return (
    <footer className="flex h-7 items-center justify-between border-t border-white/5 bg-ink-900 px-3 text-xs text-ink-400">
      <div className="flex items-center gap-4">
        <span className="capitalize text-stone-400">{mode}</span>
        <span>·</span>
        <span>{def?.label ?? tool}</span>
        <span>·</span>
        <span>Štětec {brushSize}px</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="tabular-nums">
          {cursor ? `${Math.round(cursor.x)}, ${Math.round(cursor.y)}` : '—, —'}
        </span>
        <span>·</span>
        <button
          onClick={resetCamera}
          title="Klikni pro reset zoomu a posunu"
          className="tabular-nums transition-colors hover:text-stone-100"
        >
          {Math.round(scale * 100)}%
        </button>
        <span>·</span>
        <span className="text-ink-500">Space+táhni = posun · Ctrl/⌘+kolečko = zoom</span>
      </div>
    </footer>
  );
}
