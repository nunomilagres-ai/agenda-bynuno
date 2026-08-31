// EventModal.jsx — criar/editar evento
import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { isoToDate, isoToTime, combineDatetime } from '@/lib/dateUtils'

const RECURRENCE_OPTIONS = [
  { value: '',              label: 'Não se repete' },
  { value: 'weekly',        label: 'Semanalmente' },
  { value: 'biweekly',      label: 'Quinzenalmente' },
  { value: 'every_3_weeks', label: 'De 3 em 3 semanas' },
  { value: 'monthly',       label: 'Mensalmente' },
  { value: 'yearly',        label: 'Anualmente' },
]

export default function EventModal({ date, event, locations, onClose, onSaved, onDeleted }) {
  const isEdit = !!event
  const isBirthday = isEdit && event.event_type === 'birthday'
  // Série normal (não-aniversário): cada ocorrência, incluindo a primeira, é
  // editável/apagável isoladamente — nunca afeta as restantes.
  const isDetachable = isEdit && !!event.recurrence_freq && !isBirthday
  const masterId = isEdit ? String(event.id).split('::')[0] : null

  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [locationId, setLocationId] = useState(event?.location_id || '')
  const [allDay, setAllDay] = useState(event ? !!event.all_day : true)
  const [startDate, setStartDate] = useState(event ? isoToDate(event.start_datetime) : date)
  const [startTime, setStartTime] = useState(event ? isoToTime(event.start_datetime) : '09:00')
  const [endDate, setEndDate] = useState(event ? isoToDate(event.end_datetime) : date)
  const [endTime, setEndTime] = useState(event ? isoToTime(event.end_datetime) : '10:00')
  const [eventType, setEventType] = useState(event?.event_type || '')
  const [recurrenceFreq, setRecurrenceFreq] = useState(event?.recurrence_freq || '')
  const [recurrenceUntil, setRecurrenceUntil] = useState(event?.recurrence_until || '')
  const [saving, setSaving] = useState(false)
  const isBirthdayFlag = eventType === 'birthday'

  function changeEventType(value) {
    setEventType(value)
    if (value === 'birthday') { setRecurrenceFreq('yearly'); setRecurrenceUntil('') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { toast.error('O título é obrigatório'); return }

    const basePayload = {
      title: title.trim(),
      description: description.trim() || null,
      location_id: locationId || null,
      all_day: allDay,
      start_datetime: allDay ? startDate : combineDatetime(startDate, startTime),
      end_datetime: allDay ? endDate : combineDatetime(endDate, endTime),
    }

    setSaving(true)
    try {
      if (isDetachable) {
        await api.events.updateOccurrence(masterId, event.occurrence_date, basePayload)
        toast.success('Ocorrência atualizada')
      } else {
        const payload = {
          ...basePayload,
          recurrence_freq: recurrenceFreq || null,
          recurrence_until: recurrenceFreq ? (recurrenceUntil || null) : null,
          event_type: eventType || null,
        }
        if (isEdit) {
          await api.events.update(event.id, payload)
          toast.success('Evento atualizado')
        } else {
          await api.events.create(payload)
          toast.success('Evento criado')
        }
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(isDetachable ? 'Remover esta ocorrência?' : 'Apagar este evento?')) return
    setSaving(true)
    try {
      if (isDetachable) {
        await api.events.deleteOccurrence(masterId, event.occurrence_date)
        toast.success('Ocorrência removida')
      } else {
        await api.events.delete(event.id)
        toast.success('Evento apagado')
      }
      onDeleted()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--overlay)' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl p-5 animate-fade-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isEdit ? 'Editar evento' : 'Novo evento'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-2)]">
            <X size={16} style={{ color: 'var(--text-3)' }} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do evento"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />

          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)}
              style={{ accentColor: 'var(--accent-solid)' }} />
            Dia inteiro
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>Início</span>
              <div className="flex gap-1">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                {!allDay && (
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>Fim</span>
              <div className="flex gap-1">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                {!allDay && (
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                )}
              </div>
            </div>
          </div>

          <select value={locationId} onChange={e => setLocationId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="">Sem localização</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          {isDetachable ? (
            <p className="text-[11px] -mt-1" style={{ color: 'var(--text-3)' }}>
              Esta é uma ocorrência de uma série recorrente — guardar ou apagar afeta só este dia, nunca a série.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>Tipo de evento</span>
                <select value={eventType} onChange={e => changeEventType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                  <option value="">Normal</option>
                  <option value="birthday">🎂 Aniversário (repete todos os anos; sem edição por ocorrência)</option>
                  <option value="vacation">🏖️ Férias (fundo do dia como um feriado)</option>
                </select>
              </div>
              {!isBirthdayFlag && (
                <div className="flex gap-2">
                  <select value={recurrenceFreq} onChange={e => setRecurrenceFreq(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                    {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {recurrenceFreq && (
                    <input type="date" value={recurrenceUntil} onChange={e => setRecurrenceUntil(e.target.value)}
                      title="Repetir até (opcional)"
                      className="px-2 py-1.5 rounded-lg text-sm w-36" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                  )}
                </div>
              )}
              {isBirthday && (
                <p className="text-[11px] -mt-1" style={{ color: 'var(--text-3)' }}>
                  Aniversário — a alteração aplica-se a todos os anos.
                </p>
              )}
              {isEdit && recurrenceFreq && !isBirthdayFlag && (
                <p className="text-[11px] -mt-1" style={{ color: 'var(--text-3)' }}>
                  Isto altera o padrão da série a partir de agora — as ocorrências já editadas isoladamente mantêm-se.
                </p>
              )}
            </>
          )}

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Notas (opcional)"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>

        <div className="flex items-center justify-between mt-5">
          {isEdit ? (
            <button type="button" onClick={handleDelete} disabled={saving}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-[var(--danger-soft)]"
              style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} /> {isDetachable ? 'Remover ocorrência' : 'Apagar'}
            </button>
          ) : <span />}
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--accent-solid)' }}>
            {isEdit ? 'Guardar' : 'Criar evento'}
          </button>
        </div>
      </form>
    </div>
  )
}
