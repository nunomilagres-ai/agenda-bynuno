import { useState } from 'react'
import { Plus, Pencil, Trash2, StickyNote, Bell, LayoutDashboard } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import TopicForm from './TopicForm'

function N({ label, icon, active, badge, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:opacity-80 text-left"
      style={{background:active?'var(--surface)6E8':'transparent',color:active?'var(--accent-ink)':'var(--text-2)',borderLeft:active?'2px solid var(--accent)':'2px solid transparent'}}>
      {icon && <span className="flex-shrink-0" style={{color:active?'var(--accent)':'inherit'}}>{icon}</span>}
      <span className="text-xs font-medium truncate flex-1 text-left">{label}</span>
      {badge&&<span className="text-[10px] font-bold px-1 py-0.5 rounded-full text-white flex-shrink-0" style={{background:'var(--danger)'}}>{badge}</span>}
    </button>
  )
}

export default function TopicsSidebar({ topics, setTopics, selectedTopic, setSelectedTopic, showReminders, onSelectReminders, pendingReminders, onShowDashboard, showDashboard }) {
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState(null)

  async function doCreate(d) {
    try { const t=await api.topics.create(d); setTopics(p=>[...p,t]); setCreating(false); toast.success('Tema criado') }
    catch { toast.error('Erro ao criar') }
  }
  async function doUpdate(id, d) {
    try { const u=await api.topics.update(id,d); setTopics(p=>p.map(t=>t.id===id?{...t,...u}:t)); setEditId(null) }
    catch { toast.error('Erro') }
  }
  async function doDelete(id) {
    if (!window.confirm('Apagar tema?')) return
    try { await api.topics.delete(id); setTopics(p=>p.filter(t=>t.id!==id)); if(selectedTopic===id)setSelectedTopic(null) }
    catch { toast.error('Erro') }
  }

  return (
    <aside className="flex flex-col h-full" style={{background:'var(--surface)'}}>
      <div className="px-3 pt-4 pb-2 flex items-center justify-between flex-shrink-0" style={{borderBottom:'1px solid var(--border)'}}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{color:'var(--text-3)'}}>Temas</span>
        <button onClick={()=>{setCreating(true);setEditId(null)}} className="w-5 h-5 rounded flex items-center justify-center" style={{background:'var(--surface)6E8',color:'var(--accent-ink)',border:'1px solid var(--accent)'}}><Plus size={11}/></button>
      </div>
      <div className="flex-1 overflow-y-auto py-1.5 px-2 flex flex-col gap-0.5">
        <N label="Dashboard" icon={<LayoutDashboard size={12}/>} active={showDashboard} onClick={onShowDashboard}/>
        <N label="Todas as notas" icon={<StickyNote size={12}/>} active={!showReminders&&!showDashboard&&selectedTopic===null} onClick={()=>{setSelectedTopic(null);onSelectReminders(false)}}/>
        <N label="Lembretes" icon={<Bell size={12}/>} badge={pendingReminders||undefined} active={showReminders&&!showDashboard} onClick={()=>onSelectReminders(true)}/>
        <div className="my-1 border-t" style={{borderColor:'var(--border)'}}/>
        <N label="📋 Geral" active={!showReminders&&selectedTopic==='none'} onClick={()=>{setSelectedTopic('none');onSelectReminders(false)}}/>
        {creating && <TopicForm onSave={doCreate} onCancel={()=>setCreating(false)}/>}
        {topics.map(t => editId===t.id
          ? <TopicForm key={t.id} v={t} onSave={d=>doUpdate(t.id,d)} onCancel={()=>setEditId(null)}/>
          : <div key={t.id} className="flex items-center gap-0.5 group">
              <div className="flex-1 min-w-0">
                <N label={t.emoji+' '+t.name} active={!showReminders&&selectedTopic===t.id} onClick={()=>{setSelectedTopic(t.id);onSelectReminders(false)}}/>
              </div>
              <button onClick={()=>setEditId(t.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--surface-2)]"><Pencil size={10} style={{color:'var(--text-3)'}}/></button>
              <button onClick={()=>doDelete(t.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--danger-soft)]"><Trash2 size={10} style={{color:'var(--text-3)'}}/></button>
            </div>
        )}
      </div>
    </aside>
  )
}