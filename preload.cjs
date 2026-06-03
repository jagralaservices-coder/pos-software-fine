const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  print: (htmlContent) => ipcRenderer.send('print-silent', htmlContent)
});
