const path = require('path')
const fs = require('fs')
const log = require('./logger')

let sock = null
let status = 'disconnected'
let shouldStop = false
let initTimeout = null

function getStatus() { return status }

function getSessionDir() {
  const { app } = require('electron')
  return path.join(app.getPath('userData'), 'baileys_auth')
}

let manualClear = false

function clearSession() {
  const sessionDir = getSessionDir()
  try {
    manualClear = true
    if (sock) { try { sock.end() } catch {} sock = null }
    status = 'disconnected'
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true })
    }
    log.info('WhatsApp oturumu temizlendi')
    setTimeout(() => { manualClear = false }, 3000)
  } catch (e) {
    log.error('Oturum temizleme hatası', e.message)
    manualClear = false
  }
}

async function init(mainWindow) {
  try {
    const Baileys = await import('@whiskeysockets/baileys')
    const makeWASocket = Baileys.makeWASocket || Baileys.default?.makeWASocket || Baileys.default
    const useMultiFileAuthState = Baileys.useMultiFileAuthState
    const DisconnectReason = Baileys.DisconnectReason
    const fetchLatestBaileysVersion = Baileys.fetchLatestBaileysVersion
    const { Boom } = await import('@hapi/boom')
    const QRCode = require('qrcode')

    if (sock) { try { sock.end() } catch {} sock = null }
    if (initTimeout) clearTimeout(initTimeout)

    status = 'initializing'
    log.info('WhatsApp başlatılıyor...')

    const sessionDir = getSessionDir()
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    const silentLogger = {
      level: 'silent',
      trace: () => {}, debug: () => {}, info: () => {},
      warn: () => {}, error: () => {}, fatal: () => {},
      child: () => silentLogger
    }

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['BeyanPost', 'Chrome', '1.0.0'],
      logger: silentLogger
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        status = 'qr'
        if (initTimeout) clearTimeout(initTimeout)
        log.info('QR kod oluşturuldu')
        try {
          const url = await QRCode.toDataURL(qr)
          mainWindow.webContents.send('qr-code', url)
        } catch (e) {
          log.error('QR oluşturma hatası', e.message)
        }
      }

      if (connection === 'open') {
        status = 'ready'
        if (initTimeout) clearTimeout(initTimeout)
        const phone = sock.user?.id?.split(':')[0] || ''
        log.info('WhatsApp hazır', phone)
        mainWindow.webContents.send('whatsapp-ready', { phone })
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
        log.warn('Bağlantı kesildi', String(statusCode))

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        if (!shouldReconnect) {
          log.info('Oturum geçersiz (401), temizleniyor')
          clearSession()
          status = 'disconnected'
          mainWindow.webContents.send('whatsapp-disconnected', {})
        } else if (manualClear) {
          status = 'disconnected'
          mainWindow.webContents.send('whatsapp-disconnected', {})
        } else {
          log.info('Yeniden bağlanıyor...', String(statusCode))
          status = 'disconnected'
          setTimeout(() => init(mainWindow), 2000)
        }
      }
    })

    initTimeout = setTimeout(() => {
      if (status === 'initializing' || status === 'qr') {
        status = 'disconnected'
        log.error('WhatsApp bağlantı zaman aşımı')
        mainWindow.webContents.send('whatsapp-error', { message: 'Bağlantı zaman aşımına uğradı. Tekrar deneyin.' })
      }
    }, 90000)

  } catch (e) {
    log.error('WhatsApp başlatma hatası', e.message)
    status = 'disconnected'
    mainWindow.webContents.send('whatsapp-error', { message: 'WhatsApp başlatılamadı: ' + e.message })
  }
}

function destroy() {
  if (sock) { try { sock.end() } catch {} sock = null }
  status = 'disconnected'
}

function stopSending() { shouldStop = true }

// min ve max artık dışarıdan parametrik olarak geliyor (saniye cinsinden)
function randomDelay(minSec = 8, maxSec = 15) {
  const minMs = minSec * 1000
  const maxMs = maxSec * 1000
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs))
}

function formatPhone(phone) {
  let p = String(phone).replace(/\D/g, '')
  if (p.startsWith('0')) p = p.slice(1)
  if (!p.startsWith('90')) p = '90' + p
  return p + '@s.whatsapp.net'
}

// delayMin ve delayMax: saniye cinsinden (varsayılan 8-15)
async function startSending(items, folderPath, mainWindow, delayMin = 8, delayMax = 15) {
  if (status !== 'ready') {
    mainWindow.webContents.send('send-complete', { error: 'WhatsApp bağlı değil' })
    return
  }

  status = 'sending'
  shouldStop = false

  let captionTemplate = 'Sayın {firma},\nAylık beyannameniz ektedir.\n\nBu mesaj BeyanPost tarafından otomatik gönderilmiştir.'
  try {
    const settings = require('./db').getSettings()
    if (settings.whatsappCaption) captionTemplate = settings.whatsappCaption
  } catch {}

  const results = []
  const total = items.length

  for (let i = 0; i < items.length; i++) {
    if (shouldStop) {
      results.push(...items.slice(i).map(item => ({
        vkn: item.vkn, firmAdi: item.firmAdi, phone: item.phone,
        status: 'iptal', files: item.files, error: 'Kullanıcı tarafından durduruldu'
      })))
      break
    }

    const item = items[i]
    const jid = formatPhone(item.phone)

    try {
      for (let fi = 0; fi < item.files.length; fi++) {
        const fileName = item.files[fi]
        const filePath = path.join(folderPath, fileName)
        if (!fs.existsSync(filePath)) throw new Error(`Dosya bulunamadı: ${fileName}`)

        const fileBuffer = fs.readFileSync(filePath)
        const caption = fi === 0 ? captionTemplate.replace('{firma}', item.firmAdi || '') : ''

        await sock.sendMessage(jid, {
          document: fileBuffer,
          fileName: fileName,
          mimetype: 'application/pdf',
          caption
        })

        if (item.files.length > 1 && fi < item.files.length - 1) {
          await new Promise(r => setTimeout(r, 1500))
        }
      }

      log.info(`Gönderildi: ${item.firmAdi}`)
      results.push({ vkn: item.vkn, firmAdi: item.firmAdi, phone: item.phone, status: 'gönderildi', files: item.files, error: null })
      mainWindow.webContents.send('send-progress', { current: i + 1, total, last: { vkn: item.vkn, firmAdi: item.firmAdi, status: 'gönderildi' } })

    } catch (err) {
      log.error(`Gönderim hatası: ${item.firmAdi}`, err.message)
      results.push({ vkn: item.vkn, firmAdi: item.firmAdi, phone: item.phone, status: 'hata', files: item.files, error: err.message })
      mainWindow.webContents.send('send-progress', { current: i + 1, total, last: { vkn: item.vkn, firmAdi: item.firmAdi, status: 'hata', error: err.message } })
    }

    if (i < items.length - 1 && !shouldStop) {
      await randomDelay(delayMin, delayMax)
    }
  }

  status = 'ready'
  mainWindow.webContents.send('send-complete', { results })
}

module.exports = { init, destroy, getStatus, startSending, stopSending, clearSession }
