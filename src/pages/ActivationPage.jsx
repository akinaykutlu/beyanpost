import React, { useState } from 'react'

export default function ActivationPage({ onActivated }) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const formatKey = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const parts = clean.match(/.{1,4}/g) || []
    return parts.join('-').slice(0, 19)
  }

  const handleChange = (e) => {
    setKey(formatKey(e.target.value))
    setError(null)
  }

  const handleActivate = async () => {
    if (key.length < 10) { setError('Geçerli bir lisans anahtarı girin.'); return }
    setLoading(true)
    setError(null)
    const result = await window.api.licenseActivate(key)
    setLoading(false)
    if (result.valid) {
      onActivated(result)
    } else {
      setError(result.error || 'Aktivasyon başarısız.')
    }
  }

  const planLabel = (plan) => {
    return { solo: 'Solo — 1 Cihaz', duo: 'Duo — 2 Cihaz', office: 'Office — 5 Cihaz' }[plan] || plan
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f0f2f5'
    }}>
      <div style={{ width: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>📬</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>BeyanPost</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Muhasebe Beyanname Gönderici</p>
        </div>

        {/* Kart */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Lisans Aktivasyonu</div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
            Kullanmaya başlamak için lisans anahtarınızı girin.
          </p>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            LİSANS ANAHTARI
          </label>
          <input
            value={key}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
            placeholder="BPST-XXXX-XXXX-XXXX"
            maxLength={19}
            style={{
              width: '100%', padding: '13px 16px', fontSize: 16,
              fontFamily: 'monospace', letterSpacing: 3,
              border: `2px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: 10, outline: 'none',
              background: error ? '#fff5f5' : 'white',
              boxSizing: 'border-box', marginBottom: 10,
              textAlign: 'center'
            }}
            autoFocus
          />

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#dc2626', marginBottom: 14
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={loading || key.length < 10}
            style={{
              width: '100%', padding: '13px',
              background: loading || key.length < 10 ? '#94a3b8' : '#25d366',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 600,
              cursor: loading || key.length < 10 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? '⏳ Doğrulanıyor...' : '🔑 Aktive Et'}
          </button>

          {/* Plan bilgisi - aktivasyon sonrası */}
        </div>

        {/* Alt bilgi */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
            Lisans anahtarı almak için iletişime geçin:
          </p>
          <p style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>
            Akın Aykutlu — 0 545 236 23 10
          </p>
        </div>

        {/* Planlar */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {[
            { plan: 'Solo', devices: '1 Cihaz', color: '#e0f2fe', text: '#0369a1' },
            { plan: 'Duo', devices: '2 Cihaz', color: '#f3e8ff', text: '#7c3aed' },
            { plan: 'Office', devices: '5 Cihaz', color: '#fff7ed', text: '#c2410c' },
          ].map(p => (
            <div key={p.plan} style={{
              flex: 1, background: p.color, borderRadius: 8,
              padding: '10px 12px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.text }}>{p.plan}</div>
              <div style={{ fontSize: 11, color: p.text, opacity: 0.8 }}>{p.devices}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
