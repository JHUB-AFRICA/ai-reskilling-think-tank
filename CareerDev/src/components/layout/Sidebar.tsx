import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  History as HistoryIcon,
  User,
  Settings,
  LogOut,
  BriefcaseBusiness,
  Layers,
  Bot,
  Activity,
  Shield,
  FileText,
  UserCheck,
  Users,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ApiStatusBadge from '../ui/ApiStatusBadge'

const mainItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Career Analysis', to: '/career-analysis', icon: ClipboardList },
  { label: 'AI Guidance', to: '/career-guidance', icon: Bot },
  { label: 'Skill Explorer', to: '/skill-explorer', icon: Layers },
  { label: 'Learning Roadmap', to: '/learning', icon: BookOpen },
  { label: 'Resource Library', to: '/resource-library', icon: BookOpen },
  { label: 'My Learning', to: '/my-learning', icon: GraduationCap },
  { label: 'History', to: '/history', icon: HistoryIcon },
  { label: 'Activity Feed', to: '/activity', icon: Activity },
]

const toolItems = [
  { label: 'JD Analyser', to: '/job-description', icon: FileText },
  { label: 'Resume Analyser', to: '/resume-analyser', icon: UserCheck },
  { label: 'HR Portal', to: '/hr-portal', icon: Users },
]

const bottomItems = [
  { label: 'Profile', to: '/profile', icon: User },
]


const ACTIVE_COLORS: Record<string, string> = {
  '/career-guidance':  'bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]',
  '/skill-explorer':   'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]',
  '/activity':         'bg-teal-500  text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]',
  '/admin':            'bg-rose-600  text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]',
  '/job-description':  'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]',
  '/resume-analyser':  'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]',
  '/hr-portal':        'bg-rose-600  text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]',
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) {
  const activeClass = ACTIVE_COLORS[to] ?? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group',
          isActive ? activeClass : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
        ].join(' ')
      }
    >
      <Icon size={18} className="shrink-0 transition-transform group-hover:scale-105" />
      <span>{label}</span>
    </NavLink>
  )
}

type SidebarProps = {
  isAdmin?: boolean
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Failed to sign out', err)
    }
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div className="flex flex-col flex-1 px-4 py-6 overflow-y-auto">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 px-2 mb-6">
          <span className="grid size-10 place-items-center rounded-lg bg-cyan-500 text-slate-950 font-bold glow-effect">
            <BriefcaseBusiness size={22} />
          </span>
          <div>
            <span className="block text-lg font-bold text-white tracking-wide">CareerDevAI</span>
            <span className="block text-xs font-medium text-cyan-400">AI career planner</span>
          </div>
        </NavLink>

        {/* API Status */}
        <div className="px-2 mb-5">
          <ApiStatusBadge />
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1 flex-1">
          <p className="px-4 mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">
            Navigation
          </p>
          {mainItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

          {/* Tools group */}
          <p className="px-4 mt-6 mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">
            Tools
          </p>
          {toolItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

          {/* Account group */}
          <p className="px-4 mt-6 mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">
            Account
          </p>
          {bottomItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          {/* Settings — plain anchor so hash-scroll works */}
          <a
            href="/settings"
            className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
          >
            <Settings size={18} className="shrink-0 transition-transform group-hover:scale-105" />
            <span>Settings</span>
          </a>

          {/* Admin — shown only for administrators */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                [
                  'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                    : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-100',
                ].join(' ')
              }
            >
              <Shield size={18} className="shrink-0 transition-transform group-hover:scale-105" />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
