const path = require('path')
const fs = require('fs')
const { app } = require('electron')

// sql.js - WebAssembly tabanlı, native derleme gerektirmez
const initSqlJs = require('sql.js')

let db = null
let dbPath = null

async function init() {
  const SQL = await initSqlJs()
  dbPath = path.join(app.getPath('userData'), 'beyanname.db')

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      folder TEXT,
      excel TEXT,
      total INTEGER,
      success INTEGER,
      failed INTEGER,
      results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)
  persist()
}

// Değişiklikten sonra diske yaz
function persist() {
  if (!db || !dbPath) return
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function saveReport(reportData) {
  db.run(
    `INSERT INTO reports (date, folder, excel, total, success, failed, results)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      reportData.date,
      reportData.folder,
      reportData.excel,
      reportData.total,
      reportData.success,
      reportData.failed,
      JSON.stringify(reportData.results)
    ]
  )
  persist()
}

function getReports() {
  const stmt = db.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 50')
  const rows = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    rows.push({ ...row, results: JSON.parse(row.results) })
  }
  stmt.free()
  return rows
}

function saveSettings(settings) {
  for (const [key, value] of Object.entries(settings)) {
    db.run(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      [key, String(value)]
    )
  }
  persist()
}

function getSettings() {
  const stmt = db.prepare('SELECT key, value FROM settings')
  const result = {}
  while (stmt.step()) {
    const row = stmt.getAsObject()
    result[row.key] = row.value
  }
  stmt.free()
  return result
}

module.exports = { init, saveReport, getReports, saveSettings, getSettings }
