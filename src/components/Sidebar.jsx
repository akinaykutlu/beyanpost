import React, { useState } from 'react'

const NAV = [
  { id: 'setup',  label: 'WhatsApp Bağlantı', icon: '📱' },
  { id: 'gonder', label: 'Beyanname Gönder',  icon: '📤' },
  { id: 'rapor',  label: 'Raporlar',           icon: '📊' },
]

export default function Sidebar({ page, setPage, waStatus, waPhone, licenseInfo }) {
  const [showLicense, setShowLicense] = useState(false)

  const statusColor = waStatus === 'ready' ? '#25d366' : waStatus === 'qr' ? '#f59e0b' : '#94a3b8'
  const statusLabel = waStatus === 'ready' ? 'Bağlı' : waStatus === 'qr' ? 'QR Bekleniyor' : 'Bağlı Değil'

  const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '♾ Süresiz'

  return (
    <>
      <aside style={{
        width: 220,
        background: '#1a1a2e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0'
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2d2d4e' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#25d366' }}>📬 BeyanPost</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>v1.0 — Akın Aykutlu</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                marginBottom: 4,
                borderRadius: 8,
                background: page === item.id ? '#25d366' : 'transparent',
                color: page === item.id ? 'white' : '#94a3b8',
                fontSize: 14,
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Lisans bilgisi */}
        {licenseInfo && (
          <div
            onClick={() => setShowLicense(true)}
            style={{
              margin: '0 12px 10px',
              padding: '10px 12px',
              background: '#2d2d4e',
              borderRadius: 8,
              cursor: 'pointer',
              border: '1px solid #3d3d5e',
              transition: 'border-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#25d366'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#3d3d5e'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#25d366', boxShadow: '0 0 5px #25d366' }} />
              <span style={{ fontSize: 12, color: '#25d366', fontWeight: 600 }}>Lisans Aktif</span>
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {licenseInfo.customerName || licenseInfo.bureauName || 'Müşteri'}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              {licenseInfo.plan ? licenseInfo.plan.charAt(0).toUpperCase() + licenseInfo.plan.slice(1) + ' Plan · ' : ''}Detay için tıkla
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              Detay için tıkla
            </div>
          </div>
        )}

        {/* WA Status */}
        <div style={{
          margin: '0 12px',
          padding: '12px',
          background: '#2d2d4e',
          borderRadius: 8,
          fontSize: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusColor,
              boxShadow: waStatus === 'ready' ? '0 0 6px #25d366' : 'none'
            }} />
            <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
          </div>
          {waPhone && (
            <div style={{ color: '#64748b' }}>+{waPhone}</div>
          )}
        </div>
      </aside>

      {/* Lisans modal */}
      {showLicense && licenseInfo && (
        <div
          onClick={() => setShowLicense(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: 32,
              width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>Lisans Bilgileri</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>MÜŞTERİ</div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{licenseInfo.customerName || '—'}</div>
              </div>

              {licenseInfo.bureauName && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>BÜRO ADI</div>
                  <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{licenseInfo.bureauName}</div>
                </div>
              )}

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>PLAN</div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                  {{ solo: 'Solo — 1 Cihaz', duo: 'Duo — 2 Cihaz', office: 'Office — 5 Cihaz' }[licenseInfo.plan] || licenseInfo.plan || '—'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>DURUM</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#25d366', boxShadow: '0 0 5px #25d366' }} />
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>Aktif</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>LİSANS BİTİŞ TARİHİ</div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{formatDate(licenseInfo.expiresAt)}</div>
              </div>

              {licenseInfo.offline && (
                <div style={{ background: '#fef9c3', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
                  ⚠️ Çevrimdışı modda çalışıyor
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLicense(false)}
              style={{
                width: '100%', marginTop: 20, padding: '11px',
                background: '#1a1a2e', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  )
}
