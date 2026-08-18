import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { resetCareerAnalysesForUser } from '../../services/careerAnalyses'

export default function Settings() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  async function handleReset() {
    if (!user || !window.confirm('Clear your saved analyses and learning progress? This cannot be undone.')) return

    setIsResetting(true)
    setMessage('')
    try {
      await resetCareerAnalysesForUser(user.id)
      localStorage.removeItem('active_roadmap_status')
      localStorage.removeItem('career_analysis_draft')
      window.dispatchEvent(new Event('profile-updated'))
      window.dispatchEvent(new Event('analyses-updated'))
      window.dispatchEvent(new Event('roadmap-updated'))
      setMessage('Your saved progress and analyses have been cleared.')
    } catch (error) {
      console.error('Failed to reset user data:', error)
      setMessage(error instanceof Error ? error.message : 'Unable to clear data. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8 text-left">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your saved platform data.</p>
      </div>
      <section className="space-y-5 rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-base font-bold text-white">
          <RefreshCw size={18} className="text-cyan-400" /> Platform data
        </h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Start a fresh assessment by removing your saved career analyses and learning progress. Your account remains intact.
        </p>
        {message && <p className="text-sm font-medium text-cyan-300">{message}</p>}
        <button type="button" onClick={handleReset} disabled={isResetting} className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm font-bold text-rose-400 transition hover:bg-rose-500 hover:text-slate-950 disabled:opacity-50">
          {isResetting ? 'Clearing data…' : 'Clear saved progress'}
        </button>
      </section>
    </div>
  )
}
