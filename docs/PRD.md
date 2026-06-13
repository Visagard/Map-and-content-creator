# PRD & Technický design — „Cartographer" (pracovní název)

Webová D&D mapovací aplikace spojující **Dungeon Mode** (vektorové dungeony à la Dungeon Scrawl)
a **World Mode** (malované světové mapy à la Inkarnate). Běží 100% v prohlížeči, bez loginu,
bez cloudu — data i assety v IndexedDB, hostovatelné zdarma jako statický web.

---

## 1. Produktové cíle

| Cíl | Kritérium splnění |
|---|---|
| Okamžitý start | Otevřu URL → do 2 s kreslím. Žádný login, žádný onboarding wall. |
| Dva módy plátna | Přepínač Dungeon/World; každý mód má vlastní scénu a sadu nástrojů, přepnutí nic neztratí. |
| Landmass Masking | Textura (tráva, sníh…) se NIKDY nepřelije do vody — pixel-perfect clip na malovanou pevninu. |
| Undo/Redo všeho | Každá akce (tah štětcem, posun assetu, smazání, generování) je vratná. Ctrl+Z/Ctrl+Shift+Z. |
| Vlastní assety | Drag-and-drop PNG/WebP z disku → uloží se do IndexedDB → pokládám stovky instancí plynule. |
| Export | PNG/WebP, volitelné rozlišení až 8K (7680 px delší strana). |
| Výkon | 60 fps malování; 1000+ assetů na mapě bez znatelného lagu na běžném notebooku. |
| Provoz zdarma | `next build` se statickým exportem → GitHub Pages / Netlify / Vercel free tier. Lokálně `npm run dev`. |

## 2. Technologický stack

- **Next.js 14+ (App Router, `output: 'export'`)** — čistě klientská aplikace, žádný server. Canvas komponenty se načítají přes `dynamic(..., { ssr: false })`, protože Konva potřebuje `window`.
- **React + TypeScript**, **Tailwind CSS** — tmavý fantasy vizuál (pergamen/obsidián paleta, serif nadpisy).
- **react-konva (Konva.js)** — veškerý rendering plátna.
- **Zustand + Immer** — state management; Undo/Redo postavené na **immer patchích** (ne na snapshotech).
- **localForage** — IndexedDB persistence dokumentu mapy + binárních assetů (Blob).

---

## 3. Klíčový návrh A: Landmass Masking přes `globalCompositeOperation`

### 3.1 Princip

Konva `Layer` = samostatný `<canvas>` element. `globalCompositeOperation` (dále **gCO**) tvaru
se tedy skládá **jen s pixely téže vrstvy**, ne s vrstvami pod ní. Toho využijeme: voda žije
v jiné vrstvě než pevnina, takže kompozitní operace na vrstvě pevniny vodu nikdy nezasáhnou.

Struktura scény World módu (zdola nahoru):

```
Stage
├── Layer "water"      (listening: false)  — celoplošný Rect s texturou/barvou vody
├── Layer "terrain"    (listening: false)  — ★ vrstva s maskováním (viz níže)
│     ├── Group "landGroup"
│     │     ├── Line (tah Land štětce, solid fill/stroke, round cap/join)
│     │     ├── Line (tah gumy)            gCO: 'destination-out'
│     │     └── … (tahy v chronologickém pořadí — guma maže, další tah zase přidá)
│     └── Group "textureGroup"
│           ├── TextureStroke (tráva)      gCO: 'source-atop'
│           ├── TextureStroke (sníh)       gCO: 'source-atop'
│           └── …
├── Layer "assets"     (listening: false při malování) — položené hory/stromy/truhly
├── Layer "overlay"    — grid, výběrový rámeček, ghost kurzoru štětce
```

Pravidla kompozice na vrstvě `terrain` (kreslí se v pořadí dětí):

1. **Land štětec** → obyčejná `Konva.Line` (body tahu, `strokeWidth = brushSize`, kulaté
   zakončení), vyplněná základní barvou terénu. Sjednocení všech tahů definuje **alfa masku
   pevniny**.
2. **Guma na pevninu** → stejná Line, ale `gCO: 'destination-out'` — vyřízne díru do všeho,
   co už na vrstvě je (pevnina i textury v daném místě), což je přesně očekávané chování.
3. **Texturový štětec** → tah s `gCO: 'source-atop'`. Definice `source-atop`: *zdroj se
   vykreslí jen tam, kde už destinace má neprůhledné pixely; alfa destinace zůstává.*
   Protože se `textureGroup` kreslí **až po** `landGroup`, destinací je v tu chvíli právě
   silueta pevniny → textura se fyzicky nemůže přelít do vody. Antialiasované okraje
   pevniny (částečná alfa) texturu plynule utlumí — hrany jsou měkké, ne zubaté.

