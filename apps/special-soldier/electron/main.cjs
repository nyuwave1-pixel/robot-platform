// Desktop wrapper (Windows / macOS / Linux). Loads the Vite production build from ./dist.
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
app.commandLine.appendSwitch('disable-frame-rate-limit'); // let the in-game frame limiter decide
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1600, height: 900, backgroundColor: '#000000', autoHideMenuBar: true, title: 'SPECIAL SOLDIER', webPreferences: { contextIsolation: true } });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  // SS_SMOKE=1: packaging smoke test — report the game state once booted, then quit.
  if (process.env.SS_SMOKE) {
    const t0 = Date.now(); const poll = setInterval(async () => {
      const s = await win.webContents.executeJavaScript('window.SS ? SS.state + "|" + document.title : "loading"').catch((e) => 'error ' + e.message);
      if (s.startsWith('menu') || Date.now() - t0 > 120000) { console.log('SS_SMOKE ' + s); clearInterval(poll); app.quit(); }
    }, 1000);
  }
});
app.on('window-all-closed', () => app.quit());
