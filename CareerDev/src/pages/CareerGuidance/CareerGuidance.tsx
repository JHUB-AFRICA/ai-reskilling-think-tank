import { useState, useRef, useEffect } from 'react'
import { Bot, Sparkles, CheckCircle, AlertCircle, Zap, Info, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAccessToken } from '../../services/apiClient'
import { streamCareerGuidance } from '../../services/platformApi'
import type { SkillSuggestion } from '../../services/platformApi'

type Phase = 'idle' | 'streaming' | 'done' | 'error'

const POPULAR_GOALS = [
  'AI / Machine Learning Engineer',
  'Cloud Solutions Architect',
  'Full-Stack Developer',
  'Cybersecurity Analyst',
  'Data Scientist',
  'DevOps Engineer',
  'Product Manager',
  'UX Designer',
]

export default function CareerGuidance() {
  const { user } = useAuth()
  const [resumeText, setResumeText] = useState('')
  const [careerGoal, setCareerGoal] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showResumeHelp, setShowResumeHelp] = useState(false)
  const streamRef = useRef<AbortController | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [streamedText])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !resumeText.trim() || !careerGoal.trim()) return

    const token = await getAccessToken()
    if (!token) {
      setErrorMsg('You must be signed in to use AI Career Guidance.')
      setPhase('error')
      return
    }

    setPhase('streaming')
    setStreamedText('')
    setSuggestions([])
    setErrorMsg('')

    try {
      const body = await streamCareerGuidance(
        { resume_text: resumeText, career_goal: careerGoal },
        token,
      )

      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6))
              if (payload.chunk) {
                setStreamedText((prev) => prev + payload.chunk)
              }
            } catch {
              // partial JSON — ignore
            }
          } else if (line.startsWith('event: result')) {
            // next line will be data: {...}
          } else if (line.startsWith('data: ') && line.includes('"suggestions"')) {
            try {
              const payload = JSON.parse(line.slice(6))
              if (payload.suggestions) {
                setSuggestions(payload.suggestions)
                setPhase('done')
              }
            } catch {
              // ignore
            }
          }
        }
      }

      if (phase !== 'done') setPhase('done')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setErrorMsg(msg)
      setPhase('error')
    }
  }

  function handleCancel() {
    streamRef.current?.abort()
    setPhase('idle')
  }

  const inTaxonomy = suggestions.filter((s) => s.in_taxonomy)
  const notInTaxonomy = suggestions.filter((s) => !s.in_taxonomy)

  return (
    <div className="space-y-6 text-left max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Bot size={24} className="text-purple-400" />
          AI Career Guidance
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Get real-time, taxonomy-grounded skill suggestions powered by Gemini AI.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Input Panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-5">
            {/* Career Goal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Career Goal
              </label>
              <input
                type="text"
                placeholder="e.g. AI Engineer, Cloud Architect…"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500 transition"
                required
              />
              {/* Quick-pick goal pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {POPULAR_GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setCareerGoal(g)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold border transition ${
                      careerGoal === g
                        ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                        : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume / Skills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Skills / Resume Summary
                </label>
                <button
                  type="button"
                  onClick={() => setShowResumeHelp((p) => !p)}
                  className="text-slate-600 hover:text-slate-400 transition"
                >
                  <Info size={14} />
                </button>
              </div>
              {showResumeHelp && (
                <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-400 leading-relaxed">
                  Paste your resume summary, a list of skills you have, or a brief description of your background. The AI will extract your skills and compare them against the O*NET taxonomy.
                </div>
              )}
              <textarea
                rows={7}
                placeholder="Paste your resume summary or list your current skills here…&#10;&#10;e.g. Python, SQL, 3 years data analysis, Tableau, experience with ML pipelines…"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500 transition resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={phase === 'streaming' || !resumeText.trim() || !careerGoal.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 text-sm font-bold transition disabled:opacity-50 shadow-[0_0_20px_rgba(147,51,234,0.2)]"
              >
                {phase === 'streaming' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Get AI Guidance
                  </>
                )}
              </button>
              {phase === 'streaming' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Info box */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/40 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">How it works</h3>
            <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                Skills matched to the O*NET taxonomy are <span className="text-emerald-400 font-semibold">Verified</span> — real occupational data.
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                Skills not in the taxonomy are marked <span className="text-amber-400 font-semibold">AI Estimate</span> — emerging or niche skills.
              </li>
              <li className="flex items-start gap-2">
                <Zap size={13} className="text-purple-400 mt-0.5 shrink-0" />
                Rate limited to 5 requests/day per user to ensure quality.
              </li>
            </ul>
          </div>
        </div>

        {/* ── Output Panel ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-[#0d1321]/60 backdrop-blur-xl flex flex-col overflow-hidden min-h-[400px]">
          {phase === 'idle' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
              <div className="size-16 rounded-2xl border border-purple-500/20 bg-purple-500/10 flex items-center justify-center">
                <Bot size={30} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Ready for AI Guidance</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  Describe your current skills and career goal, then click "Get AI Guidance" to receive personalized, taxonomy-grounded skill suggestions.
                </p>
              </div>
            </div>
          ) : phase === 'error' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
              <AlertCircle size={40} className="text-rose-400" />
              <div>
                <h3 className="font-bold text-white">Error</h3>
                <p className="text-sm text-rose-400 mt-1 max-w-sm">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Streaming text area */}
              {(phase === 'streaming' || (phase === 'done' && streamedText)) && (
                <div className="p-5 border-b border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`size-1.5 rounded-full ${phase === 'streaming' ? 'bg-purple-400 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {phase === 'streaming' ? 'AI Thinking…' : 'Analysis Complete'}
                    </span>
                  </div>
                  <div
                    ref={outputRef}
                    className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-xs text-slate-300 leading-relaxed font-mono max-h-40 overflow-y-auto"
                  >
                    {streamedText}
                    {phase === 'streaming' && (
                      <span className="inline-block w-1.5 h-3 bg-purple-400 ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </div>
                </div>
              )}

              {/* Results */}
              {suggestions.length > 0 && (
                <div
                  ref={outputRef}
                  className="flex-1 overflow-y-auto p-5 space-y-6"
                >
                  {/* Verified skills */}
                  {inTaxonomy.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle size={13} />
                        Verified Skills ({inTaxonomy.length})
                      </h3>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {inTaxonomy.map((s, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-sm">{s.skill}</span>
                              {s.priority && (
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  s.priority === 'high'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : s.priority === 'medium'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {s.priority}
                                </span>
                              )}
                            </div>
                            {s.reason && (
                              <p className="text-xs text-slate-400 leading-relaxed">{s.reason}</p>
                            )}
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400/70 uppercase tracking-wider">
                              <CheckCircle size={9} /> O*NET Verified
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Estimate skills */}
                  {notInTaxonomy.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        AI Estimates — Emerging Skills ({notInTaxonomy.length})
                      </h3>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {notInTaxonomy.map((s, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1.5"
                          >
                            <span className="font-bold text-white text-sm">{s.skill}</span>
                            {s.reason && (
                              <p className="text-xs text-slate-400 leading-relaxed">{s.reason}</p>
                            )}
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400/70 uppercase tracking-wider">
                              <AlertCircle size={9} /> AI Estimate
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
