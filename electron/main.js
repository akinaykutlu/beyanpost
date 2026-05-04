const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const db = require('./db')
const whatsapp = require('./whatsapp')
const license = require('./license')
const log = require('./logger')

const isDev = !app.isPackaged

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    title: 'BeyanPost'
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  await db.init()
  Menu.setApplicationMenu(null)
  log.startCleanupSchedule()
  log.info('BeyanPost başlatıldı')
  createWindow()

  // Pencere yüklendikten sonra otomatik WhatsApp başlat
  mainWindow.webContents.once('did-finish-load', () => {
    const sessionPath = path.join(app.getPath('userData'), 'baileys_auth')
    if (fs.existsSync(sessionPath)) {
      log.info('Kayıtlı oturum bulundu, otomatik bağlanıyor...')
      whatsapp.init(mainWindow)
    }
  })

  // ── Otomatik Güncelleme (sadece production) ──────────────────────
  if (!isDev) {
    try {
      const { autoUpdater } = require('electron-updater')

      autoUpdater.autoDownload = false        // kullanıcı onayı bekle
      autoUpdater.autoInstallOnAppQuit = true // kapanışta kur

      autoUpdater.on('update-available', (info) => {
        log.info('Güncelleme mevcut', info.version)
        mainWindow.webContents.send('update-available', {
          version: info.version,
          releaseNotes: info.releaseNotes || ''
        })
      })

      autoUpdater.on('update-not-available', () => {
        // Manuel kontrol sonucu gönder
        mainWindow.webContents.send('update-not-available')
      })

      autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send('update-download-progress', {
          percent: Math.round(progress.percent),
          transferred: progress.transferred,
          total: progress.total
        })
      })

      autoUpdater.on('update-downloaded', () => {
        log.info('Güncelleme indirildi')
        mainWindow.webContents.send('update-downloaded')
      })

      autoUpdater.on('error', (err) => {
        log.error('Güncelleme hatası', err.message)
        mainWindow.webContents.send('update-error', { message: err.message })
      })

      // Uygulama açılışında 10sn sonra güncelleme kontrol et
     setTimeout(() => {
  autoUpdater.checkForUpdates().catch(() => {
    // Sessiz geç
  })
}, 10000)

    } catch (err) {
      log.warn('electron-updater yüklenemedi', err.message)
    }
  }
})

app.on('window-all-closed', () => {
  whatsapp.destroy()
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC: Klasör seç ───────────────────────────────────────────────
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// ─── IPC: Excel seç ────────────────────────────────────────────────
ipcMain.handle('select-excel', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
    properties: ['openFile']
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// ─── IPC: Excel oku ────────────────────────────────────────────────
ipcMain.handle('read-excel', async (_, filePath) => {
  try {
    const XLSX = require('xlsx')
    const workbook = XLSX.readFile(filePath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Klasördeki PDF'leri tara ─────────────────────────────────
ipcMain.handle('scan-folder', async (_, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath)
    const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf'))
    const grouped = {}
    for (const file of pdfs) {
      const vkn = file.split('-')[0].trim()
      if (!grouped[vkn]) grouped[vkn] = []
      grouped[vkn].push(file)
    }
    return { success: true, grouped, folderPath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: WhatsApp QR başlat ───────────────────────────────────────
ipcMain.handle('whatsapp-init', async () => {
  whatsapp.init(mainWindow)
  return { success: true }
})

// ─── IPC: WhatsApp durum sorgula ───────────────────────────────────
ipcMain.handle('whatsapp-status', async () => {
  return whatsapp.getStatus()
})

// ─── IPC: Gönderim başlat (delayMin / delayMax destekli) ──────────
ipcMain.handle('start-sending', async (_, payload) => {
  const delayMin = payload.delayMin ?? 8
  const delayMax = payload.delayMax ?? 15
  whatsapp.startSending(payload.items, payload.folderPath, mainWindow, delayMin, delayMax)
  return { success: true }
})

// ─── IPC: Gönderimi durdur ─────────────────────────────────────────
ipcMain.handle('stop-sending', async () => {
  whatsapp.stopSending()
  return { success: true }
})

// ─── IPC: Rapor kaydet ─────────────────────────────────────────────
ipcMain.handle('save-report', async (_, reportData) => {
  try {
    db.saveReport(reportData)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Raporları getir ──────────────────────────────────────────
ipcMain.handle('get-reports', async () => {
  try {
    const reports = db.getReports()
    return { success: true, reports }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Lisans kontrol (startup) ────────────────────────────────
ipcMain.handle('license-check', async () => {
  try {
    const result = await license.checkOnStartup()
    return result
  } catch (err) {
    return { valid: false, error: err.message }
  }
})

// ─── IPC: Lisans aktive et ─────────────────────────────────────────
ipcMain.handle('license-activate', async (_, key) => {
  try {
    const result = await license.verifyLicense(key)
    return result
  } catch (err) {
    return { valid: false, error: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.' }
  }
})

// ─── IPC: Lisans deaktive et ───────────────────────────────────────
ipcMain.handle('license-deactivate', async () => {
  license.deactivate()
  return { success: true }
})

// ─── IPC: WhatsApp oturumu temizle ────────────────────────────────
ipcMain.handle('whatsapp-clear-session', async () => {
  try {
    if (whatsapp.getStatus() !== 'disconnected') {
      whatsapp.destroy()
    }
    whatsapp.clearSession()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Ayarları kaydet ─────────────────────────────────────────
ipcMain.handle('save-settings', async (_, settings) => {
  try {
    db.saveSettings(settings)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Ayarları getir ──────────────────────────────────────────
ipcMain.handle('get-settings', async () => {
  try {
    const settings = db.getSettings()
    return { success: true, settings }
  } catch (err) {
    return { success: false, settings: {} }
  }
})

// ─── IPC: Örnek Excel şablonu oluştur ────────────────────────────
ipcMain.handle('create-excel-template', async () => {
  try {
    const XLSX = require('xlsx')
    const desktopPath = app.getPath('desktop')
    const filePath = path.join(desktopPath, 'mukellef_listesi.xlsx')
    const data = [
      ['VKN', 'Telefon', 'Firma Adı'],
      ['12345678900', '5301234567', 'ABC Muhasebe Ltd.'],
      ['98765432100', '5559876543', 'XYZ Ticaret A.Ş.'],
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Mükellefleri')
    XLSX.writeFile(wb, filePath)
    return { success: true, path: filePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Güncelleme kontrol et (manuel) ──────────────────────────
ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { success: false, error: 'Geliştirme modunda güncelleme kontrolü yapılmaz.' }
  }
  try {
    const { autoUpdater } = require('electron-updater')
    await autoUpdater.checkForUpdates()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Güncellemeyi indir ──────────────────────────────────────
ipcMain.handle('download-update', async () => {
  try {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.downloadUpdate()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Güncellemeyi kur ve yeniden başlat ──────────────────────
ipcMain.handle('install-update', async () => {
  try {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.quitAndInstall()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IPC: Uygulama versiyonu ──────────────────────────────────────
ipcMain.handle('get-app-version', async () => {
  return app.getVersion()
})
// ─── IPC: Logları getir ───────────────────────────────────────────
ipcMain.handle('get-logs', async () => {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs')
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const logFile = path.join(logDir, `${today}.log`)
    if (!fs.existsSync(logFile)) return { success: true, logs: [] }
    const content = fs.readFileSync(logFile, 'utf-8')
    const logs = content.split('\n').filter(l => l.trim())
    return { success: true, logs }
  } catch (err) {
    return { success: false, logs: [], error: err.message }
  }
})