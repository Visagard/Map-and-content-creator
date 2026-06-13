# Cartographer — D&D Map & Content Creator

Webová mapovací aplikace pro D&D, která spojuje dvě funkcionality do jednoho plátna:

- **Dungeon Mode** — vektorové dungeony (kreslení místností, grid, procedurální generování) ve stylu Dungeon Scrawl.
- **World Mode** — malované světové mapy (landmass masking, textury, stovky assetů) ve stylu Inkarnate.

Aplikace běží **100 % v prohlížeči** — žádný login, žádný cloud. Data i nahrané assety se ukládají
lokálně do IndexedDB, takže provoz i použití jsou zdarma.

## Tech stack

| Vrstva | Volba |
|---|---|
| Framework | Next.js 14 (App Router, statický export) |
| Jazyk / UI | TypeScript, React, Tailwind CSS (tmavé fantasy téma) |
| Plátno | react-konva (Konva.js) |
| State | Zustand + Immer (patch-based Undo/Redo) |
| Úložiště | localForage (IndexedDB) |

## Spuštění lokálně

```bash
npm install
npm run dev          # http://localhost:3000
```

Produkční statický build (hostovatelný zdarma na GitHub Pages / Netlify / Vercel):

```bash
npm run build        # vygeneruje statický web do ./out
npm run preview      # lokální náhled buildu
```

## Stav vývoje (iterace)

- [x] **F1** — Technický design (PRD): `docs/PRD.md`
- [x] **F2** — Skeleton: layout (TopBar / ToolRail / panel / StatusBar), Konva plátno s pan/zoom, přepínač World/Dungeon, Zustand store + patch-historie
- [ ] **F3** — Kreslicí engine: Land Brush, Eraser, Room tool, Undo/Redo na každou akci, autosave do IndexedDB
- [ ] **F4** — Landmass Masking (`globalCompositeOperation`) + texturový štětec
- [ ] **F5** — Asset tool (drag-and-drop import), procedurální generátor dungeonu, export PNG/WebP do 8K

## Ovládání

| Zkratka | Akce |
|---|---|
| `Tab` | Přepnout World / Dungeon |
| `V` / `B` / `T` / `E` / `R` / `A` / `H` | Výběr nástrojů |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Zpět / Vpřed |
| `[` / `]` | Zmenšit / zvětšit štětec |
| `Space` + táhnutí | Posun plátna |
| Kolečko myši | Zoom ke kurzoru |
