import { useEffect, useState } from 'react'
import { ExternalLink, GraduationCap } from 'lucide-react'
import { listMyLearningItems, updateLearningItem } from '../../services/learning'
import type { UserLearningItem } from '../../types/database'

export default function MyLearning() {
  const [items, setItems] = useState<UserLearningItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function load() { try { setLoading(true); setItems((await listMyLearningItems()).items) } catch (err: any) { setError(err?.message ?? 'Could not load your learning items.') } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  async function update(item: UserLearningItem, status: UserLearningItem['status']) { await updateLearningItem(item.resource_id, { status, progress_percent: status === 'completed' ? 100 : item.progress_percent }); load() }
  if (loading) return <p className="text-slate-500">Loading your learning…</p>
  return <div className="max-w-5xl space-y-7"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-400">My learning</p><h1 className="mt-1 text-3xl font-extrabold text-white">Turn your roadmap into progress</h1></div>{error && <p className="text-rose-300">{error}</p>}{items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">Save a verified course or learning path from the Resource Library to begin tracking it.</div> : <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-800 bg-[#0d1321]/70 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex gap-2"><GraduationCap size={18} className="text-cyan-400"/><h2 className="font-bold text-white">{item.title}</h2></div><p className="mt-2 text-xs text-slate-500">{item.provider} · {item.status.replace('_', ' ')} · {item.completion_source.replace('_', ' ')}</p></div><a href={item.url} target="_blank" rel="noreferrer" className="text-cyan-400"><ExternalLink size={18}/></a></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950"><div className="h-full bg-cyan-500" style={{width: `${item.progress_percent}%`}}/></div><div className="mt-4 flex gap-2">{item.status !== 'in_progress' && item.status !== 'completed' && <button onClick={() => update(item, 'in_progress')} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950">Start</button>}{item.status !== 'completed' && <button onClick={() => update(item, 'completed')} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950">Mark completed</button>}</div></article>)}</div>}</div>
}
