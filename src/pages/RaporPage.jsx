import React, { useState, useEffect, useRef } from 'react'

export default function RaporPage() {
  const [reports, setReports]           = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef(null)

  useEffect(() => { loadReports() }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadReports = async () => {
    const res = await window.api.getReports()
    if (res.success) setReports(res.reports)
  }

  const reportsByDate = {}
  for (const r of reports) {
    if (!reportsByDate[r.date]) reportsByDate[r.date] = []
    reportsByDate[r.date].push(r)
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = firstDay === 0 ? 6 : firstDay - 1

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const dayNames = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz']

  const formatDateKey = (d) =>
    `${String(d).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`

  const handleDayClick = (day) => {
    const key = formatDateKey(day)
    if (reportsByDate[key]) {
      setSelectedDate(key)
      setSelectedReport(null)
      setCalendarOpen(false)
    }
  }

  const selectedReports = selectedDate ? (reportsByDate[selectedDate] || []) : []

  const th = { padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }
  const td = { padding: '8px 12px', fontSize: 13 }

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

      {/* ── Üst bar: tarih seçici + rapor listesi ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>

        {/* Tarih butonu + takvim dropdown */}
        <div ref={calendarRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setCalendarOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', background: 'white',
              border: '2px solid ' + (calendarOpen ? '#1a1a2e' : '#e2e8f0'),
              borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: '#1a1a2e', transition: 'border-color 0.15s', whiteSpace: 'nowrap'
            }}
          >
            📅 {selectedDate || 'Tarih Seç'}
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{calendarOpen ? '▲' : '▼'}</span>
          </button>

          {calendarOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
              background: 'white', borderRadius: 12, padding: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
              width: 260
            }}>
              {/* Ay navigasyonu */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <button onClick={() => setCurrentMonth(new Date(year, month - 1))}
                  style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#475569', padding: '2px 6px' }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{monthNames[month]} {year}</span>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1))}
                  style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#475569', padding: '2px 6px' }}>›</button>
              </div>

              {/* Gün başlıkları */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {dayNames.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', fontWeight: 600, padding: '2px 0' }}>{d}</div>
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
                    <div key={day} onClick={() => handleDayClick(day)} style={{
                      textAlign: 'center', padding: '5px 2px', borderRadius: 5, fontSize: 12,
                      cursor: hasReport ? 'pointer' : 'default',
                      background: isSelected ? '#1a1a2e' : hasReport ? '#dcfce7' : 'transparent',
                      color: isSelected ? 'white' : hasReport ? '#16a34a' : isToday ? '#3b82f6' : '#475569',
                      fontWeight: hasReport || isToday ? 700 : 400,
                      border: isToday && !isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                    }}>
                      {day}
                    </div>
                  )
                })}
              </div>

              {reports.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 10 }}>Henüz rapor yok</div>
              )}
            </div>
          )}
        </div>

        {/* Rapor listesi — tarih seçilince görünür */}
        {selectedDate && selectedReports.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedReports.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedReport(r)}
                style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  border: `2px solid ${selectedReport?.id === r.id ? '#1a1a2e' : '#e2e8f0'}`,
                  background: selectedReport?.id === r.id ? '#1a1a2e' : 'white',
                  color: selectedReport?.id === r.id ? 'white' : '#1a1a2e',
                  fontWeight: 600, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>📄 {r.excel?.split(/[/\\]/).pop() || 'Rapor'}</span>
                <span style={{
                  fontSize: 11, padding: '1px 6px', borderRadius: 99,
                  background: selectedReport?.id === r.id ? 'rgba(255,255,255,0.2)' : '#dcfce7',
                  color: selectedReport?.id === r.id ? 'white' : '#16a34a', fontWeight: 700
                }}>✓{r.success}</span>
                {r.failed > 0 && (
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 99,
                    background: selectedReport?.id === r.id ? 'rgba(255,255,255,0.2)' : '#fee2e2',
                    color: selectedReport?.id === r.id ? 'white' : '#dc2626', fontWeight: 700
                  }}>✗{r.failed}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedDate && selectedReports.length === 0 && (
          <div style={{ padding: '9px 14px', background: '#fef9c3', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
            Bu tarihte rapor bulunamadı
          </div>
        )}
      </div>

      {/* ── Rapor detayı ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!selectedReport ? (
          <div className="card" style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <p style={{ fontSize: 14, marginBottom: 4 }}>Takvimden bir gün seçin</p>
            <p style={{ fontSize: 13 }}>Yeşil renkli günlerde gönderim raporu mevcut</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Özet */}
            <div className="card" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
                    📊 {selectedDate} — {selectedReport.excel?.split(/[/\\]/).pop()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Başarılı', val: selectedReport.success, color: '#16a34a' },
                    { label: 'Başarısız', val: selectedReport.failed, color: '#dc2626' },
                    { label: 'Toplam', val: selectedReport.total, color: '#1a1a2e' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tablo */}
            <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {['VKN', 'Firma', 'Telefon', 'Dosyalar', 'Durum', 'Hata'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
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
