'use client';

import { useMemo, useRef, useState } from 'react';
import { Search, Upload, Trash2, X } from 'lucide-react';
import {
  CATEGORIES,
  searchCatalog,
  normalize,
  CATALOG_COUNT,
  type CategoryId,
} from '@/lib/assetCatalog';
import { useEditorStore } from '@/store/editorStore';
import { useAssetLibStore } from '@/store/assetLibStore';

type Filter = CategoryId | 'all' | 'moje';

export default function AssetPanel() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const fileInput = useRef<HTMLInputElement>(null);

  const stampAssetId = useEditorStore((s) => s.stampAssetId);
  const pickStampAsset = useEditorStore((s) => s.pickStampAsset);

  const customs = useAssetLibStore((s) => s.customs);
  const images = useAssetLibStore((s) => s.images);
  const importFile = useAssetLibStore((s) => s.importFile);
  const removeCustom = useAssetLibStore((s) => s.removeCustom);

  const customResults = useMemo(() => {
    const q = normalize(query);
    return customs.filter((c) => !q || normalize(c.name).includes(q));
  }, [customs, query]);

  const catalogResults = useMemo(() => {
    if (filter === 'moje') return [];
    return searchCatalog(query, filter === 'all' ? 'all' : filter);
  }, [query, filter]);

  const showCustom = filter === 'all' || filter === 'moje';
  const total = catalogResults.length + (showCustom ? customResults.length : 0);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let firstId: string | null = null;
    for (const f of Array.from(files)) {
      const id = await importFile(f);
      if (id && !firstId) firstId = id;
    }
    if (firstId) pickStampAsset(firstId);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Hledání */}
      <div className="border-b border-white/5 px-3 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat prvek podle názvu…"
            className="w-full rounded-md bg-ink-800 py-1.5 pl-8 pr-7 text-sm text-stone-100 outline-none ring-1 ring-white/5 placeholder:text-ink-400 focus:ring-ember/40"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-stone-200"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Kategorie */}
        <div className="mt-2 flex flex-wrap gap-1">
          <CatChip active={filter === 'all'} onClick={() => setFilter('all')} label="Vše" icon="✳️" />
          {CATEGORIES.map((c) => (
            <CatChip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
              label={c.label}
              icon={c.icon}
            />
          ))}
          <CatChip active={filter === 'moje'} onClick={() => setFilter('moje')} label="Moje" icon="📁" />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-ink-400">
            {query || filter !== 'all' ? `Nalezeno: ${total}` : `${CATALOG_COUNT + customs.length} prvků`}
          </span>
          <button
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-1 rounded-md bg-ink-700 px-2 py-1 text-[11px] text-stone-200 hover:bg-ink-600"
            title="Nahraj vlastní obrázek (PNG/WebP) z disku"
          >
            <Upload size={12} /> Nahrát
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Mřížka prvků */}
      <div
        className="grid flex-1 auto-rows-min grid-cols-4 content-start gap-1.5 overflow-y-auto p-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        {showCustom &&
          customResults.map((c) => {
            const img = images[c.id];
            const active = stampAssetId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => pickStampAsset(c.id)}
                title={c.name}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/cartographer-asset', c.id)}
                className={`group relative flex aspect-square items-center justify-center rounded-md p-1 ring-1 transition-colors ${
                  active ? 'bg-ember/15 ring-ember/50' : 'bg-ink-800 ring-white/5 hover:bg-ink-700'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL z IndexedDB, ne next/image */}
                {img && <img src={img.src} alt={c.name} className="max-h-full max-w-full object-contain" />}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustom(c.id);
                  }}
                  className="absolute right-0.5 top-0.5 hidden rounded bg-black/60 p-0.5 text-red-300 group-hover:block"
                >
                  <Trash2 size={11} />
                </span>
              </button>
            );
          })}

        {catalogResults.map((a) => {
          const active = stampAssetId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => pickStampAsset(a.id)}
              title={a.name}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/cartographer-asset', a.id)}
              className={`flex aspect-square items-center justify-center rounded-md text-2xl ring-1 transition-colors ${
                active ? 'bg-ember/15 ring-ember/50' : 'bg-ink-800 ring-white/5 hover:bg-ink-700'
              }`}
            >
              <span style={{ lineHeight: 1 }}>{a.emoji}</span>
            </button>
          );
        })}

        {total === 0 && (
          <p className="col-span-4 px-2 py-6 text-center text-xs text-ink-400">
            Nic nenalezeno. Zkus jiný název nebo nahraj vlastní obrázek.
          </p>
        )}
      </div>

      <div className="border-t border-white/5 px-3 py-2 text-[11px] leading-relaxed text-ink-400">
        Klikni na prvek a pak ho razítkuj na plátno (Asset tool, klávesa A). Prvky lze i přetáhnout
        přímo na mapu.
      </div>
    </div>
  );
}

function CatChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors ${
        active ? 'bg-ember text-obsidian' : 'bg-ink-800 text-stone-400 hover:text-stone-100'
      }`}
    >
      <span style={{ fontSize: 11 }}>{icon}</span>
      {label}
    </button>
  );
}
