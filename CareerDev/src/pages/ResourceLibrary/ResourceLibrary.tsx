import { useEffect, useState } from 'react'
import { BookOpen, ExternalLink, Search, ShieldCheck, ShieldAlert } from 'lucide-react'
import { browseLearningResources, updateLearningItem } from '../../services/learning'
import { verifyLearningResourceLink } from '../../services/platformApi'
import type { LearningResource } from '../../types/database'

const TRUST: Record<LearningResource['verification_status'], string> = {
  verified: 'Verified by platform',
  provider_synced: 'Official provider feed',
  discovery: 'Discovery link',
}

export default function ResourceLibrary() {
  const [query, setQuery] = useState('')
  const [resources, setResources] = useState<LearningResource[]>([])
  const [status, setStatus] = useState<LearningResource['verification_status'] | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [verifying, setVerifying] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await browseLearningResources({ query, verification_status: status || undefined })
      setResources(data.resources)
      setError('')
    } catch (err: any) {
      setError(err?.message ?? 'The learning catalogue is unavailable.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [status])

  async function save(resource: LearningResource) {
    setSaving(resource.id)
    try {
      await updateLearningItem(resource.id, { status: 'saved' })
    } catch (err: any) {
      setError(err?.message ?? 'Could not save this resource.')
    } finally { setSaving(null) }
  }

  async function verify(resource: LearningResource) {
    setVerifying(resource.id)
    try {
      await verifyLearningResourceLink(resource.id)
      await load()
    } catch (err: any) {
      setError(err?.message ?? 'Could not verify this resource.')
    } finally { setVerifying(null) }
  }

  return (
    <div className="max-w-6xl space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Learning catalogue</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Find credible learning materials</h1>
        <p className="mt-2 text-sm text-slate-400">Save real courses and learning paths, then track your own progress and evidence.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3">
          <Search size={16} className="text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search provider or topic" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none">
          <option value="">All trust levels</option><option value="verified">Verified</option><option value="provider_synced">Provider synced</option><option value="discovery">Discovery</option>
        </select>
        <button onClick={load} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950">Search</button>
      </div>
      {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-sm text-slate-500">Loading catalogue…</p> : resources.map((resource) => (
          <article key={resource.id} className="flex flex-col rounded-2xl border border-slate-800 bg-[#0d1321]/70 p-5">
            <div className="flex items-start justify-between gap-3"><BookOpen className="text-cyan-400" size={20} /><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">{TRUST[resource.verification_status]}</span></div>
            <h2 className="mt-4 font-bold text-white">{resource.title}</h2><p className="mt-1 text-xs text-slate-500">{resource.provider} · {resource.difficulty ?? 'All levels'} · {resource.is_free ? 'Free' : 'Paid'}</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{resource.description}</p>
            <p className="mt-3 text-[11px] text-slate-600">
              Last checked: {resource.last_verified_at ? new Date(resource.last_verified_at).toLocaleDateString() : 'Not recorded'}
              {resource.last_link_status ? ` · ${resource.last_link_status.toUpperCase()}` : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"><ExternalLink size={13} />Open</a>
              <button onClick={() => save(resource)} disabled={saving === resource.id} className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"><ShieldCheck size={13} />{saving === resource.id ? 'Saving…' : 'Save'}</button>
              <button onClick={() => verify(resource)} disabled={verifying === resource.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50">
                <ShieldAlert size={13} />{verifying === resource.id ? 'Verifying…' : 'Verify Link'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
