// DateTimeField.jsx — date (required) + time (optional) + recurrence + recurrence end
import { useState } from 'react'
import { isoToDate, isoToTime, combineDatetime } from '@/lib/dateUtils'

const RECURRENCES = [
  { value: '', label: 'Sem recorrência' },
  { value: 'daily',   label: 'Diária' },
  { value: 'weekly',  label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly',  label: 'Anual' },
]

export default function DateTimeField({ value, onChange, label, recurrence, onRecurrenceChange, recurrenceEndDate, onRecurrenceEndDateChange, recurrenceCount, onRecurrenceCountChange }) {
  const date = isoToDate(value)
  const time = isoToTime(value)
  const [endType, setEndType] = useState(recurrenceCount ? 'count' : recurrenceEndDate ? 'date' : 'never')

  function handleDate(e) { onChange(combineDatetime(e.target.value, time)) }
  function handleTime(e) { onChange(combineDatetime(date, e.target.value)) }

  function handleEndType(t) {
    setEndType(t)
    if (t === 'never') { onRecurrenceEndDateChange && onRecurrenceEndDateChange(null); onRecurrenceCountChange && onRecurrenceCountChange(null) }
    if (t === 'date')  { onRecurrenceCountChange && onRecurrenceCountChange(null) }
    if (t === 'count') { onRecurrenceEndDateChange && onRecurrenceEndDateChange(null) }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1.5">
        <div className="flex flex-col flex-1">
          <label className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>{label || 'Data'} *</label>
          <input type="date" value={date} onChange={handleDate} required
            className="text-xs bg-transparent focus:outline-none" style={{ color: 'var(--text-2)' }} />
        </div>
        <div className="flex flex-col w-24">
          <label className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Hora (opcional)</label>
          <input type="time" value={time} onChange={handleTime}
            className="text-xs bg-transparent focus:outline-none" style={{ color: 'var(--text-2)' }} />
        </div>
      </div>
      {onRecurrenceChange !== undefined && (
        <div className="flex flex-col gap-1">
          <div className="flex flex-col">
            <label className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Recorrência</label>
            <select value={recurrence || ''} onChange={e => { onRecurrenceChange(e.target.value || null); if (!e.target.value) { onRecurrenceEndDateChange && onRecurrenceEndDateChange(null); onRecurrenceCountChange && onRecurrenceCountChange(null); setEndType('never') } }}
              className="text-xs bg-transparent focus:outline-none" style={{ color: 'var(--text-2)' }}>
              {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {recurrence && (
            <div className="flex flex-col gap-1 pl-2" style={{ borderLeft: '2px solid var(--border)' }}>
              <label className="text-[10px]" style={{ color: 'var(--text-3)' }}>Fim da recorrência</label>
              <div className="flex gap-2 flex-wrap">
                {[['never','Nunca'],['date','Por data'],['count','Nº ocorrências']].map(([k,lbl]) => (
                  <button key={k} type="button" onClick={() => handleEndType(k)}
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: endType===k?'var(--surface)6E8':'var(--surface-2)', color: endType===k?'var(--accent-ink)':'var(--text-2)', border: endType===k?'1px solid var(--accent)':'1px solid transparent' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              {endType === 'date' && onRecurrenceEndDateChange && (
                <div className="flex flex-col">
                  <label className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Data de fim</label>
                  <input type="date" value={recurrenceEndDate || ''} onChange={e => onRecurrenceEndDateChange(e.target.value || null)}
                    className="text-xs bg-transparent focus:outline-none" style={{ color: 'var(--text-2)' }} />
                </div>
              )}
              {endType === 'count' && onRecurrenceCountChange && (
                <div className="flex flex-col">
                  <label className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Nº de ocorrências</label>
                  <input type="number" min="1" max="365" value={recurrenceCount || ''} onChange={e => onRecurrenceCountChange(e.target.value ? parseInt(e.target.value) : null)} placeholder="ex: 12"
                    className="text-xs bg-transparent focus:outline-none w-20" style={{ color: 'var(--text-2)' }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
