import { useState, useEffect, useCallback } from 'react'
import { Shield, Users, RefreshCw, AlertCircle, ChevronDown, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAdminUsers, updateUserRole } from '../../services/platformApi'
import type { AdminUser } from '../../services/platformApi'

const ROLES = ['job_seeker', 'workforce_analyst', 'administrator']

const ROLE_COLORS: Record<string, string> = {
  administrator: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  workforce_analyst: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  job_seeker: 'text-slate-400 bg-slate-800 border-slate-700',
}

export default function AdminPanel() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isForbidden, setIsForbidden] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState('')

  const load = useCallback(() => {
    setIsLoading(true)
    setError('')
    getAdminUsers()
      .then((d) => setUsers(d.users))
      .catch((err) => {
        const status = (err as { status?: number }).status
        if (status === 403 || status === 401) {
          setIsForbidden(true)
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load users.')
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRoleChange(userId: string, role: string) {
    setUpdating(userId)
    setSaveMsg('')
    try {
      const result = await updateUserRole(userId, role)
      setUsers((prev) =>
        prev.map((u) => (u.id === result.user_id ? { ...u, role: result.role } : u)),
      )
      setSaveMsg('Role updated successfully.')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.')
    } finally {
      setUpdating(null)
    }
  }

  if (isForbidden) {
    return (
      <div className="space-y-6 text-left max-w-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield size={24} className="text-rose-400" />
            Admin Panel
          </h1>
        </div>
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-10 text-center backdrop-blur-xl space-y-4">
          <Shield size={48} className="mx-auto text-rose-500/50" />
          <div>
            <h3 className="text-lg font-bold text-white">Access Restricted</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              This panel is only available to users with the <span className="text-rose-400 font-semibold">administrator</span> role.
              Contact your platform administrator to request elevated access.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 inline-block text-xs text-slate-500 font-mono">
            Signed in as: {user?.email ?? 'unknown'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield size={24} className="text-rose-400" />
            Admin Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage user roles and platform access permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle size={13} />
              {saveMsg}
            </span>
          )}
          <button
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && users.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map((role) => {
            const count = users.filter((u) => u.role === role).length
            return (
              <div
                key={role}
                className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-5 backdrop-blur-xl"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {role.replace('_', ' ')}
                </p>
                <span className="block text-3xl font-extrabold text-white mt-1">{count}</span>
                <span className="text-xs text-slate-500">{count === 1 ? 'user' : 'users'}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 flex items-center gap-3 text-sm text-rose-400">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* User Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 backdrop-blur-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users size={40} className="mx-auto text-slate-700" />
            <p className="text-sm text-slate-500">No users found.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 px-6 py-3 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Email</span>
              <span className="col-span-4 hidden sm:block">User ID</span>
              <span className="col-span-3 sm:col-span-3">Role</span>
            </div>

            {/* Rows */}
            {users.map((u, idx) => (
              <div
                key={u.id}
                className="grid grid-cols-12 items-center px-6 py-4 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition"
              >
                <span className="col-span-1 text-sm font-bold text-slate-600">{idx + 1}</span>

                <div className="col-span-5 sm:col-span-4 space-y-0.5">
                  <span className="block text-sm font-semibold text-white truncate max-w-[180px]">
                    {u.email}
                  </span>
                </div>

                <span className="col-span-3 hidden sm:block text-[10px] font-mono text-slate-600 truncate">
                  {u.id.slice(0, 16)}…
                </span>

                <div className="col-span-6 sm:col-span-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updating === u.id}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none transition appearance-none cursor-pointer ${ROLE_COLORS[u.role] ?? ROLE_COLORS.job_seeker} disabled:opacity-50`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                  </div>
                  {updating === u.id && (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-cyan-400 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Role descriptions */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { role: 'job_seeker', label: 'Job Seeker', desc: 'Can run career analyses, view their own history, and access learning roadmaps.', color: 'border-slate-700' },
          { role: 'workforce_analyst', label: 'Workforce Analyst', desc: 'Extended access for reviewing platform-wide skill trends and taxonomy data.', color: 'border-indigo-500/30' },
          { role: 'administrator', label: 'Administrator', desc: 'Full access including user management and role assignment (this panel).', color: 'border-rose-500/30' },
        ].map(({ role, label, desc, color }) => (
          <div key={role} className={`rounded-xl border ${color} bg-slate-900/20 p-4`}>
            <span className={`inline-block rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2 ${ROLE_COLORS[role]}`}>
              {label}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
