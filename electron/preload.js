const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, route) => callback(route));
  },
});
