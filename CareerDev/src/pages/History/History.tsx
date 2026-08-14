import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { History as HistoryIcon, Clock, ChevronRight, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listCareerAnalyses } from '../../services/careerAnalyses'
import type { CareerAnalysis } from '../../types/database'

export default function HistoryPage() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<CareerAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadHistory = useCallback(() => {
    if (!user) return
    setIsLoading(true)

    listCareerAnalyses(user.id)
      .then((data) => setAnalyses(data))
      .catch((err) => console.error('Error fetching history:', err))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Watch for updates
  useEffect(() => {
    window.addEventListener('analyses-updated', loadHistory)
    return () => window.removeEventListener('analyses-updated', loadHistory)
  }, [loadHistory])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 text-left max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <HistoryIcon size={24} className="text-cyan-400" />
          Analysis History
        </h1>
        <p className="text-sm text-slate-400 mt-1">Review all your past AI advisor career reports and metrics.</p>
      </div>

      {analyses.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-8 text-center backdrop-blur-xl space-y-5">
          <Clock className="mx-auto text-slate-650 size-12" />
          <h3 className="text-lg font-bold text-white">No Analysis History Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You haven't run any career advisor analyses yet. Set up your current profile details and generate your first path mapping now.
          </p>
          <Link
            to="/career-analysis"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            Start Career Analysis
            <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {analyses.map((item) => {
            const isExpanded = expandedId === item.id
            const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            return (
              <div 
                key={item.id} 
                className={`rounded-2xl border transition-all duration-300 backdrop-blur-xl overflow-hidden ${
                  isExpanded ? 'border-cyan-500/50 bg-[#0d1321]/80 shadow-[0_0_20px_rgba(6,182,212,0.08)]' : 'border-slate-800 bg-[#0d1321]/50 hover:border-slate-700'
                }`}
              >
                {/* Header Card Summary */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <span className="block text-[10px] uppercase font-bold text-cyan-400 tracking-wider">AI Assessment Run</span>
                    <h3 className="text-lg font-extrabold text-white leading-tight flex items-center gap-2">
                      Target: {item.target_career}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.matched_taxonomy
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                        title={
                          item.matched_taxonomy
                            ? 'Grounded in verified O*NET labour-market data for this exact occupation'
                            : 'AI-assisted estimate -- target career did not match a verified occupation'
                        }
                      >
                        {item.matched_taxonomy ? 'Verified' : 'AI Estimate'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {dateStr}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-start sm:self-center">
                    <div className="text-right">
                      <span className="block text-2xl font-black text-white leading-none">{item.readiness_score}%</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Readiness Score</span>
                    </div>
                    <ChevronRight 
                      size={20} 
                      className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-cyan-400' : ''}`} 
                    />
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-6 animate-fadeIn">
                    
                    {/* Summary */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Analysis Summary</h4>
                      <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                        {item.summary || 'No summary available.'}
                      </p>
                    </div>

                    {/* Skill Gaps Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Identified Gaps & Priority</h4>
                      
                      <div className="grid gap-3 sm:grid-cols-2">
                        {item.skill_gaps && item.skill_gaps.length > 0 ? (
                          item.skill_gaps.map((gap, gIdx) => (
                            <div key={gIdx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 flex items-start gap-3">
                              <span className={`mt-0.5 inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                gap.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                gap.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {gap.priority}
                              </span>
                              <div className="space-y-0.5">
                                <span className="block font-bold text-white text-xs">{gap.skill}</span>
                                <span className="block text-[11px] text-slate-400 leading-normal">{gap.reason}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 py-4 text-center text-slate-600 text-xs italic">No skill gaps identified.</div>
                        )}
                      </div>
                    </div>

                    {/* Recommendations Courses List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-semibold">Recommended Course Roadmaps</h4>
                      
                      <div className="space-y-2.5">
                        {item.learning_recommendations && item.learning_recommendations.length > 0 ? (
                          item.learning_recommendations.map((course, cIdx) => (
                            <div key={cIdx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={16} className="text-cyan-400" />
                                <div className="text-xs">
                                  <span className="font-bold text-white">{course.title}</span>
                                  <span className="text-slate-500 font-medium"> ({course.provider})</span>
                                </div>
                              </div>

                              <a 
                                href={course.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition"
                              >
                                View Course
                                <ArrowUpRight size={12} />
                              </a>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-slate-600 text-xs italic">No recommendations available.</div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
