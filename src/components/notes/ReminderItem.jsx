import { useState } from 'react'
import { Check, Trash2, AlertCircle, Pencil, X } from 'lucide-react'
import { fmtDue } from '@/lib/api'
import DateTimeField from './DateTimeField'

const RECURRENCE_LABELS = { daily: '↻ Diária', weekly: '↻ Semanal', monthly: '↻ Mensal', yearly: '↻ Anual' }

function EditForm({ r, allNotes, onSave, onCancel }) {
  const [title, setTitle] = useState(r.title)
  const [body, setBody] = useState(r.body || '')
  const [due, setDue] = useState(r.due_date || '')
  const [noteId, setNoteId] = useState(r.note_id || '')
  const [recurrence, setRecurrence] = useState(r.recurrence || null)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(r.recurrence_end_date || null)
  const [recurrenceCount, setRecurrenceCount] = useState(r.recurrence_count || null)
  return (
    <form onSubmit={e => { e.preventDefault(); title.trim() && due && onSave({ ...r, title: title.trim(), body: body || null, due_date: due, note_id: noteId || null, recurrence: recurrence || null, recurrence_end_date: recurrenceEndDate || null, recurrence_count: recurrenceCount || null }) }}
      className="p-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Título…"
        className="w-full text-xs font-medium bg-transparent focus:outline-none mb-1" style={{ color: 'var(--text)' }} />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Nota (opcional)…" rows={2}
        className="w-full text-xs bg-transparent focus:outline-none resize-none mb-1" style={{ color: 'var(--text-2)' }} />
      <div className="mb-1.5"><DateTimeField value={due} onChange={setDue} recurrence={recurrence} onRecurrenceChange={setRecurrence} recurrenceEndDate={recurrenceEndDate} onRecurrenceEndDateChange={setRecurrenceEndDate} recurrenceCount={recurrenceCount} onRecurrenceCountChange={setRecurrenceCount} /></div>
      {allNotes && allNotes.length > 0 && (
        <select value={noteId} onChange={e => setNoteId(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none mb-2" style={{ color: 'var(--text-2)' }}>
          <option value="">— Sem nota ligada —</option>
          {allNotes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
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

export default function ReminderItem({ r, allNotes, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const { label, overdue } = fmtDue(r.due_date)
  const bg = overdue && !r.completed ? 'var(--surface)0F0' : 'var(--surface)'
  const bd = overdue && !r.completed ? 'var(--danger)' : 'var(--border)'

  if (editing) {
    return <EditForm r={r} allNotes={allNotes} onSave={d => { onEdit(d); setEditing(false) }} onCancel={() => setEditing(false)} />
  }

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg group" style={{ background: bg, border: '1px solid ' + bd }}>
      <button onClick={() => onToggle(r)} className="mt-0.5 flex-shrink-0">
        {r.completed
          ? <Check size={14} style={{ color: 'var(--ok)' }} />
          : <div className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: 'var(--accent)' }} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: r.completed ? 'var(--text-3)' : 'var(--text)', textDecoration: r.completed ? 'line-through' : 'none' }}>
          {r.title}
        </p>
        {r.body && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-2)' }}>{r.body}</p>}
        {r.note_title && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>📝 {r.note_title}</p>}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {overdue && !r.completed && <AlertCircle size={10} style={{ color: 'var(--danger)' }} />}
          <span className="text-[10px]" style={{ color: overdue && !r.completed ? 'var(--danger)' : 'var(--text-3)' }}>{label}</span>
          {r.recurrence && <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: 'var(--surface)6E8', color: 'var(--accent-ink)' }}>{RECURRENCE_LABELS[r.recurrence]}</span>}
        </div>
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-[var(--surface-2)] opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil size={11} style={{ color: 'var(--text-3)' }} />
        </button>
        <button onClick={() => onDelete(r.id)} className="p-1 rounded hover:bg-[var(--danger-soft)]">
          <Trash2 size={11} style={{ color: 'var(--text-3)' }} />
        </button>
      </div>
    </div>
  )
}