Invariant pořadí: `landGroup` je v z-orderu **vždy celý před** `textureGroup`. Nový tah Land
štětce se appenduje do `landGroup`, takže i pevnina domalovaná později je při překreslení
vrstvy k dispozici dřív, než se kreslí textury.

### 3.2 Texturovaný tah štětce (TextureStroke)

Konva `Line` neumí texturovaný **stroke** (fillPattern funguje jen pro fill). Řešení:
vlastní `Konva.Shape` se `sceneFunc`, který nastaví `ctx.strokeStyle = pattern`:

```ts
// TextureStroke — polyline tah vykreslený texturou, klipovaný na pevninu přes source-atop
const patternCache = new Map<string, CanvasPattern>(); // 1 pattern / textura / kontext

<Shape
  globalCompositeOperation="source-atop"
  listening={false}
  perfectDrawEnabled={false}
  sceneFunc={(ctx, shape) => {
    const img = textureImages[stroke.textureId];          // sdílený HTMLImageElement
    ctx.strokeStyle = ctx._context.createPattern(img, 'repeat')!;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath();
    stroke.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  }}
/>
```

Důležité: pattern je v souřadnicích plátna, takže dva sousední tahy stejné textury na sebe
**bezešvě navazují** (textura „prosvítá oknem", neposouvá se s tahem) — stejné chování jako
Inkarnate.

Pozn.: `perfectDrawEnabled={false}` je nutné — perfect-draw používá buffer canvas, který by
gCO izoloval od zbytku vrstvy a maskování rozbil.

### 3.3 Proč ne `destination-in` na skupině

Alternativa „nakresli textury volně a pak je ořízni maskou přes `destination-in`" má dvě vady:
(a) `destination-in` je destruktivní vůči celé destinaci — každá další maska by ořezávala
i výsledek předchozích, takže funguje jen pro jednorázový ořez celé nacachované skupiny;
(b) vyžaduje `group.cache()` po **každém tahu** (re-rasterizace celé skupiny → lag při malování).
Per-stroke `source-atop` je inkrementální: nový tah nic nepřepočítává, jen se přikreslí.
`destination-in`/cache kombinaci si necháváme pro budoucí feature „víc nezávislých ostrovů
s vlastními texturovými sadami".

### 3.4 Výkon vrstvy terénu při tisících tahů

- Všechny tahy: `listening: false`, `perfectDrawEnabled: false`, `shadowForStrokeEnabled: false`.
- Live tah se NEcommituje do Reactu po pointermove — kreslí se přímou mutací Konva node
  (ref) + `layer.batchDraw()`; do Zustand jde **jednou**, na pointer-up (viz §4.4).
- **Stroke baking (milník M4):** po překročení prahu (např. 300 tahů) se nejstarší tahy
  zrasterizují do jedné `Konva.Image` (offscreen render vrstvy) a vektorové nody se odstraní.
  Vektorová data zůstávají v dokumentu — undo přes „baked" hranici masku přegeneruje z historie.

---

## 4. Klíčový návrh B: Zustand store pro oba módy + Undo/Redo

### 4.1 Rozdělení store

Tři store, oddělené podle životního cyklu dat:

```
useDocumentStore   — DOKUMENT (vše, co se ukládá a verzuje v historii)
useEditorStore     — UI/SESSION stav (mód, nástroj, kamera, výběr) — BEZ historie, BEZ persistence*
useAssetLibStore   — knihovna nahraných assetů (metadata; bity v IndexedDB)
```
\* kamera a aktivní mód se persistují zvlášť (quality-of-life), ale nikdy nejdou do undo stacku.

```ts
// ---- Dokument: jeden soubor mapy obsahuje OBĚ scény — přepnutí módu nic nezahodí
interface MapDocument {
  id: string;
  name: string;
  world: WorldScene;
  dungeon: DungeonScene;
}

interface WorldScene {
  waterStyle: { color: string; textureId?: string };
  terrainStrokes: Record<string, TerrainStroke>;  // entity mapa O(1) přístup
  terrainOrder: string[];                          // z-order = chronologie tahů
  assets: Record<string, PlacedAsset>;
  assetOrder: string[];
}

type TerrainStroke =
  | { id: string; kind: 'land';    points: number[]; size: number }
  | { id: string; kind: 'erase';   points: number[]; size: number }
  | { id: string; kind: 'texture'; points: number[]; size: number; textureId: string };

interface DungeonScene {
  grid: { cellSize: number; visible: boolean };
  rooms: Record<string, Room>;       // Room = rect | polygon, dveře, …
  roomOrder: string[];
  corridors: Record<string, Corridor>;
  assets: Record<string, PlacedAsset>;
  assetOrder: string[];
}

interface PlacedAsset {
  id: string; assetId: string;       // odkaz do knihovny, NE inline data
  x: number; y: number; rotation: number; scale: number; flipX: boolean;
}
```

Render mapuje `terrainOrder` na nody: `kind: 'land'` → Line do `landGroup`,
`kind: 'erase'` → Line s `destination-out` do `landGroup` (na správné chronologické pozici),
`kind: 'texture'` → TextureStroke do `textureGroup`. Invariant z §3.1 tím drží sám od sebe.

### 4.2 Undo/Redo: immer patche, ne snapshoty

Snapshotová historie (např. zundo) by při tisících objektů kopírovala celý dokument na každou
akci → RAM exploduje. Místo toho **patch-based historie**: každá mutace dokumentu jde přes
`produceWithPatches` a do historie se ukládají jen **delty**:

```ts
interface HistoryEntry { label: string; patches: Patch[]; inversePatches: Patch[]; }

interface DocumentStore {
  doc: MapDocument;
  history: { undo: HistoryEntry[]; redo: HistoryEntry[] };   // cap: 200 entries

  apply: (label: string, recipe: (draft: MapDocument) => void) => void;
  undo: () => void;   // applyPatches(doc, top.inversePatches), přesun do redo
  redo: () => void;
  beginBatch: (label: string) => void;  // skládá víc apply() do JEDNOHO entry
  endBatch: () => void;
}

const apply = (label, recipe) => set((s) => {
  const [next, patches, inversePatches] = produceWithPatches(s.doc, recipe);
  const entry = { label, patches, inversePatches };
  const undo = s.batch ? mergeIntoBatch(s, entry) : [...s.history.undo, entry].slice(-200);
  return { doc: next, history: { undo, redo: [] } };  // nová akce zahazuje redo větev
});
```

Vlastnosti:
- **Paměť:** tah štětcem = 1 patch s jedním objektem tahu (~pár KB), ne kopie dokumentu.
- **Granularita:** 1 gesto uživatele = 1 entry. Drag 50 vybraných assetů → `beginBatch` na
  pointer-down, `endBatch` na pointer-up → jeden Ctrl+Z vrátí celé gesto. Procedurální
  generátor dungeonu = taky jeden entry („Generate dungeon").
- **Univerzálnost:** funguje identicky pro World i Dungeon, protože historie verzuje celý
  `MapDocument` — přepnutí módu undo stack nerozbije (undo v Dungeon módu může vrátit akci
  z World módu; UI u entry zobrazí label, případně mód automaticky přepne).
- **Selektory:** komponenty subscribují úzce (`s => s.doc.world.terrainOrder`), takže přidání
  tahu nere-renderuje asety a naopak.

### 4.3 Editor store (bez historie)

```ts
interface EditorStore {
  mode: 'world' | 'dungeon';
  tool: 'select' | 'landBrush' | 'textureBrush' | 'erase' | 'room' | 'corridor' | 'asset' | 'pan';
  brush: { size: number; textureId: string };
  camera: { x: number; y: number; scale: number };
  selection: string[];
  setTool, setMode, setCamera, ...
}
```
Změna nástroje/kamery/výběru NEnít undo akce (standard ve všech editorech).

### 4.4 Horká cesta malování (60 fps)

```
pointerdown  → vytvoř dočasnou Konva.Line/Shape přímo ve vrstvě (mimo React i Zustand)
pointermove  → points.push(x,y); layer.batchDraw()        // žádný setState!
pointerup    → documentStore.apply('Brush stroke', d => { d.world.terrainStrokes[id] = ...; })
               → React tah převezme deklarativně, dočasný node se zahodí
```

### 4.5 Persistence (localForage / IndexedDB)

- `maps/<id>` → serializovaný `MapDocument` (JSON). Autosave: subscribe na `doc`,
  debounce 1500 ms, write-behind.
- `assets/<assetId>` → `Blob` originálního souboru; `assetIndex` → metadata
  (název, rozměry, kategorie). Při startu se bloby načtou → `createImageBitmap` →
  sdílené obrázky pro Konva.
- Žádný server, žádné API klíče, provoz = statický hosting zdarma.

---

## 5. Výkonová strategie pro stovky/tisíce assetů

1. **Sdílené bitmapy:** 500 stromů = 500 lehkých `Konva.Image` nodů ukazujících na JEDEN
   `ImageBitmap`. Dekódování obrázku proběhne jednou.
2. **Vrstvy bez hit-grafu:** Konva 8+ odstranila `FastLayer` — moderní ekvivalent je
   `<Layer listening={false}>`, který přeskakuje celý hit-detection canvas (poloviční práce
   i paměť). Asset vrstva má `listening` zapnuté **jen** když je aktivní Select/Asset tool;
   při malování terénu je vypnuté.
3. **`cache()` skupin:** vybraný asset s transformerem se cachuje během transformace;
   statické dekorační skupiny (les položený generátorem) se cachují jako celek → překreslení
   vrstvy = 1 drawImage místo 200 draw calls.
4. **Viewport culling (M4):** render jen assetů protínajících viewport (AABB test proti
   kameře) — mapy s tisíci assety pak kreslí jen viditelnou stovku.
5. **Per-node hygiena:** `perfectDrawEnabled:false`, `shadowForStrokeEnabled:false`,
   `transformsEnabled:'position'` kde stačí translace.

## 6. Dungeon Mode

- **Kreslení místností:** Rect/polygon tool — tah myší vytvoří místnost zarovnanou na grid;
  překrývající se místnosti se vizuálně slévají (floor fill + computed obvodové zdi).
  MVP renderuje floor jako fill a zdi jako outline; boolean slévání obrysů přes
  grid-based marching squares (floor buňky → obvodové segmenty zdí).
- **Procedurální generátor:** seedovaný algoritmus *rooms & corridors*: náhodné nekolizní
  obdélníkové místnosti + L-koridory mezi nejbližšími sousedy (MST přes středy místností).
  Výstup = normální `Room`/`Corridor` entity → plně editovatelné a undoable jako jeden entry.
- **Grid:** vykreslený v overlay vrstvě, snap na poloviny buněk.

## 7. Export PNG/WebP do 8K

```ts
const pixelRatio = targetLongEdge / Math.max(mapWidthPx, mapHeightPx); // 8K: 7680
stage.toDataURL({ mimeType: 'image/webp', quality: 0.92, pixelRatio, ...mapBounds });
```
- Export běží na **klonu Stage** připnutém na celé hranice mapy (ne na viewport), overlay
  vrstva (grid/výběr) se vynechá volitelně.
- 8K limit: jeden canvas 7680×7680 je ~225 MB RAM — OK pro desktop Chrome/Firefox;
  fallback **dlaždicový export** (render po 2K dlaždicích, sešití v offscreen canvasu)
  jako M5 pojistka pro slabší stroje.

## 8. UX: nástroje a klávesové zkratky

| Zkratka | Akce | | Zkratka | Akce |
|---|---|---|---|---|
| `V` | Select | | `B` | Land/Texture Brush |
| `E` | Eraser | | `R` | Room (Dungeon) |
| `A` | Asset stamp | | `Space`+drag / `H` | Pan |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo | | `[` / `]` | Brush size −/+ |
| `Tab` | Přepnout World/Dungeon | | `Ctrl+E` | Export dialog |
| `Del` | Smazat výběr | | `Ctrl+scroll` | Zoom na kurzor |

User journey: otevření → prázdné plátno World módu s vodou → tooltip „Namaluj pevninu (B)" →
malba → výběr textury v levém panelu → texturování → drag-and-drop assetu z OS → export.
Žádný krok nevyžaduje účet ani síť.

## 9. Layout UI

```
┌────────────────────────────────────────────────────────────┐
│ TopBar: logo · název mapy · [World ⇄ Dungeon] · Undo/Redo · Export │
├──────────┬─────────────────────────────────────┬───────────┤
│ ToolRail │                                     │ Panel     │
│ (ikony   │            Canvas (Konva)           │ kontextu: │
│ nástrojů,│                                     │ textury / │
│ svisle)  │                                     │ assety /  │
│          │                                     │ vlastnosti│
├──────────┴─────────────────────────────────────┴───────────┤
│ StatusBar: souřadnice · zoom · velikost štětce · hint zkratky │
└────────────────────────────────────────────────────────────┘
```
Tmavé téma: obsidián (#0d0f14) pozadí, pergamenové akcenty, serif display font pro nadpisy.

## 10. Iterační plán (fáze = vždy spustitelný celek)

| Fáze | Obsah | Test |
|---|---|---|
| **F1 (tento dokument)** | PRD | review |
| **F2** | Next.js skeleton, Tailwind dark theme, layout (TopBar, ToolRail, panely), prázdný Konva Stage s pan/zoom, přepínač módů | `npm run dev` → UI stojí, pan/zoom funguje |
| **F3** | Kreslící engine: Land Brush + Eraser (World), Room tool (Dungeon), Zustand patch-historie, Undo/Redo, zkratky, autosave do IndexedDB | namaluju/smažu/vrátím; reload zachová mapu |
| **F4** | Landmass Masking + texturový štětec (source-atop), výběr textur v panelu, voda | textura se nepřelije do vody; guma maže obojí |
| **F5** | Asset tool: drag-and-drop import do IndexedDB, razítkování, select/move/rotate/scale, sdílené bitmapy + listening optimalizace; procedurální generátor dungeonu; export PNG/WebP do 8K | 500 assetů plynule; generátor undoable; 8K export |

---
*Konec PRD. Po schválení („Pokračuj") následuje F2.*
