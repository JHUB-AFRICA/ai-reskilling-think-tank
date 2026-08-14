import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Users, ClipboardCopy, Award, Brain, Compass, Target, LineChart, ShieldCheck, Cpu, Globe, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import ApiStatusBadge from '../../components/ui/ApiStatusBadge'
import { getTaxonomyStats } from '../../services/platformApi'
import type { TaxonomyStats } from '../../services/platformApi'

// Animated counter hook
function useCountUp(target: number, duration = 1200, active = true) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    if (!active || target === 0) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) raf.current = requestAnimationFrame(step)
      else setValue(target)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, active])
  return value
}

function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const count = useCountUp(value, 1400, visible)
  return (
    <div ref={ref} className="text-center">
      <span className="block text-3xl font-extrabold text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="block text-xs text-slate-400 font-medium mt-1">{label}</span>
    </div>
  )
}

export default function Home() {
  const [stats, setStats] = useState<TaxonomyStats | null>(null)

  useEffect(() => {
    getTaxonomyStats().then(setStats).catch(() => null)
  }, [])

  return (
    <div className="relative min-h-[90vh] bg-[#050814] text-white overflow-hidden">
      {/* Dynamic Grid Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute top-1/4 right-1/4 size-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 size-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 size-64 rounded-full bg-purple-500/8 blur-[80px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-12 md:py-20">
        {/* API Status pill — top right */}
        <div className="flex justify-end mb-4">
          <ApiStatusBadge />
        </div>

        <div className="grid gap-16 lg:grid-cols-12 items-center">

          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <span className="mb-6 w-fit rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-semibold text-cyan-400 tracking-wider uppercase backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              ✨ AI-Powered Career Development Platform
            </span>

            <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight text-white">
              Build a Smarter
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                Career
              </span>{' '}
              with AI
            </h1>

            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-400">
              Get personalized career analysis, skill gap insights backed by O*NET labour data,
              and a tailored learning roadmap to achieve your dream career.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-400 transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>

              <a
                href="#features"
                className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur px-8 py-4 font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-white transition-all duration-300 transform hover:scale-[1.02]"
              >
                Learn More
              </a>
            </div>

            {/* Live Stats Row */}
            <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-wrap gap-8 sm:gap-12 text-left">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">10K+</h3>
                  <p className="text-xs text-slate-400 font-medium">Active Users</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ClipboardCopy size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">50K+</h3>
                  <p className="text-xs text-slate-400 font-medium">Analyses Run</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">95%</h3>
                  <p className="text-xs text-slate-400 font-medium">Success Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Dashboard Mockup */}
          <div className="lg:col-span-5 flex items-center justify-center gap-4 w-full">
            <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-[#0d1321]/90 p-6 shadow-2xl backdrop-blur-xl relative">
              <div className="absolute -top-3 -right-3 size-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 blur-md" />

              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <h3 className="text-md font-bold text-white tracking-wide">Career Readiness Analysis</h3>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Circular SVG Gauge */}
              <div className="flex flex-col items-center py-4">
                <div className="relative size-32 flex items-center justify-center">
                  <svg className="size-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50" cy="50" r="40"
                      className="stroke-cyan-500 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                      strokeWidth="8" fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset="70.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold text-white">72%</span>
                    <p className="text-[10px] uppercase font-semibold text-cyan-400 tracking-wider mt-0.5">Readiness</p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-emerald-400">Good Progress</p>
              </div>

              {/* Skill Gaps */}
              <div className="mt-6 space-y-4 pt-5 border-t border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left mb-3">Identified Skill Gaps</h4>
                {[
                  { name: 'Machine Learning', level: 'Advanced', pct: 80, color: 'from-purple-600 to-indigo-500', shadow: 'rgba(147,51,234,0.5)' },
                  { name: 'System Design', level: 'Intermediate', pct: 60, color: 'from-indigo-500 to-cyan-500', shadow: 'rgba(99,102,241,0.5)' },
                  { name: 'Cloud Computing', level: 'Beginner', pct: 40, color: 'from-cyan-500 to-teal-400', shadow: 'rgba(6,182,212,0.5)' },
                ].map((g) => (
                  <div key={g.name}>
                    <div className="mb-1.5 flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{g.name}</span>
                      <span className="text-slate-400">{g.level}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${g.color}`} style={{ width: `${g.pct}%`, boxShadow: `0 0 8px ${g.shadow}` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Taxonomy Stats */}
      {stats && (
        <section className="relative mx-auto max-w-7xl px-6 py-10 border-t border-slate-800/60">
          <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 backdrop-blur-xl p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Live Platform Data</span>
                <h2 className="text-lg font-bold text-white mt-0.5">O*NET Taxonomy — Real Labour Market Intelligence</h2>
              </div>
              <ApiStatusBadge />
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-slate-800">
              <StatCounter value={stats.occupation_count} label="Occupations" />
              <StatCounter value={stats.skill_count} label="Unique Skills" />
              <StatCounter value={stats.domain_count} label="Skill Domains" />
              <StatCounter value={stats.technology_skill_count} label="Tech Skills" />
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-12 border-t border-slate-800/60 bg-slate-950/40 backdrop-blur relative z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Platform Capabilities</span>
          <h2 className="text-2xl font-extrabold text-white mt-2">Everything you need to grow your career</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Brain, color: 'cyan', title: 'AI-Powered Analysis', desc: 'Get intelligent insights about your target career path using O*NET verified occupation data.' },
            { icon: Compass, color: 'indigo', title: 'Personalized Roadmap', desc: 'Tailored learning path specifically built from your unique skill profile and goals.' },
            { icon: Target, color: 'purple', title: 'Skill Gap Detection', desc: 'Identify and systematically close critical technical skill gaps with importance weighting.' },
            { icon: Cpu, color: 'teal', title: 'Gemini AI Guidance', desc: 'Streaming AI career reasoning backed by real taxonomy validation and holding-pen checks.' },
            { icon: Globe, color: 'emerald', title: 'Skill Explorer', desc: 'Browse 900+ O*NET occupations and explore every skill requirement and domain breakdown.' },
            { icon: Zap, color: 'amber', title: 'xAPI Activity Log', desc: 'Every learning event tracked in a portable Learning Record Store for lifelong credentials.' },
            { icon: LineChart, color: 'pink', title: 'Track Progress', desc: 'Monitor milestones, course completion, and readiness score changes over time.' },
            { icon: ShieldCheck, color: 'rose', title: 'Career Readiness', desc: 'Real-time readiness score based on importance-weighted skill matching, not guesswork.' },
            { icon: Users, color: 'violet', title: 'Role-Based Access', desc: 'Job Seeker, Workforce Analyst, and Administrator roles with RBAC-gated features.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className={`p-5 rounded-2xl border border-slate-800/60 bg-slate-900/20 hover:border-${color}-500/30 hover:bg-slate-900/40 transition-all duration-300 group`}
            >
              <div className={`size-10 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 mb-4 group-hover:bg-${color}-500 group-hover:text-slate-950 transition duration-300`}>
                <Icon size={20} />
              </div>
              <h4 className="font-bold text-sm text-white">{title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-10 py-4 font-bold text-white hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.25)]"
          >
            Start Your Career Journey
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}