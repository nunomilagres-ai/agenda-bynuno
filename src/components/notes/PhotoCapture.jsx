import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { analyzeNotePhoto, fileToBase64 } from '@/lib/aiPhoto'

export default function PhotoCapture({ topics, onResult, onClose }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)
  const camRef = useRef(null)

  function pick(f) { if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)) }

  async function analyze() {
    if (!file) return
    setLoading(true)
    try {
      const { base64, mediaType } = await fileToBase64(file)
      const r = await analyzeNotePhoto(base64, mediaType, topics)
      const matched = topics.find(t => t.name === r.topic_name)
      onResult({ title: r.title || 'Nova nota', content: r.content || '', topic_id: matched?.id || null })
      toast.success('Nota identificada pela IA!')
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={13} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Foto para nota — IA</span>
          </div>
          <button onClick={onClose}><X size={14} style={{ color: 'var(--text-3)' }} /></button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => pick(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pick(e.target.files[0])} />
          {!preview ? (
            <div className="flex gap-2">
              <button onClick={() => camRef.current.click()} className="flex-1 flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                <Camera size={22} /><span className="text-xs font-medium">Câmara</span>
              </button>
              <button onClick={() => fileRef.current.click()} className="flex-1 flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--text-3)', color: 'var(--text-3)' }}>
                <Upload size={22} /><span className="text-xs font-medium">Galeria</span>
              </button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <img src={preview} alt="" className="w-full object-contain" style={{ maxHeight: 220 }} />
              <button onClick={() => { setPreview(null); setFile(null) }} className="absolute top-2 right-2 p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <X size={12} className="text-white" />
              </button>
            </div>
          )}
          <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>A foto não é guardada — apenas o texto da nota.</p>
          {preview && (
            <button onClick={analyze} disabled={loading} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--accent-solid)' }}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> A analisar…</> : <><Sparkles size={14} /> Analisar com IA</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}