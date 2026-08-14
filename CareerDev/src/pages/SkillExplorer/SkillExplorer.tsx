import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ChevronRight,
  Layers,
  Brain,
  ArrowUpDown,
  Filter,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { getOccupations, getTaxonomyRequirements } from '../../services/platformApi'
import type { SkillRequirement } from '../../services/platformApi'

type SortKey = 'skill_name' | 'domain' | 'source' | 'importance'
type SortDir = 'asc' | 'desc'

const DOMAIN_COLORS: Record<string, string> = {
  'Technology': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Business': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'Science': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Management': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Communication': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

function domainColor(domain: string) {
  for (const [key, cls] of Object.entries(DOMAIN_COLORS)) {
    if (domain.toLowerCase().includes(key.toLowerCase())) return cls
  }
  return 'text-slate-400 bg-slate-800 border-slate-700'
}

function ImportanceBar({ value }: { value: number }) {
  const pct = Math.round((value / 5) * 100)
  const color = value >= 4 ? 'bg-emerald-500' : value >= 3 ? 'bg-cyan-500' : 'bg-slate-600'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 w-5">{value.toFixed(1)}</span>
    </div>
  )
}

export default function SkillExplorer() {
  const [occupations, setOccupations] = useState<string[]>([])
  const [occSearch, setOccSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [requirements, setRequirements] = useState<SkillRequirement[]>([])
  const [reqSearch, setReqSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('importance')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [domainFilter, setDomainFilter] = useState('All')
  const [isLoadingOcc, setIsLoadingOcc] = useState(true)
  const [isLoadingReq, setIsLoadingReq] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getOccupations()
      .then((d) => setOccupations(d.occupations.sort()))
      .catch(() => setError('Failed to load occupations. Is the backend running?'))
      .finally(() => setIsLoadingOcc(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setIsLoadingReq(true)
    setRequirements([])
    getTaxonomyRequirements(selected)
      .then((d) => setRequirements(d.requirements))
      .catch(() => setError('Failed to load skill requirements.'))
      .finally(() => setIsLoadingReq(false))
  }, [selected])

  const filteredOcc = useMemo(
    () => occupations.filter((o) => o.toLowerCase().includes(occSearch.toLowerCase())),
    [occupations, occSearch],
  )

  const domains = useMemo(
    () => ['All', ...Array.from(new Set(requirements.map((r) => r.domain))).sort()],
    [requirements],
  )

  const filteredReq = useMemo(() => {
    let list = [...requirements]
    if (domainFilter !== 'All') list = list.filter((r) => r.domain === domainFilter)
    if (reqSearch) list = list.filter((r) => r.skill_name.toLowerCase().includes(reqSearch.toLowerCase()))
    list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return list
  }, [requirements, reqSearch, domainFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown size={12} className="text-slate-600" />
    return (
      <ArrowUpDown
        size={12}
        className={`text-cyan-400 ${sortDir === 'asc' ? 'rotate-180' : ''} transition-transform`}
      />
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers size={24} className="text-cyan-400" />
            Skill Explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse {occupations.length} O*NET occupations and explore their required skills.
          </p>
        </div>
        {selected && (
          <Link
            to="/career-analysis"
            state={{ prefillOccupation: selected }}
            className="self-start inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 text-sm font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Brain size={16} />
            Analyze My Gap
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Occupation List ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0d1321]/60 backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search occupations…"
                value={occSearch}
                onChange={(e) => setOccSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            {isLoadingOcc ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500" />
              </div>
            ) : filteredOcc.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500 italic">No occupations match.</p>
            ) : (
              filteredOcc.map((occ) => (
                <button
                  key={occ}
                  onClick={() => setSelected(occ)}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between gap-2 transition border-b border-slate-800/40 last:border-0 ${
                    selected === occ
                      ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <span className="leading-snug">{occ}</span>
                  <ChevronRight size={14} className="shrink-0 opacity-40" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Skill Requirements ───────────────────────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-[#0d1321]/60 backdrop-blur-xl flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
              <BookOpen size={44} className="text-slate-700" />
              <div>
                <h3 className="font-bold text-white">Select an occupation</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Choose an occupation from the list to explore its required skills.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="p-4 border-b border-slate-800 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Selected Occupation</span>
                    <h2 className="text-base font-extrabold text-white leading-tight mt-0.5">{selected}</h2>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-400">
                    {filteredReq.length} skills
                  </span>
                </div>

                {/* Search + filter row */}
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[140px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter skills…"
                      value={reqSearch}
                      onChange={(e) => setReqSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                  <div className="relative">
                    <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950 pl-7 pr-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition appearance-none"
                    >
                      {domains.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto max-h-[55vh]">
                {isLoadingReq ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500" />
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-slate-950/80 backdrop-blur z-10">
                      <tr>
                        {(
                          [
                            ['skill_name', 'Skill'],
                            ['domain', 'Domain'],
                            ['source', 'Source'],
                            ['importance', 'Importance'],
                          ] as [SortKey, string][]
                        ).map(([k, label]) => (
                          <th
                            key={k}
                            onClick={() => toggleSort(k)}
                            className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300 transition select-none border-b border-slate-800"
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              <SortIcon k={k} />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReq.map((req, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-800/40 hover:bg-slate-800/20 transition"
                        >
                          <td className="px-4 py-3 font-semibold text-white text-xs leading-snug">
                            {req.skill_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${domainColor(req.domain)}`}>
                              {req.domain}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-semibold ${req.source === 'technology' ? 'text-purple-400' : 'text-slate-400'}`}>
                              {req.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ImportanceBar value={req.importance} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer CTA */}
              {!isLoadingReq && requirements.length > 0 && (
                <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    See how your current skills compare to <span className="font-semibold text-slate-300">{selected}</span>.
                  </p>
                  <Link
                    to="/career-analysis"
                    state={{ prefillOccupation: selected }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 text-xs font-bold transition"
                  >
                    <Sparkles size={12} />
                    Analyze My Gap
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
