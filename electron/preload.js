// Bezpečný most. Aplikace používá jen prohlížečové API (IndexedDB), žádné Node funkce,
// takže vystavujeme pouze informaci, že běžíme jako desktop.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('cartographer', {
  isDesktop: true,
  electronVersion: process.versions.electron,
});
