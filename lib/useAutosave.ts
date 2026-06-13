import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { loadCurrentDocument, scheduleSave, saveNow } from './persistence';

/**
 * Načte uloženou mapu z IndexedDB při startu a poté debounce-ukládá každou změnu.
 * Save-subscription se zapíná až PO načtení, aby prázdný startovní dokument
 * nepřepsal dříve uloženou práci.
 */
export function useAutosave(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    let active = true;

    loadCurrentDocument().then((doc) => {
      if (!active) return;
      if (doc) useDocumentStore.getState().loadDocument(doc);
      setLoaded(true);
      unsub = useDocumentStore.subscribe((state, prev) => {
        if (state.doc !== prev.doc) scheduleSave(state.doc);
      });
    });

    const flush = () => saveNow(useDocumentStore.getState().doc);
    window.addEventListener('beforeunload', flush);

    return () => {
      active = false;
      unsub();
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  return loaded;
}
