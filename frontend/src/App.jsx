import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

// Authentication
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Student
import Dashboard from './pages/student/Dashboard'
import CareerAnalysis from './pages/student/CareerAnalysis'
import CareerRecommendations from './pages/student/CareerRecommendations'
import PlacementOpportunities from './pages/student/PlacementOpportunities'
import JobMatchDetails from './pages/student/JobMatchDetails'
import ApplyJob from './pages/student/ApplyJob'
import ApplicationTracking from './pages/student/ApplicationTracking'
import SkillGap from './pages/student/SkillGap'
import Roadmap from './pages/student/Roadmap'

// Admin
import AdminApplications from './pages/admin/AdminApplications'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Student */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/career-analysis"
          element={<CareerAnalysis />}
        />
        <Route
          path="/career-recommendations"
          element={<CareerRecommendations />}
        />
        <Route
          path="/placement-opportunities"
          element={<PlacementOpportunities />}
        />
        <Route
          path="/job-match/:jobId"
          element={<JobMatchDetails />}
        />
        <Route
          path="/apply-job/:jobId"
          element={<ApplyJob />}
        />
        <Route
          path="/application-tracking"
          element={<ApplicationTracking />}
        />
        <Route path="/skill-gap" element={<SkillGap />} />
        <Route path="/roadmap" element={<Roadmap />} />

        {/* Admin */}
        <Route
          path="/admin/applications"
          element={<AdminApplications />}
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App