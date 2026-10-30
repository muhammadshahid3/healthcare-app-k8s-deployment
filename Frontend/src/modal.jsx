import { createContext, useContext, useState } from 'react'
import AuthModal from './components/AuthModal.jsx'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [state, setState] = useState(null) // { mode, role, id }

  const openAuth = (mode = 'login', role = 'Patient') =>
    setState({ mode, role, id: Date.now() })
  const closeAuth = () => setState(null)

  return (
    <ModalContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      {state && (
        <AuthModal key={state.id} initialMode={state.mode} initialRole={state.role} onClose={closeAuth} />
      )}
    </ModalContext.Provider>
  )
}

export const useModal = () => useContext(ModalContext)
