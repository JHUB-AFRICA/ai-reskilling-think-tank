import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, DollarSign, Briefcase, Zap, RefreshCw } from 'lucide-react'
import { apiClient } from '../../services/apiClient'

type MarketPulseData = {
  career: string
  salary_min: number
  salary_max: number
  salary_currency: string
  demand_trend: 'growing' | 'stable' | 'declining'
  demand_score: number
  top_hiring_companies: string[]
  trending_skills: string[]
  job_count_estimate: number
  data_source: string
  cached: boolean
}

type Props = {
  targetCareer: string
}

const TREND_CONFIG = {
  growing:   { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Growing Demand' },
  stable:    { icon: Minus,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   label: 'Stable Demand' },
  declining: { icon: TrendingDown, color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',     label: 'Declining Demand' },
}

export default function MarketPulse({ targetCareer }: Props) {
  const [data, setData] = useState<MarketPulseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  async function load() {
    if (!targetCareer) return
    setIsLoading(true)
    setHasError(false)
    try {
      const result = await apiClient.get<MarketPulseData>(
        `/market/pulse?career=${encodeURIComponent(targetCareer)}`,
        false // no auth required
      )
      setData(result)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [targetCareer])

  if (!targetCareer) return null

  const trend = data ? TREND_CONFIG[data.demand_trend] : null
  const TrendIcon = trend?.icon ?? Minus

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          Market Pulse
        </h3>
        <button
          onClick={load}
          disabled={isLoading}
          className="text-slate-600 hover:text-slate-400 transition disabled:opacity-50"
          title="Refresh market data"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400" />
        </div>
      )}

      {hasError && !isLoading && (
        <p className="text-xs text-slate-600 italic text-center py-4">
          Market data unavailable — connect the backend for live insights.
        </p>
      )}

      {data && !isLoading && (
        <>
          {/* Demand trend badge */}
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${trend?.bg}`}>
            <TrendIcon size={14} className={trend?.color} />
            <span className={`text-xs font-bold ${trend?.color}`}>{trend?.label}</span>
            <span className="ml-auto text-[10px] text-slate-500">Score: {data.demand_score}/100</span>
          </div>

          {/* Salary */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3">
            <DollarSign size={14} className="text-cyan-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Avg Salary Range</p>
              <p className="text-sm font-bold text-white">
                {data.salary_currency}{data.salary_min.toLocaleString()} – {data.salary_currency}{data.salary_max.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Job count */}
          {data.job_count_estimate > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3">
              <Briefcase size={14} className="text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Open Positions (Est.)</p>
                <p className="text-sm font-bold text-white">{data.job_count_estimate.toLocaleString()}+</p>
              </div>
            </div>
          )}

          {/* Trending skills */}
          {data.trending_skills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">In-Demand Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {data.trending_skills.slice(0, 6).map((sk) => (
                  <span key={sk} className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-400">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top hirers */}
          {data.top_hiring_companies.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Top Hiring Companies</p>
              <div className="flex flex-wrap gap-1.5">
                {data.top_hiring_companies.slice(0, 4).map((co) => (
                  <span key={co} className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                    {co}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9px] text-slate-600">
            Source: {data.data_source}{data.cached ? ' · cached' : ' · live'}
          </p>
        </>
      )}
    </div>
  )
}
