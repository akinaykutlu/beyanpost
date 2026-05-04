const fs = require('fs')
const path = require('path')
const { app } = require('electron')

const KEEP_DAYS = 30 // kaç günlük log tutulsun

let logDir = null

function getLogDir() {
  if (!logDir) {
    logDir = path.join(app.getPath('userData'), 'logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
  }
  return logDir
}

function getTodayFile() {
  const d = new Date()
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return path.join(getLogDir(), `${dateStr}.log`)
}

function write(level, message, detail = '') {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  const line = `[${time}] [${level}] ${message}${detail ? ' — ' + detail : ''}\n`

  if (level === 'ERROR') console.error(line.trim())
  else console.log(line.trim())

  try {
    fs.appendFileSync(getTodayFile(), line, 'utf8')
  } catch {}
}

function info(msg, detail)  { write('INFO',  msg, detail) }
function warn(msg, detail)  { write('WARN',  msg, detail) }
function error(msg, detail) { write('ERROR', msg, detail) }

// 30 günden eski log dosyalarını sil
function cleanup() {
  try {
    const dir = getLogDir()
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.log'))
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath)
        console.log(`Eski log silindi: ${file}`)
      }
    }
  } catch {}
}

// Günlük temizlik: her 24 saatte bir
function startCleanupSchedule() {
  cleanup() // başlangıçta bir kez çalıştır
  setInterval(cleanup, 24 * 60 * 60 * 1000)
}

function getLogDir2() { return getLogDir() }

module.exports = { info, warn, error, getLogDir: getLogDir2, startCleanupSchedule }
