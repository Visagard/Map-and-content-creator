// Lokální perzistence dokumentu do IndexedDB (localForage). Žádný cloud.
import localforage from 'localforage';
import type { MapDocument } from './types';

const store = localforage.createInstance({
  name: 'cartographer',
  storeName: 'documents',
  description: 'Uložené D&D mapy (Dungeon + World scéna)',
});

const CURRENT_KEY = 'current';

export async function loadCurrentDocument(): Promise<MapDocument | null> {
  try {
    return (await store.getItem<MapDocument>(CURRENT_KEY)) ?? null;
  } catch {
    return null;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced write-behind autosave (default 800 ms po poslední změně). */
export function scheduleSave(doc: MapDocument, delay = 800): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    store.setItem(CURRENT_KEY, doc).catch(() => {});
  }, delay);
}

export async function saveNow(doc: MapDocument): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  try {
    await store.setItem(CURRENT_KEY, doc);
  } catch {
    /* storage plné / nedostupné — tichý fail, MVP */
  }
}
