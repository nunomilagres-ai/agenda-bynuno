// LocationPeriodModal.jsx — marcar "estarei em X de A a B" (tinge a grelha)
import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { fmtDayRange } from '@/lib/dateUtils'

export default function LocationPeriodModal({ locations, defaultLocationId, defaultDate, defaultStartDate, defaultEndDate, period, onClose, onSaved, onDeleted }) {
  const isEdit = !!period
  const isRange = !isEdit && defaultStartDate && defaultEndDate && defaultStartDate !== defaultEndDate
  const [locationId, setLocationId] = useState(period?.location_id || defaultLocationId || locations[0]?.id || '')
  const [startDate, setStartDate] = useState(period?.start_date || defaultStartDate || defaultDate)
  const [endDate, setEndDate] = useState(period?.end_date || defaultEndDate || defaultDate)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!locationId) { toast.error('Escolhe uma localização'); return }
    if (endDate < startDate) { toast.error('A data de fim não pode ser anterior à de início'); return }

    setSaving(true)
    try {
      const payload = { location_id: locationId, start_date: startDate, end_date: endDate }
      if (isEdit) {
        await api.locationPeriods.update(period.id, payload)
        toast.success('Período atualizado')
      } else {
        await api.locationPeriods.create(payload)
        toast.success('Período marcado')
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
    if (!confirm('Remover este período?')) return
    setSaving(true)
    try {
      await api.locationPeriods.delete(period.id)
      toast.success('Período removido')
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl p-5 animate-fade-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              {isEdit ? 'Editar período' : 'Marcar localização'}
            </h2>
            {isRange && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                {fmtDayRange(startDate, endDate, true)}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-2)]">
            <X size={16} style={{ color: 'var(--text-3)' }} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <select value={locationId} onChange={e => setLocationId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          {!isRange && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>De</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>Até</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
          {isEdit ? (
            <button type="button" onClick={handleDelete} disabled={saving}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-[var(--danger-soft)]"
              style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} /> Remover
            </button>
          ) : <span />}
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--accent-solid)' }}>
            {isEdit ? 'Guardar' : 'Marcar'}
          </button>
        </div>
      </form>
    </div>
  )
}
