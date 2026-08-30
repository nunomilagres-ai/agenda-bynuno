import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import CalendarPage from '@/pages/CalendarPage'

// ─── Spinner de loading ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <span className="text-sm" style={{ color: 'var(--text-3)' }}>A carregar…</span>
      </div>
    </div>
  )
}

// ─── Página de login (redireciona para bynuno.com) ────────────────────────────
function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl">🗓️</span>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Agenda</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>O teu calendário, com cores por localização.</p>
      </div>
      <a
        href="https://bynuno.com/login?redirect=https://agenda.bynuno.com"
        className="flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--accent-solid)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#fff"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#fff" fillOpacity=".8"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" fillOpacity=".6"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" fillOpacity=".4"/>
        </svg>
        Entrar com Google via byNuno
      </a>
      <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
        A autenticação é gerida pelo byNuno Hub
      </p>
    </div>
  )
}

// ─── Rota protegida ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isLoadingAuth, isAuthenticated } = useAuth()

  if (isLoadingAuth) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// ─── App interno ──────────────────────────────────────────────────────────────
function AppInner() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster richColors position="top-right" />
    </Router>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
