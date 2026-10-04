// AI Hub - Native macOS Electron Wrapper
// Run with: npx electron electron-main.cjs

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Only hand http(s) URLs to the OS browser; anything else (javascript:,
// file:, data:) would be opened as a link by the default handler.
const isSafeExternalUrl = (url) => {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'AI Hub',
    titleBarStyle: 'hiddenInset', // macOS native traffic light integration
    backgroundColor: '#121214',
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false, // the app embeds services in sandboxed iframes
      allowRunningInsecureContent: false,
    },
  });

  // Load Vite dev server, falling back to the production build
  const devUrl = 'http://localhost:3000';
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadURL(devUrl).catch(() => {
    if (fs.existsSync(distIndex)) {
      // vite.config.ts sets base: './', so dist/index.html resolves its
      // assets relative to file:// correctly.
      mainWindow.loadFile(distIndex).catch((err) => {
        console.error('Failed to load production build:', err);
      });
    } else {
      console.error('No dev server on ' + devUrl + ' and no dist/index.html. Run "npm run build" first.');
    }
  });

  // Open external links in macOS default browser (Safari, Chrome, etc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
