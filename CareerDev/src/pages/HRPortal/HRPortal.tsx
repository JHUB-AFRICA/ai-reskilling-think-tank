import { useState, useEffect } from 'react'
import { Shield, Users, BarChart2, BookOpen, Plus, X, Save, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAdminUsers, getOrgSkillFrameworks, saveOrgSkillFrameworks, listProviderConnections, connectProvider } from '../../services/platformApi'
import type { AdminUser, OrgSkillFrameworkEntry, ProviderConnection } from '../../services/platformApi'
import { listCareerAnalyses } from '../../services/careerAnalyses'

type Tab = 'framework' | 'team' | 'integrations' | 'individual'

type RoleFramework = OrgSkillFrameworkEntry

type TeamMember = AdminUser & {
  readiness: number | null
  skills_count: number
  target_career: string | null
}

export default function HRPortal() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('framework')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [frameworks, setFrameworks] = useState<RoleFramework[]>([])
  const [skillInput, setSkillInput] = useState<Record<number, string>>({})
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [connections, setConnections] = useState<ProviderConnection[]>([])
  const [providerForm, setProviderForm] = useState({ provider_name: '', provider_account: '', access_token: '' })
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    if (activeTab === 'team') loadTeam()
    if (activeTab === 'framework') loadFrameworks()
    if (activeTab === 'integrations') loadConnections()
  }, [activeTab, user])

  if (!user) return null

  async function loadTeam() {
    setIsLoadingTeam(true)
    setError('')
    try {
      const { users } = await getAdminUsers()
      const withReadiness = await Promise.all(
        users.map(async (u): Promise<TeamMember> => {
          try {
            const analyses = await listCareerAnalyses(u.id)
            const latest = analyses[0] ?? null
            return {
              ...u,
              readiness: latest?.readiness_score ?? null,
              skills_count: latest?.current_skills?.length ?? 0,
              target_career: latest?.target_career ?? null,
            }
          } catch {
            return { ...u, readiness: null, skills_count: 0, target_career: null }
          }
        })
      )
      setTeamMembers(withReadiness)
    } catch (err: any) {
      setError(err?.message ?? 'Could not load team. You may need admin privileges.')
    } finally {
      setIsLoadingTeam(false)
    }
  }

  async function loadFrameworks() {
    setError('')
    try {
      const { frameworks: loaded } = await getOrgSkillFrameworks()
      setFrameworks(loaded.length > 0 ? loaded : [{ role_name: '', required_skills: [] }])
    } catch (err: any) {
      setError(err?.message ?? 'Could not load skill frameworks.')
      setFrameworks([{ role_name: '', required_skills: [] }])
    }
  }

  async function loadConnections() {
    setError('')
    try {
      const { connections: loaded } = await listProviderConnections()
      setConnections(loaded)
    } catch (err: any) {
      setError(err?.message ?? 'Could not load provider connections.')
      setConnections([])
    }
  }

  async function addProviderConnection() {
    setIsConnecting(true)
    setError('')
    try {
      await connectProvider(providerForm)
      setProviderForm({ provider_name: '', provider_account: '', access_token: '' })
      await loadConnections()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect provider.')
    } finally {
      setIsConnecting(false)
    }
  }

  function addFramework() {
    setFrameworks([...frameworks, { role_name: '', required_skills: [] }])
  }

  function removeFramework(idx: number) {
    setFrameworks(frameworks.filter((_, i) => i !== idx))
  }

  function updateRoleName(idx: number, name: string) {
    setFrameworks(frameworks.map((f, i) => i === idx ? { ...f, role_name: name } : f))
  }

  function addSkillToFramework(idx: number) {
    const val = (skillInput[idx] ?? '').trim()
    if (!val) return
    setFrameworks(frameworks.map((f, i) =>
      i === idx && !f.required_skills.includes(val)
        ? { ...f, required_skills: [...f.required_skills, val] }
        : f
    ))
    setSkillInput({ ...skillInput, [idx]: '' })
  }

  function removeSkillFromFramework(fIdx: number, skill: string) {
    setFrameworks(frameworks.map((f, i) =>
      i === fIdx ? { ...f, required_skills: f.required_skills.filter((s) => s !== skill) } : f
    ))
  }

  async function saveFrameworks() {
    setIsSaving(true)
    setSaveSuccess(false)
    setError('')
    try {
      await saveOrgSkillFrameworks(frameworks)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save frameworks.')
    } finally {
      setIsSaving(false)
    }
  }

  function exportTeamCSV() {
    const rows = [
      ['Email', 'Role', 'Target Career', 'Skills Count', 'Readiness %'],
      ...teamMembers.map((m) => [m.email, m.role, m.target_career ?? '', m.skills_count, m.readiness ?? 'N/A']),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'team-readiness.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'framework', label: 'Skill Framework', icon: BookOpen },
    { id: 'team', label: 'Team Overview', icon: Users },
    { id: 'integrations', label: 'Provider Integrations', icon: Shield },
    { id: 'individual', label: 'Individual Plans', icon: BarChart2 },
  ]

  return (
    <div className="space-y-8 text-left max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield size={24} className="text-rose-400" />
            HR Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define your company's skill standards, review team readiness, and generate individual development plans.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-2">
          <Shield size={14} className="text-rose-400" />
          <span className="text-xs font-bold text-rose-400">HR / Admin Access</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold relative transition ${
              activeTab === id ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={15} />
            {label}
            {activeTab === id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-rose-500 rounded-full" />}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Tab: Skill Framework */}
      {activeTab === 'framework' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Define the required skills for each role in your organisation. These will be used to generate targeted learning plans for your employees.
            </p>
            <button
              onClick={addFramework}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition"
            >
              <Plus size={13} />
              Add Role
            </button>
          </div>

          {frameworks.map((fw, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Role name (e.g. Senior Data Analyst)"
                  value={fw.role_name}
                  onChange={(e) => updateRoleName(idx, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-rose-500/50 transition"
                />
                <button
                  onClick={() => removeFramework(idx)}
                  className="rounded-xl p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {fw.required_skills.length === 0 ? (
                  <span className="text-xs text-slate-600 italic self-center">No required skills defined yet</span>
                ) : (
                  fw.required_skills.map((sk) => (
                    <span key={sk} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300">
                      {sk}
                      <button onClick={() => removeSkillFromFramework(idx, sk)} className="hover:text-white">
                        <X size={11} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Add required skill…"
                  value={skillInput[idx] ?? ''}
                  onChange={(e) => setSkillInput({ ...skillInput, [idx]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillToFramework(idx))}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-500/40 transition"
                />
                <button
                  onClick={() => addSkillToFramework(idx)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={saveFrameworks}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-50 shadow-[0_0_15px_rgba(225,29,72,0.2)]"
          >
            {isSaving ? (
              <><Loader2 size={15} className="animate-spin" />Saving…</>
            ) : saveSuccess ? (
              <><CheckCircle2 size={15} />Saved!</>
            ) : (
              <><Save size={15} />Save Framework</>
            )}
          </button>
        </div>
      )}

      {/* Tab: Team Overview */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</p>
            <button
              onClick={exportTeamCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>

          {isLoadingTeam ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 backdrop-blur-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Member</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Target Career</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Skills</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-xs italic">
                        No team members found. Admin access required to view all users.
                      </td>
                    </tr>
                  ) : (
                    teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/20 transition">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-white text-sm">{m.email}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 capitalize">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          {m.target_career ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          {m.skills_count > 0 ? `${m.skills_count} skills` : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {m.readiness !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${m.readiness >= 70 ? 'bg-emerald-500' : m.readiness >= 50 ? 'bg-cyan-500' : 'bg-amber-500'}`}
                                  style={{ width: `${m.readiness}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${m.readiness >= 70 ? 'text-emerald-400' : m.readiness >= 50 ? 'text-cyan-400' : 'text-amber-400'}`}>
                                {m.readiness}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">No analysis</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Individual Plans */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Provider Integrations</h2>
              <p className="text-sm text-slate-400">
                Connect external learning providers and keep progress in sync for your team.
              </p>
            </div>
            <button
              onClick={loadConnections}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              Refresh
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Connect a provider</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                value={providerForm.provider_name}
                onChange={(e) => setProviderForm({ ...providerForm, provider_name: e.target.value })}
                placeholder="Provider name"
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
              />
              <input
                value={providerForm.provider_account}
                onChange={(e) => setProviderForm({ ...providerForm, provider_account: e.target.value })}
                placeholder="Provider account"
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
              />
              <input
                value={providerForm.access_token}
                onChange={(e) => setProviderForm({ ...providerForm, access_token: e.target.value })}
                placeholder="Access token"
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <button
              onClick={addProviderConnection}
              disabled={isConnecting || !providerForm.provider_name}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50"
            >
              {isConnecting ? 'Connecting…' : 'Connect Provider'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Connected providers</h3>
            {connections.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No provider connections configured yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {connections.map((connection) => (
                  <div key={connection.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{connection.provider_name}</p>
                        <p className="text-xs text-slate-500">{connection.provider_account ?? 'No account specified'}</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {connection.last_sync_at ? `Synced ${new Date(connection.last_sync_at).toLocaleDateString()}` : 'Not yet synced'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-10 text-center backdrop-blur-xl space-y-4">
          <BarChart2 size={36} className="mx-auto text-slate-600" />
          <h3 className="text-lg font-bold text-white">Individual Development Plans</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Select a team member from the Team Overview tab to generate a personalised roadmap based on your company's skill framework.
          </p>
          <button
            onClick={() => setActiveTab('team')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-300 transition"
          >
            <Users size={14} />
            View Team
          </button>
        </div>
      )}
    </div>
  )
}
