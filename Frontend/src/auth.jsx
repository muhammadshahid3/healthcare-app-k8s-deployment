import { createContext, useContext, useState } from 'react'
import { STORAGE_KEY } from './api.js'

const AuthContext = createContext(null)

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(load)

  const login = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setAuth(data)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  // Doctor profile update ke baad stored user refresh karne ke liye
  const updateUser = (user) => {
    const next = { ...auth, user }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setAuth(next)
  }

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
