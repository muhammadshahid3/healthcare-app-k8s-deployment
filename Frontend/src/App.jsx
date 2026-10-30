import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Navbar from './components/Navbar.jsx'
import Landing from './pages/Landing.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'

function Protected({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role !== role) return <Navigate to={user.role === 'Doctor' ? '/doctor' : '/patient'} replace />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/doctor"
          element={
            <Protected role="Doctor">
              <DoctorDashboard />
            </Protected>
          }
        />
        <Route
          path="/patient"
          element={
            <Protected role="Patient">
              <PatientDashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
