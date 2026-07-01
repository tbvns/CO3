const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db;

function getDb() {
  if (!db) {
    const userDataPath = path.join(app.getPath('userData'), 'CO3');
    fs.mkdirSync(userDataPath, { recursive: true });
    db = new Database(path.join(userDataPath, 'library.db'));
  }
  return db;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

ipcMain.handle('db:exec', (event, sql, params = []) => {
  const stmt = getDb().prepare(sql);
  if (stmt.reader) {
    return stmt.all(params);
  }
  return stmt.run(params);
});

ipcMain.handle('db:transaction', (event, ops) => {
  const database = getDb();
  const runAll = database.transaction((statements) => {
    for (const { sql, params } of statements) {
      const stmt = database.prepare(sql);
      if (stmt.reader) {
        stmt.all(params);
      } else {
        stmt.run(params);
      }
    }
  });
  runAll(ops);
  return true;
});

ipcMain.handle('cookie-set', async (event, url, name, value) => {
  await session.defaultSession.cookies.set({ url, name, value, path: '/' });
  return true;
});

ipcMain.handle('cookie-get', async (event, url) => {
  const cookies = await session.defaultSession.cookies.get({ url });
  return cookies.reduce((acc, c) => {
    acc[c.name] = { name: c.name, value: c.value };
    return acc;
  }, {});
});

ipcMain.handle('cookie-clear', async () => {
  const cookies = await session.defaultSession.cookies.get({});
  await Promise.all(
    cookies.map(c =>
      session.defaultSession.cookies.remove(
        `http${c.secure ? 's' : ''}://${c.domain.replace(/^\./, '')}${c.path}`,
        c.name,
      ),
    ),
  );
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });