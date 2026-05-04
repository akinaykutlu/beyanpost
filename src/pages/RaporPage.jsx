import React, { useState, useEffect } from 'react'

export default function RaporPage() {
  const [reports, setReports] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => { loadReports() }, [])

  const loadReports = async () => {
    const res = await window.api.getReports()
    if (res.success) setReports(res.reports)
  }

  // Tarih → raporlar map'i oluştur
  const reportsByDate = {}
  for (const r of reports) {
    const key = r.date
    if (!reportsByDate[key]) reportsByDate[key] = []
    reportsByDate[key].push(r)
  }

  // Takvim günleri
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = firstDay === 0 ? 6 : firstDay - 1

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const dayNames = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

  const formatDateKey = (d) => {
    return `${String(d).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`
  }

  const handleDayClick = (day) => {
    const key = formatDateKey(day)
    if (reportsByDate[key]) {
      setSelectedDate(key)
      setSelectedReport(null)
    }
  }

  const selectedReports = selectedDate ? (reportsByDate[selectedDate] || []) : []

  const th = { padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12 }
  const td = { padding: '8px 12px', fontSize: 13 }

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      {/* Sol: Takvim */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div className="card" style={{ padding: 16 }}>
          {/* Ay navigasyonu */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#475569', padding: '2px 8px' }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{monthNames[month]} {year}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#475569', padding: '2px 8px' }}>›</button>
          </div>

          {/* Gün başlıkları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Günler */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1
              const key = formatDateKey(day)
              const hasReport = !!reportsByDate[key]
              const isSelected = selectedDate === key
              const today = new Date()
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    textAlign: 'center', padding: '6px 2px', borderRadius: 6, fontSize: 13,
                    cursor: hasReport ? 'pointer' : 'default',
                    background: isSelected ? '#1a1a2e' : hasReport ? '#dcfce7' : 'transparent',
                    color: isSelected ? 'white' : hasReport ? '#16a34a' : isToday ? '#3b82f6' : '#475569',
                    fontWeight: hasReport || isToday ? 700 : 400,
                    border: isToday && !isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>

        {/* Seçili tarihin raporları */}
        {selectedDate && selectedReports.length > 0 && (
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e', marginBottom: 10 }}>
              📅 {selectedDate}
            </div>
            {selectedReports.map((r, i) => (
              <div
                key={i}
                onClick={() => setSelectedReport(r)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
                  background: selectedReport?.id === r.id ? '#1a1a2e' : '#f8fafc',
                  color: selectedReport?.id === r.id ? 'white' : '#1a1a2e',
                  border: '1px solid #e2e8f0', transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  {r.excel?.split(/[/\\]/).pop() || 'Rapor'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 99, fontWeight: 600,
                    background: selectedReport?.id === r.id ? 'rgba(255,255,255,0.2)' : '#dcfce7',
                    color: selectedReport?.id === r.id ? 'white' : '#16a34a'
                  }}>✓ {r.success}</span>
                  {r.failed > 0 && (
                    <span style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 99, fontWeight: 600,
                      background: selectedReport?.id === r.id ? 'rgba(255,255,255,0.2)' : '#fee2e2',
                      color: selectedReport?.id === r.id ? 'white' : '#dc2626'
                    }}>✗ {r.failed}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {reports.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <p style={{ fontSize: 13 }}>Henüz rapor yok</p>
          </div>
        )}
      </div>

      {/* Sağ: Rapor detayı */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedReport ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: '#94a3b8', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <p style={{ fontSize: 14 }}>Takvimden bir gün seçin</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Yeşil renkli günlerde gönderim raporu mevcut</p>
          </div>
        ) : (
          <div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📊 {selectedDate} — Rapor Detayı</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{selectedReport.excel?.split(/[/\\]/).pop()}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{selectedReport.success}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Başarılı</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{selectedReport.failed}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Başarısız</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedReport.total}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Toplam</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['VKN', 'Firma', 'Telefon', 'Dosyalar', 'Durum', 'Hata'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.results || []).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}><code style={{ fontSize: 11 }}>{r.vkn}</code></td>
                        <td style={td}>{r.firmAdi}</td>
                        <td style={td}>{r.phone}</td>
                        <td style={{ ...td, fontSize: 11, color: '#475569' }}>{(r.files || []).join(', ')}</td>
                        <td style={td}>
                          {r.status === 'gönderildi'
                            ? <span className="badge badge-success">✓ Gönderildi</span>
                            : r.status === 'iptal'
                              ? <span className="badge badge-gray">İptal</span>
                              : <span className="badge badge-error">Hata</span>}
                        </td>
                        <td style={{ ...td, fontSize: 11, color: '#ef4444' }}>{r.error || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
