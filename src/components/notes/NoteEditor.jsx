import { useState, useRef, useCallback } from 'react'
import { Eye, EyeOff, Save, Pin, PinOff, Trash2, Camera } from 'lucide-react'
import { api, renderMarkdown } from '@/lib/api'
import { toast } from 'sonner'
import PhotoCapture from './PhotoCapture'
import NoteReminders from './NoteReminders'

export default function NoteEditor({ note, topics, onUpdate, onDelete, onBack, reminders, setReminders }) {
  const [title, setTitle] = useState(note.title||'')
  const [content, setContent] = useState(note.content||'')
  const [preview, setPreview] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timer = useRef(null)

  const save = useCallback(async (t, c) => {
    setSaving(true)
    try {
      const u = await api.notes.update(note.id, { title: t, content: c })
      onUpdate({ ...note, ...u, title: t, content: c })
      setSaved(true); setTimeout(()=>setSaved(false), 2000)
    } catch { toast.error('Erro ao guardar') }
    finally { setSaving(false) }
  }, [note, onUpdate])

  function scheduleAutoSave(t, c) {
    clearTimeout(timer.current)
    setSaved(false)
    timer.current = setTimeout(()=>save(t,c), 1500)
  }

  function chTitle(e) { setTitle(e.target.value); scheduleAutoSave(e.target.value, content) }
  function chContent(e) { setContent(e.target.value); scheduleAutoSave(title, e.target.value) }

  async function togglePin() {
    const u = await api.notes.update(note.id, { pinned: !note.pinned })
    onUpdate({ ...note, ...u, pinned: !note.pinned })
  }

  async function doDelete() {
    if (!window.confirm('Apagar esta nota?')) return
    await api.notes.delete(note.id)
    onDelete(note.id)
  }

  function handlePhotoResult(r) {
    setTitle(r.title); setContent(r.content)
    scheduleAutoSave(r.title, r.content)
    if (r.topic_id && r.topic_id !== note.topic_id) {
      api.notes.update(note.id, { topic_id: r.topic_id })
      onUpdate({ ...note, topic_id: r.topic_id })
    }
    setShowPhoto(false)
  }

  const topic = topics.find(t=>t.id===note.topic_id)

  return (
    <div className="flex flex-col h-full" style={{background:'var(--surface)'}}>
      {showPhoto && <PhotoCapture topics={topics} onResult={handlePhotoResult} onClose={()=>setShowPhoto(false)}/>}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{borderBottom:'1px solid var(--border)'}}>
        {onBack && <button onClick={onBack} className="text-xs mr-1 hover:underline" style={{color:'var(--text-3)'}}>← Notas</button>}
        {topic && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:topic.color+'22',color:topic.color}}>{topic.emoji} {topic.name}</span>}
        <div className="flex items-center gap-1 ml-auto">
          {saving && <span className="text-xs" style={{color:'var(--text-3)'}}>A guardar…</span>}
          {saved && <span className="text-xs flex items-center gap-1" style={{color:'var(--accent)'}}><Save size={10}/>Guardado</span>}
          <button onClick={()=>setPreview(p=>!p)} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{background:'var(--surface-2)',color:'var(--text-2)'}}>
            {preview?<EyeOff size={11}/>:<Eye size={11}/>}{preview?'Editor':'Preview'}
          </button>
          <button onClick={()=>setShowPhoto(true)} className="p-1.5 rounded hover:bg-[var(--surface-2)]" title="Foto para nota (IA)">
            <Camera size={12} style={{color:'var(--accent)'}}/>
          </button>
          <button onClick={togglePin} className="p-1.5 rounded hover:bg-[var(--surface-2)]" title={note.pinned?'Desafixar':'Fixar'}>
            {note.pinned?<PinOff size={12} style={{color:'var(--accent)'}}/>:<Pin size={12} style={{color:'var(--text-3)'}}/>}
          </button>
          <button onClick={doDelete} className="p-1.5 rounded hover:bg-[var(--danger-soft)]"><Trash2 size={12} style={{color:'var(--text-3)'}}/></button>
        </div>
      </div>
      <div className="px-5 pt-4 pb-2 flex-shrink-0" style={{borderBottom:'1px solid var(--surface-2)'}}>
        <input value={title} onChange={chTitle} placeholder="Título da nota"
          className="w-full text-xl font-semibold bg-transparent focus:outline-none" style={{color:'var(--text)'}}/>
      </div>
      <div className="flex-1 overflow-hidden">
        {preview
          ? <div className="h-full overflow-y-auto px-5 py-4 text-sm" dangerouslySetInnerHTML={{__html:renderMarkdown(content)}}/>
          : <textarea value={content} onChange={chContent} placeholder="Escreve aqui em Markdown…"
              className="w-full h-full resize-none px-5 py-4 text-sm focus:outline-none font-mono leading-relaxed"
              style={{color:'var(--text-2)',background:'transparent'}}/>}
      </div>
      {reminders !== undefined && <NoteReminders noteId={note.id} reminders={reminders} setReminders={setReminders}/>}
    </div>
  )
}