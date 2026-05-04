const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const os = require('os')
const log = require('./logger')

const API_URL = 'https://beyanpost.zabiris.com/api.php'

function getCachePath() {
  return path.join(app.getPath('userData'), 'license.json')
}

function getMachineId() {
  const raw = [os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model || '', os.totalmem()].join('|')
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

function readCache() {
  try {
    const p = getCachePath()
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch { return null }
}

function writeCache(data) {
  fs.writeFileSync(getCachePath(), JSON.stringify(data), 'utf8')
}

function clearCache() {
  const p = getCachePath()
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

async function verifyLicense(licenseKey) {
  const machineId = getMachineId()
  const fetch = require('node-fetch')

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', license_key: licenseKey, machine_id: machineId }),
      timeout: 10000
    })
    const data = await res.json()

    if (data.valid) {
      writeCache({
        key: licenseKey,
        machineId,
        customerName: data.customer_name,
        bureauName: data.bureau_name,
        plan: data.plan,
        expiresAt: data.expires_at,
        cachedAt: new Date().toISOString()
      })
      log.info('Lisans doğrulandı', `${data.customer_name} / ${data.plan}`)
    } else {
      log.warn('Lisans geçersiz', data.error)
    }
    return data
  } catch (err) {
    log.error('Lisans sunucusuna bağlanılamadı', err.message)
    throw err
  }
}

async function checkOnStartup() {
  const cache = readCache()
  if (!cache) return { valid: false, needsActivation: true }

  const machineId = getMachineId()
  if (cache.machineId !== machineId) {
    clearCache()
    return { valid: false, needsActivation: true }
  }

  // Her açılışta online kontrol
  try {
    const result = await verifyLicense(cache.key)
    return result
  } catch {
    // İnternet yoksa 3 günlük grace period
    const daysSince = (Date.now() - new Date(cache.cachedAt).getTime()) / 86400000
    if (daysSince < 3) {
      log.warn('Lisans sunucusuna ulaşılamadı, önbellek kullanılıyor')
      return { valid: true, customerName: cache.customerName, bureauName: cache.bureauName, plan: cache.plan, expiresAt: cache.expiresAt, fromCache: true, offline: true }
    }
    clearCache()
    return { valid: false, needsActivation: true, error: 'İnternet bağlantısı kurulamadı.' }
  }
}

function deactivate() { clearCache() }

module.exports = { verifyLicense, checkOnStartup, deactivate, getMachineId }
