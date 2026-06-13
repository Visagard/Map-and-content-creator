'use client';

import dynamic from 'next/dynamic';
import TopBar from './TopBar';
import ToolRail from './ToolRail';
import ContextPanel from './ContextPanel';
import StatusBar from './StatusBar';
import { useEffect } from 'react';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { useAutosave } from '@/lib/useAutosave';
import { useEditorStore } from '@/store/editorStore';
import { useAssetLibStore } from '@/store/assetLibStore';

// Konva potřebuje `window` → načítáme jen na klientu, nikdy při SSR/exportu.
const MapCanvas = dynamic(() => import('./canvas/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-ink-400">
      Načítám plátno…
    </div>
  ),
});

export default function EditorShell() {
  useKeyboardShortcuts();
  useAutosave();
  const mode = useEditorStore((s) => s.mode);

  // Načti dříve nahrané vlastní assety z IndexedDB
  useEffect(() => {
    useAssetLibStore.getState().loadAll();
  }, []);

  return (
    <div className="grid h-screen w-screen grid-rows-[auto_1fr_auto] bg-obsidian text-stone-200">
      <TopBar />
      <div className="grid min-h-0 grid-cols-[56px_1fr_300px] overflow-hidden">
        <ToolRail />
        <main
          className="relative min-w-0 overflow-hidden"
          // Barva pozadí podle módu: oceán (World) vs. obsidián (Dungeon)
          style={{
            background:
              mode === 'world'
                ? 'radial-gradient(circle at 50% 40%, #1b3d54 0%, #0f2738 70%, #0a1a26 100%)'
                : 'radial-gradient(circle at 50% 40%, #14171f 0%, #0b0d12 80%)',
          }}
        >
          <MapCanvas />
        </main>
        <ContextPanel />
      </div>
      <StatusBar />
    </div>
  );
}
