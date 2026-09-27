// AI Hub - Native macOS Electron Wrapper
// Run with: npx electron electron-main.cjs

const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');

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
      webviewTag: true, // Enables isolated <webview> tags with session partitions
      allowRunningInsecureContent: false,
    },
  });

  // Enable isolated cookie partitions for each service provider
  const providers = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok'];
  providers.forEach(provider => {
    const ses = session.fromPartition(`persist:${provider}`);
    // Keep cookies and storage indefinitely in macOS Application Support
  });

  // Load Vite dev server or built production files
  const devUrl = 'http://localhost:3000';
  mainWindow.loadURL(devUrl).catch(() => {
    // If dev server not running, load production dist
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  });

  // Open external links in macOS default browser (Safari, Chrome, etc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
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
