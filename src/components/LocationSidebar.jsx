// LocationSidebar.jsx — gerir localizações (Porto, Lisboa, Vila Real, ...) e as suas cores
import { useState } from 'react'
import { X, Plus, Pencil, Trash2, CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

const PALETTE = ['#2E5FCB', '#DC2626', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D']

export default function LocationSidebar({ locations, onClose, onChanged, onMarkPeriod }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[locations.length % PALETTE.length])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await api.locations.create({ name: name.trim(), color })
      setName('')
      setColor(PALETTE[(locations.length + 1) % PALETTE.length])
      onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(loc) {
    setEditingId(loc.id)
    setEditName(loc.name)
    setEditColor(loc.color)
  }

  async function saveEdit(id) {
    if (!editName.trim()) return
    try {
      await api.locations.update(id, { name: editName.trim(), color: editColor })
      setEditingId(null)
      onChanged()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(loc) {
    if (!confirm(`Apagar "${loc.name}"? Os períodos associados também são removidos.`)) return
    try {
      await api.locations.delete(loc.id)
      onChanged()
      toast.success('Localização apagada')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" style={{ background: 'var(--overlay)' }} onClick={onClose}>
      <div className="w-full max-w-xs h-full flex flex-col animate-fade-in" style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Localizações</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-2)]">
            <X size={16} style={{ color: 'var(--text-3)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {locations.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Ainda não tens localizações. Cria a primeira em baixo.</p>
          )}
          {locations.map(loc => (
            <div key={loc.id} className="rounded-lg p-2" style={{ border: '1px solid var(--border)' }}>
              {editingId === loc.id ? (
                <div className="flex items-center gap-2">
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer" style={{ border: 'none', padding: 0 }} />
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(loc.id)} autoFocus />
                  <button onClick={() => saveEdit(loc.id)} className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>OK</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: loc.color }} />
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>{loc.name}</span>
                  <button onClick={() => onMarkPeriod(loc)} title="Marcar período" className="p-1 rounded hover:bg-[var(--surface-2)]">
                    <CalendarPlus size={14} style={{ color: 'var(--text-3)' }} />
                  </button>
                  <button onClick={() => startEdit(loc)} title="Editar" className="p-1 rounded hover:bg-[var(--surface-2)]">
                    <Pencil size={14} style={{ color: 'var(--text-3)' }} />
                  </button>
                  <button onClick={() => handleDelete(loc)} title="Apagar" className="p-1 rounded hover:bg-[var(--surface-2)]">
                    <Trash2 size={14} style={{ color: 'var(--text-3)' }} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCreate} className="p-4 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer flex-shrink-0" style={{ border: 'none', padding: 0 }} />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nova localização"
            className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          <button type="submit" disabled={saving || !name.trim()}
            className="p-2 rounded-lg text-white flex-shrink-0" style={{ background: 'var(--accent-solid)' }}>
            <Plus size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
