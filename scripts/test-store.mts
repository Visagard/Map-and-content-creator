// Rychlý test patch-historie documentStore (apply / undo / redo / napříč módy).
import { useDocumentStore } from '../store/documentStore';

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

console.log(failed ? '\nNĚKTERÉ TESTY SELHALY' : '\nVŠECHNY TESTY PROŠLY ✓');
process.exit(failed ? 1 : 0);
