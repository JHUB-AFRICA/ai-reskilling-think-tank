import { useState, useEffect, useCallback } from 'react'
import { Activity, Upload, BarChart2, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { getLrsStatements } from '../../services/platformApi'
import type { LrsStatement } from '../../services/platformApi'

const VERB_LABELS: Record<string, string> = {
  'http://adlnet.gov/expapi/verbs/uploaded': 'Uploaded Resume',
  'http://adlnet.gov/expapi/verbs/analyzed': 'Ran Gap Analysis',
  'http://adlnet.gov/expapi/verbs/completed': 'Completed Activity',
  'http://adlnet.gov/expapi/verbs/attempted': 'Attempted Activity',
}

function verbLabel(stmt: LrsStatement): string {
  const verbId = stmt.verb?.id ?? ''
  return (
    VERB_LABELS[verbId] ||
    stmt.verb?.display?.['en-US'] ||
    verbId.split('/').pop() ||
    'Activity'
  )
}

function VerbIcon({ verbId }: { verbId: string }) {
  if (verbId.includes('upload')) return <Upload size={16} className="text-indigo-400" />
  if (verbId.includes('analyz')) return <BarChart2 size={16} className="text-cyan-400" />
  return <Activity size={16} className="text-purple-400" />
}

function verbColor(verbId: string): string {
  if (verbId.includes('upload')) return 'border-indigo-500/30 bg-indigo-500/5'
  if (verbId.includes('analyz')) return 'border-cyan-500/30 bg-cyan-500/5'
  return 'border-purple-500/30 bg-purple-500/5'
}

function dotColor(verbId: string): string {
  if (verbId.includes('upload')) return 'bg-indigo-500'
  if (verbId.includes('analyz')) return 'bg-cyan-500'
  return 'bg-purple-500'
}

function formatTimestamp(ts?: string): string {
  if (!ts) return 'Unknown time'
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

function actorName(stmt: LrsStatement): string {
  const mbox = stmt.actor?.mbox ?? ''
  return stmt.actor?.name ?? mbox.replace('mailto:', '') ?? 'Unknown'
}

function objectName(stmt: LrsStatement): string {
  return (
    stmt.object?.definition?.name?.['en-US'] ??
    stmt.object?.id?.split('/').pop() ??
    'Unknown activity'
  )
}

export default function LRSFeed() {
  const [statements, setStatements] = useState<LrsStatement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = useCallback(() => {
    setIsLoading(true)
    setError('')
    getLrsStatements(50)
      .then((d) => {
        setStatements(d.statements)
        setLastRefresh(new Date())
      })
      .catch(() => setError('Could not load activity log. Is the backend running?'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 text-left max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-indigo-400" />
            Activity Feed
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            xAPI LRS log — every platform action recorded in your learning record store.
          </p>
        </div>

        <button
          onClick={load}
          disabled={isLoading}
          className="self-start inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* What is xAPI info */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-slate-300 leading-relaxed flex gap-3">
        <Activity size={16} className="text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-white">What is the LRS?</span>{' '}
          The Learning Record Store (xAPI / Tin Can) captures structured statements about every
          learning event on the platform — skill extractions, gap analyses, and more. These are
          stored in <code className="text-indigo-300">lrs_log.jsonl</code> on the backend and are
          fully portable to any xAPI-compatible LMS.
        </div>
      </div>

      {/* Last refresh timestamp */}
      {!isLoading && (
        <p className="text-[10px] text-slate-600 flex items-center gap-1">
          <Clock size={10} />
          Last refreshed {lastRefresh.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 flex items-center gap-3 text-sm text-rose-400">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : statements.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-12 text-center backdrop-blur-xl space-y-4">
          <Activity size={44} className="mx-auto text-slate-700" />
          <div>
            <h3 className="font-bold text-white">No Activity Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Run a Career Analysis or extract skills to start generating xAPI statements in your learning record store.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-800" />

          <div className="space-y-1">
            {statements.map((stmt, i) => {
              const verbId = stmt.verb?.id ?? ''
              return (
                <div key={i} className="relative flex gap-4 pl-12 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 top-3.5 size-3 rounded-full border-2 border-[#050814] ${dotColor(verbId)}`} />

                  {/* Card */}
                  <div className={`flex-1 rounded-2xl border p-4 backdrop-blur-xl transition hover:brightness-110 ${verbColor(verbId)}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center shrink-0">
                          <VerbIcon verbId={verbId} />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-white">{verbLabel(stmt)}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{actorName(stmt)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
                        <Clock size={10} />
                        {formatTimestamp(stmt.timestamp)}
                      </span>
                    </div>

                    {/* Object name */}
                    <p className="mt-2.5 text-xs text-slate-300 pl-9">
                      <span className="font-semibold text-slate-400">Activity: </span>
                      {objectName(stmt)}
                    </p>

                    {/* Extra result fields */}
                    {stmt.result && Object.keys(stmt.result).length > 0 && (
                      <div className="mt-2 pl-9 flex flex-wrap gap-2">
                        {Object.entries(stmt.result)
                          .filter(([, v]) => v !== null && v !== undefined)
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[10px] font-semibold text-slate-400"
                            >
                              {k}: <span className="text-slate-300">{String(v)}</span>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
