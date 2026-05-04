import React, { useState, useEffect } from 'react'

export default function SetupPage({ waStatus, setWaStatus }) {
  const [qrUrl, setQrUrl]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    window.api.on('qr-code', (url) => {
      setQrUrl(url); setWaStatus('qr'); setLoading(false); setStatusMsg('')
    })
    window.api.on('whatsapp-status-update', (data) => { setStatusMsg(data.message) })
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

  const handleConnect = async () => {
    setLoading(true); setQrUrl(null); setStatusMsg('')
    await window.api.whatsappInit()
  }

  const handleClearSession = async () => {
    if (!window.confirm('WhatsApp oturumu temizlenecek ve yeniden QR okutmanız gerekecek. Devam edilsin mi?')) return
    await window.api.whatsappClearSession()
    setQrUrl(null); setStatusMsg(''); setWaStatus('disconnected')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 4, fontSize: 18 }}>WhatsApp Bağlantısı</h2>
      <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13 }}>Bağlantı durumu ve cihaz yönetimi.</p>

      {/* Bilgi notu */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
        padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: '#1e40af', margin: 0, lineHeight: 1.7 }}>
          BeyanPost, mesajları <strong>WhatsApp Web protokolü</strong> üzerinden gönderir.
          Gönderilen mesajların telefonunuzda görünmesi için WhatsApp uygulamasının
          arka planda <strong>açık ve internete bağlı</strong> olması gerekir.
          Telefonunuzda "Mesaj bekleniyor" görünüyorsa <strong>Bağlantıyı Yenile</strong> butonunu kullanın.
        </p>
      </div>

      {/* Bağlantı kartı */}
      {waStatus === 'ready' ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>Bağlantı Aktif</div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
            Beyanname göndermek için sol menüden ilgili sekmeye geçin.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleClearSession}
              style={{ padding: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              🔄 Bağlantıyı Yenile
            </button>
            <button
              onClick={handleClearSession}
              style={{ padding: '10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              📱 Numara Değiştir
            </button>
            <button onClick={handleClearSession} className="btn-danger" style={{ padding: '10px', fontSize: 13 }}>
              🚪 Çıkış Yap
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 12 }}>
          {!qrUrl && !loading && !statusMsg && (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
              <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13, lineHeight: 1.7 }}>
                WhatsApp → Bağlı Cihazlar → Cihaz Bağla adımlarını izleyin.
              </p>
              <button className="btn-primary" onClick={handleConnect} style={{ width: '100%', padding: '12px', fontSize: 14 }}>
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

      {/* Bağlantı sorunu */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🔧 Bağlantı Sorunu?</div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
          QR okutulmuyor, bağlantı kurulamıyor veya telefonunuzda mesajlar "Mesaj bekleniyor"
          durumunda kalıyorsa oturumu temizleyip yeniden bağlanın.
        </p>
        <button className="btn-danger" onClick={handleClearSession} style={{ fontSize: 13, padding: '9px 16px' }}>
          🗑️ Oturumu Temizle & Yeniden Bağlan
        </button>
      </div>
    </div>
  )
}
