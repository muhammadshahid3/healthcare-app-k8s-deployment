import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { formatRange } from '../format.js'

export default function DoctorDashboard() {
  const { user, updateUser } = useAuth()

  // ---- Profile ----
  const [profile, setProfile] = useState({
    fullName: user.fullName,
    education: user.education || '',
    specialization: user.specialization || '',
    about: user.about || '',
  })
  const [profileMsg, setProfileMsg] = useState(null)

  const saveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    try {
      const updated = await api('/doctors/me', { method: 'PUT', body: profile })
      updateUser(updated)
      setProfileMsg({ type: 'success', text: 'Profile saved.' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message })
    }
  }

  // ---- Slots ----
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [slotForm, setSlotForm] = useState({ start: '', duration: 30 })
  const [slotMsg, setSlotMsg] = useState(null)

  const loadSlots = async () => {
    try {
      setSlots(await api('/slots/mine'))
    } catch (err) {
      setSlotMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
  }, [])

  const addSlot = async (e) => {
    e.preventDefault()
    setSlotMsg(null)
    const start = new Date(slotForm.start)
    const end = new Date(start.getTime() + Number(slotForm.duration) * 60000)
    try {
      await api('/slots', {
        method: 'POST',
        body: { start: start.toISOString(), end: end.toISOString() },
      })
      setSlotMsg({ type: 'success', text: 'Slot added.' })
      loadSlots()
    } catch (err) {
      setSlotMsg({ type: 'error', text: err.message })
    }
  }

  const removeSlot = async (id) => {
    setSlotMsg(null)
    try {
      await api(`/slots/${id}`, { method: 'DELETE' })
      loadSlots()
    } catch (err) {
      setSlotMsg({ type: 'error', text: err.message })
    }
  }

  const setP = (key) => (e) => setProfile({ ...profile, [key]: e.target.value })

  const booked = slots.filter((s) => s.isBooked).length
  const free = slots.length - booked

  return (
    <div className="dash">
      <div className="dash-header">
        <div className="dash-welcome">
          <span className="avatar avatar-lg">{user.fullName.charAt(0).toUpperCase()}</span>
          <div>
            <h1>Welcome, Dr. {user.fullName}</h1>
            <p>{user.specialization || 'Doctor'} · manage your profile and booking slots</p>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat">
            <b>{slots.length}</b>
            <span>Total slots</span>
          </div>
          <div className="stat stat-green">
            <b>{free}</b>
            <span>Available</span>
          </div>
          <div className="stat stat-blue">
            <b>{booked}</b>
            <span>Booked</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <section className="card">
          <h2>👤 My profile</h2>
          <form onSubmit={saveProfile}>
            <label>
              Full name
              <input value={profile.fullName} onChange={setP('fullName')} required maxLength={100} />
            </label>
            <label>
              Education
              <input value={profile.education} onChange={setP('education')} required maxLength={300} />
            </label>
            <label>
              Specialization
              <input value={profile.specialization} onChange={setP('specialization')} required maxLength={150} />
            </label>
            <label>
              About
              <textarea value={profile.about} onChange={setP('about')} rows={4} maxLength={1000} />
            </label>
            {profileMsg && <div className={`alert alert-${profileMsg.type}`}>{profileMsg.text}</div>}
            <button className="btn btn-primary">Save profile</button>
          </form>
        </section>

        <section className="card">
          <h2>🗓️ My booking slots</h2>

          <form className="slot-form" onSubmit={addSlot}>
            <label>
              Start date & time
              <input
                type="datetime-local"
                value={slotForm.start}
                onChange={(e) => setSlotForm({ ...slotForm, start: e.target.value })}
                required
              />
            </label>
            <label>
              Duration
              <select value={slotForm.duration} onChange={(e) => setSlotForm({ ...slotForm, duration: e.target.value })}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </label>
            <button className="btn btn-primary">+ Add slot</button>
          </form>

          {slotMsg && <div className={`alert alert-${slotMsg.type}`}>{slotMsg.text}</div>}

          {loading ? (
            <p className="muted">Loading...</p>
          ) : slots.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">🗓️</div>
              <p>No slots yet. Add your first slot above.</p>
            </div>
          ) : (
            <ul className="list">
              {slots.map((s) => (
                <li key={s.id} className="list-item">
                  <div>
                    <div className="strong">{formatRange(s.start, s.end)}</div>
                    {s.isBooked ? (
                      <span className="badge badge-booked">Booked by {s.patientName}</span>
                    ) : (
                      <span className="badge badge-free">Available</span>
                    )}
                  </div>
                  {!s.isBooked && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeSlot(s.id)}>
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
