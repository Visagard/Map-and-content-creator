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
- [x] **F4** — Landmass Masking (`globalCompositeOperation: source-atop`) + 12 procedurálních textur; textura drží jen na pevnině
- [x] **F5** — Procedurální generátor dungeonu (MST místnosti+chodby) + export PNG/WebP do 8K
- [x] **F6** — Profesionální grafika: ~38 vektorových assetů kreslených v kódu (stínované „stampy" jako Inkarnate/Dungeon Scrawl), malované textury (měkké skvrny + šum), pobřeží (hloubkový stín vody) a Dungeon-Scrawl vzhled (světlá podlaha, tučné zdi, mřížka na podlaze)
- [x] **F7** — Inkarnate workflow: texturový štětec s krytím a měkkostí okraje (plynulé prolínání biomů), ostřejší a detailnější vykreslení (assety/emoji ve vyšším rozlišení, vyhlazování), jemná vinětace v exportu
- [x] **F8** — Kartografická vrstva: soustředné vodní hloubkové pásy (mělčina→hloubka), pergamenové zrno + rámeček mapy, textové popisky (serif font, halo, editace), +21 nových kreslených assetů (vesnice, maják, loď, menhiry, vodopád, útes, trůn, fontána, kotlík, sarkofág, pavučina…)
- [x] **F9** — Úroveň Dungeon Scrawl / Inkarnate: dungeon má sloučenou podlahu s jediným obrysem zdí (marching-squares přes rastr buněk) + vnitřní stín zdí + kamennou texturu + mřížku jen na podlaze; svět má vždy plně texturovaný podklad pevniny (volitelný biom)
- [x] **F10** — Grafika/design/ovladatelnost: kreslení chodeb (nástroj Chodba, ortogonální, snap na grid), plovoucí ovládání zoomu (přiblížit/oddálit/přizpůsobit/reset), nápověda zkratek (?), písčitá pláž u pobřeží + jemné vlnění moře, výběr barvy vody
- [x] **F11** — Vybavení dungeonu: +16 propů a nábytku (stůl, kulatý stůl, postel, židle, koberec, stojan na zbraně, kovadlina, pytel, hrnec, krb, mříž, páka, klec, svíčky, lahvičky), přichytávání assetů na grid v dungeonu (pokládání i posun), knihovna se v dungeon módu otevírá rovnou v kategorii Dungeon
- [x] **F12** — Dungeon blíž Dungeon Scrawlu: vržený stín podlahy na podklad (dungeon „leží" na tmavém papíru), tlustší zdi, teplejší krémová podlaha, výraznější mřížka, papírové pozadí v exportu
- [x] **F13** — Grafika + vkládání + filtr: objemové stínování všech assetů (světlo shora → plastičtější), +18 nových assetů (pařez, houby, lekníny, liány, oáza, gejzír, močál, molo, hláska, obelisk, svatyně, stánek, suť, magický kruh, hromada zlata, jezírko lávy, svítící houby), razítkování s natočením/velikostí/rozptylem, perzistentní filtr knihovny (kategorie + hledání)
- [x] **F14** — Pero + otáčení + víc obsahu: nástroj Pero/tužka (volné čáry — řeky, cesty, hranice, poznámky; barva/šířka/krytí/čárkovaně + předvolby), otáčení vybraných prvků kolečkem i klávesami Q/E, +12 assetů (bříza, plot, strašák, úl, vchod do dolu, sliz, pavouk, mimik, drahokamy, zlomený sloup, krvavá skvrna, runový kámen), +6 textur (dlažba, podzim, tmavá tráva, bahno, mech, savana)

## Ovládání

| Zkratka | Akce |
|---|---|
| `Tab` | Přepnout World / Dungeon |
| `V` / `B` / `T` / `E` / `R` / `A` / `H` | Výběr nástrojů |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Zpět / Vpřed |
| `[` / `]` | Zmenšit / zvětšit štětec |
| `Del` / `Esc` | Smazat výběr / zrušit výběr |
| `Ctrl+E` | Export do PNG/WebP |
| `Space` + táhnutí | Posun plátna |
| Kolečko myši | Zoom ke kurzoru |
