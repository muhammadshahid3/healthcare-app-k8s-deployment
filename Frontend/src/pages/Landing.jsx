import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { useModal } from '../modal.jsx'

const features = [
  { icon: '🩺', title: 'Verified doctors', text: 'Browse doctors with their education and specialization before you book.' },
  { icon: '🗓️', title: 'Real-time slots', text: 'Only free slots are shown. Once booked, a slot disappears for everyone else.' },
  { icon: '⚡', title: 'Book in seconds', text: 'Pick a doctor, pick a time, tap Book. No phone calls, no waiting.' },
  { icon: '🔒', title: 'Secure accounts', text: 'Passwords are hashed and every request is protected with a login token.' },
  { icon: '🧑‍⚕️', title: 'Built for doctors', text: 'Create your own slots, see who booked, and keep your schedule organised.' },
  { icon: '📱', title: 'Works everywhere', text: 'Clean design that looks great on your phone, tablet and computer.' },
]

const patientSteps = [
  { n: 1, title: 'Create an account', text: 'Sign up as a patient with your email.' },
  { n: 2, title: 'Choose a doctor', text: 'Check their specialization and education.' },
  { n: 3, title: 'Book a slot', text: 'Pick a free time and your appointment is confirmed.' },
]

const doctorSteps = [
  { n: 1, title: 'Sign up as a doctor', text: 'Add your education and specialization.' },
  { n: 2, title: 'Create your slots', text: 'Choose date, time and duration.' },
  { n: 3, title: 'Get booked', text: 'Patients book and you see them on your dashboard.' },
]

export default function Landing() {
  const { user } = useAuth()
  const { openAuth } = useModal()

  return (
    <div className="landing">
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="hero-text">
            <span className="pill">✨ Simple online doctor booking</span>
            <h1>
              Your health, <span className="grad">one booking</span> away.
            </h1>
            <p className="hero-sub">
              MediBook connects patients with doctors. Doctors publish their available time slots and patients book the
              one that suits them — quick, simple and secure.
            </p>

            {user ? (
              <div className="hero-cta">
                <Link className="btn btn-primary btn-lg" to={user.role === 'Doctor' ? '/doctor' : '/patient'}>
                  Go to my dashboard →
                </Link>
              </div>
            ) : (
              <div className="hero-cta">
                <button className="btn btn-primary btn-lg" onClick={() => openAuth('signup', 'Patient')}>
                  🧑 I'm a Patient
                </button>
                <button className="btn btn-white btn-lg" onClick={() => openAuth('signup', 'Doctor')}>
                  🩺 I'm a Doctor
                </button>
              </div>
            )}

            <div className="hero-stats">
              <div>
                <b>24/7</b>
                <span>Online booking</span>
              </div>
              <div>
                <b>30 sec</b>
                <span>Average booking</span>
              </div>
              <div>
                <b>100%</b>
                <span>Free to use</span>
              </div>
            </div>
          </div>

          {/* Floating mock cards */}
          <div className="hero-visual">
            <div className="mock mock-main">
              <div className="mock-head">
                <span className="avatar avatar-lg">A</span>
                <div>
                  <b>Dr. Ayesha Khan</b>
                  <small>Cardiologist · MBBS, FCPS</small>
                </div>
              </div>
              <div className="mock-slots">
                <span className="chip">10:00 AM</span>
                <span className="chip chip-active">10:30 AM</span>
                <span className="chip">11:00 AM</span>
                <span className="chip chip-off">11:30 AM</span>
              </div>
              <div className="mock-btn">Book appointment</div>
            </div>

            <div className="mock mock-float mock-a">
              <span className="mock-ico">✅</span>
              <div>
                <b>Appointment booked</b>
                <small>Tomorrow, 10:30 AM</small>
              </div>
            </div>

            <div className="mock mock-float mock-b">
              <span className="mock-ico">🗓️</span>
              <div>
                <b>12 free slots</b>
                <small>This week</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="section">
        <div className="section-inner">
          <div className="section-head">
            <span className="eyebrow">Features</span>
            <h2>Everything you need, nothing you don't</h2>
            <p>A clean and easy way for doctors and patients to meet.</p>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <div key={f.title} className="feature">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="section section-alt">
        <div className="section-inner">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Three simple steps</h2>
            <p>Whether you are a patient or a doctor, you are ready in minutes.</p>
          </div>

          <div className="steps-grid">
            <div className="steps-col">
              <h3>🧑 For patients</h3>
              {patientSteps.map((s) => (
                <div key={s.n} className="step">
                  <span className="step-n">{s.n}</span>
                  <div>
                    <b>{s.title}</b>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="steps-col">
              <h3>🩺 For doctors</h3>
              {doctorSteps.map((s) => (
                <div key={s.n} className="step">
                  <span className="step-n step-n-blue">{s.n}</span>
                  <div>
                    <b>{s.title}</b>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section id="join" className="section">
        <div className="section-inner">
          <div className="cta-band">
            <h2>Ready to get started?</h2>
            <p>Join MediBook today as a patient or as a doctor.</p>
            {user ? (
              <Link className="btn btn-white btn-lg" to={user.role === 'Doctor' ? '/doctor' : '/patient'}>
                Open my dashboard
              </Link>
            ) : (
              <div className="hero-cta center-row">
                <button className="btn btn-white btn-lg" onClick={() => openAuth('signup', 'Patient')}>
                  Sign up as Patient
                </button>
                <button className="btn btn-outline-light btn-lg" onClick={() => openAuth('signup', 'Doctor')}>
                  Sign up as Doctor
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span className="brand brand-light">
            <span className="brand-icon">+</span> MediBook
          </span>
          <span>© {new Date().getFullYear()} MediBook. Simple doctor appointments.</span>
        </div>
      </footer>
    </div>
  )
}
