import React, { useState, useEffect } from 'react'

const DEFAULT_CAPTION = 'Sayın {firma},\nAylık beyannameniz ektedir.\n\nBu mesaj BeyanPost tarafından otomatik gönderilmiştir.'

const DELAY_RISKS = [
  { min: 8,   max: 15,  label: '8 – 15 sn',  risk: 'Yüksek',    color: '#dc2626', bg: '#fef2f2', desc: 'Spam tespiti olasılığı yüksek. Kısa listeler için kullanın.' },
  { min: 30,  max: 45,  label: '30 – 45 sn', risk: 'Orta',      color: '#d97706', bg: '#fffbeb', desc: 'Orta risk. 50 kişiye kadar listelerde makul.' },
  { min: 60,  max: 90,  label: '60 – 90 sn', risk: 'Düşük',     color: '#16a34a', bg: '#f0fdf4', desc: 'Güvenli aralık. Büyük listelerde önerilir.' },
  { min: 120, max: 180, label: '2 – 3 dk',   risk: 'Çok Düşük', color: '#0369a1', bg: '#eff6ff', desc: 'En güvenli seçenek. Gün boyu arka planda çalışabilir.' },
]

export default function AyarlarPage({ licenseInfo }) {
  const [caption, setCaption]           = useState(DEFAULT_CAPTION)
  const [captionSaved, setCaptionSaved] = useState(false)
  const [delayIndex, setDelayIndex]     = useState(0)
  const [delaySaved, setDelaySaved]     = useState(false)
  const [logs, setLogs]                 = useState([])
  const [logsExpanded, setLogsExpanded] = useState(false)
  const [appVersion, setAppVersion]     = useState('')
  const [updateStatus, setUpdateStatus] = useState(null)
  // null | 'checking' | 'latest' | 'available' | 'error'
  const [updateInfo, setUpdateInfo]     = useState({})
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  useEffect(() => {
    window.api.getSettings().then(res => {
      if (res.success && res.settings) {
        if (res.settings.whatsappCaption) setCaption(res.settings.whatsappCaption)
        if (res.settings.delayIndex !== undefined) setDelayIndex(Number(res.settings.delayIndex))
      }
    })
    window.api.getAppVersion().then(v => setAppVersion(v))

    window.api.on('update-available', (info) => {
      setUpdateInfo(info)
      setUpdateStatus('available')
    })
    window.api.on('update-not-available', () => setUpdateStatus('latest'))
    window.api.on('update-error', () => setUpdateStatus('error'))

    return () => {
      window.api.off('update-available')
      window.api.off('update-not-available')
      window.api.off('update-error')
    }
  }, [])

  const handleSaveCaption = async () => {
    await window.api.saveSettings({ whatsappCaption: caption })
    setCaptionSaved(true)
    setTimeout(() => setCaptionSaved(false), 2000)
  }

  const handleSaveDelay = async () => {
    await window.api.saveSettings({ delayIndex })
    setDelaySaved(true)
    setTimeout(() => setDelaySaved(false), 2000)
  }

  const handleCheckUpdate = async () => {
    setUpdateStatus('checking')
    await window.api.checkForUpdates()
  }

  const handleLoadLogs = async () => {
    if (logsExpanded) { setLogsExpanded(false); return }
    const res = await window.api.getLogs()
    if (res.success) setLogs(res.logs || [])
    setLogsExpanded(true)
  }

  const handleDeactivate = async () => {
    await window.api.licenseDeactivate()
    setShowDeactivateConfirm(false)
    alert('Lisans deaktive edildi. Uygulama yeniden başlatılacak.')
    window.location.reload()
  }

  const selected = DELAY_RISKS[delayIndex]

  const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '♾ Süresiz'

  return (
    <div>
      <h2 style={{ marginBottom: 4, fontSize: 18 }}>Ayarlar</h2>
      <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13 }}>Gönderim tercihleri, lisans ve uygulama yönetimi.</p>

      {/* ── Gönderim Aralığı ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>⏱️ Gönderim Aralığı</div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
          Mesajlar arasındaki bekleme süresi. Düşük aralıklar WhatsApp'ın spam korumasını
          tetikleyebilir. <strong>Minimum 8 saniyenin altına düşürmeyin.</strong>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {DELAY_RISKS.map((d, i) => (
            <button
              key={i}
              onClick={() => setDelayIndex(i)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${delayIndex === i ? d.color : '#e2e8f0'}`,
                background: delayIndex === i ? d.bg : 'white',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: delayIndex === i ? d.color : '#1a1a2e', marginBottom: 2 }}>{d.label}</div>
              <div style={{
                display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '1px 6px',
                borderRadius: 99, background: d.bg, color: d.color, border: `1px solid ${d.color}`, marginBottom: 4
              }}>{d.risk} Risk</div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{d.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleSaveDelay} style={{ fontSize: 13, padding: '9px 18px' }}>💾 Kaydet</button>
          {delaySaved && <span style={{ fontSize: 13, color: '#16a34a' }}>✅ Kaydedildi</span>}
        </div>
      </div>

      {/* ── Gönderim Mesajı ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>💬 Gönderim Mesajı</div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>
          Beyanname ile birlikte gönderilecek mesaj.{' '}
          <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{firma}'}</code>{' '}
          otomatik firma adına dönüşür.
        </p>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={4}
          style={{
            width: '100%', padding: '10px 12px', fontSize: 13,
            border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none',
            resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
            boxSizing: 'border-box', marginBottom: 8
          }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleSaveCaption} style={{ fontSize: 13, padding: '9px 18px' }}>💾 Kaydet</button>
          <button className="btn-secondary" onClick={() => setCaption(DEFAULT_CAPTION)} style={{ fontSize: 13, padding: '9px 14px' }}>Varsayılana Sıfırla</button>
          {captionSaved && <span style={{ fontSize: 13, color: '#16a34a' }}>✅ Kaydedildi</span>}
        </div>
      </div>

      {/* ── Güncelleme ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>🔄 Uygulama Güncellemesi</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          Mevcut sürüm: <strong>v{appVersion}</strong>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheckUpdate}
            disabled={updateStatus === 'checking'}
            className="btn-secondary"
            style={{ fontSize: 13, padding: '9px 16px' }}
          >
            {updateStatus === 'checking' ? '⏳ Kontrol ediliyor...' : '🔍 Güncelleme Kontrol Et'}
          </button>
          {updateStatus === 'latest' && (
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ En güncel sürümdesiniz</span>
          )}
          {updateStatus === 'available' && (
            <span style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>
              🆕 v{updateInfo.version} mevcut — uygulama bildirimi kontrol edin
            </span>
          )}
          {updateStatus === 'error' && (
            <span style={{ fontSize: 13, color: '#dc2626' }}>⚠️ Kontrol edilemedi</span>
          )}
        </div>
      </div>

      {/* ── Lisans ── */}
      {licenseInfo && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🔑 Lisans Bilgisi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'MÜŞTERİ', value: licenseInfo.customerName || '—' },
              { label: 'BÜRO ADI', value: licenseInfo.bureauName || '—' },
              { label: 'PLAN', value: { solo: 'Solo — 1 Cihaz', duo: 'Duo — 2 Cihaz', office: 'Office — 5 Cihaz' }[licenseInfo.plan] || licenseInfo.plan || '—' },
              { label: 'BİTİŞ TARİHİ', value: formatDate(licenseInfo.expiresAt) },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
          {!showDeactivateConfirm ? (
            <button
              onClick={() => setShowDeactivateConfirm(true)}
              style={{ fontSize: 12, padding: '7px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer' }}
            >
              Lisansı Deaktive Et
            </button>
          ) : (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 10 }}>Bu cihazdan lisansı kaldırmak istediğinizden emin misiniz?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDeactivate} style={{ padding: '7px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Evet, Kaldır</button>
                <button onClick={() => setShowDeactivateConfirm(false)} className="btn-secondary" style={{ fontSize: 13, padding: '7px 14px' }}>İptal</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Log Görüntüleyici ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: logsExpanded ? 12 : 0 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>📋 Uygulama Logları</div>
            {!logsExpanded && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Hata ayıklama ve aktivite geçmişi</div>}
          </div>
          <button onClick={handleLoadLogs} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
            {logsExpanded ? 'Kapat' : 'Göster'}
          </button>
        </div>
        {logsExpanded && (
          <div style={{
            background: '#0f172a', borderRadius: 8, padding: 12,
            maxHeight: 240, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11
          }}>
            {logs.length === 0
              ? <div style={{ color: '#475569', textAlign: 'center', padding: 16 }}>Log bulunamadı</div>
              : logs.map((line, i) => (
                <div key={i} style={{
                  color: line.includes('ERROR') ? '#f87171' : line.includes('WARN') ? '#fbbf24' : '#94a3b8',
                  marginBottom: 2, lineHeight: 1.5
                }}>{line}</div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
