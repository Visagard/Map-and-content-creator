import { create } from 'zustand';
import type { EditorMode, ToolId } from '@/lib/types';
import { toolsForMode } from '@/lib/tools';

export interface Camera {
  x: number; // posun stage v px (screen prostor)
  y: number;
  scale: number;
}

interface EditorState {
  mode: EditorMode;
  tool: ToolId;
  brush: { size: number; textureId: string | null };
  camera: Camera;
  selection: string[];
  // Efemérní pozice kurzoru ve world souřadnicích (pro StatusBar). Mimo historii.
  cursor: { x: number; y: number } | null;

  setMode: (mode: EditorMode) => void;
  toggleMode: () => void;
  setTool: (tool: ToolId) => void;
  setBrushSize: (size: number) => void;
  setBrushTexture: (textureId: string | null) => void;
  setCamera: (camera: Partial<Camera>) => void;
  resetCamera: () => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  setCursor: (pos: { x: number; y: number } | null) => void;
}

const DEFAULT_TOOL: Record<EditorMode, ToolId> = {
  world: 'landBrush',
  dungeon: 'room',
};

const BRUSH_MIN = 4;
const BRUSH_MAX = 512;
const clampBrush = (n: number) => Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, Math.round(n)));

export const useEditorStore = create<EditorState>((set, get) => ({
  mode: 'world',
  tool: 'landBrush',
  brush: { size: 64, textureId: null },
  camera: { x: 0, y: 0, scale: 1 },
  selection: [],
  cursor: null,

  setMode: (mode) =>
    set((s) => {
      // Pokud aktuální nástroj v novém módu neexistuje, zvol smysluplný default.
      const available = toolsForMode(mode).map((t) => t.id);
      const tool = available.includes(s.tool) ? s.tool : DEFAULT_TOOL[mode];
      return { mode, tool, selection: [] };
    }),

  toggleMode: () => get().setMode(get().mode === 'world' ? 'dungeon' : 'world'),

  setTool: (tool) => set({ tool }),
  setBrushSize: (size) => set((s) => ({ brush: { ...s.brush, size: clampBrush(size) } })),
  setBrushTexture: (textureId) => set((s) => ({ brush: { ...s.brush, textureId } })),

  setCamera: (camera) => set((s) => ({ camera: { ...s.camera, ...camera } })),
  resetCamera: () => set({ camera: { x: 0, y: 0, scale: 1 } }),

  setSelection: (ids) => set({ selection: ids }),
  clearSelection: () => set({ selection: [] }),
  setCursor: (pos) => set({ cursor: pos }),
}));

export const BRUSH_LIMITS = { min: BRUSH_MIN, max: BRUSH_MAX };
