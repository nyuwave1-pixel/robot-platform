// Desktop wrapper (Windows / macOS / Linux). Loads the Vite production build from ./dist.
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
app.commandLine.appendSwitch('disable-frame-rate-limit'); // let the in-game frame limiter decide
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1600, height: 900, backgroundColor: '#000000', autoHideMenuBar: true, title: 'SPECIAL SOLDIER', webPreferences: { contextIsolation: true } });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.on('enter-full-screen', () => win.setMenuBarVisibility(false));
});
app.on('window-all-closed', () => app.quit());
