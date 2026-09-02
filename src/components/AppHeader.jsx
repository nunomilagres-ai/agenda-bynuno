// AppHeader.jsx — cabeçalho partilhado pelas duas páginas da app.
//
// Existe desde que o notes.bynuno.com foi fundido aqui: antes o cabeçalho vivia
// dentro da CalendarPage, e a app de notas tinha o seu. Aqui ficam as partes
// comuns (identidade, navegação, sair); cada página passa em `actions` os
// botões que só fazem sentido nela.
import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

const TABS = [
  { to: '/',      label: 'Calendário', emoji: '🗓️' },
  { to: '/notas', label: 'Notas',      emoji: '🗒️' },
]

export default function AppHeader({ actions }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between px-5 py-3 flex-shrink-0"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-base font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>Agenda</h1>
        <nav className="flex items-center gap-1 no-print">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={({ isActive }) => isActive
                ? { background: 'var(--accent-soft)', color: 'var(--accent-ink)' }
                : { color: 'var(--text-2)' }}>
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2 no-print">
        {actions}
        {user && (
          <button onClick={logout} title="Sair" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]">
            <LogOut size={15} style={{ color: 'var(--text-3)' }} />
          </button>
        )}
      </div>
    </header>
  )
}
