import { useState, useEffect } from 'react'
import { User, Shield, RefreshCw, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getCurrentUserProfile, upsertProfile } from '../../services/profiles'
import { resetCareerAnalysesForUser } from '../../services/careerAnalyses'

export default function ProfilePage() {
  const { user, isConfigured } = useAuth()
  
  // Form states
  const [fullName, setFullName] = useState('')
  const [targetCareer, setTargetCareer] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Junior')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [resetMessage, setResetMessage] = useState('')

  useEffect(() => {
    if (user) {
      setIsLoading(true)
      getCurrentUserProfile(user.id)
        .then((data) => {
          if (data) {
            setFullName(data.full_name || '')
            setTargetCareer(data.target_career || '')
            setExperienceLevel(data.experience_level || 'Junior')
          }
        })
        .catch((err) => console.error('Error fetching profile:', err))
        .finally(() => setIsLoading(false))
    }
  }, [user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      await upsertProfile({
        id: user.id,
        full_name: fullName,
        target_career: targetCareer,
        experience_level: experienceLevel,
      })
      setSaveStatus('success')
      
      // Dispatch event to update the parent layout header
      window.dispatchEvent(new Event('profile-updated'))
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleResetData() {
    if (!confirm('Are you sure you want to clear your learning progress and analysis history? This cannot be undone.')) {
      return
    }

    try {
      setResetMessage('Resetting data...')
      
      if (user) {
        await resetCareerAnalysesForUser(user.id)
      }
      
      // Clear LocalStorage fallbacks
      localStorage.removeItem('active_roadmap_status')
      
      setResetMessage('All progress and analyses have been cleared.')
      
      // Dispatch layout reload events
      window.dispatchEvent(new Event('profile-updated'))
      window.dispatchEvent(new Event('analyses-updated'))
      window.dispatchEvent(new Event('roadmap-updated'))
      
      setTimeout(() => setResetMessage(''), 4000)
    } catch (err) {
      console.error('Failed to reset history:', err)
      setResetMessage('Failed to clear data.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 text-left max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Profile & Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your career focus, education details, and account data.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Side: Profile Details form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-6">
            <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <User size={18} className="text-cyan-400" />
              Career Profile
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Joel Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-855 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition duration-205"
                >
                  <option value="Junior">Junior (0-2 years)</option>
                  <option value="Mid">Mid-Level (2-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Target Career Role</label>
                <input
                  type="text"
                  placeholder="e.g. AI Engineer, Frontend Developer, Product Manager"
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition duration-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                {saveStatus === 'success' && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle size={14} /> Profile updated successfully!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-xs text-rose-400 font-semibold">Failed to update profile.</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Settings Section */}
          <div id="settings" className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-5">
            <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <RefreshCw size={18} className="text-cyan-400" />
              Platform Data Settings
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you wish to recalculate your skill gaps, change your path, or run a new AI career assessment, you can clear all previous analyses and start over.
            </p>

            <div className="flex items-center justify-between pt-2">
              {resetMessage ? (
                <span className="text-xs font-semibold text-cyan-400">{resetMessage}</span>
              ) : (
                <span className="text-xs text-slate-500">This action permanently deletes all history.</span>
              )}
              <button
                onClick={handleResetData}
                className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-slate-950 transition duration-300 shadow-[0_0_15px_rgba(244,63,94,0.05)]"
              >
                Clear All Progress
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Account Connection and System Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-6">
            <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Shield size={18} className="text-cyan-400" />
              Account Connection
            </h3>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-850 bg-slate-950 p-4">
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Database Connection</span>
                <span className="block mt-1 text-sm font-bold text-emerald-400">
                  {isConfigured ? 'Connected to Supabase' : 'Offline Mode (Local)'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-950 p-4">
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Signed In As</span>
                <span className="block mt-1 text-sm font-semibold text-slate-300 truncate">
                  {user?.email ?? 'Guest / Local Session'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-950 p-4">
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Session Token Status</span>
                <span className="block mt-1 text-xs text-slate-400 font-mono truncate">
                  {user ? `UID: ${user.id.slice(0, 15)}...` : 'No active session token'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
