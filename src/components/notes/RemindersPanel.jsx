import { useState } from 'react'
import { Plus, Check, X, Bell } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import ReminderItem from './ReminderItem'
import DateTimeField from './DateTimeField'

function ReminderForm({ notes, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [due, setDue] = useState('')
  const [noteId, setNoteId] = useState('')
  const [recurrence, setRecurrence] = useState(null)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(null)
  const [recurrenceCount, setRecurrenceCount] = useState(null)
  return (
    <form onSubmit={e => { e.preventDefault(); title.trim() && due && onSave({ title: title.trim(), body: body || null, due_date: due, note_id: noteId || null, recurrence: recurrence || null, recurrence_end_date: recurrenceEndDate || null, recurrence_count: recurrenceCount || null }) }}
      className="p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do lembrete…"
        className="w-full text-xs bg-transparent focus:outline-none mb-1.5 font-medium" style={{ color: 'var(--text)' }} />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Nota (opcional)…" rows={2}
        className="w-full text-xs bg-transparent focus:outline-none resize-none mb-1.5" style={{ color: 'var(--text-2)' }} />
      <div className="mb-2"><DateTimeField value={due} onChange={setDue} recurrence={recurrence} onRecurrenceChange={setRecurrence} recurrenceEndDate={recurrenceEndDate} onRecurrenceEndDateChange={setRecurrenceEndDate} recurrenceCount={recurrenceCount} onRecurrenceCountChange={setRecurrenceCount} /></div>
      {notes.length > 0 && (
        <select value={noteId} onChange={e => setNoteId(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none mb-2" style={{ color: 'var(--text-2)' }}>
          <option value="">— Ligar a nota (opcional) —</option>
          {notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
      )}
      <div className="flex gap-1.5">
        <button type="submit" className="flex-1 py-1 rounded text-xs font-medium text-white flex items-center justify-center gap-1" style={{ background: 'var(--accent)' }}>
          <Check size={10} /> Guardar
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1 rounded text-xs" style={{ background: 'var(--border)', color: 'var(--text-2)' }}>
          <X size={10} />
        </button>
      </div>
    </form>
  )
}

export default function RemindersPanel({ reminders, setReminders, allNotes }) {
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState('pending')

  async function doCreate(d) {
    try { const r = await api.reminders.create(d); setReminders(p => [r, ...p]); setCreating(false); toast.success('Lembrete criado') }
    catch { toast.error('Erro ao criar') }
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
  async function doEdit(updated) {
    try { const u = await api.reminders.update(updated.id, updated); setReminders(p => p.map(x => x.id === updated.id ? { ...x, ...u } : x)); toast.success('Lembrete actualizado') }
    catch { toast.error('Erro ao actualizar') }
  }
  async function doDelete(id) {
    try { await api.reminders.delete(id); setReminders(p => p.filter(x => x.id !== id)) }
    catch { toast.error('Erro ao apagar') }
  }

  const pending = reminders.filter(r => !r.completed).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const done = reminders.filter(r => r.completed)
  const list = tab === 'pending' ? pending : done

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Lembretes</span>
        </div>
        <button onClick={() => setCreating(c => !c)} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--surface)6E8', color: 'var(--accent-ink)', border: '1px solid var(--accent)' }}>
          <Plus size={12} />
        </button>
      </div>
      <div className="flex px-4 pt-2 flex-shrink-0 gap-1">
        {[['pending', 'Pendentes (' + pending.length + ')'], ['done', 'Concluídos']].map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)} className="px-3 py-1 text-xs font-medium rounded-t-lg"
            style={{ background: tab === k ? 'var(--surface)6E8' : 'transparent', color: tab === k ? 'var(--accent-ink)' : 'var(--text-3)', borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent' }}>
            {lbl}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {creating && <ReminderForm notes={allNotes} onSave={doCreate} onCancel={() => setCreating(false)} />}
        {list.length === 0 && <p className="text-xs text-center mt-8" style={{ color: 'var(--text-3)' }}>Nenhum lembrete {tab === 'pending' ? 'pendente' : 'concluído'}.</p>}
        {list.map(r => <ReminderItem key={r.id} r={r} allNotes={allNotes} onToggle={doToggle} onDelete={doDelete} onEdit={doEdit} />)}
      </div>
    </div>
  )
}