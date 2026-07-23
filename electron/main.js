const { app, BrowserWindow, Menu, Tray, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
let tray = null;
let backendProcess = null;
let splashWindow = null;

const isDev = !app.isPackaged;

// Hide standard browser window menu bar
Menu.setApplicationMenu(null);

// ═══ SPLASH SCREEN ═══
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashPath = path.join(__dirname, '../build/splash.html');
  if (fs.existsSync(splashPath)) {
    splashWindow.loadFile(splashPath);
  }

  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });
}

// ═══ START BACKEND SERVER ═══
function startBackend() {
  return new Promise((resolve) => {
    console.log('Starting VOXORA backend server...');

    const possibleBackendPaths = [
      path.join(__dirname, '../backend/dist/server.js'),
      path.join(process.resourcesPath || '', 'backend/server.js'),
      path.join(process.resourcesPath || '', 'backend/dist/server.js'),
      path.join(app.getAppPath(), 'backend/dist/server.js'),
    ];

    let backendPath = possibleBackendPaths[0];
    for (const p of possibleBackendPaths) {
      if (fs.existsSync(p)) {
        backendPath = p;
        break;
      }
    }

    try {
      const nodeExec = process.execPath;
      backendProcess = spawn(nodeExec, [backendPath], {
        cwd: isDev ? path.join(__dirname, '../backend') : path.join(process.resourcesPath || '', 'backend'),
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          NODE_ENV: 'production',
          PORT: '4000',
        },
      });

      backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend]: ${data.toString()}`);
      });

      backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error]: ${data.toString()}`);
      });

      backendProcess.on('error', (err) => {
        console.error('Backend process spawn error:', err);
      });
    } catch (e) {
      console.error('Failed to spawn backend process:', e);
    }

    // Fast Health Check Polling (100ms)
    let retries = 0;
    const checkHealth = () => {
      http
        .get('http://localhost:4000/api/system/health', (res) => {
          if (res.statusCode === 200) {
            console.log('Backend server is healthy & ready on port 4000!');
            resolve();
          } else if (retries < 50) {
            retries++;
            setTimeout(checkHealth, 100);
          } else {
            resolve();
          }
        })
        .on('error', () => {
          if (retries < 50) {
            retries++;
            setTimeout(checkHealth, 100);
          } else {
            resolve();
          }
        });
    };

    setTimeout(checkHealth, 100);
  });
}

// ═══ CREATE MAIN WINDOW ═══
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../build/icon.ico'),
    frame: true,
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    show: false,
    titleBarStyle: 'default',
  });

  const appUrl = 'http://localhost:4000/dashboard/';
  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ═══ SYSTEM TRAY ═══
function createTray() {
  try {
    const iconPath = path.join(__dirname, '../build/icon.ico');
    if (!fs.existsSync(iconPath)) return;

    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show VOXORA Software',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: '❌ Exit VOXORA',
        click: () => {
          app.isQuitting = true;
          if (backendProcess) {
            backendProcess.kill();
            backendProcess = null;
          }
          app.quit();
        },
      },
    ]);

    tray.setToolTip('VOXORA - Enterprise Bulk WhatsApp Software & CRM');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.error('Tray creation error:', err);
  }
}

// ═══ APP LIFECYCLE ═══
app.whenReady().then(async () => {
  createSplashWindow();
  await startBackend();
  createMainWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && app.isQuitting) {
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
