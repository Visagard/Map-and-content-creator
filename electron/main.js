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
        let filePath = path.normalize(path.join(OUT_DIR, urlPath));
        if (!filePath.startsWith(OUT_DIR)) {
          res.writeHead(403);
          return res.end('Forbidden');
        }
        const send = (fp, fallbackToIndex) => {
          fs.readFile(fp, (err, data) => {
            if (err) {
              if (fallbackToIndex) return send(path.join(OUT_DIR, 'index.html'), false);
              res.writeHead(404);
              return res.end('Not found');
            }
            res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
            res.end(data);
          });
        };
        const ext = path.extname(filePath);
        if (!ext) {
          // route bez přípony → zkus route.html, jinak SPA fallback na index.html
          send(filePath + '.html', true);
        } else {
          send(filePath, false);
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
    startUrl = `http://127.0.0.1:${port}/`;
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
    mainWindow.webContents.on('did-finish-load', async () => {
      try {
        const title = await mainWindow.webContents.executeJavaScript('document.title');
        const ok = await mainWindow.webContents.executeJavaScript(
          "document.body && document.body.innerText.includes('Cartographer')",
        );
        console.log(`[smoke] loaded title="${title}" shellVisible=${ok}`);
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
