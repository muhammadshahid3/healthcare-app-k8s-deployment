import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'

export default function AuthModal({ initialMode, initialRole, onClose }) {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'
  const [role, setRole] = useState(initialRole) // 'Doctor' | 'Patient'
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    education: '',
    specialization: '',
    about: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const isSignup = mode === 'signup'
  const isDoctor = role === 'Doctor'

  // Esc se band ho, aur piche page scroll na ho
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const switchMode = (m) => {
    setMode(m)
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = isSignup ? { ...form, role } : { email: form.email, password: form.password }
      const data = await api(isSignup ? '/auth/signup' : '/auth/login', { method: 'POST', body })
      login(data)
      onClose()
      navigate(data.user.role === 'Doctor' ? '/doctor' : '/patient', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-head">
          <div className="modal-logo">+</div>
          <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p>{isSignup ? 'Join MediBook in less than a minute.' : 'Login to manage your appointments.'}</p>
        </div>

        {isSignup && (
          <div className="segmented">
            <button type="button" className={role === 'Patient' ? 'active' : ''} onClick={() => setRole('Patient')}>
              🧑 I'm a Patient
            </button>
            <button type="button" className={role === 'Doctor' ? 'active' : ''} onClick={() => setRole('Doctor')}>
              🩺 I'm a Doctor
            </button>
          </div>
        )}

        <form onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}

          {isSignup && (
            <label>
              Full name
              <input value={form.fullName} onChange={set('fullName')} placeholder="Your full name" required maxLength={100} />
            </label>
          )}

          <label>
            Email
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </label>

          <label>
            Password
            <div className="pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                required
                minLength={isSignup ? 6 : undefined}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {isSignup && isDoctor && (
            <>
              <label>
                Education
                <input
                  value={form.education}
                  onChange={set('education')}
                  placeholder="e.g. MBBS, FCPS (Cardiology)"
                  required
                  maxLength={300}
                />
              </label>
              <label>
                Specialization
                <input
                  value={form.specialization}
                  onChange={set('specialization')}
                  placeholder="e.g. Cardiologist"
                  required
                  maxLength={150}
                />
              </label>
              <label>
                About you <span className="optional">(optional)</span>
                <textarea value={form.about} onChange={set('about')} rows={3} maxLength={1000} placeholder="Experience, clinic, languages..." />
              </label>
            </>
          )}

          <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? `Sign up as ${role}` : 'Login'}
          </button>
        </form>

        <p className="modal-switch">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Login
              </button>
            </>
          ) : (
            <>
              New to MediBook?{' '}
              <button type="button" onClick={() => switchMode('signup')}>
                Create an account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
