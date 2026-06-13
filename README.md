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

## 🖥️ Spuštění jako desktopová aplikace (zástupce na ploše)

Aplikace je zabalená do **Electronu** — můžeš ji otevírat ikonou/zástupcem, ne přes terminál.
Běží plně offline (statický web servíruje interní localhost server uvnitř aplikace).

### Windows — instalátor se zástupcem (doporučeno)

Stačí **jednou** sestavit instalátor (vyžaduje [Node.js LTS](https://nodejs.org)):

```bash
npm install
npm run dist:win
```

Ve složce `dist/` vznikne **`Cartographer-Setup-…​.exe`**. Spusť ho → instalátor sám vytvoří
**zástupce na ploše i v nabídce Start**. Od té chvíle Node.js ani terminál nepotřebuješ —
aplikaci otevíráš jako jakýkoli jiný program. (Vznikne i `Cartographer-…-portable.exe`,
který běží bez instalace; můžeš si na něj kliknout pravým → *Vytvořit zástupce*.)

### Windows — bez instalace (jednoklikový launcher)

Pokud nechceš stavět instalátor, dvakrát klikni na **`Spustit-Cartographer.bat`**
(napoprvé doinstaluje a sestaví, pak spustí). Pravým tlačítkem na soubor →
*Odeslat → Plocha (vytvořit zástupce)*.

### macOS

```bash
npm install
npm run dist:mac     # → dist/Cartographer-…​.dmg
```

### Rychlé spuštění desktopu z vývojového prostředí

```bash
npm run app          # sestaví a otevře aplikaci v okně Electronu
```

## Spuštění v prohlížeči / hosting zdarma

```bash
npm install
npm run dev          # vývoj: http://localhost:3000
npm run build        # statický web do ./out (GitHub Pages / Netlify / Vercel)
npm run preview      # lokální náhled produkčního buildu
```

## Stav vývoje (iterace)

- [x] **F1** — Technický design (PRD): `docs/PRD.md`
- [x] **F2** — Skeleton: layout (TopBar / ToolRail / panel / StatusBar), Konva plátno s pan/zoom, přepínač World/Dungeon, Zustand store + patch-historie
- [x] **F2.5** — Desktop balení: Electron wrapper (offline, interní server), generátor ikony, electron-builder pro Windows/macOS, launcher
- [x] **F3** — Kreslicí engine: Land Brush + Eraser (World), Room tool (Dungeon), Undo/Redo na každou akci (patch-historie), autosave do IndexedDB
- [x] **F3.5** — Knihovna prvků: ~290 vestavěných prvků (8 kategorií) s vyhledáváním podle názvu, pokládání na mapu, výběr/posun/otáčení/zvětšení/mazání, drag-and-drop import vlastních obrázků z disku do IndexedDB, sdílené bitmapy pro výkon
- [ ] **F4** — Landmass Masking (`globalCompositeOperation`) + texturový štětec
- [ ] **F5** — Procedurální generátor dungeonu, export PNG/WebP do 8K

## Ovládání

| Zkratka | Akce |
|---|---|
| `Tab` | Přepnout World / Dungeon |
| `V` / `B` / `T` / `E` / `R` / `A` / `H` | Výběr nástrojů |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Zpět / Vpřed |
| `[` / `]` | Zmenšit / zvětšit štětec |
| `Space` + táhnutí | Posun plátna |
| Kolečko myši | Zoom ke kurzoru |
