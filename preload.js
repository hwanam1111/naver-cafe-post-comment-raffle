const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startLottery: (formData) => ipcRenderer.invoke('start-lottery', formData),
  stopLottery: () => ipcRenderer.send('stop-lottery'),
  onLog: (callback) => ipcRenderer.on('log', (_, message) => callback(message))
});
