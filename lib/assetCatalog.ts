// Velký vestavěný katalog prvků (emoji-based → žádné soubory, plně offline, zdarma).
// Každý prvek má český název + tagy (cz/en synonyma) pro vyhledávání podle názvu.

export type CategoryId =
  | 'priroda'
  | 'teren'
  | 'stavby'
  | 'dungeon'
  | 'bytosti'
  | 'predmety'
  | 'znacky'
  | 'efekty';

export interface CatalogAsset {
  id: string;
  emoji: string;
  name: string;
  category: CategoryId;
  tags: string[];
}

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'priroda', label: 'Příroda', icon: '🌲' },
  { id: 'teren', label: 'Terén', icon: '⛰️' },
  { id: 'stavby', label: 'Stavby', icon: '🏰' },
  { id: 'dungeon', label: 'Dungeon', icon: '🗝️' },
  { id: 'bytosti', label: 'Bytosti', icon: '🐉' },
  { id: 'predmety', label: 'Předměty', icon: '⚔️' },
  { id: 'znacky', label: 'Značky', icon: '📍' },
  { id: 'efekty', label: 'Efekty', icon: '🔥' },
];

// [emoji, název, "tagy"]
const RAW: Record<CategoryId, [string, string, string][]> = {
  priroda: [
    ['🌲', 'Smrk', 'jehlicnan strom les conifer tree pine'],
    ['🌳', 'Listnatý strom', 'strom les dub tree oak forest'],
    ['🌴', 'Palma', 'tropy ostrov palm tree beach'],
    ['🎄', 'Vánoční strom', 'jehlicnan smrk christmas tree'],
    ['🌵', 'Kaktus', 'poust cactus desert'],
    ['🌱', 'Sazenice', 'klicek rostlina seedling sprout'],
    ['🌿', 'Bylina', 'rostlina herb leaf'],
    ['☘️', 'Trojlístek', 'shamrock clover'],
    ['🍀', 'Čtyřlístek', 'stesti clover luck'],
    ['🍁', 'Javorový list', 'podzim maple leaf autumn'],
    ['🍂', 'Spadané listí', 'podzim listi leaves autumn'],
    ['🍃', 'Listí ve větru', 'leaf wind'],
    ['🌾', 'Obilí', 'pole klasy rice wheat field'],
    ['🌷', 'Tulipán', 'kvetina tulip flower'],
    ['🌹', 'Růže', 'kvetina rose flower'],
    ['🥀', 'Zvadlá růže', 'kvetina wilted rose'],
    ['🌺', 'Ibišek', 'kvetina hibiscus flower'],
    ['🌸', 'Květ třešně', 'sakura blossom flower'],
    ['🌼', 'Sedmikráska', 'kvetina blossom daisy flower'],
    ['🌻', 'Slunečnice', 'kvetina sunflower'],
    ['💐', 'Kytice', 'kvetiny bouquet flowers'],
    ['🍄', 'Houba', 'hrib mushroom toadstool'],
    ['🌰', 'Kaštan', 'orech chestnut'],
    ['🎋', 'Bambus', 'bamboo'],
    ['🪵', 'Kláda', 'drevo poleno log wood'],
    ['🪴', 'Květina v květináči', 'rostlina potted plant'],
    ['🪻', 'Hyacint', 'kvetina hyacinth'],
    ['🌽', 'Kukuřice', 'pole corn maize'],
    ['🐚', 'Mušle', 'plaz more shell sea'],
    ['🪨', 'Balvan', 'skala kamen rock stone boulder'],
    ['🦗', 'Cvrček', 'hmyz cricket'],
  ],
  teren: [
    ['⛰️', 'Hora', 'kopec mountain'],
    ['🏔️', 'Zasněžená hora', 'snih mountain snow'],
    ['🌋', 'Sopka', 'lava volcano'],
    ['🗻', 'Hora Fudži', 'hora fuji mountain'],
    ['🏕️', 'Tábořiště', 'stan kemp camping'],
    ['🏞️', 'Krajina', 'reka park nature landscape river'],
    ['🏜️', 'Poušť', 'pisek desert dune'],
    ['🏝️', 'Pustý ostrov', 'island'],
    ['🏖️', 'Pláž', 'more pisek beach'],
    ['🌊', 'Vlna', 'voda more wave ocean water'],
    ['💧', 'Kapka vody', 'voda water drop'],
    ['🧱', 'Cihlová zeď', 'zed brick wall'],
    ['🕳️', 'Jáma', 'dira hole pit'],
    ['🛤️', 'Koleje', 'cesta rails track'],
    ['🛣️', 'Silnice', 'cesta road'],
    ['🌉', 'Most', 'bridge'],
    ['🌅', 'Východ slunce', 'more sunrise water'],
    ['🪺', 'Hnízdo', 'nest'],
    ['🧊', 'Led', 'ledovec ice'],
    ['🏟️', 'Aréna', 'stadion arena stadium'],
    ['🌁', 'Mlha nad městem', 'mlha fog'],
  ],
  stavby: [
    ['🏰', 'Hrad', 'castle fortress'],
    ['🏯', 'Japonský hrad', 'castle japanese'],
    ['🏛️', 'Antický chrám', 'temple classical column'],
    ['⛩️', 'Brána tórii', 'gate torii shrine'],
    ['🕌', 'Mešita', 'mosque'],
    ['⛪', 'Kostel', 'church chapel'],
    ['🛕', 'Chrám', 'temple hindu'],
    ['🕍', 'Synagoga', 'synagogue'],
    ['🏠', 'Dům', 'home house'],
    ['🏡', 'Dům se zahradou', 'home house garden'],
    ['🏘️', 'Domky', 'vesnice houses village'],
    ['🏚️', 'Opuštěný dům', 'ruina derelict house'],
    ['🏭', 'Továrna', 'factory'],
    ['🏢', 'Budova', 'office building'],
    ['🏬', 'Obchodní dům', 'shop department store'],
    ['🏨', 'Hotel', 'hotel'],
    ['🏪', 'Obchod', 'shop store'],
    ['🏫', 'Škola', 'school'],
    ['🏥', 'Špitál', 'nemocnice hospital'],
    ['🏦', 'Banka', 'bank'],
    ['⛺', 'Stan', 'tabor tent camp'],
    ['🛖', 'Chýše', 'hut'],
    ['🗼', 'Věž', 'tower'],
    ['🏗️', 'Stavba', 'construction'],
    ['⛲', 'Fontána', 'kasna fountain'],
    ['🌃', 'Noční město', 'city night'],
    ['🏙️', 'Panorama města', 'cityscape city'],
    ['🌇', 'Město za soumraku', 'city sunset'],
    ['🎪', 'Cirkusový stan', 'tent circus'],
    ['🎡', 'Ruské kolo', 'ferris wheel'],
    ['🗽', 'Socha', 'statue monument'],
    ['🪟', 'Okno', 'window'],
    ['🚪', 'Vrata', 'dvere door gate'],
    ['🧱', 'Hradba', 'zed wall brick'],
  ],
  dungeon: [
    ['🚪', 'Dveře', 'door'],
    ['🔑', 'Klíč', 'key'],
    ['🗝️', 'Starý klíč', 'klic old key'],
    ['🔒', 'Zámek', 'lock locked'],
    ['🔓', 'Odemčeno', 'lock unlocked'],
    ['💀', 'Lebka', 'smrt skull death'],
    ['☠️', 'Lebka s hnáty', 'smrt skull crossbones'],
    ['🦴', 'Kost', 'bone'],
    ['⚰️', 'Rakev', 'coffin'],
    ['🪦', 'Náhrobek', 'hrob grave tombstone'],
    ['🕯️', 'Svíčka', 'candle light'],
    ['🪔', 'Olejová lampa', 'lampa lamp oil'],
    ['🏺', 'Amfora', 'nadoba amphora vase'],
    ['⚱️', 'Urna', 'urn'],
    ['🛢️', 'Sud', 'barrel'],
    ['📦', 'Bedna', 'krabice box crate'],
    ['🧰', 'Bedna s nářadím', 'toolbox'],
    ['🗿', 'Kamenná socha', 'moai statue'],
    ['🕸️', 'Pavučina', 'web spiderweb cobweb'],
    ['🪤', 'Past', 'trap mousetrap'],
    ['💎', 'Drahokam', 'gem diamond jewel'],
    ['💰', 'Pytel zlata', 'penize money bag gold'],
    ['🪙', 'Mince', 'penize coin gold'],
    ['👑', 'Koruna', 'crown'],
    ['🔮', 'Křišťálová koule', 'crystal ball magic'],
    ['📜', 'Svitek', 'scroll'],
    ['📕', 'Kniha', 'book'],
    ['📚', 'Knihy', 'books library'],
    ['⛓️', 'Řetězy', 'chains'],
    ['🪜', 'Žebřík', 'ladder'],
    ['🚧', 'Zátaras', 'barrier roadblock'],
    ['🛏️', 'Postel', 'bed'],
    ['🪑', 'Židle', 'chair'],
    ['🪞', 'Zrcadlo', 'mirror'],
    ['🧪', 'Lektvar', 'potion flask'],
    ['⚗️', 'Destilace', 'alembic alchemy'],
    ['🗄️', 'Skříň', 'cabinet'],
    ['🪚', 'Pila', 'saw'],
    ['🔦', 'Pochodeň', 'baterka torch light'],
  ],
  bytosti: [
    ['🐉', 'Drak', 'dragon'],
    ['🐲', 'Dračí hlava', 'dragon head'],
    ['🦖', 'T-Rex', 'dinosaurus dinosaur trex'],
    ['🦕', 'Brontosaurus', 'dinosaurus dinosaur'],
    ['🐺', 'Vlk', 'wolf'],
    ['🦊', 'Liška', 'fox'],
    ['🐻', 'Medvěd', 'bear'],
    ['🐗', 'Divočák', 'kanec boar pig'],
    ['🦌', 'Jelen', 'deer stag'],
    ['🐍', 'Had', 'snake'],
    ['🕷️', 'Pavouk', 'spider'],
    ['🦂', 'Štír', 'scorpion'],
    ['🦇', 'Netopýr', 'bat'],
    ['🦅', 'Orel', 'eagle bird'],
    ['🦉', 'Sova', 'owl bird'],
    ['🐀', 'Krysa', 'potkan rat mouse'],
    ['🐊', 'Krokodýl', 'crocodile alligator'],
    ['🐙', 'Chobotnice', 'octopus'],
    ['🦑', 'Oliheň', 'squid kraken'],
    ['🦈', 'Žralok', 'shark'],
    ['🐸', 'Žába', 'frog'],
    ['🐈‍⬛', 'Černá kočka', 'kocka cat black'],
    ['🐕', 'Pes', 'dog hound'],
    ['🐎', 'Kůň', 'horse'],
    ['🦄', 'Jednorožec', 'unicorn'],
    ['🐐', 'Koza', 'goat'],
    ['🐂', 'Býk', 'bull ox'],
    ['👻', 'Duch', 'ghost'],
    ['👹', 'Skřet', 'ogre demon oni'],
    ['👺', 'Goblin', 'tengu goblin'],
    ['🧌', 'Troll', 'troll'],
    ['🧟', 'Zombie', 'nemrtvy zombie undead'],
    ['🧛', 'Upír', 'vampire'],
    ['🧙', 'Čaroděj', 'mag kouzelnik wizard mage'],
    ['🧙‍♀️', 'Čarodějka', 'witch sorceress'],
    ['🧝', 'Elf', 'elf'],
    ['🧝‍♀️', 'Elfka', 'elf female'],
    ['🧚', 'Víla', 'fairy'],
    ['🧜', 'Mořská panna', 'mermaid merman'],
    ['🧞', 'Džin', 'genie djinn'],
    ['🦹', 'Padouch', 'villain'],
    ['🦸', 'Hrdina', 'hero'],
    ['🤴', 'Princ', 'prince'],
    ['👸', 'Princezna', 'princess'],
    ['🥷', 'Nindža', 'ninja'],
    ['💂', 'Stráž', 'guard soldier'],
    ['🤺', 'Šermíř', 'fencer swordsman'],
    ['🏇', 'Jezdec', 'rider horseman knight'],
    ['👤', 'Postava', 'silueta figure person token'],
    ['👥', 'Skupina', 'group party people'],
  ],
  predmety: [
    ['⚔️', 'Zkřížené meče', 'meč boj swords battle'],
    ['🗡️', 'Dýka', 'meč dagger knife sword'],
    ['🛡️', 'Štít', 'shield'],
    ['🏹', 'Luk a šíp', 'bow arrow archery'],
    ['🪄', 'Kouzelná hůlka', 'wand magic'],
    ['🔱', 'Trojzubec', 'trident'],
    ['🪓', 'Sekera', 'axe'],
    ['📿', 'Korále', 'beads necklace prayer'],
    ['💍', 'Prsten', 'ring'],
    ['🏆', 'Pohár', 'trophy cup'],
    ['🥇', 'Medaile', 'medal'],
    ['🔔', 'Zvon', 'bell'],
    ['⚓', 'Kotva', 'anchor ship'],
    ['⚖️', 'Váhy', 'scales justice balance'],
    ['🧭', 'Kompas', 'compass'],
    ['⏳', 'Přesýpací hodiny', 'hourglass time'],
    ['🕰️', 'Hodiny', 'clock time'],
    ['🗺️', 'Mapa', 'map'],
    ['🧳', 'Kufr', 'luggage suitcase'],
    ['🎒', 'Batoh', 'backpack'],
    ['🥾', 'Bota', 'boot shoe'],
    ['🧤', 'Rukavice', 'gloves'],
    ['⛑️', 'Helma', 'helmet'],
    ['🪖', 'Vojenská helma', 'helmet military'],
    ['🏮', 'Lampion', 'lampa lantern light'],
    ['🎁', 'Truhla s pokladem', 'dar dárek gift treasure'],
    ['🍖', 'Maso', 'jidlo meat food'],
    ['🍗', 'Pečené stehno', 'jidlo chicken meat'],
    ['🍞', 'Chléb', 'jidlo bread food'],
    ['🧀', 'Sýr', 'jidlo cheese'],
    ['🍺', 'Pivo', 'piti beer ale tavern'],
    ['🍷', 'Víno', 'piti wine'],
    ['🍶', 'Džbán', 'saké jug bottle'],
    ['🫖', 'Konvice', 'teapot'],
    ['🍎', 'Jablko', 'jidlo apple fruit'],
    ['🍇', 'Hrozny', 'jidlo grapes fruit'],
    ['🍯', 'Med', 'honey'],
    ['🧂', 'Sůl', 'salt'],
    ['💊', 'Pilulka', 'pill medicine'],
    ['🩸', 'Krev', 'blood'],
  ],
  znacky: [
    ['📍', 'Špendlík', 'pin marker location'],
    ['📌', 'Připínáček', 'pushpin pin'],
    ['🚩', 'Vlajka', 'flag'],
    ['🏁', 'Cílová vlajka', 'flag finish'],
    ['🏴', 'Černá vlajka', 'flag black pirate'],
    ['🏳️', 'Bílá vlajka', 'flag white surrender'],
    ['⭐', 'Hvězda', 'star'],
    ['🌟', 'Zářící hvězda', 'star glow'],
    ['✨', 'Třpyt', 'sparkles magic'],
    ['❗', 'Vykřičník', 'exclamation alert'],
    ['❓', 'Otazník', 'question mystery'],
    ['❌', 'Křížek', 'cross x mark'],
    ['✅', 'Fajfka', 'check ok done'],
    ['⚠️', 'Pozor', 'warning danger'],
    ['⛔', 'Zákaz', 'no entry forbidden'],
    ['🎯', 'Terč', 'target bullseye'],
    ['🔴', 'Červený kruh', 'circle red'],
    ['🟠', 'Oranžový kruh', 'circle orange'],
    ['🟡', 'Žlutý kruh', 'circle yellow'],
    ['🟢', 'Zelený kruh', 'circle green'],
    ['🔵', 'Modrý kruh', 'circle blue'],
    ['🟣', 'Fialový kruh', 'circle purple'],
    ['⚫', 'Černý kruh', 'circle black'],
    ['⚪', 'Bílý kruh', 'circle white'],
    ['🔺', 'Červený trojúhelník', 'triangle red'],
    ['🔷', 'Modrý kosočtverec', 'diamond blue'],
    ['🔶', 'Oranžový kosočtverec', 'diamond orange'],
    ['1️⃣', 'Číslo 1', 'cislo one number'],
    ['2️⃣', 'Číslo 2', 'cislo two number'],
    ['3️⃣', 'Číslo 3', 'cislo three number'],
    ['4️⃣', 'Číslo 4', 'cislo four number'],
    ['5️⃣', 'Číslo 5', 'cislo five number'],
    ['❤️', 'Srdce', 'heart life'],
    ['♠️', 'Piky', 'spade card'],
    ['♣️', 'Kříže', 'club card'],
    ['♦️', 'Káro', 'diamond card'],
    ['🧿', 'Amulet', 'amulet charm evil eye'],
  ],
  efekty: [
    ['🔥', 'Oheň', 'fire flame'],
    ['💥', 'Výbuch', 'explosion boom'],
    ['💢', 'Vztek', 'anger'],
    ['💨', 'Závan', 'wind dash smoke'],
    ['🌪️', 'Tornádo', 'tornado cyclone'],
    ['🌫️', 'Mlha', 'fog mist'],
    ['☁️', 'Mrak', 'cloud'],
    ['⛅', 'Polojasno', 'cloud sun'],
    ['🌧️', 'Déšť', 'rain'],
    ['⛈️', 'Bouřka', 'storm thunder rain'],
    ['🌩️', 'Blesk v mracích', 'lightning storm'],
    ['⚡', 'Blesk', 'lightning bolt'],
    ['❄️', 'Vločka', 'snih snow snowflake'],
    ['☃️', 'Sněhulák', 'snih snowman'],
    ['🌨️', 'Sněžení', 'snih snow'],
    ['💦', 'Stříkance', 'voda water splash'],
    ['🫧', 'Bubliny', 'bubbles'],
    ['☄️', 'Kometa', 'comet'],
    ['🌠', 'Padající hvězda', 'shooting star'],
    ['🌈', 'Duha', 'rainbow'],
    ['☀️', 'Slunce', 'sun'],
    ['🌙', 'Měsíc', 'moon night'],
    ['🌕', 'Úplněk', 'moon full'],
    ['💫', 'Závrať', 'dizzy stars'],
    ['🕳️', 'Černá díra', 'hole void portal'],
  ],
};

