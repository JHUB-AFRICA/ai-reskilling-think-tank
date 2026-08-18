import { Route, Routes } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import DashboardLayout from '../components/layout/DashboardLayout'
import AdminPanel from '../pages/AdminPanel/AdminPanel'
import CareerAnalysis from '../pages/CareerAnalysis/CareerAnalysis'
import CareerGuidance from '../pages/CareerGuidance/CareerGuidance'
import Dashboard from '../pages/Dashboard/Dashboard'
import History from '../pages/History/History'
import Home from '../pages/Home/Home'
import Learning from '../pages/Learning/Learning'
import Login from '../pages/Login/Login'
import LRSFeed from '../pages/LRSFeed/LRSFeed'
import NotFound from '../pages/NotFound'
import Profile from '../pages/Profile/Profile'
import Settings from '../pages/Settings/Settings'
import Register from '../pages/Register/Register'
import AuthCallback from '../pages/AuthCallback/AuthCallback'
import JobDescription from '../pages/JobDescription/JobDescription'
import ResumeAnalyser from '../pages/ResumeAnalyser/ResumeAnalyser'
import HRPortal from '../pages/HRPortal/HRPortal'
import SkillExplorer from '../pages/SkillExplorer/SkillExplorer'
import ResourceLibrary from '../pages/ResourceLibrary/ResourceLibrary'
import MyLearning from '../pages/MyLearning/MyLearning'
import ProtectedRoute from './ProtectedRoute'

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with Top Nav and Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      {/* Protected Routes with Sidebar Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/career-analysis" element={<CareerAnalysis />} />
          <Route path="/job-description" element={<JobDescription />} />
          <Route path="/resume-analyser" element={<ResumeAnalyser />} />
          <Route path="/skill-explorer" element={<SkillExplorer />} />
          <Route path="/career-guidance" element={<CareerGuidance />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/resource-library" element={<ResourceLibrary />} />
          <Route path="/my-learning" element={<MyLearning />} />
          <Route path="/history" element={<History />} />
          <Route path="/activity" element={<LRSFeed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/hr-portal" element={<HRPortal />} />
        </Route>
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
