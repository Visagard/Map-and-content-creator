import { create } from 'zustand';
import {
  produceWithPatches,
  applyPatches,
  enablePatches,
  type Patch,
} from 'immer';
import {
  createEmptyDocument,
  type EditorMode,
  type MapDocument,
} from '@/lib/types';

// Immer patche jsou základ paměťově úsporné Undo/Redo historie (delty, ne snapshoty).
enablePatches();

interface HistoryEntry {
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
}

interface OpenBatch {
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
}

const HISTORY_CAP = 200;

interface DocumentState {
  doc: MapDocument;
  past: HistoryEntry[];
  future: HistoryEntry[];
  batch: OpenBatch | null;

  /** Jediná cesta, jak měnit dokument. `recipe` mutuje immer draft. */
  apply: (label: string, recipe: (draft: MapDocument) => void) => void;
  /** Skládá víc apply() do jednoho undo-kroku (drag gesto, generátor…). */
  beginBatch: (label: string) => void;
  endBatch: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  /** Smaže položené prvky podle id z dané scény (jeden krok historie). */
  deleteAssets: (mode: EditorMode, ids: string[]) => void;
  /** Otočí vybrané prvky o delta stupňů. */
  rotateAssets: (mode: EditorMode, ids: string[], delta: number) => void;
  /** Odstraní všechny instance odkazující na daný assetId (po smazání z knihovny). */
  removeByAssetId: (assetId: string) => void;

  /** Nahradí dokument (load z IndexedDB / nový soubor) a vyčistí historii. */
  loadDocument: (doc: MapDocument) => void;
  resetDocument: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  doc: createEmptyDocument(crypto.randomUUID()),
  past: [],
  future: [],
  batch: null,

  apply: (label, recipe) =>
    set((s) => {
      const [next, patches, inversePatches] = produceWithPatches(s.doc, recipe);
      if (patches.length === 0) return s; // no-op → historii nešpiníme

      // Otevřený batch: deltu jen akumulujeme, do undo stacku ji dáme až endBatch().
      if (s.batch) {
        return {
          doc: next,
          batch: {
            label: s.batch.label,
            patches: [...s.batch.patches, ...patches],
            // inverzní patche se aplikují v opačném pořadí → nový blok dáváme dopředu
            inversePatches: [...inversePatches, ...s.batch.inversePatches],
          },
          future: [],
        };
      }

      const entry: HistoryEntry = { label, patches, inversePatches };
      const past = [...s.past, entry].slice(-HISTORY_CAP);
      return { doc: next, past, future: [] };
    }),

  beginBatch: (label) =>
    set((s) => (s.batch ? s : { batch: { label, patches: [], inversePatches: [] } })),

  endBatch: () =>
    set((s) => {
      if (!s.batch) return s;
      if (s.batch.patches.length === 0) return { batch: null };
      const entry: HistoryEntry = {
        label: s.batch.label,
        patches: s.batch.patches,
        inversePatches: s.batch.inversePatches,
      };
      const past = [...s.past, entry].slice(-HISTORY_CAP);
      return { batch: null, past, future: [] };
    }),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const entry = s.past[s.past.length - 1];
      const doc = applyPatches(s.doc, entry.inversePatches);
      return {
        doc,
        past: s.past.slice(0, -1),
        future: [entry, ...s.future].slice(0, HISTORY_CAP),
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const entry = s.future[0];
      const doc = applyPatches(s.doc, entry.patches);
      return {
        doc,
        past: [...s.past, entry].slice(-HISTORY_CAP),
        future: s.future.slice(1),
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  deleteAssets: (mode, ids) => {
    if (ids.length === 0) return;
    get().apply('Smazání prvku', (d) => {
      const scene = mode === 'world' ? d.world : d.dungeon;
      ids.forEach((id) => {
        delete scene.assets[id];
        const i = scene.assetOrder.indexOf(id);
        if (i >= 0) scene.assetOrder.splice(i, 1);
        // popisky (jen World)
        if (mode === 'world') {
          delete d.world.labels[id];
          const li = d.world.labelOrder.indexOf(id);
          if (li >= 0) d.world.labelOrder.splice(li, 1);
        }
      });
    });
  },

  rotateAssets: (mode, ids, delta) => {
    if (ids.length === 0) return;
    get().apply('Otočení prvku', (d) => {
      const scene = mode === 'world' ? d.world : d.dungeon;
      ids.forEach((id) => {
        const a = scene.assets[id];
        if (a) a.rotation = (((a.rotation + delta) % 360) + 360) % 360;
      });
    });
  },

  removeByAssetId: (assetId) => {
    const { world, dungeon } = get().doc;
    const orphans =
      Object.values(world.assets).some((a) => a.assetId === assetId) ||
      Object.values(dungeon.assets).some((a) => a.assetId === assetId);
    if (!orphans) return;
    get().apply('Odebrání prvku z knihovny', (d) => {
      for (const scene of [d.world, d.dungeon]) {
        for (const id of [...scene.assetOrder]) {
          if (scene.assets[id]?.assetId === assetId) {
            delete scene.assets[id];
            const i = scene.assetOrder.indexOf(id);
            if (i >= 0) scene.assetOrder.splice(i, 1);
          }
        }
      }
    });
  },

  loadDocument: (doc) => set({ doc, past: [], future: [], batch: null }),
  resetDocument: () =>
    set({ doc: createEmptyDocument(crypto.randomUUID()), past: [], future: [], batch: null }),
}));
