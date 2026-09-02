// NoteReminders.jsx — reminders linked to a specific note, shown inside NoteEditor
import { useState } from 'react'
import { Bell, Plus, Check, X, Trash2, AlertCircle } from 'lucide-react'
import { api, fmtDue } from '@/lib/api'
import { toast } from 'sonner'
import DateTimeField from './DateTimeField'

const RECURRENCE_LABELS = { daily: '↻ Diária', weekly: '↻ Semanal', monthly: '↻ Mensal', yearly: '↻ Anual' }

function QuickForm({ noteId, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [recurrence, setRecurrence] = useState(null)
  return (
    <form onSubmit={e => { e.preventDefault(); title.trim() && due && onSave({ title: title.trim(), due_date: due, note_id: noteId, body: null, recurrence: recurrence || null }) }}
      className="flex flex-col gap-1 p-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da tarefa…"
        className="text-xs font-medium bg-transparent focus:outline-none" style={{ color: 'var(--text)' }} />
      <DateTimeField value={due} onChange={setDue} recurrence={recurrence} onRecurrenceChange={setRecurrence} />
      <div className="flex gap-1.5 mt-0.5">
        <button type="submit" className="flex-1 py-1 rounded text-xs font-medium text-white flex items-center justify-center gap-1" style={{ background: 'var(--accent)' }}>
          <Check size={10} /> Criar
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1 rounded text-xs" style={{ background: 'var(--border)', color: 'var(--text-2)' }}>
          <X size={10} />
        </button>
      </div>
    </form>
  )
}

export default function NoteReminders({ noteId, reminders, setReminders }) {
  const [creating, setCreating] = useState(false)
  const noteReminders = reminders
    .filter(r => r.note_id === noteId)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  async function doCreate(d) {
    try {
      const r = await api.reminders.create(d)
      setReminders(p => [...p, r])
      setCreating(false)
      toast.success('Tarefa criada')
    } catch { toast.error('Erro ao criar') }
  }

  async function doToggle(r) {
    try {
      const u = await api.reminders.update(r.id, { ...r, completed: r.completed ? 0 : 1 })
      setReminders(p => {
        const updated = p.map(x => x.id === r.id ? { ...x, ...u } : x)
        return u.next ? [...updated, u.next] : updated
      })
    } catch { toast.error('Erro') }
  }

  async function doDelete(id) {
    try {
      await api.reminders.delete(id)
      setReminders(p => p.filter(x => x.id !== id))
    } catch { toast.error('Erro ao apagar') }
  }

  return (
    <div className="flex-shrink-0 px-5 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Bell size={11} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Tarefas desta nota</span>
          {noteReminders.length > 0 && (
            <span className="text-[10px] px-1 py-0.5 rounded-full font-bold text-white" style={{ background: 'var(--accent)' }}>{noteReminders.length}</span>
          )}
        </div>
        <button onClick={() => setCreating(c => !c)} className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--surface)6E8', color: 'var(--accent-ink)', border: '1px solid var(--accent)' }}>
          <Plus size={10} />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {creating && <QuickForm noteId={noteId} onSave={doCreate} onCancel={() => setCreating(false)} />}
        {noteReminders.length === 0 && !creating && (
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sem tarefas. Clica + para adicionar.</p>
        )}
        {noteReminders.map(r => {
          const { label, overdue } = fmtDue(r.due_date)
          return (
            <div key={r.id} className="flex items-center gap-2 group">
              <button onClick={() => doToggle(r)} className="flex-shrink-0">
                {r.completed
                  ? <Check size={12} style={{ color: 'var(--ok)' }} />
                  : <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: overdue ? 'var(--danger)' : 'var(--accent)' }} />}
              </button>
              <span className="text-xs flex-1 truncate" style={{ color: r.completed ? 'var(--text-3)' : 'var(--text)', textDecoration: r.completed ? 'line-through' : 'none' }}>
                {r.title}
              </span>
              <span className="text-[10px] flex-shrink-0" style={{ color: overdue && !r.completed ? 'var(--danger)' : 'var(--text-3)' }}>
                {overdue && !r.completed && <AlertCircle size={9} className="inline mr-0.5" />}{label}
                {r.recurrence && <span className="ml-1 px-1 rounded" style={{ background: 'var(--surface)6E8', color: 'var(--accent-ink)' }}>{RECURRENCE_LABELS[r.recurrence]}</span>}
              </span>
              <button onClick={() => doDelete(r.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--danger-soft)] flex-shrink-0">
                <Trash2 size={10} style={{ color: 'var(--text-3)' }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}