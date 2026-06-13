import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { loadCurrentDocument, scheduleSave, saveNow } from './persistence';

/**
 * Načte uloženou mapu z IndexedDB při startu a poté debounce-ukládá každou změnu.
 * Save-subscription se zapíná až PO načtení. Uloženou mapu navíc aplikuje jen
 * pokud uživatel mezitím nezačal kreslit (prázdná historie) — jinak by se
 * rozdělaná práce přepsala.
 */
export function useAutosave(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    let active = true;

    loadCurrentDocument().then((doc) => {
      if (!active) return;
      // Aplikuj jen když uživatel ještě nic neudělal (jinak jeho edity vyhrávají).
      if (doc && useDocumentStore.getState().past.length === 0) {
        useDocumentStore.getState().loadDocument(doc);
      }
      setLoaded(true);
      unsub = useDocumentStore.subscribe((state, prev) => {
        if (state.doc !== prev.doc) scheduleSave(state.doc);
      });
    });

    // Uložení při skrytí/zavření. visibilitychange je spolehlivější než beforeunload
    // (prohlížeč stihne dokončit IndexedDB zápis při přechodu na pozadí).
    const flush = () => saveNow(useDocumentStore.getState().doc);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);

    return () => {
      active = false;
      unsub();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  return loaded;
}
