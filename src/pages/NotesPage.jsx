// NotesPage.jsx — notas, temas e lembretes, vindos do notes.bynuno.com.
//
// Duas diferenças em relação à app de origem:
//  · não traz cabeçalho próprio — o cabeçalho (e a navegação Calendário/Notas)
//    é o AppHeader partilhado com a página do calendário;
//  · não traz o painel de calendário que existia na barra lateral — nesta app o
//    calendário é a outra página, a sério, e não fazia sentido manter dois.
import { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { toast } from 'sonner'
import { api, gid } from '@/lib/api'
import { startNotificationService } from '@/lib/NotificationService'
import AppHeader from '@/components/AppHeader'
import TopicsSidebar from '@/components/notes/TopicsSidebar'
import NotesList from '@/components/notes/NotesList'
import NoteEditor from '@/components/notes/NoteEditor'
import RemindersPanel from '@/components/notes/RemindersPanel'
import DashboardPanel from '@/components/notes/DashboardPanel'

export default function NotesPage() {
  const [topics, setTopics] = useState([])
  const [notes, setNotes] = useState([])
  const [reminders, setReminders] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [showReminders, setShowReminders] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [search, setSearch] = useState('')
  const [mobilePane, setMobilePane] = useState('sidebar') // sidebar | list | editor
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Carregamento inicial. O api.js desta app lança em respostas não-2xx (no
  // Notes devolvia o corpo do erro como se fossem dados), por isso cada chamada
  // trata a falha em vez de a deixar passar em silêncio.
  useEffect(() => {
    api.topics.list()
      .then(d => Array.isArray(d) && setTopics(d))
      .catch(() => toast.error('Erro ao carregar temas'))
    api.reminders.list()
      .then(d => Array.isArray(d) && setReminders(d))
      .catch(() => toast.error('Erro ao carregar lembretes'))
    startNotificationService()
  }, [])

  // Notas do tema selecionado — um tema "chapéu" traz também as notas dos
  // temas que agrupa.
  useEffect(() => {
    setSelectedNote(null)
    setSearch('')
    let tid
    if (selectedTopic === null) tid = undefined
    else if (selectedTopic === 'none') tid = 'none'
    else {
      const childIds = topics.filter(t => t.parent_id === selectedTopic).map(t => t.id)
      tid = [selectedTopic, ...childIds].join(',')
    }
    api.notes.list(tid)
      .then(d => Array.isArray(d) && setNotes(d))
      .catch(() => toast.error('Erro ao carregar notas'))
  }, [selectedTopic, topics])

  async function openNote(n) {
    try {
      const full = await api.notes.get(n.id)
      setSelectedNote(full)
      setMobilePane('editor')
    } catch { toast.error('Erro ao abrir nota') }
  }

  async function newNote() {
    const id = gid()
    const topicId = selectedTopic && selectedTopic !== 'none' ? selectedTopic : null
    try {
      const note = await api.notes.create({ id, title: 'Nova nota', content: '', topic_id: topicId })
      setNotes(p => [note, ...p])
      setSelectedNote(note)
      setMobilePane('editor')
    } catch { toast.error('Erro ao criar nota') }
  }

  function handleUpdate(updated) {
    setNotes(p => p.map(n => n.id === updated.id
      ? { ...n, ...updated, excerpt: (updated.content || '').replace(/#+\s|[*`>#-]/g, '').slice(0, 80) }
      : n))
    setSelectedNote(updated)
  }

  function handleDelete(id) {
    setNotes(p => p.filter(n => n.id !== id))
    setSelectedNote(null)
    setMobilePane('list')
  }

  function handleSelectReminders(show) {
    setShowReminders(show)
    setShowDashboard(false)
    setSelectedNote(null)
    setMobilePane(show ? 'editor' : 'list')
  }

  function handleShowDashboard() {
    setShowDashboard(true)
    setShowReminders(false)
    setSelectedNote(null)
    setMobilePane('editor')
  }

  const pendingReminders = reminders.filter(r => !r.completed).length
  const topicLabel = selectedTopic === null
    ? 'Todas as notas'
    : selectedTopic === 'none'
      ? '📋 Geral'
      : (topics.find(t => t.id === selectedTopic)?.name || 'Notas')

  const sidebar = (
    <TopicsSidebar
      topics={topics} setTopics={setTopics}
      selectedTopic={selectedTopic}
      setSelectedTopic={t => { setSelectedTopic(t); setMobilePane('list'); setShowDashboard(false) }}
      showReminders={showReminders} onSelectReminders={handleSelectReminders}
      pendingReminders={pendingReminders}
      onShowDashboard={handleShowDashboard} showDashboard={showDashboard}
    />
  )

  const list = (
    <NotesList
      notes={notes} selectedId={selectedNote?.id}
      search={search} setSearch={setSearch}
      onSelect={openNote} onNew={newNote}
      topicLabel={topicLabel} sidebarOpen={sidebarOpen}
      topics={topics} selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic}
      showReminders={showReminders} onSelectReminders={handleSelectReminders}
    />
  )

  const editor = showDashboard
    ? <DashboardPanel reminders={reminders} setReminders={setReminders} allNotes={notes} />
    : showReminders
      ? <RemindersPanel reminders={reminders} setReminders={setReminders} allNotes={notes} />
      : selectedNote
        ? <NoteEditor key={selectedNote.id} note={selectedNote} topics={topics}
            onUpdate={handleUpdate} onDelete={handleDelete}
            onBack={() => setMobilePane('list')}
            reminders={reminders} setReminders={setReminders} />
        : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-3)' }}>
            <span className="text-4xl">🗒️</span>
            <p className="text-sm">Seleciona ou cria uma nota</p>
            <button onClick={newNote} className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--accent-solid)' }}>
              + Nova nota
            </button>
          </div>
        )

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      <AppHeader
        actions={
          <button onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] hidden md:flex items-center"
            title={sidebarOpen ? 'Esconder temas' : 'Mostrar temas'}>
            {sidebarOpen
              ? <PanelLeftClose size={15} style={{ color: 'var(--text-3)' }} />
              : <PanelLeftOpen size={15} style={{ color: 'var(--text-3)' }} />}
          </button>
        }
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className={`${mobilePane === 'sidebar' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-52 lg:w-60 flex-shrink-0`}
            style={{ borderRight: '1px solid var(--border)' }}>
            {sidebar}
          </div>
        )}
        <div className={`${mobilePane === 'list' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-56 lg:w-72 flex-shrink-0`}
          style={{ borderRight: '1px solid var(--border)' }}>
          {list}
        </div>
        <div className={`${mobilePane === 'editor' ? 'flex' : 'hidden'} md:flex flex-col flex-1 overflow-hidden`}>
          {editor}
        </div>
      </div>
    </div>
  )
}
