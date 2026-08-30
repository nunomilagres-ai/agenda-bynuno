// MonthGrid.jsx — grelha mensal estilo Outlook: células tingidas por localização,
// eventos como chips coloridos dentro de cada dia.
import { DAY_NAMES } from '@/lib/dateUtils'

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function MonthGrid({ cells, periodByDay, eventsByDay, todayKey, onDayClick, onEventClick, onPeriodClick }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="grid grid-cols-7 flex-shrink-0">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-xs font-semibold text-center py-2"
            style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridAutoRows: '1fr' }}>
        {cells.map((cell) => {
          const period = periodByDay[cell.key]
          const dayEvents = eventsByDay[cell.key] || []
          const isToday = cell.key === todayKey
          const bg = period ? hexToRgba(period.location_color, cell.inMonth ? 0.16 : 0.08) : (cell.inMonth ? 'var(--surface)' : 'var(--surface-2)')

          return (
            <button
              key={cell.key}
              onClick={() => onDayClick(cell.key)}
              className="flex flex-col items-stretch text-left p-1.5 min-h-[92px] transition-colors hover:opacity-90"
              style={{
                background: bg,
                border: '1px solid var(--border)',
                opacity: cell.inMonth ? 1 : 0.6,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                {period && (
                  <span
                    onClick={(e) => { e.stopPropagation(); onPeriodClick(period) }}
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[70%]"
                    style={{ background: period.location_color, color: '#fff' }}>
                    {period.location_name}
                  </span>
                )}
                <span
                  className="text-xs font-medium ml-auto flex items-center justify-center rounded-full"
                  style={{
                    color: isToday ? '#fff' : cell.inMonth ? 'var(--text)' : 'var(--text-3)',
                    background: isToday ? 'var(--accent-solid)' : 'transparent',
                    width: 20, height: 20,
                  }}
                >
                  {cell.day}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map(ev => (
                  <span
                    key={ev.id}
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
                {dayEvents.length > 3 && (
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>+{dayEvents.length - 3} mais</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
