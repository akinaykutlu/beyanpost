import React, { useState, useEffect } from 'react'

const DEFAULT_CAPTION = 'Sayın {firma},\nAylık beyannameniz ektedir.\n\nBu mesaj BeyanPost tarafından otomatik gönderilmiştir.'

export default function SetupPage({ waStatus, setWaStatus }) {
  const [qrUrl, setQrUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [caption, setCaption] = useState(DEFAULT_CAPTION)
  const [captionSaved, setCaptionSaved] = useState(false)

  useEffect(() => {
    window.api.getSettings().then(res => {
      if (res.success && res.settings?.whatsappCaption) {
        setCaption(res.settings.whatsappCaption)
      }
    })
    window.api.on('qr-code', (url) => {
      setQrUrl(url); setWaStatus('qr'); setLoading(false); setStatusMsg('')
    })
    window.api.on('whatsapp-status-update', (data) => {
      setStatusMsg(data.message)
      // QR okutulduktan sonra mesaj gelir, QR'ı silme
      // sadece loading ekranındaysa göster
    })
    window.api.on('whatsapp-error', (data) => {
      setLoading(false); setQrUrl(null); setStatusMsg('')
      alert('Hata: ' + data.message)
    })
    return () => {
      window.api.off('qr-code')
      window.api.off('whatsapp-status-update')
      window.api.off('whatsapp-error')
    }
  }, [])

  const handleSaveCaption = async () => {
    await window.api.saveSettings({ whatsappCaption: caption })
    setCaptionSaved(true)
    setTimeout(() => setCaptionSaved(false), 2000)
  }

  const handleConnect = async () => {
    setLoading(true); setQrUrl(null); setStatusMsg('')
    await window.api.whatsappInit()
  }

  const handleClearSession = async () => {
    if (!window.confirm('WhatsApp oturumu temizlenecek ve yeniden QR okutmanız gerekecek. Devam edilsin mi?')) return
    await window.api.whatsappClearSession()
    setQrUrl(null); setStatusMsg(''); setWaStatus('disconnected')
    alert('Oturum temizlendi.')
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 style={{ marginBottom: 4, fontSize: 18 }}>WhatsApp Bağlantısı</h2>
      <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13 }}>Bağlantı durumu ve gönderim mesajı ayarları.</p>

      {/* Bağlantı kartı */}
      {waStatus === 'ready' ? (
        <div className="card" style={{ textAlign: 'center', padding: 28, marginBottom: 12 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#16a34a', marginBottom: 6 }}>Bağlantı Aktif</div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Beyanname göndermek için sol menüden ilgili sekmeye geçin.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={handleClearSession} style={{ fontSize: 13, padding: '9px 16px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
              🔄 Numara Değiştir
            </button>
            <button onClick={handleClearSession} className="btn-danger" style={{ fontSize: 13, padding: '9px 16px' }}>
              🚪 Çıkış Yap
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 28, marginBottom: 12 }}>
          {!qrUrl && !loading && !statusMsg && (
            <>
              <div style={{ fontSize: 44, marginBottom: 10 }}>📱</div>
              <p style={{ color: '#64748b', marginBottom: 18, fontSize: 13, lineHeight: 1.7 }}>
                WhatsApp → Bağlı Cihazlar → Cihaz Bağla adımlarını izleyin.
              </p>
              <button className="btn-primary" onClick={handleConnect} style={{ width: '100%', padding: '12px' }}>
                QR Kod Oluştur
              </button>
            </>
          )}
          {(loading || statusMsg) && !qrUrl && (
            <>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
              <p style={{ color: '#475569', fontWeight: 500, marginBottom: 4 }}>{statusMsg || 'WhatsApp başlatılıyor...'}</p>
              <p style={{ color: '#94a3b8', fontSize: 12 }}>Lütfen bekleyin</p>
            </>
          )}
          {qrUrl && (
            <>
              <p style={{ color: '#475569', marginBottom: 12, fontSize: 13, fontWeight: 600 }}>Telefonunuzla bu QR kodu okutun:</p>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={qrUrl} alt="QR Kod" style={{ width: 210, height: 210, borderRadius: 8, border: '2px solid #e2e8f0', display: 'block' }} />
                {statusMsg && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)',
                    borderRadius: 8, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                    <div style={{ fontSize: 28 }}>⏳</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{statusMsg}</div>
                  </div>
                )}
              </div>
              {!statusMsg && <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 12 }}>QR kod 60 saniye geçerlidir</p>}
              {!statusMsg && <button className="btn-secondary" onClick={handleConnect} style={{ marginTop: 12, width: '100%' }}>Yeni QR Oluştur</button>}
            </>
          )}
        </div>
      )}

      {/* Mesaj şablonu */}
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
          <button className="btn-primary" onClick={handleSaveCaption} style={{ fontSize: 13, padding: '9px 18px' }}>
            💾 Kaydet
          </button>
          <button className="btn-secondary" onClick={() => setCaption(DEFAULT_CAPTION)} style={{ fontSize: 13, padding: '9px 14px' }}>
            Varsayılana Sıfırla
          </button>
          {captionSaved && <span style={{ fontSize: 13, color: '#16a34a' }}>✅ Kaydedildi</span>}
        </div>
      </div>

      {/* Sorun giderme */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🔧 Bağlantı Sorunu?</div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>
          QR okutulmuyor veya bağlantı kurulamıyorsa oturumu temizleyin.
        </p>
        <button className="btn-danger" onClick={handleClearSession} style={{ fontSize: 13, padding: '8px 14px' }}>
          🗑️ Oturumu Temizle
        </button>
      </div>
    </div>
  )
}
