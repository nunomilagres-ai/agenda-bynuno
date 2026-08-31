// MonthGrid.jsx — grelha mensal estilo Outlook: células tingidas por localização,
// eventos como chips coloridos dentro de cada dia. Suporta arrastar sobre vários
// dias para marcar um período de localização de uma vez.
import { useEffect, useState } from 'react'
import { DAY_NAMES } from '@/lib/dateUtils'
import { getHoliday } from '@/lib/holidays'

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function MonthGrid({ cells, periodByDay, eventsByDay, todayKey, onDayClick, onEventClick, onPeriodClick, onRangeSelect }) {
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const dragging = dragStart !== null

  useEffect(() => {
    if (!dragging) return
    function handleMouseUp() {
      if (dragStart === dragEnd) {
        onDayClick(dragStart)
      } else {
        const [start, end] = dragStart < dragEnd ? [dragStart, dragEnd] : [dragEnd, dragStart]
        onRangeSelect(start, end)
      }
      setDragStart(null)
      setDragEnd(null)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [dragging, dragStart, dragEnd, onDayClick, onRangeSelect])

  const [selMin, selMax] = dragging
    ? (dragStart < dragEnd ? [dragStart, dragEnd] : [dragEnd, dragStart])
    : [null, null]

  return (
    <div className="flex flex-col flex-1 min-h-0" style={dragging ? { userSelect: 'none' } : undefined}>
      <div className="grid grid-cols-7 flex-shrink-0">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-xs font-semibold text-center py-2"
            style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridAutoRows: '1fr' }}>
        {cells.map((cell) => {
          if (cell.blank) {
            return <div key={cell.key} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', opacity: 0.4 }} />
          }
          const period = periodByDay[cell.key]
          const dayEvents = eventsByDay[cell.key] || []
          const isToday = cell.key === todayKey
          const holiday = getHoliday(cell.key)
          const dow = new Date(cell.key + 'T00:00:00Z').getUTCDay()
          const isWeekend = dow === 0 || dow === 6
          const inSelection = dragging && cell.key >= selMin && cell.key <= selMax
          const bg = period
            ? hexToRgba(period.location_color, 0.16)
            : (isWeekend ? 'var(--surface-2)' : 'var(--surface)')

          return (
            <button
              key={cell.key}
              onMouseDown={() => { setDragStart(cell.key); setDragEnd(cell.key) }}
              onMouseEnter={() => { if (dragging) setDragEnd(cell.key) }}
              className="flex flex-col items-stretch text-left p-1.5 min-h-[92px] transition-colors hover:opacity-90"
              style={{
                background: inSelection ? 'var(--accent-soft)' : bg,
                border: inSelection ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                {period && (
                  <span
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onPeriodClick(period) }}
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[70%]"
                    style={{ background: period.location_color, color: '#fff' }}>
                    {period.location_name}
                  </span>
                )}
                <span
                  title={holiday?.name}
                  className="text-xs font-medium ml-auto flex items-center justify-center rounded-full"
                  style={{
                    color: isToday ? '#fff' : holiday ? 'var(--danger)' : 'var(--text)',
                    background: isToday ? 'var(--accent-solid)' : 'transparent',
                    width: 20, height: 20,
                  }}
                >
                  {cell.day}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {holiday && (
                  <span className="text-[10px] truncate font-medium" style={{ color: 'var(--danger)' }} title={holiday.name}>
                    {holiday.name}
                  </span>
                )}
                {dayEvents.slice(0, holiday ? 2 : 3).map(ev => (
                  <span
                    key={ev.id}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    className="text-[10px] truncate rounded px-1 py-0.5 font-medium"
                    style={{
                      background: ev.location_color ? hexToRgba(ev.location_color, 0.22) : 'var(--surface-2)',
                      color: ev.location_color || 'var(--text-2)',
                      borderLeft: `2px solid ${ev.location_color || 'var(--text-3)'}`,
                    }}
                    title={ev.title}
                  >
                    {ev.all_day ? '' : ev.start_datetime.slice(11, 16) + ' '}{ev.title}
                  </span>
                ))}
                {dayEvents.length > (holiday ? 2 : 3) && (
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>+{dayEvents.length - (holiday ? 2 : 3)} mais</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
