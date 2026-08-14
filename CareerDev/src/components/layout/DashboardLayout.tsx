import { useState, useEffect } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  BriefcaseBusiness,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  History,
  Settings,
  Layers,
  Bot,
  Activity,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import ApiStatusBadge from '../ui/ApiStatusBadge'
import { getCurrentUserProfile } from '../../services/profiles'
import type { Profile } from '../../types/database'

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      getCurrentUserProfile(user.id)
        .then((data) => {
          if (data) setProfile(data)
        })
        .catch((err) => console.error('Error fetching profile:', err))
    }
  }, [user])

  // Watch for profile update events
  useEffect(() => {
    function handleProfileUpdate() {
      if (user) {
        getCurrentUserProfile(user.id)
          .then((data) => {
            if (data) setProfile(data)
          })
          .catch((err) => console.error('Error updating profile layout:', err))
      }
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-updated', handleProfileUpdate)
  }, [user])

  const isAdmin = profile?.role === 'administrator'
  const mobileNavItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Career Analysis', to: '/career-analysis', icon: ClipboardList },
    { label: 'AI Guidance', to: '/career-guidance', icon: Bot },
    { label: 'Skill Explorer', to: '/skill-explorer', icon: Layers },
    { label: 'Learning', to: '/learning', icon: BookOpen },
    { label: 'History', to: '/history', icon: History },
    { label: 'Activity', to: '/activity', icon: Activity },
    { label: 'Profile', to: '/profile', icon: UserIcon },
    ...(isAdmin ? [{ label: 'Admin Panel', to: '/admin', icon: Shield }] : []),
  ]
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-cyan-500 text-slate-950 font-bold glow-effect">
                <BriefcaseBusiness size={20} />
              </span>
              <span className="text-base font-bold text-white tracking-wide">CareerDevAI</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* API Status */}
          <div className="mb-4">
            <ApiStatusBadge />
          </div>

          <nav className="space-y-1" onClick={() => setIsMobileMenuOpen(false)}>
            {mobileNavItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            ))}
            {/* Settings — plain anchor so hash-scroll works */}
            <a
              href="/profile#settings"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings size={17} />
              <span>Settings</span>
            </a>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition mt-4"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Menu size={22} />
            </button>

            <div className="hidden sm:block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Career Platform
              </span>
              <h1 className="text-sm font-bold text-slate-300">Plan, learn, and track your next move</h1>
            </div>
          </div>

          {/* Right side: API badge + user */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <ApiStatusBadge />
            </div>

            <Link to="/profile" className="flex items-center gap-3 hover:opacity-85 transition">
              <div className="hidden md:block text-right">
                <span className="block text-sm font-semibold text-white leading-tight">{displayName}</span>
                <span className="block text-xs text-slate-500">{profile?.target_career || 'Career Seeker'}</span>
              </div>

              <div className="size-9 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                {profile?.full_name ? (
                  <span>{profile.full_name.charAt(0).toUpperCase()}</span>
                ) : (
                  <UserIcon size={16} />
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
