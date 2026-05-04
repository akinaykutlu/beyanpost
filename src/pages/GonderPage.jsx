import React, { useState, useEffect, useRef } from 'react'

const STEPS = ['Dosyaları Seç', 'Eşleştir & Önizle', 'Gönder']

export default function GonderPage({ waStatus }) {
  const [step, setStep] = useState(0)
  const [folderPath, setFolderPath] = useState(null)
  const [excelPath, setExcelPath] = useState(null)
  const [folderData, setFolderData] = useState(null)
  const [matchedItems, setMatchedItems] = useState([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [progressLog, setProgressLog] = useState([])
  const [sendComplete, setSendComplete] = useState(false)
  const [finalResults, setFinalResults] = useState([])
  const logEndRef = useRef(null)

  useEffect(() => {
    window.api.getSettings().then(res => {
      if (res.success && res.settings) {
        if (res.settings.lastFolder) setFolderPath(res.settings.lastFolder)
        if (res.settings.lastExcel) setExcelPath(res.settings.lastExcel)
      }
    })
  }, [])

  useEffect(() => {
    window.api.on('send-progress', (data) => {
      setProgress({ current: data.current, total: data.total })
      setProgressLog(prev => [...prev, data.last])
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
    window.api.on('send-complete', async (data) => {
      setSending(false)
      setSendComplete(true)
      if (data.results) {
        setFinalResults(data.results)
        const success = data.results.filter(r => r.status === 'gönderildi').length
        const failed  = data.results.filter(r => r.status !== 'gönderildi').length
        await window.api.saveReport({
          date: new Date().toLocaleDateString('tr-TR'),
          folder: folderPath,
          excel: excelPath,
          total: data.results.length,
          success, failed,
          results: data.results
        })
      }
    })
    return () => {
      window.api.off('send-progress')
      window.api.off('send-complete')
    }
  }, [folderPath, excelPath])

  const handleSelectFolder = async () => {
    const p = await window.api.selectFolder()
    if (p) { setFolderPath(p); window.api.saveSettings({ lastFolder: p }) }
  }

  const handleSelectExcel = async () => {
    const p = await window.api.selectExcel()
    if (p) { setExcelPath(p); window.api.saveSettings({ lastExcel: p }) }
  }

  const handleCreateTemplate = async () => {
    const res = await window.api.createExcelTemplate()
    if (res.success) {
      setExcelPath(res.path)
      window.api.saveSettings({ lastExcel: res.path })
      alert('✅ Şablon masaüstüne oluşturuldu ve seçildi!\n\nDosyayı doldurup kaydedin.')
    } else {
      alert('Şablon oluşturulamadı: ' + res.error)
    }
  }

  const handleNext0 = async () => {
    const [folderRes, excelRes] = await Promise.all([
      window.api.scanFolder(folderPath),
      window.api.readExcel(excelPath)
    ])
    if (!folderRes.success) return alert('Klasör okunamadı: ' + folderRes.error)
    if (!excelRes.success) return alert('Excel okunamadı: ' + excelRes.error)
    setFolderData(folderRes)
    const rawData = excelRes.data
    const firstRow = rawData[0] || {}
    const keys = Object.keys(firstRow)
    const hasHeader = keys.some(k => /vkn|vergi|telefon|gsm|firma|ad/i.test(String(k)))
    const items = []
    for (const row of rawData) {
      let vkn, phone, firma
      if (hasHeader) {
        vkn   = String(row['VKN'] || row['vkn'] || row['Vergi No'] || '').trim()
        phone = String(row['Telefon'] || row['telefon'] || row['GSM'] || '').trim()
        firma = String(row['Firma Adı'] || row['firma_adi'] || row['Ad'] || '').trim()
      } else {
        const vals = Object.values(row)
        vkn = String(vals[0] || '').trim()
        phone = String(vals[1] || '').trim()
        firma = String(vals[2] || '').trim()
      }
      phone = phone.replace(/\D/g, '').replace(/^0/, '')
      const files = folderRes.grouped[vkn] || []
      if (vkn && vkn.length >= 10) {
        items.push({ vkn, phone, firmAdi: firma, files, hasFiles: files.length > 0, hasPhone: !!phone })
      }
    }
    setMatchedItems(items)
    setStep(1)
  }

  const handleStartSending = async () => {
    if (waStatus !== 'ready') return alert('Önce WhatsApp\'ı bağlayın!')
    const toSend = matchedItems.filter(i => i.hasFiles && i.hasPhone)
    setSending(true)
    setSendComplete(false)
    setProgressLog([])
    setProgress({ current: 0, total: toSend.length })
    setStep(2)
    await window.api.startSending({ items: toSend, folderPath })
  }

  const handleReset = () => {
    setStep(0)
    setFolderData(null)
    setMatchedItems([])
    setSending(false)
    setSendComplete(false)
    setFinalResults([])
    setProgressLog([])
  }

  const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12 }
  const td = { padding: '9px 12px', fontSize: 13 }

  return (
    <div style={{ maxWidth: 740 }}>
      <h2 style={{ marginBottom: 4, fontSize: 18 }}>Beyanname Gönder</h2>
      <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13 }}>PDF klasörü ve mükellef listesini seçin, eşleştirin ve gönderin.</p>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: i < step ? '#25d366' : i === step ? '#1a1a2e' : '#e2e8f0',
                color: i <= step ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0
              }}>{i < step ? '✓' : i + 1}</div>
              <span style={{ fontSize: 13, color: i === step ? '#1a1a2e' : '#94a3b8', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#25d366' : '#e2e8f0', margin: '0 10px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Adım 0 */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>📁 PDF Klasörü</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Beyanname PDF'lerinin bulunduğu klasör. Dosyalar <code>12345678900-kdv.pdf</code> formatında olmalı.</p>
            {folderPath && <div style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6, marginBottom: 8, wordBreak: 'break-all' }}>📂 {folderPath}</div>}
            <button className="btn-secondary" onClick={handleSelectFolder} style={{ fontSize: 13 }}>
              {folderPath ? '🔄 Klasörü Değiştir' : '📁 Klasör Seç'}
            </button>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>📊 Mükellef Listesi</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>VKN, Telefon ve Firma Adı kolonlarını içeren Excel dosyası.</p>
            {excelPath && <div style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6, marginBottom: 8, wordBreak: 'break-all' }}>📄 {excelPath}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleSelectExcel} style={{ fontSize: 13 }}>
                {excelPath ? '🔄 Değiştir' : '📊 Excel Seç'}
              </button>
              <button onClick={handleCreateTemplate} style={{ fontSize: 13, padding: '10px 16px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                📋 Örnek Şablon Oluştur
              </button>
            </div>
          </div>

          <button className="btn-primary" onClick={handleNext0} disabled={!folderPath || !excelPath} style={{ alignSelf: 'flex-start', padding: '11px 28px', fontSize: 14 }}>
            Eşleştir →
          </button>
        </div>
      )}

      {/* Adım 1 */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Gönderilecek', val: matchedItems.filter(i => i.hasFiles && i.hasPhone).length, color: '#25d366' },
              { label: 'Dosyası Yok', val: matchedItems.filter(i => !i.hasFiles).length, color: '#f59e0b' },
              { label: 'Telefonu Yok', val: matchedItems.filter(i => i.hasFiles && !i.hasPhone).length, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="card" style={{ flex: 1, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ overflowY: 'auto', maxHeight: 300 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['VKN', 'Firma', 'Telefon', 'Dosyalar', 'Durum'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {matchedItems.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}><code style={{ fontSize: 12 }}>{item.vkn}</code></td>
                      <td style={td}>{item.firmAdi || '—'}</td>
                      <td style={td}>{item.phone || <span style={{ color: '#ef4444' }}>Yok</span>}</td>
                      <td style={td}>{item.files.length > 0 ? item.files.map(f => <div key={f} style={{ fontSize: 11, color: '#475569' }}>📄 {f}</div>) : <span style={{ color: '#ef4444', fontSize: 12 }}>Yok</span>}</td>
                      <td style={td}>
                        {item.hasFiles && item.hasPhone ? <span className="badge badge-success">✓ Hazır</span>
                          : !item.hasFiles ? <span className="badge badge-warn">Dosya yok</span>
                          : <span className="badge badge-error">Tel yok</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn-secondary" onClick={() => setStep(0)}>← Geri</button>
            {waStatus !== 'ready' && <span style={{ fontSize: 13, color: '#ef4444' }}>⚠️ WhatsApp bağlı değil</span>}
            <button className="btn-primary" onClick={handleStartSending} disabled={matchedItems.filter(i => i.hasFiles && i.hasPhone).length === 0 || waStatus !== 'ready'} style={{ padding: '10px 24px' }}>
              Gönderimi Başlat 🚀
            </button>
          </div>
        </div>
      )}

      {/* Adım 2 */}
      {step === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{sendComplete ? '✅ Tamamlandı' : `⏳ Gönderiliyor... (${progress.current}/${progress.total})`}</span>
              <span style={{ color: '#64748b', fontSize: 13 }}>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, background: sendComplete ? '#25d366' : '#3b82f6', width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%', transition: 'width 0.4s' }} />
            </div>
            {sending && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Spam önlemi: mesajlar arası 8-15sn bekleniyor</p>}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 13 }}>Gönderim Logu</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
              {progressLog.length === 0 && <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Bekleniyor...</div>}
              {progressLog.map((log, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 14px', fontSize: 13 }}>
                  <span>{log.status === 'gönderildi' ? '✅' : '❌'}</span>
                  <span style={{ fontWeight: 500 }}>{log.firmAdi || log.vkn}</span>
                  {log.error && <span style={{ color: '#ef4444', fontSize: 11 }}>{log.error}</span>}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {sendComplete && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                <div><span style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{finalResults.filter(r => r.status === 'gönderildi').length}</span><span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>Başarılı</span></div>
                <div><span style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{finalResults.filter(r => r.status !== 'gönderildi').length}</span><span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>Başarısız</span></div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#16a34a' }}>✅ Rapor otomatik kaydedildi</span>
                <button className="btn-primary" onClick={handleReset}>Yeni Gönderim</button>
              </div>
            </div>
          )}
          {sending && <button className="btn-danger" onClick={() => window.api.stopSending()}>⏹ Gönderimi Durdur</button>}
        </div>
      )}
    </div>
  )
}
