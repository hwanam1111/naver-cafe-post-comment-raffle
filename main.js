const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const runPuppeteer = require('./logic/puppeteer');

let mainWindow;
let globalBrowser = null;

function createWindow() {
  const isMac = process.platform === 'darwin';
  const iconPath = isMac ? 'icon.icns' : 'icon.ico';

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 850,
    icon: path.join(__dirname, iconPath),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('renderer/index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('start-lottery', async (_event, formData) => {
  return await runPuppeteer(
    formData,
    (log) => mainWindow.webContents.send('log', log),
    (browserInstance) => { globalBrowser = browserInstance; }
  );
});

ipcMain.on('stop-lottery', () => {
  if (globalBrowser) {
    try {
      globalBrowser.close();
    } catch (_) {}
    globalBrowser = null;
  }
});
