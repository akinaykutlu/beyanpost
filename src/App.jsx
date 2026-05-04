import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import SetupPage from './pages/SetupPage'
import GonderPage from './pages/GonderPage'
import RaporPage from './pages/RaporPage'
import AyarlarPage from './pages/AyarlarPage'
import ActivationPage from './pages/ActivationPage'

export default function App() {
  const [page, setPage] = useState('setup')
  const [waStatus, setWaStatus] = useState('disconnected')
  const [waPhone, setWaPhone] = useState(null)

  const [licenseStatus, setLicenseStatus] = useState('checking')
  const [licenseInfo, setLicenseInfo] = useState(null)

  // Güncelleme state'leri
  const [updateState, setUpdateState] = useState(null)
  const [updateInfo, setUpdateInfo] = useState({})
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [updateDismissed, setUpdateDismissed] = useState(false)

  useEffect(() => {
    window.api.licenseCheck().then(result => {
      if (result.valid) {
        setLicenseStatus('valid')
        setLicenseInfo({
          ...result,
          customerName: result.customerName || result.customer_name || '',
          bureauName: result.bureauName || result.bureau_name || '',
          plan: result.plan || '',
          expiresAt: result.expiresAt || result.expires_at || null,
        })
      } else {
        setLicenseStatus('invalid')
      }
    })
  }, [])

  useEffect(() => {
    window.api.on('whatsapp-ready', (data) => {
      setWaStatus('ready')
      setWaPhone(data.phone)
    })
    window.api.on('whatsapp-disconnected', () => {
      setWaStatus('disconnected')
      setWaPhone(null)
    })
    window.api.on('update-available', (info) => {
      setUpdateInfo(info)
      setUpdateState('available')
      setUpdateDismissed(false)
    })
    window.api.on('update-not-available', () => {
      setUpdateState('not-available')
      setTimeout(() => setUpdateState(null), 4000)
    })
    window.api.on('update-download-progress', (data) => {
      setUpdateState('downloading')
      setDownloadPercent(data.percent)
    })
    window.api.on('update-downloaded', () => setUpdateState('downloaded'))
    window.api.on('update-error', () => {
      // Sessizce log'a düş, kullanıcıya gösterme
      console.warn('Güncelleme kontrol hatası')
    })

    return () => {
      window.api.off('whatsapp-ready')
      window.api.off('whatsapp-disconnected')
      window.api.off('update-available')
      window.api.off('update-not-available')
      window.api.off('update-download-progress')
      window.api.off('update-downloaded')
      window.api.off('update-error')
    }
  }, [])

  if (licenseStatus === 'checking') {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f0f2f5', flexDirection: 'column', gap: 16
      }}>
        <div style={{ fontSize: 48 }}>📋</div>
        <p style={{ color: '#64748b', fontSize: 15 }}>Lisans doğrulanıyor...</p>
      </div>
    )
  }

  if (licenseStatus === 'invalid') {
    return (
      <ActivationPage
        onActivated={(info) => {
          setLicenseInfo({
            ...info,
            customerName: info.customerName || info.customer_name || '',
            bureauName: info.bureauName || info.bureau_name || '',
            plan: info.plan || '',
            expiresAt: info.expiresAt || info.expires_at || null,
          })
          setLicenseStatus('valid')
        }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        page={page}
        setPage={setPage}
        waStatus={waStatus}
        waPhone={waPhone}
        licenseInfo={licenseInfo}
      />
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', position: 'relative', display:'flex', flexDirection: 'column' }}>
        {page === 'setup'    && <SetupPage waStatus={waStatus} setWaStatus={setWaStatus} />}
        {page === 'gonder'   && <GonderPage waStatus={waStatus} />}
        {page === 'rapor'    && <RaporPage />}
        {page === 'ayarlar'  && <AyarlarPage licenseInfo={licenseInfo} />}

        {/* Güncelleme bildirimi */}
        {updateState && !updateDismissed && updateState !== 'not-available' && (
          <div style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
            background: 'white', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            border: '1px solid #e2e8f0',
            padding: '16px 18px', minWidth: 300, maxWidth: 360
          }}>
            {updateState === 'available' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>🆕</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Güncelleme Mevcut</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Versiyon {updateInfo.version}</div>
                  </div>
                  <button onClick={() => setUpdateDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => { setUpdateState('downloading'); setDownloadPercent(0); await window.api.downloadUpdate() }}
                    style={{ flex: 1, padding: '8px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >⬇️ İndir</button>
                  <button onClick={() => setUpdateDismissed(true)} style={{ padding: '8px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Sonra</button>
                </div>
              </>
            )}
            {updateState === 'downloading' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>⬇️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>İndiriliyor</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>%{downloadPercent}</div>
                  </div>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: '#3b82f6', width: `${downloadPercent}%`, transition: 'width 0.3s' }} />
                </div>
              </>
            )}
            {updateState === 'downloaded' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Güncelleme Hazır</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Yeniden başlatarak kurun</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => window.api.installUpdate()}
                    style={{ flex: 1, padding: '8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >🔄 Yeniden Başlat & Kur</button>
                  <button onClick={() => setUpdateDismissed(true)} style={{ padding: '8px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Sonra</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
