// NoteAttachments.jsx — anexos (PDF, fotos, etc.) de uma nota, mostrados dentro do NoteEditor
import { useState, useEffect, useRef } from 'react'
import { Paperclip, Plus, Trash2, Loader2, FileText, Image as ImageIcon, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

function fmtSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function NoteAttachments({ noteId }) {
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    api.attachments.list(noteId)
      .then(d => Array.isArray(d) && setAttachments(d))
      .catch(() => toast.error('Erro ao carregar anexos'))
      .finally(() => setLoading(false))
  }, [noteId])

  async function handlePick(e) {
    const file = e.target.files?.[0]
    if (fileRef.current) fileRef.current.value = ''
    if (!file) return
    setUploading(true)
    try {
      const a = await api.attachments.upload(noteId, file)
      setAttachments(p => [...p, a])
    } catch (e) {
      toast.error('Erro ao anexar: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  async function doDelete(id) {
    if (!window.confirm('Apagar este anexo?')) return
    try {
      await api.attachments.delete(id)
      setAttachments(p => p.filter(a => a.id !== id))
    } catch { toast.error('Erro ao apagar anexo') }
  }

  if (loading) return null

  return (
    <div className="flex-shrink-0 px-5 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Paperclip size={11} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Anexos</span>
          {attachments.length > 0 && (
            <span className="text-[10px] px-1 py-0.5 rounded-full font-bold text-white" style={{ background: 'var(--accent)' }}>{attachments.length}</span>
          )}
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-5 h-5 rounded flex items-center justify-center disabled:opacity-50"
          style={{ color: 'var(--accent-ink)', border: '1px solid var(--accent)' }} title="Adicionar anexo">
          {uploading ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handlePick} disabled={uploading} />
      </div>
      <div className="flex flex-col gap-1">
        {attachments.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sem anexos. Clica + para adicionar um ficheiro.</p>
        )}
        {attachments.map(a => {
          const Icon = (a.content_type || '').startsWith('image/') ? ImageIcon : FileText
          return (
            <div key={a.id} className="flex items-center gap-2 group">
              <Icon size={12} style={{ color: 'var(--text-3)' }} className="flex-shrink-0" />
              <a href={api.attachments.fileUrl(a.id)} target="_blank" rel="noopener noreferrer"
                className="text-xs flex-1 truncate hover:underline" style={{ color: 'var(--text)' }} title={a.filename}>
                {a.filename}
              </a>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-3)' }}>{fmtSize(a.size_bytes)}</span>
              <a href={api.attachments.fileUrl(a.id)} download={a.filename}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--surface-2)] flex-shrink-0" title="Descarregar">
                <Download size={10} style={{ color: 'var(--text-3)' }} />
              </a>
              <button onClick={() => doDelete(a.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--danger-soft)] flex-shrink-0" title="Apagar">
                <Trash2 size={10} style={{ color: 'var(--text-3)' }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
