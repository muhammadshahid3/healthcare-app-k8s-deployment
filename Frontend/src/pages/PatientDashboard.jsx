import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { formatRange } from '../format.js'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('doctors')
  const [message, setMessage] = useState(null)

  // ---- Doctors ----
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [openDoctorId, setOpenDoctorId] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [search, setSearch] = useState('')

  // ---- My appointments ----
  const [appointments, setAppointments] = useState([])
  const [loadingAppts, setLoadingAppts] = useState(true)

  const loadDoctors = async () => {
    try {
      setDoctors(await api('/doctors'))
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoadingDoctors(false)
    }
  }

  const loadAppointments = async () => {
    try {
      setAppointments(await api('/appointments/mine'))
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoadingAppts(false)
    }
  }

  const loadSlots = async (doctorId) => {
    setLoadingSlots(true)
    try {
      setSlots(await api(`/doctors/${doctorId}/slots`))
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    loadDoctors()
    loadAppointments()
  }, [])

  const toggleDoctor = (id) => {
    setMessage(null)
    if (openDoctorId === id) {
      setOpenDoctorId(null)
      return
    }
    setOpenDoctorId(id)
    setSlots([])
    loadSlots(id)
  }

  const book = async (slotId) => {
    setMessage(null)
    try {
      await api('/appointments', { method: 'POST', body: { slotId } })
      setMessage({ type: 'success', text: 'Appointment booked! You can see it in "My appointments".' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    // Success ho ya conflict, list refresh karo
    loadSlots(openDoctorId)
    loadDoctors()
    loadAppointments()
  }

  const cancel = async (slotId) => {
    setMessage(null)
    try {
      await api(`/appointments/${slotId}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: 'Appointment cancelled.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    loadAppointments()
    loadDoctors()
    if (openDoctorId) loadSlots(openDoctorId)
  }

  const q = search.trim().toLowerCase()
  const filtered = doctors.filter(
    (d) =>
      !q ||
      d.fullName.toLowerCase().includes(q) ||
      (d.specialization || '').toLowerCase().includes(q)
  )

  return (
    <div className="dash">
      <div className="dash-header">
        <div className="dash-welcome">
          <span className="avatar avatar-lg">{user.fullName.charAt(0).toUpperCase()}</span>
          <div>
            <h1>Hello, {user.fullName} 👋</h1>
            <p>Find a doctor and book your appointment.</p>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat">
            <b>{doctors.length}</b>
            <span>Doctors</span>
          </div>
          <div className="stat stat-blue">
            <b>{appointments.length}</b>
            <span>My appointments</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'doctors' ? 'active' : ''}`} onClick={() => setTab('doctors')}>
          🔍 Find a doctor
        </button>
        <button className={`tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
          📅 My appointments ({appointments.length})
        </button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {tab === 'doctors' && (
        <section>
          <input
            className="search"
            placeholder="Search by doctor name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loadingDoctors ? (
            <p className="muted">Loading doctors...</p>
          ) : filtered.length === 0 ? (
            <div className="card empty">
              <div className="empty-ico">🩺</div>
              <p>{doctors.length === 0 ? 'No doctors have registered yet.' : 'No doctors match your search.'}</p>
            </div>
          ) : (
            filtered.map((d) => (
              <div key={d.id} className="card doctor-card">
                <div className="doctor-head">
                  <div className="doctor-info">
                    <span className="avatar avatar-lg">{d.fullName.charAt(0).toUpperCase()}</span>
                    <div>
                      <h3>Dr. {d.fullName}</h3>
                      <div className="spec">{d.specialization}</div>
                      <div className="muted">🎓 {d.education}</div>
                      {d.about && <p className="about">{d.about}</p>}
                    </div>
                  </div>
                  <div className="doctor-action">
                    <span className={`badge ${d.availableSlots > 0 ? 'badge-free' : 'badge-none'}`}>
                      {d.availableSlots} slot{d.availableSlots === 1 ? '' : 's'} available
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => toggleDoctor(d.id)}>
                      {openDoctorId === d.id ? 'Hide slots' : 'View slots'}
                    </button>
                  </div>
                </div>

                {openDoctorId === d.id && (
                  <div className="slots-panel">
                    {loadingSlots ? (
                      <p className="muted">Loading slots...</p>
                    ) : slots.length === 0 ? (
                      <p className="muted">No free slots right now.</p>
                    ) : (
                      <ul className="list">
                        {slots.map((s) => (
                          <li key={s.id} className="list-item">
                            <span className="strong">🕒 {formatRange(s.start, s.end)}</span>
                            <button className="btn btn-secondary btn-sm" onClick={() => book(s.id)}>
                              Book
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'mine' && (
        <section className="card">
          <h2>📅 My appointments</h2>
          {loadingAppts ? (
            <p className="muted">Loading...</p>
          ) : appointments.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">📅</div>
              <p>You have no appointments yet.</p>
            </div>
          ) : (
            <ul className="list">
              {appointments.map((a) => (
                <li key={a.id} className="list-item">
                  <div className="doctor-info">
                    <span className="avatar">{a.doctorName.charAt(0).toUpperCase()}</span>
                    <div>
                      <div className="strong">Dr. {a.doctorName}</div>
                      <div className="muted">{a.specialization}</div>
                      <div>🕒 {formatRange(a.start, a.end)}</div>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => cancel(a.id)}>
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
