import {
  MousePointer2,
  Hand,
  Brush,
  Layers,
  Eraser,
  Square,
  Spline,
  Shapes,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { EditorMode, ToolId } from './types';

export interface ToolDef {
  id: ToolId;
  label: string;
  hint: string;
  shortcut: string;
  icon: LucideIcon;
  modes: EditorMode[];
}

export const TOOLS: ToolDef[] = [
  {
    id: 'select',
    label: 'Výběr',
    hint: 'Vyber, posuň, otoč a změň velikost objektů',
    shortcut: 'V',
    icon: MousePointer2,
    modes: ['world', 'dungeon'],
  },
  {
    id: 'landBrush',
    label: 'Pevnina',
    hint: 'Maluj masku pevniny — definuje, kde končí voda',
    shortcut: 'B',
    icon: Brush,
    modes: ['world'],
  },
  {
    id: 'textureBrush',
    label: 'Textura',
    hint: 'Nanášej textury (tráva, sníh…) — drží se jen na pevnině',
    shortcut: 'T',
    icon: Layers,
    modes: ['world'],
  },
  {
    id: 'room',
    label: 'Místnost',
    hint: 'Nakresli obdélníkovou místnost zarovnanou na grid',
    shortcut: 'R',
    icon: Square,
    modes: ['dungeon'],
  },
  {
    id: 'corridor',
    label: 'Chodba',
    hint: 'Spoj místnosti chodbou',
    shortcut: 'C',
    icon: Spline,
    modes: ['dungeon'],
  },
  {
    id: 'erase',
    label: 'Guma',
    hint: 'Vymaž pevninu i texturu pod štětcem',
    shortcut: 'E',
    icon: Eraser,
    modes: ['world'],
  },
  {
    id: 'asset',
    label: 'Asset',
    hint: 'Razítkuj assety (hory, stromy, truhly)',
    shortcut: 'A',
    icon: Shapes,
    modes: ['world', 'dungeon'],
  },
  {
    id: 'label',
    label: 'Popisek',
    hint: 'Přidej text/název na mapu (dvojklik upraví, táhni přesune)',
    shortcut: 'L',
    icon: Type,
    modes: ['world'],
  },
  {
    id: 'pan',
    label: 'Posun',
    hint: 'Posuň plátno (nebo podrž mezerník)',
    shortcut: 'H',
    icon: Hand,
    modes: ['world', 'dungeon'],
  },
];

export function toolsForMode(mode: EditorMode): ToolDef[] {
  return TOOLS.filter((t) => t.modes.includes(mode));
}

export function toolById(id: ToolId): ToolDef | undefined {
  return TOOLS.find((t) => t.id === id);
}
