'use client';

import { Undo2, Redo2, Download, Compass, Map as MapIcon, Mountain } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import type { EditorMode } from '@/lib/types';

function ModeToggle() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);

  const option = (id: EditorMode, label: string, Icon: typeof MapIcon) => {
    const active = mode === id;
    return (
      <button
        key={id}
        onClick={() => setMode(id)}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          active
            ? 'bg-ember text-obsidian shadow-sm'
            : 'text-stone-400 hover:text-stone-100'
        }`}
        title={`${label} (Tab přepíná)`}
      >
        <Icon size={15} />
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-ink-800 p-0.5 ring-1 ring-white/5">
      {option('world', 'World', MapIcon)}
      {option('dungeon', 'Dungeon', Mountain)}
    </div>
  );
}

export default function TopBar() {
  const name = useDocumentStore((s) => s.doc.name);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const canUndo = useDocumentStore((s) => s.past.length > 0);
  const canRedo = useDocumentStore((s) => s.future.length > 0);

  return (
    <header className="flex h-12 items-center justify-between border-b border-white/5 bg-ink-900 px-3">
      <div className="flex items-center gap-2.5">
        <Compass className="text-ember" size={20} />
        <span className="font-display text-lg tracking-wide text-parchment">Cartographer</span>
        <span className="ml-2 text-sm text-ink-400">·</span>
        <span className="text-sm text-stone-400">{name}</span>
      </div>

      <ModeToggle />

      <div className="flex items-center gap-1">
        <IconButton onClick={undo} disabled={!canUndo} title="Zpět (Ctrl+Z)">
          <Undo2 size={17} />
        </IconButton>
        <IconButton onClick={redo} disabled={!canRedo} title="Vpřed (Ctrl+Shift+Z)">
          <Redo2 size={17} />
        </IconButton>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <button
          disabled
          title="Export PNG/WebP (přijde ve fázi F5)"
          className="flex items-center gap-1.5 rounded-md bg-ink-700 px-3 py-1.5 text-sm text-stone-500 opacity-60"
        >
          <Download size={15} />
          Export
        </button>
      </div>
    </header>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-md p-1.5 text-stone-300 transition-colors hover:bg-ink-700 hover:text-stone-100 disabled:cursor-not-allowed disabled:text-ink-500 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
