// EventModal.jsx — criar/editar evento
import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { isoToDate, isoToTime, combineDatetime } from '@/lib/dateUtils'

export default function EventModal({ date, event, locations, onClose, onSaved, onDeleted }) {
  const isEdit = !!event
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [locationId, setLocationId] = useState(event?.location_id || '')
  const [allDay, setAllDay] = useState(event ? !!event.all_day : true)
  const [startDate, setStartDate] = useState(event ? isoToDate(event.start_datetime) : date)
  const [startTime, setStartTime] = useState(event ? isoToTime(event.start_datetime) : '09:00')
  const [endDate, setEndDate] = useState(event ? isoToDate(event.end_datetime) : date)
  const [endTime, setEndTime] = useState(event ? isoToTime(event.end_datetime) : '10:00')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { toast.error('O título é obrigatório'); return }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      location_id: locationId || null,
      all_day: allDay,
      start_datetime: allDay ? startDate : combineDatetime(startDate, startTime),
      end_datetime: allDay ? endDate : combineDatetime(endDate, endTime),
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.events.update(event.id, payload)
        toast.success('Evento atualizado')
      } else {
        await api.events.create(payload)
        toast.success('Evento criado')
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
    if (!confirm('Apagar este evento?')) return
    setSaving(true)
    try {
      await api.events.delete(event.id)
      toast.success('Evento apagado')
      onDeleted()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(19,26,42,0.4)' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl p-5 animate-fade-in"
        style={{ background: '#FFFFFF', border: '1px solid #E2E6EF' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#131A2A' }}>
            {isEdit ? 'Editar evento' : 'Novo evento'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={16} style={{ color: '#8A93A6' }} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do evento"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #E2E6EF' }}
          />

          <label className="flex items-center gap-2 text-sm" style={{ color: '#4B5567' }}>
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)}
              style={{ accentColor: '#2E5FCB' }} />
            Dia inteiro
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: '#8A93A6' }}>Início</span>
              <div className="flex gap-1">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid #E2E6EF' }} />
                {!allDay && (
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid #E2E6EF' }} />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: '#8A93A6' }}>Fim</span>
              <div className="flex gap-1">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid #E2E6EF' }} />
                {!allDay && (
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid #E2E6EF' }} />
                )}
              </div>
            </div>
          </div>

          <select value={locationId} onChange={e => setLocationId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid #E2E6EF', color: '#131A2A' }}>
            <option value="">Sem localização</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Notas (opcional)"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ border: '1px solid #E2E6EF' }}
          />
        </div>

        <div className="flex items-center justify-between mt-5">
          {isEdit ? (
            <button type="button" onClick={handleDelete} disabled={saving}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50"
              style={{ color: '#DC2626' }}>
              <Trash2 size={14} /> Apagar
            </button>
          ) : <span />}
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#2E5FCB' }}>
            {isEdit ? 'Guardar' : 'Criar evento'}
          </button>
        </div>
      </form>
    </div>
  )
}
