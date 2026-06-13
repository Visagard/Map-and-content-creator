// Rychlý test patch-historie documentStore (apply / undo / redo / napříč módy).
import { useDocumentStore } from '../store/documentStore';
import { generateDungeon } from '../lib/dungeonGenerator';

const s = () => useDocumentStore.getState();
let failed = false;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('  ✗ FAIL:', msg);
    failed = true;
  } else {
    console.log('  ✓', msg);
  }
}

assert(s().doc.world.terrainOrder.length === 0, 'start: prázdná scéna');
assert(s().past.length === 0 && s().future.length === 0, 'start: prázdná historie');

s().apply('Tah pevninou', (d) => {
  d.world.terrainStrokes['a'] = { id: 'a', kind: 'land', points: [0, 0, 10, 10], size: 20 };
  d.world.terrainOrder.push('a');
});
assert(s().doc.world.terrainOrder.length === 1, 'apply: tah přidán');
assert(s().past.length === 1, 'apply: jeden krok historie');

s().undo();
assert(s().doc.world.terrainOrder.length === 0, 'undo: tah odebrán');
assert(s().future.length === 1, 'undo: redo k dispozici');

s().redo();
assert(s().doc.world.terrainOrder.length === 1, 'redo: tah obnoven');

// no-op apply nešpiní historii
const before = s().past.length;
s().apply('nic', () => {});
assert(s().past.length === before, 'no-op apply: historie beze změny');

// nová akce zahodí redo větev
s().undo();
assert(s().future.length === 1, 'připraven redo');
s().apply('Tah pevninou 2', (d) => {
  d.world.terrainStrokes['b'] = { id: 'b', kind: 'land', points: [1, 1, 2, 2], size: 8 };
  d.world.terrainOrder.push('b');
});
assert(s().future.length === 0, 'nová akce zahodila redo větev');

// Dungeon ve stejném dokumentu — undo napříč módy nerozbije World data
s().apply('Místnost', (d) => {
  d.dungeon.rooms['r'] = { id: 'r', x: 0, y: 0, width: 48, height: 48 };
  d.dungeon.roomOrder.push('r');
});
assert(s().doc.dungeon.roomOrder.length === 1, 'dungeon: místnost přidána');
s().undo();
assert(s().doc.dungeon.roomOrder.length === 0, 'dungeon: místnost vrácena');
assert(s().doc.world.terrainOrder.length === 1, 'World data zůstala při undo v dungeonu');

// ---- Asset akce: deleteAssets + removeByAssetId ----
s().resetDocument();
s().apply('add', (d) => {
  d.world.assets['a1'] = { id: 'a1', assetId: 'cat:priroda-smrk', x: 0, y: 0, rotation: 0, scale: 1, flipX: false };
  d.world.assets['a2'] = { id: 'a2', assetId: 'usr:img1', x: 10, y: 10, rotation: 0, scale: 1, flipX: false };
  d.world.assetOrder.push('a1', 'a2');
});
assert(s().doc.world.assetOrder.length === 2, 'assety: dva položené');

s().deleteAssets('world', ['a1']);
assert(s().doc.world.assetOrder.length === 1 && !s().doc.world.assets['a1'], 'deleteAssets: a1 smazán');
assert(s().doc.world.assetOrder[0] === 'a2', 'deleteAssets: pořadí zachováno');
s().undo();
assert(s().doc.world.assetOrder.length === 2, 'deleteAssets: undo obnovil');

s().removeByAssetId('usr:img1');
assert(!s().doc.world.assets['a2'] && s().doc.world.assetOrder.length === 1, 'removeByAssetId: osiřelý prvek odstraněn');
assert(!!s().doc.world.assets['a1'], 'removeByAssetId: ostatní prvky zůstaly');

// ---- Generátor dungeonu ----
const g = generateDungeon({ roomCount: 10, cell: 48, seed: 42 });
assert(g.rooms.length > 0 && g.rooms.length <= 10, 'generátor: počet místností v limitu');
assert(g.rooms.length < 2 || g.corridors.length === g.rooms.length - 1, 'generátor: MST chodby = rooms-1');
let overlap = false;
for (let i = 0; i < g.rooms.length; i++) {
  for (let j = i + 1; j < g.rooms.length; j++) {
    const a = g.rooms[i];
    const b = g.rooms[j];
    if (!(a.x >= b.x + b.width || a.x + a.width <= b.x || a.y >= b.y + b.height || a.y + a.height <= b.y)) overlap = true;
  }
}
assert(!overlap, 'generátor: místnosti se nepřekrývají');
assert(
  g.rooms.every((r) => r.x % 48 === 0 && r.y % 48 === 0 && r.width % 48 === 0 && r.height % 48 === 0),
  'generátor: místnosti zarovnané na grid',
);
const g2 = generateDungeon({ roomCount: 10, cell: 48, seed: 42 });
const geom = (x: typeof g) => JSON.stringify(x.rooms.map((r) => [r.x, r.y, r.width, r.height]));
assert(geom(g) === geom(g2), 'generátor: deterministický se stejným seedem');

console.log(failed ? '\nNĚKTERÉ TESTY SELHALY' : '\nVŠECHNY TESTY PROŠLY ✓');
process.exit(failed ? 1 : 0);
