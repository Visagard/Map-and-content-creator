// Doménové typy — sdílené mezi World a Dungeon módem.
// Dokument drží OBĚ scény, takže přepnutí módu nikdy nic nezahodí.

export type EditorMode = 'world' | 'dungeon';

export type ToolId =
  | 'select'
  | 'pan'
  | 'landBrush'
  | 'textureBrush'
  | 'erase'
  | 'room'
  | 'corridor'
  | 'asset'
  | 'label'
  | 'pen';

// ---- World Mode -------------------------------------------------------------

/** Jeden tah na vrstvě terénu. Pořadí v `terrainOrder` = z-order = chronologie. */
export type TerrainStroke =
  | { id: string; kind: 'land'; points: number[]; size: number }
  | { id: string; kind: 'erase'; points: number[]; size: number }
  | {
      id: string;
      kind: 'texture';
      points: number[];
      size: number;
      textureId: string;
      opacity?: number; // krytí tahu (0–1), default 1
      softness?: number; // měkkost okraje (0–1) pro prolínání biomů, default 0
    };

export interface TextLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

/** Volný tah perem/tužkou (řeky, cesty, hranice, poznámky). */
export interface InkStroke {
  id: string;
  points: number[];
  color: string;
  width: number;
  dash: boolean;
  opacity: number;
}

export interface WorldScene {
  waterStyle: { color: string; textureId?: string };
  landColor: string;
  baseTextureId: string;
  terrainStrokes: Record<string, TerrainStroke>;
  terrainOrder: string[];
  assets: Record<string, PlacedAsset>;
  assetOrder: string[];
  labels: Record<string, TextLabel>;
  labelOrder: string[];
  ink: Record<string, InkStroke>;
  inkOrder: string[];
}

// ---- Dungeon Mode -----------------------------------------------------------

export interface Room {
  id: string;
  // Obdélníková místnost zarovnaná na grid (MVP). Polygony přijdou později.
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Corridor {
  id: string;
  points: number[]; // lomená čára (L-koridor) ve world souřadnicích
  width: number;
}

export interface DungeonScene {
  grid: { cellSize: number; visible: boolean };
  rooms: Record<string, Room>;
  roomOrder: string[];
  corridors: Record<string, Corridor>;
  corridorOrder: string[];
  assets: Record<string, PlacedAsset>;
  assetOrder: string[];
  ink: Record<string, InkStroke>;
  inkOrder: string[];
}

// ---- Sdílené ----------------------------------------------------------------

/** Instance položeného assetu — odkazuje na knihovnu, nedrží binární data inline. */
export interface PlacedAsset {
  id: string;
  assetId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipX: boolean;
}

export interface MapDocument {
  id: string;
  name: string;
  schemaVersion: number;
  world: WorldScene;
  dungeon: DungeonScene;
}

// ---- Factory ----------------------------------------------------------------

export const SCHEMA_VERSION = 1;

/** Doplní chybějící pole u dokumentu načteného ze staršího schématu (např. bez labels). */
export function normalizeDocument(raw: Partial<MapDocument> | null | undefined): MapDocument {
  const base = createEmptyDocument(raw?.id ?? crypto.randomUUID(), raw?.name);
  return {
    ...base,
    ...raw,
    id: raw?.id ?? base.id,
    name: raw?.name ?? base.name,
    schemaVersion: SCHEMA_VERSION,
    world: { ...base.world, ...(raw?.world ?? {}) },
    dungeon: { ...base.dungeon, ...(raw?.dungeon ?? {}) },
  };
}

export function createEmptyDocument(id: string, name = 'Nová mapa'): MapDocument {
  return {
    id,
    name,
    schemaVersion: SCHEMA_VERSION,
    world: {
      waterStyle: { color: '#16384f' },
      landColor: '#cdb386',
      baseTextureId: 'grass',
      terrainStrokes: {},
      terrainOrder: [],
      assets: {},
      assetOrder: [],
      labels: {},
      labelOrder: [],
      ink: {},
      inkOrder: [],
    },
    dungeon: {
      grid: { cellSize: 48, visible: true },
      rooms: {},
      roomOrder: [],
      corridors: {},
      corridorOrder: [],
      assets: {},
      assetOrder: [],
      ink: {},
      inkOrder: [],
    },
  };
}
