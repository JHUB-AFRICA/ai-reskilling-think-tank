import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Zap, Target, BarChart2, Filter } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listCareerAnalyses, updateAnalysisRecommendations } from '../../services/careerAnalyses'
import { getSkillResources } from '../../services/platformApi'
import type { CareerAnalysis, SkillGap, LearningRecommendation } from '../../types/database'
import type { SkillResourceLink } from '../../services/platformApi'
import RoadmapStep from '../../components/roadmap/RoadmapStep'

type StepStatus = 'not_started' | 'in_progress' | 'completed'

type RoadmapMilestone = SkillGap & {
  resources: SkillResourceLink[]
  status: StepStatus
  progress: number
  primaryCourse: LearningRecommendation | null
}

export default function LearningRoadmap() {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null)
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([])
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | StepStatus>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null)

  const loadRoadmap = useCallback(() => {
    if (!user) return
    setIsLoading(true)

    listCareerAnalyses(user.id)
      .then(async (data) => {
        if (data.length === 0) {
          setAnalysis(null)
          setMilestones([])
          return
        }

        const latest = data[0]
        setAnalysis(latest)

        // Build milestone list from skill_gaps (not the flat recommendation list)
        const gaps = latest.skill_gaps ?? []
        const recs = latest.learning_recommendations ?? []

        // Fetch per-skill resources
        const skillsToFetch = gaps
          .filter((g) => g.skill_id)
          .map((g) => ({ skill_id: g.skill_id!, skill_name: g.skill }))

        let resourceMap: Record<string, SkillResourceLink[]> = {}
        if (skillsToFetch.length > 0) {
          try {
            const res = await getSkillResources(skillsToFetch)
            resourceMap = res.resources
          } catch { /* graceful degradation */ }
        }

        // Merge existing progress from recommendations
        const progressBySkill: Record<string, { status: StepStatus; progress: number }> = {}
        for (const rec of recs as any[]) {
          if (rec.skill && rec.status) {
            progressBySkill[rec.skill] = {
              status: rec.status === 'Completed' ? 'completed'
                : rec.status === 'In Progress' ? 'in_progress'
                : 'not_started',
              progress: rec.progress ?? 0,
            }
          }
        }

        // Sort: high → medium → low priority
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
        const sorted = [...gaps].sort(
          (a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
        )

        const built: RoadmapMilestone[] = sorted.map((gap) => {
          const prog = progressBySkill[gap.skill] ?? { status: 'not_started', progress: 0 }
          const primaryCourse = recs.find((r) => r.skill === gap.skill) ?? null
          return {
            ...gap,
            resources: [
              ...(primaryCourse ? [{ title: primaryCourse.title, provider: primaryCourse.provider, url: primaryCourse.url, curated: true }] : []),
              ...(gap.skill_id ? (resourceMap[gap.skill_id] ?? []) : []),
            ],
            status: prog.status,
            progress: prog.progress,
            primaryCourse,
          }
        })

        setMilestones(built)
        // Auto-expand first in-progress or first not-started
        const firstActive = built.find((m) => m.status === 'in_progress') ?? built.find((m) => m.status === 'not_started')
        if (firstActive) setExpandedStep(firstActive.skill)
      })
      .catch((err) => console.error('Error loading roadmap:', err))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => { loadRoadmap() }, [loadRoadmap])
  useEffect(() => {
    window.addEventListener('roadmap-updated', loadRoadmap)
    return () => window.removeEventListener('roadmap-updated', loadRoadmap)
  }, [loadRoadmap])

  async function persistProgress(updatedMilestones: RoadmapMilestone[]) {
    if (!analysis) return
    // Reformat to the existing recommendations shape expected by the backend
    const recommendations = updatedMilestones.map((m) => ({
      title: m.primaryCourse?.title ?? m.skill,
      provider: m.primaryCourse?.provider ?? '',
      url: m.primaryCourse?.url ?? '',
      skill: m.skill,
      skill_id: m.skill_id,
      status:
        m.status === 'completed' ? 'Completed'
        : m.status === 'in_progress' ? 'In Progress'
        : 'Not Started',
      progress: m.progress,
    }))
    await updateAnalysisRecommendations(analysis.id, recommendations)
    window.dispatchEvent(new Event('roadmap-updated'))
    window.dispatchEvent(new Event('analyses-updated'))
  }

  async function handleStart(skill: string) {
    setUpdatingSkill(skill)
    try {
      const updated = milestones.map((m) =>
        m.skill === skill ? { ...m, status: 'in_progress' as StepStatus, progress: 5 } : m
      )
      setMilestones(updated)
      setExpandedStep(skill)
      await persistProgress(updated)
    } finally {
      setUpdatingSkill(null)
    }
  }

  async function handleComplete(skill: string) {
    setUpdatingSkill(skill)
    try {
      const updated = milestones.map((m) =>
        m.skill === skill ? { ...m, status: 'completed' as StepStatus, progress: 100 } : m
      )
      setMilestones(updated)
      await persistProgress(updated)
    } finally {
      setUpdatingSkill(null)
    }
  }

  async function handleProgressChange(skill: string, value: number) {
    const newStatus: StepStatus = value === 100 ? 'completed' : value === 0 ? 'not_started' : 'in_progress'
    const updated = milestones.map((m) =>
      m.skill === skill ? { ...m, status: newStatus, progress: value } : m
    )
    setMilestones(updated)
    await persistProgress(updated)
  }

  // Stats
  const completedCount = milestones.filter((m) => m.status === 'completed').length
  const inProgressCount = milestones.filter((m) => m.status === 'in_progress').length
  const totalCount = milestones.length
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Filtering
  let visible = focusMode
    ? milestones.filter((m) => m.priority === 'high').slice(0, 5)
    : milestones

  if (filterStatus !== 'all') {
    visible = visible.filter((m) => m.status === filterStatus)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen size={24} className="text-cyan-400" />
            Learning Roadmap
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Your step-by-step skill-building plan — each step links to real learning resources.
          </p>
        </div>
        {analysis && (
          <span className="self-start rounded-full border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-1 text-xs font-semibold text-cyan-400 shrink-0">
            Target: {analysis.target_career}
          </span>
        )}
      </div>

      {!analysis ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-10 text-center backdrop-blur-xl space-y-5">
          <BookOpen className="mx-auto text-slate-600 size-12" />
          <h3 className="text-lg font-bold text-white">No Roadmap Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Complete a career analysis first so the AI advisor can build your personalised skill roadmap.
          </p>
          <Link
            to="/career-analysis"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            Build My Roadmap
            <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Progress Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Steps', value: totalCount, color: 'text-white', icon: Target },
              { label: 'Completed', value: completedCount, color: 'text-emerald-400', icon: BarChart2 },
              { label: 'In Progress', value: inProgressCount, color: 'text-cyan-400', icon: Zap },
              { label: 'Overall Progress', value: `${overallProgress}%`, color: 'text-purple-400', icon: BarChart2 },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-4 backdrop-blur-xl flex flex-col gap-1">
                <Icon size={14} className={`${color} mb-1`} />
                <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Roadmap Completion</span>
              <span className="text-cyan-400">{overallProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${
                focusMode
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={13} />
              Focus Mode {focusMode ? '(Top 5 high-priority)' : '(all steps)'}
            </button>

            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
              <Filter size={12} className="text-slate-600 ml-2" />
              {(['all', 'not_started', 'in_progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                    filterStatus === s
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s === 'not_started' ? 'Not Started' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Milestone Steps */}
          <div className="space-y-3">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-10 text-center text-slate-500 text-sm">
                No steps match this filter.
              </div>
            ) : (
              visible.map((milestone, idx) => (
                <RoadmapStep
                  key={milestone.skill}
                  index={idx}
                  skill={milestone.skill}
                  reason={milestone.reason}
                  priority={milestone.priority}
                  status={milestone.status}
                  progress={milestone.progress}
                  resources={milestone.resources}
                  isExpanded={expandedStep === milestone.skill}
                  isUpdating={updatingSkill === milestone.skill}
                  onToggleExpand={() =>
                    setExpandedStep(expandedStep === milestone.skill ? null : milestone.skill)
                  }
                  onStart={() => handleStart(milestone.skill)}
                  onComplete={() => handleComplete(milestone.skill)}
                  onProgressChange={(v) => handleProgressChange(milestone.skill, v)}
                />
              ))
            )}
          </div>

          {/* No gaps congratulations */}
          {totalCount === 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-10 text-center space-y-3">
              <span className="text-4xl">🎉</span>
              <h3 className="text-lg font-bold text-white">You're already qualified!</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                No skill gaps were detected for your target role. Consider running a new analysis for a more advanced position.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
