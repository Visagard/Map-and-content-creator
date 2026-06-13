import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { toolsForMode } from './tools';

/** Globální klávesové zkratky editoru. Nepřepisuje psaní do inputů. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (typing) return;

      const editor = useEditorStore.getState();
      const doc = useDocumentStore.getState();
      const meta = e.ctrlKey || e.metaKey;

      // Undo / Redo
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) doc.redo();
        else doc.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        doc.redo();
        return;
      }
      if (meta) return; // ostatní Ctrl/Cmd kombinace neřešíme

      // Smazání vybraných prvků
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.selection.length) {
          e.preventDefault();
          doc.deleteAssets(editor.mode, editor.selection);
          editor.clearSelection();
        }
        return;
      }

      // Zrušení výběru
      if (e.key === 'Escape') {
        editor.clearSelection();
        return;
      }

      // Přepnutí módu World ⇄ Dungeon
      if (e.key === 'Tab') {
        e.preventDefault();
        editor.toggleMode();
        return;
      }

      // Velikost štětce
      if (e.key === '[') {
        editor.setBrushSize(editor.brush.size - 8);
        return;
      }
      if (e.key === ']') {
        editor.setBrushSize(editor.brush.size + 8);
        return;
      }

      // Výběr nástroje podle zkratky (jen nástroje dostupné v aktuálním módu)
      const tool = toolsForMode(editor.mode).find(
        (t) => t.shortcut.toLowerCase() === e.key.toLowerCase(),
      );
      if (tool) {
        e.preventDefault();
        editor.setTool(tool.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
