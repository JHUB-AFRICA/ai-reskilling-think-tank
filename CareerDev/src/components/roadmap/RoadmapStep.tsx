import { ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import type { SkillResourceLink } from '../../services/platformApi'

type Priority = 'high' | 'medium' | 'low'

type RoadmapStepProps = {
  index: number
  skill: string
  reason: string
  priority: Priority
  status: 'not_started' | 'in_progress' | 'completed'
  progress: number
  resources: SkillResourceLink[]
  isExpanded: boolean
  isUpdating: boolean
  onToggleExpand: () => void
  onStart: () => void
  onComplete: () => void
  onProgressChange: (value: number) => void
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  high:   { label: 'High Priority',   color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20',   dot: 'bg-rose-400' },
  medium: { label: 'Medium Priority', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  low:    { label: 'Low Priority',    color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-500' },
}

export default function RoadmapStep({
  index,
  skill,
  reason,
  priority,
  status,
  progress,
  resources,
  isExpanded,
  isUpdating,
  onToggleExpand,
  onStart,
  onComplete,
  onProgressChange,
}: RoadmapStepProps) {
  const pc = PRIORITY_CONFIG[priority]
  const isCompleted = status === 'completed'
  const isInProgress = status === 'in_progress'

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isCompleted
          ? 'border-emerald-500/20 bg-emerald-950/10'
          : isInProgress
          ? 'border-cyan-500/30 bg-[#0d1321]/80 shadow-[0_0_20px_rgba(6,182,212,0.05)]'
          : 'border-slate-800 bg-[#0d1321]/60'
      } backdrop-blur-xl`}
    >
      {/* Step Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        {/* Step number / check indicator */}
        <div className="shrink-0 mt-0.5">
          {isCompleted ? (
            <CheckCircle2 size={24} className="text-emerald-400" />
          ) : isInProgress ? (
            <div className="relative size-6">
              <svg className="size-6 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#1e293b" strokeWidth="3" fill="none" />
                <circle
                  cx="12" cy="12" r="10"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(progress / 100) * 62.83} 62.83`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-cyan-400">
                {progress}
              </span>
            </div>
          ) : (
            <Circle size={24} className="text-slate-600" />
          )}
        </div>

        {/* Skill name + priority + reason */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-600">Step {index + 1}</span>
            <h3 className={`font-bold text-base ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
              {skill}
            </h3>
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pc.bg} ${pc.color}`}>
              <span className={`size-1.5 rounded-full ${pc.dot}`} />
              {pc.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{reason}</p>
          {isInProgress && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1 rounded-full bg-slate-900 overflow-hidden max-w-[200px]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(6,182,212,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-cyan-400">{progress}% done</span>
            </div>
          )}
        </div>

        {/* Expand / Resources count */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {resources.length > 0 && (
            <span className="text-[10px] font-semibold text-indigo-400">
              {resources.length} resource{resources.length > 1 ? 's' : ''}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </div>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-800/60 pt-4">
          {/* Why this skill */}
          <div className="flex items-start gap-2 rounded-xl bg-slate-950/60 border border-slate-800 px-4 py-3">
            <AlertCircle size={14} className="text-cyan-400/70 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">{reason}</p>
          </div>

          {/* Progress slider (In Progress only) */}
          {isInProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Your Progress</span>
                <span className="text-cyan-400">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => onProgressChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {status === 'not_started' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStart() }}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 text-xs font-bold transition disabled:opacity-50"
              >
                Start Learning
              </button>
            )}
            {isInProgress && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete() }}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-bold transition disabled:opacity-50"
              >
                <CheckCircle2 size={13} />
                Mark as Completed
              </button>
            )}
            {isCompleted && (
              <button
                onClick={(e) => { e.stopPropagation(); onStart() }}
                disabled={isUpdating}
                className="rounded-xl border border-slate-700 hover:bg-slate-800 px-3 py-2 text-[10px] font-bold text-slate-400 transition"
              >
                Reset Progress
              </button>
            )}
          </div>

          {/* Learning Resources */}
          {resources.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Learning Resources
              </p>
              <div className="space-y-2">
                {resources.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="block text-xs font-semibold text-slate-200 group-hover:text-white transition leading-snug">
                        {link.title}
                        {link.curated && (
                          <span className="ml-2 text-[9px] font-bold text-emerald-400 uppercase">curated</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">{link.provider}</span>
                    </div>
                    <ExternalLink size={13} className="shrink-0 text-slate-600 group-hover:text-indigo-400 transition mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
