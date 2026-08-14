import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  BookOpen,
  Award,
  Calendar,
  ArrowRight,
  Brain,
  Clock,
  Play,
  Layers,
  Bot,
  Activity,
  Database,
  FileText,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listCareerAnalyses } from '../../services/careerAnalyses'
import { getCurrentUserProfile } from '../../services/profiles'
import { getTaxonomyStats, getLrsStatements } from '../../services/platformApi'
import type { CareerAnalysis, Profile } from '../../types/database'
import type { TaxonomyStats, LrsStatement } from '../../services/platformApi'
import MarketPulse from '../../components/dashboard/MarketPulse'

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [analyses, setAnalyses] = useState<CareerAnalysis[]>([])
  const [taxonomyStats, setTaxonomyStats] = useState<TaxonomyStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<LrsStatement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = useCallback(() => {
    if (!user) return
    setIsLoading(true)

    Promise.all([
      getCurrentUserProfile(user.id),
      listCareerAnalyses(user.id),
      getTaxonomyStats().catch(() => null),
      getLrsStatements(5).catch(() => ({ statements: [] as LrsStatement[] })),
    ])
      .then(([profileData, analysesData, statsData, lrsData]) => {
        if (profileData) setProfile(profileData)
        setAnalyses(analysesData)
        if (statsData) setTaxonomyStats(statsData)
        setRecentActivity(lrsData.statements.slice(0, 3))
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  useEffect(() => {
    window.addEventListener('roadmap-updated', loadDashboardData)
    window.addEventListener('profile-updated', loadDashboardData)
    window.addEventListener('analyses-updated', loadDashboardData)
    return () => {
      window.removeEventListener('roadmap-updated', loadDashboardData)
      window.removeEventListener('profile-updated', loadDashboardData)
      window.removeEventListener('analyses-updated', loadDashboardData)
    }
  }, [loadDashboardData])

  const latestAnalysis = analyses && analyses.length > 0 ? analyses[0] : null
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Seeker'

  const readinessScore = latestAnalysis ? latestAnalysis.readiness_score : 0
  const recommendations = latestAnalysis?.learning_recommendations || []
  const completedCoursesCount = recommendations.filter((r) => (r as any).status === 'Completed').length
  const inProgressCoursesCount = recommendations.filter((r) => (r as any).status === 'In Progress').length
  const baseSkillsCount = latestAnalysis?.current_skills?.length || 0
  const skillsLearnedCount = baseSkillsCount + completedCoursesCount * 3 + inProgressCoursesCount
  const activeCourse =
    recommendations.find((r) => (r as any).status === 'In Progress') ||
    recommendations.find((r) => (r as any).status === 'Not Started') ||
    null

  return (
    <div className="space-y-8 text-left">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your career readiness, learn skills, and follow your AI planner.
          </p>
        </div>
        <Link
          to="/career-analysis"
          className="self-start inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 text-sm font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          <Brain size={16} />
          New Analysis
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        </div>
      ) : (
        <>
          {/* Top Stats Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Career Readiness */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl flex flex-col justify-between h-40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Career Readiness</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-white">{readinessScore}%</span>
                  {latestAnalysis && (
                    <span className="text-xs font-semibold text-emerald-400">
                      {readinessScore >= 70 ? 'Strong' : readinessScore >= 50 ? 'Good' : 'Building'}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-10 w-full mt-2">
                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path
                    d={readinessScore > 0 ? 'M 0,15 Q 25,5 50,12 T 100,2' : 'M 0,15 L 100,15'}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    className="drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]"
                  />
                </svg>
              </div>
            </div>

            {/* Skills Learned */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Skills Learned</p>
                <span className="block text-3xl font-extrabold text-white mt-2">{skillsLearnedCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 mt-4">
                <TrendingUp size={14} />
                <span>+{baseSkillsCount} skills imported from profile</span>
              </div>
            </div>

            {/* Courses Completed */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Courses Completed</p>
                <span className="block text-3xl font-extrabold text-white mt-2">
                  {completedCoursesCount}{' '}
                  <span className="text-sm font-semibold text-slate-500">/ {recommendations.length}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-4">
                <Award size={14} />
                <span>{inProgressCoursesCount} in progress</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Left/Middle — Continue Learning + Recent Analyses */}
            <div className="lg:col-span-2 space-y-6">
              {/* Continue Learning */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <BookOpen size={16} className="text-cyan-400" />
                  Continue Learning
                </h3>
                {activeCourse ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="space-y-1.5">
                      <span className="rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                        {activeCourse.skill}
                      </span>
                      <h4 className="font-bold text-white text-md tracking-wide mt-1">{activeCourse.title}</h4>
                      <p className="text-xs text-slate-500">
                        Provider: <span className="font-semibold text-slate-400">{activeCourse.provider}</span>
                      </p>
                      <div className="pt-2 w-64 max-w-full">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span>Status: {(activeCourse as any).status || 'Not Started'}</span>
                          <span>{(activeCourse as any).progress || 0}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                            style={{ width: `${(activeCourse as any).progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/learning"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 text-slate-950 px-4 py-2.5 text-xs font-bold hover:bg-cyan-400 transition self-start sm:self-center"
                    >
                      <Play size={10} fill="currentColor" />
                      Continue
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm italic">
                    No active course roadmap. Run a Career Analysis to populate recommendations.
                  </div>
                )}
              </div>

              {/* Recent Analyses */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Clock size={16} className="text-cyan-400" />
                  Recent Analyses
                </h3>
                <div className="divide-y divide-slate-800/60">
                  {analyses.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-sm italic">
                      No analyses recorded yet.
                    </div>
                  ) : (
                    analyses.slice(0, 3).map((item) => (
                      <div key={item.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-sm">{item.target_career}</span>
                          <span className="block text-xs text-slate-500">
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-extrabold ${item.readiness_score >= 70 ? 'text-emerald-400' : item.readiness_score >= 50 ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {item.readiness_score}%
                          </span>
                          <Link to="/history" className="text-slate-500 hover:text-white transition">
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Upcoming Milestones */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-6 backdrop-blur-xl space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-cyan-400" />
                  Upcoming Milestones
                </h3>
                <div className="space-y-3.5">
                  {recommendations.length > 0 ? (
                    recommendations.slice(0, 2).map((item, idx) => {
                      const isDone = (item as any).status === 'Completed'
                      return (
                        <div key={item.title} className="flex gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                          <div className={`mt-0.5 size-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : idx === 0 ? 'bg-cyan-400 animate-pulse' : 'bg-purple-500'}`} />
                          <div className="space-y-1 text-xs">
                            <p className={`font-bold ${isDone ? 'line-through text-slate-600' : 'text-white'}`}>
                              {idx === 0 ? 'Complete Basics' : 'Build First Project'}
                            </p>
                            <p className="text-slate-500 leading-normal">
                              Focusing on <span className="font-semibold text-slate-400">{item.skill}</span>
                            </p>
                            <span className="inline-block text-[10px] text-cyan-400/80 font-semibold mt-1">
                              {idx === 0 ? 'In 3 days' : 'In 7 days'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-sm italic">
                      Generate analysis to receive dynamic milestones.
                    </div>
                  )}
                </div>
              </div>

              {/* Market Pulse */}
              {profile?.target_career && (
                <MarketPulse targetCareer={profile.target_career} />
              )}

              {/* Platform Stats Widget */}
              {taxonomyStats && (
                <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-5 backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Database size={16} className="text-indigo-400" />
                    O*NET Platform Data
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
                      <span className="block text-xl font-extrabold text-white">{taxonomyStats.occupation_count}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Occupations</span>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
                      <span className="block text-xl font-extrabold text-white">{taxonomyStats.skill_count}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Skills</span>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
                      <span className="block text-xl font-extrabold text-white">{taxonomyStats.domain_count}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Domains</span>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
                      <span className="block text-xl font-extrabold text-white">{taxonomyStats.technology_skill_count}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Tech Skills</span>
                    </div>
                  </div>
                  <Link
                    to="/skill-explorer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-400 transition"
                  >
                    <Layers size={13} />
                    Browse Skill Explorer
                  </Link>
                </div>
              )}

              {/* Quick Actions */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-5 backdrop-blur-xl space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
                  Quick Actions
                </h3>
                <Link to="/career-guidance" className="flex items-center gap-3 rounded-xl border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/10 p-3.5 transition group">
                  <div className="size-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/25 transition">
                    <Bot size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">AI Career Guidance</span>
                    <span className="text-[10px] text-slate-500">Streaming Gemini insights</span>
                  </div>
                  <ArrowRight size={13} className="ml-auto text-slate-600 group-hover:text-purple-400 transition" />
                </Link>

                <Link to="/job-description" className="flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/5 hover:bg-indigo-500/10 p-3.5 transition group">
                  <div className="size-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/25 transition">
                    <FileText size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">JD Analyser</span>
                    <span className="text-[10px] text-slate-500">Match a job description</span>
                  </div>
                  <ArrowRight size={13} className="ml-auto text-slate-600 group-hover:text-indigo-400 transition" />
                </Link>

                <Link to="/resume-analyser" className="flex items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 p-3.5 transition group">
                  <div className="size-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/25 transition">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">Resume Analyser</span>
                    <span className="text-[10px] text-slate-500">Auto-import your skills</span>
                  </div>
                  <ArrowRight size={13} className="ml-auto text-slate-600 group-hover:text-violet-400 transition" />
                </Link>

                <Link to="/activity" className="flex items-center gap-3 rounded-xl border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 p-3.5 transition group">
                  <div className="size-8 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/25 transition">
                    <Activity size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">Activity Feed</span>
                    <span className="text-[10px] text-slate-500">
                      {recentActivity.length > 0 ? `${recentActivity.length} recent events` : 'xAPI LRS log'}
                    </span>
                  </div>
                  <ArrowRight size={13} className="ml-auto text-slate-600 group-hover:text-teal-400 transition" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
