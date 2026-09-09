import { Plus, Search, ChevronDown } from 'lucide-react'
import { fmtDate } from '@/lib/api'

export default function NotesList({ notes, selectedId, search, setSearch, onSelect, onNew, topicLabel, sidebarOpen, topics, selectedTopic, setSelectedTopic, showReminders, onSelectReminders }) {
  const filtered = notes.filter(n =>
    (n.title||'').toLowerCase().includes(search.toLowerCase()) ||
    (n.excerpt||'').toLowerCase().includes(search.toLowerCase())
  )

  function handleTopicChange(e) {
    const v = e.target.value
    if (v === '__reminders__') { onSelectReminders(true); return }
    onSelectReminders(false)
    setSelectedTopic(v === '__all__' ? null : v === '__none__' ? 'none' : v)
  }

  const topicValue = showReminders ? '__reminders__' : selectedTopic === null ? '__all__' : selectedTopic === 'none' ? '__none__' : selectedTopic

  return (
    <div className="flex flex-col h-full" style={{background:'var(--surface)',borderRight:'1px solid var(--border)'}}>
      <div className="px-3 pt-3 pb-2 flex-shrink-0" style={{borderBottom:'1px solid var(--border)'}}>
        {/* Topic filter — shown only when sidebar is hidden */}
        {!sidebarOpen && (
          <div className="relative mb-2">
            <select value={topicValue} onChange={handleTopicChange}
              className="w-full text-xs font-medium rounded-lg pl-2 pr-6 py-1.5 appearance-none focus:outline-none cursor-pointer"
              style={{background:'var(--surface)6E8',color:'var(--accent-ink)',border:'1px solid var(--accent)'}}>
              <option value="__all__">📋 Todas as notas</option>
              <option value="__reminders__">🔔 Lembretes</option>
              <option value="__none__">📋 Geral</option>
              {(topics||[]).filter(t=>!t.parent_id).map(t=>[
                <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>,
                ...(topics||[]).filter(c=>c.parent_id===t.id).map(c=>(
                  <option key={c.id} value={c.id}>{'  ↳ '}{c.emoji} {c.name}</option>
                ))
              ])}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{color:'var(--accent-ink)'}}/>
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          {sidebarOpen && <span className="text-xs font-semibold truncate" style={{color:'var(--text)'}}>{topicLabel}</span>}
          <button onClick={onNew} className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ml-auto"
            style={{background:'var(--surface)6E8',color:'var(--accent-ink)',border:'1px solid var(--accent)'}}>
            <Plus size={12}/>
          </button>
        </div>
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{color:'var(--text-3)'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar…"
            className="w-full pl-7 pr-2 py-1 text-xs rounded-lg focus:outline-none"
            style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text)'}}/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length===0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-xs" style={{color:'var(--text-3)'}}>{search?'Sem resultados':'Nenhuma nota ainda.'}</p>
            {!search && <button onClick={onNew} className="text-xs px-3 py-1 rounded-lg text-white" style={{background:'var(--accent)'}}>+ Nova nota</button>}
          </div>
        )}
        {filtered.map(n=>(
          <button key={n.id} onClick={()=>onSelect(n)}
            className="w-full text-left px-3 py-2.5 transition-colors hover:opacity-90"
            style={{borderBottom:'1px solid var(--surface-2)',borderLeft:selectedId===n.id?'2px solid var(--accent)':'2px solid transparent',background:selectedId===n.id?'var(--surface)6E8':'transparent'}}>
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-medium truncate flex-1" style={{color:'var(--text)'}}>{n.pinned?'📌 ':''}{n.title||'Sem título'}</p>
              <span className="text-[10px] flex-shrink-0 mt-0.5" style={{color:'var(--text-3)'}}>{fmtDate(n.updated_date)}</span>
            </div>
            <p className="text-xs mt-0.5 line-clamp-2" style={{color:'var(--text-3)'}}>{n.excerpt||''}</p>
          </button>
        ))}
      </div>
    </div>
  )
}