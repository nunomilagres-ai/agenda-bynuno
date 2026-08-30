// src/lib/AuthContext.jsx — Autenticação delegada ao byNuno Hub
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext({
  isLoadingAuth: true,
  user: null,
  isAuthenticated: false,
  refetchUser: () => {},
  logout: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [isLoadingAuth, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/me')
      if (res.status === 401) {
        setUser(null)
      } else if (res.ok) {
        setUser(await res.json())
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = 'https://bynuno.com/login?next=https://agenda.bynuno.com'
  }, [])

  return (
    <AuthContext.Provider value={{ isLoadingAuth, user, isAuthenticated: !!user, refetchUser: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
