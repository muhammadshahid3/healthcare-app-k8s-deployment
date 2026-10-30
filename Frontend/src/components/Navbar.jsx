import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { useModal } from '../modal.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { openAuth } = useModal()
  const { pathname } = useLocation()
  const onLanding = pathname === '/'

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">+</span>
          <span>MediBook shahid arain</span>
        </Link>

        {onLanding && !user && (
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#join">Join</a>
          </nav>
        )}

        <div className="nav-right">
          {user ? (
            <>
              <Link to={user.role === 'Doctor' ? '/doctor' : '/patient'} className="nav-user">
                <span className="avatar avatar-sm">{user.fullName.charAt(0).toUpperCase()}</span>
                <span className="nav-user-name">
                  {user.role === 'Doctor' ? 'Dr. ' : ''}
                  {user.fullName}
                </span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => openAuth('login')}>
                Login
              </button>
              <button className="btn btn-primary" onClick={() => openAuth('signup', 'Patient')}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
