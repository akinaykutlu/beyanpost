const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectExcel: () => ipcRenderer.invoke('select-excel'),
  readExcel: (path) => ipcRenderer.invoke('read-excel', path),
  scanFolder: (path) => ipcRenderer.invoke('scan-folder', path),
  whatsappInit: () => ipcRenderer.invoke('whatsapp-init'),
  whatsappStatus: () => ipcRenderer.invoke('whatsapp-status'),
  startSending: (payload) => ipcRenderer.invoke('start-sending', payload),
  stopSending: () => ipcRenderer.invoke('stop-sending'),
  saveReport: (data) => ipcRenderer.invoke('save-report', data),
  getReports: () => ipcRenderer.invoke('get-reports'),
  licenseCheck: () => ipcRenderer.invoke('license-check'),
  licenseActivate: (key) => ipcRenderer.invoke('license-activate', key),
  licenseDeactivate: () => ipcRenderer.invoke('license-deactivate'),
  whatsappClearSession: () => ipcRenderer.invoke('whatsapp-clear-session'),
  getLogs: () => ipcRenderer.invoke('get-logs'),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),
  openLogFile: () => ipcRenderer.invoke('open-log-file'),
  openLogFolder: () => ipcRenderer.invoke('open-log-folder'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  createExcelTemplate: () => ipcRenderer.invoke('create-excel-template'),

  // Güncelleme
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Electron'dan React'a event dinle
  on: (channel, callback) => {
    const allowed = [
      'qr-code', 'whatsapp-ready', 'whatsapp-disconnected',
      'whatsapp-error', 'whatsapp-status-update',
      'send-progress', 'send-complete',
      'update-available', 'update-not-available',
      'update-download-progress', 'update-downloaded', 'update-error'
    ]
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_, data) => callback(data))
    }
  },
  off: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