// ID odvozené ze stabilního slugu názvu (NE z indexu) → změna pořadí/přidání
// prvku nerozbije dříve uložené mapy.
function slugId(name: string): string {
  return normalize(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const CATALOG: CatalogAsset[] = (() => {
  const out: CatalogAsset[] = [];
  const seen = new Set<string>();
  for (const cat of Object.keys(RAW) as CategoryId[]) {
    for (const row of RAW[cat]) {
      let id = `cat:${cat}:${slugId(row[1])}`;
      while (seen.has(id)) id += '_'; // pojistka proti kolizi slugů
      seen.add(id);
      out.push({ id, emoji: row[0], name: row[1], category: cat, tags: row[2].split(/\s+/).filter(Boolean) });
    }
  }
  return out;
})();

const BY_ID = new Map(CATALOG.map((a) => [a.id, a]));
export function catalogById(id: string): CatalogAsset | undefined {
  return BY_ID.get(id);
}

/** Bezdiakritické porovnání pro odolné vyhledávání (řeka == reka). */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function searchCatalog(query: string, category: CategoryId | 'all'): CatalogAsset[] {
  const q = normalize(query);
  return CATALOG.filter((a) => {
    if (category !== 'all' && a.category !== category) return false;
    if (!q) return true;
    if (normalize(a.name).includes(q)) return true;
    return a.tags.some((t) => normalize(t).includes(q));
  });
}

export const CATALOG_COUNT = CATALOG.length;
