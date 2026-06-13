// Electron hlavní proces — zabaluje webovou aplikaci do desktopového okna.
// Statický export (./out) servíruje interní HTTP server na localhostu → plně offline,
// žádné absolutní-cestové problémy s file://, žádný cloud.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const isDev = process.env.ELECTRON_DEV === '1';
const OUT_DIR = path.join(__dirname, '..', 'out');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        if (urlPath.endsWith('/')) urlPath += 'index.html';
        const filePath = path.normalize(path.join(OUT_DIR, urlPath));
        // Path-traversal guard: musí být POD OUT_DIR (porovnáváme s odděleovačem,
        // ať neprojde sourozenec jako "out-secret").
        if (filePath !== OUT_DIR && !filePath.startsWith(OUT_DIR + path.sep)) {
          res.writeHead(403);
          return res.end('Forbidden');
        }
        const send = (fp, onMissing) => {
          fs.readFile(fp, (err, data) => {
            if (err) {
              if (onMissing) return onMissing();
              // Styled 404 z exportu, jinak prostý text
              fs.readFile(path.join(OUT_DIR, '404.html'), (e2, html) => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(e2 ? 'Not found' : html);
              });
              return;
            }
            res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
            res.end(data);
          });
        };
        const ext = path.extname(filePath);
        if (!ext) {
          // route bez přípony → zkus route.html, jinak SPA fallback na index.html
          send(filePath + '.html', () => send(path.join(OUT_DIR, 'index.html'), null));
        } else {
          send(filePath, null);
        }
      } catch {
        res.writeHead(500);
        res.end('Server error');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  return Menu.buildFromTemplate([
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Soubor',
      submenu: [isMac ? { role: 'close' } : { role: 'quit', label: 'Ukončit' }],
    },
    {
      label: 'Zobrazení',
      submenu: [
        { role: 'reload', label: 'Obnovit' },
        { role: 'resetZoom', label: 'Výchozí zoom' },
        { role: 'zoomIn', label: 'Přiblížit' },
        { role: 'zoomOut', label: 'Oddálit' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Celá obrazovka' },
        { role: 'toggleDevTools', label: 'Vývojářské nástroje' },
      ],
    },
  ]);
}

let mainWindow;

async function createWindow() {
  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else {
    const port = await startServer();
    startUrl = `http://127.0.0.1:${port}/${process.env.CARTO_SMOKE ? '?smoke' : ''}`;
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0b0d12',
    title: 'Cartographer',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(buildMenu());
  mainWindow.loadURL(startUrl);

  // Smoke test (aktivní jen s CARTO_SMOKE=1) — ověří, že se okno načte, pak ukončí.
  if (process.env.CARTO_SMOKE) {
    mainWindow.webContents.once('did-finish-load', async () => {
      try {
        // Počkej, než se domountuje dynamicky načtené Konva plátno
        await new Promise((r) => setTimeout(r, 1500));
        const title = await mainWindow.webContents.executeJavaScript('document.title');
        const ok = await mainWindow.webContents.executeJavaScript(
          "document.body && document.body.innerText.includes('Cartographer')",
        );
        const canvases = await mainWindow.webContents.executeJavaScript(
          'document.querySelectorAll("canvas").length',
        );
        console.log(`[smoke] loaded title="${title}" shellVisible=${ok} konvaCanvases=${canvases}`);

        // Test Landmass Masking: textura se musí udržet jen na pevnině, do vody ne.
        const mask = await mainWindow.webContents.executeJavaScript(`
          (async () => {
            const doc = window.__doc, editor = window.__editor;
            if (!doc || !editor) return { err: 'store nedostupný' };
            editor.getState().setMode('world');
            doc.getState().resetDocument();
            doc.getState().apply('land', (d) => {
              d.world.terrainStrokes['L1'] = { id:'L1', kind:'land', points:[160,200,440,200], size:80 };
              d.world.terrainOrder.push('L1');
            });
            doc.getState().apply('tex', (d) => {
              d.world.terrainStrokes['T1'] = { id:'T1', kind:'texture', points:[300,200,520,200], size:60, textureId:'grass' };
              d.world.terrainOrder.push('T1');
            });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            await new Promise(r => setTimeout(r, 250));
            const terrain = document.querySelectorAll('canvas')[2];
            const pr = terrain.width / terrain.getBoundingClientRect().width;
            const ctx = terrain.getContext('2d');
            const at = (x,y) => { const d = ctx.getImageData(Math.round(x*pr), Math.round(y*pr), 1, 1).data; return { r:d[0], g:d[1], b:d[2], a:d[3] }; };
            return { A: at(350,200), B: at(500,200), C: at(200,200) };
          })()
        `);
        console.log(`[smoke] masking ${JSON.stringify(mask)}`);

        // Test exportu (svět má pevninu+texturu) + generátoru dungeonu + exportu dungeonu
        const exp = await mainWindow.webContents.executeJavaScript(`
          (async () => {
            const doc = window.__doc, exportMap = window.__exportMap;
            if (!exportMap) return { err: 'export nedostupný' };
            const world = await exportMap(doc.getState().doc, 'world', { longEdge: 256, mime: 'image/png' });
            // vygeneruj dungeon přes store-friendly cestu: vlož pár místností + chodbu
            doc.getState().apply('gen', (d) => {
              d.dungeon.rooms = { r1:{id:'r1',x:0,y:0,width:96,height:96}, r2:{id:'r2',x:240,y:0,width:96,height:96} };
              d.dungeon.roomOrder = ['r1','r2'];
              d.dungeon.corridors = { c1:{id:'c1',points:[48,48,288,48],width:32} };
              d.dungeon.corridorOrder = ['c1'];
            });
            const dungeon = await exportMap(doc.getState().doc, 'dungeon', { longEdge: 256, mime: 'image/webp' });
            return { worldW: world.width, worldH: world.height, worldBytes: world.blob.size, worldType: world.blob.type, dungBytes: dungeon.blob.size, dungType: dungeon.blob.type };
          })()
        `);
        console.log(`[smoke] export ${JSON.stringify(exp)}`);
        setTimeout(() => app.quit(), 400);
      } catch (e) {
        console.log('[smoke] eval error', e);
        app.exit(1);
      }
    });
    mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
      console.log(`[smoke] FAIL code=${code} desc=${desc}`);
      app.exit(1);
    });
  }

  // Externí odkazy otevírej v systémovém prohlížeči, ne v aplikaci
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
