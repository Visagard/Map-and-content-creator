'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { exportMap, estimateExportSize, type ExportOptions } from '@/lib/exportMap';

const RESOLUTIONS = [
  { label: '1K', edge: 1024 },
  { label: '2K', edge: 2048 },
  { label: '4K', edge: 4096 },
  { label: '8K', edge: 7680 },
];

export default function ExportDialog() {
  const open = useEditorStore((s) => s.exportOpen);
  const setExportOpen = useEditorStore((s) => s.setExportOpen);
  const mode = useEditorStore((s) => s.mode);
  const doc = useDocumentStore((s) => s.doc);

  const [edge, setEdge] = useState(4096);
  const [mime, setMime] = useState<'image/png' | 'image/webp'>('image/png');
  const [transparent, setTransparent] = useState(false);
  const [grid, setGrid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = useMemo(
    () => (open ? estimateExportSize(doc, mode, edge) : null),
    [open, doc, mode, edge],
  );

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const doExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const opts: ExportOptions = {
        longEdge: edge,
        mime,
        quality: 0.92,
        background: transparent ? 'transparent' : 'scene',
        grid,
      };
      const { blob, width, height } = await exportMap(doc, mode, opts);
      const ext = mime === 'image/webp' ? 'webp' : 'png';
      const safeName = (doc.name || 'mapa').replace(/[^\p{L}\p{N}_-]+/gu, '-');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}-${mode}-${width}x${height}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export se nezdařil.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={() => setExportOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-ink-800 p-5 shadow-panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-parchment">Export mapy</h2>
          <button onClick={() => setExportOpen(false)} className="rounded p-1 text-ink-400 hover:text-stone-100">
            <X size={18} />
          </button>
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-400">Rozlišení</label>
        <div className="mb-4 grid grid-cols-4 gap-1.5">
          {RESOLUTIONS.map((r) => (
            <button
              key={r.edge}
              onClick={() => setEdge(r.edge)}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                edge === r.edge ? 'bg-ember text-obsidian' : 'bg-ink-700 text-stone-300 hover:bg-ink-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-400">Formát</label>
        <div className="mb-4 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setMime('image/png')}
            className={`rounded-md py-2 text-sm transition-colors ${mime === 'image/png' ? 'bg-ember text-obsidian' : 'bg-ink-700 text-stone-300 hover:bg-ink-600'}`}
          >
            PNG
          </button>
          <button
            onClick={() => setMime('image/webp')}
            className={`rounded-md py-2 text-sm transition-colors ${mime === 'image/webp' ? 'bg-ember text-obsidian' : 'bg-ink-700 text-stone-300 hover:bg-ink-600'}`}
          >
            WebP
          </button>
        </div>

        <div className="mb-4 space-y-2">
          <label className="flex items-center gap-2 text-sm text-stone-300">
            <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="accent-ember" />
            Průhledné pozadí (bez {mode === 'world' ? 'vody' : 'podkladu'})
          </label>
          {mode === 'dungeon' && (
            <label className="flex items-center gap-2 text-sm text-stone-300">
              <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} className="accent-ember" />
              Zahrnout mřížku
            </label>
          )}
        </div>

        <div className="mb-4 rounded-md bg-ink-900 px-3 py-2 text-xs text-ink-400">
          {estimate ? (
            <>
              Výstup: <span className="tabular-nums text-stone-300">{estimate.width}×{estimate.height}px</span>
              {edge >= 7680 && <div className="mt-1 text-ember-dim">8K je náročné na paměť — chvíli to potrvá.</div>}
            </>
          ) : (
            <span className="text-ember-dim">Mapa je prázdná — není co exportovat.</span>
          )}
        </div>

        {error && <div className="mb-3 rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-300">{error}</div>}

        <button
          onClick={doExport}
          disabled={busy || !estimate}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-ember py-2.5 text-sm font-semibold text-obsidian transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {busy ? 'Generuji…' : 'Exportovat a stáhnout'}
        </button>
      </div>
    </div>
  );
}
