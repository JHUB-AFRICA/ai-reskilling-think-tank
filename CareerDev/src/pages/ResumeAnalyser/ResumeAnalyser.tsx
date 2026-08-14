import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle2, X, Loader2, Sparkles, AlertCircle, UserCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiClient } from '../../services/apiClient'

type ParsedSkill = {
  name: string
  confidence: 'high' | 'medium' | 'low'
  domain: string
}

type ResumeAnalysisResult = {
  detected_skills: ParsedSkill[]
  experience_level: string
  detected_role: string
  summary: string
}

export default function ResumeAnalyser() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())

  async function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string ?? '')
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setError('')
    setResult(null)
    try {
      const text = await readFileAsText(file)
      setResumeText(text)
    } catch {
      setError('Could not read the file. Try a plain .txt file or paste your resume text below.')
    }
  }, [])

  if (!user) return null

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() { setIsDragging(false) }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleAnalyse() {
    if (!resumeText.trim()) {
      setError('Please upload or paste your resume first.')
      return
    }
    setError('')
    setIsAnalysing(true)
    setResult(null)

    try {
      const data = await apiClient.post<ResumeAnalysisResult>(
        '/me/analyse-resume',
        { resume_text: resumeText }
      )
      setResult(data)
      // Pre-select all high-confidence skills
      setSelectedSkills(new Set(data.detected_skills.filter((s) => s.confidence === 'high').map((s) => s.name)))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to analyse resume. Please try again.')
    } finally {
      setIsAnalysing(false)
    }
  }

  async function handleImport() {
    if (!result || selectedSkills.size === 0) return
    setIsImporting(true)
    try {
      await apiClient.patch('/me/profile', {
        experience_level: result.experience_level,
      })
      // Store skills in local state for use in career analysis
      localStorage.setItem('imported_skills', JSON.stringify(Array.from(selectedSkills)))
      window.dispatchEvent(new Event('profile-updated'))
      navigate('/career-analysis')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to import skills.')
    } finally {
      setIsImporting(false)
    }
  }

  function toggleSkill(name: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const CONFIDENCE_CONFIG = {
    high:   { label: 'High',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    medium: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    low:    { label: 'Low',    color: 'text-slate-500',   bg: 'bg-slate-800 border-slate-700' },
  }

  // Group detected skills by domain
  const byDomain: Record<string, ParsedSkill[]> = {}
  for (const sk of result?.detected_skills ?? []) {
    ;(byDomain[sk.domain] ??= []).push(sk)
  }

  return (
    <div className="space-y-8 text-left max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <UserCheck size={24} className="text-purple-400" />
          Resume Analyser
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload your resume and the AI will detect your current skills, experience level, and role — pre-filling your profile in one click.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-8 backdrop-blur-xl space-y-6">

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Drop zone */}
        <div
          ref={dropZoneRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-purple-500/60 bg-purple-500/10 scale-[1.01]'
              : fileName
              ? 'border-purple-500/30 bg-purple-500/5'
              : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
          }`}
        >
          {fileName ? (
            <>
              <FileText size={36} className="text-purple-400" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">{fileName}</p>
                <p className="text-xs text-slate-400 mt-1">{resumeText.length.toLocaleString()} characters loaded</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFileName(null)
                  setResumeText('')
                  setResult(null)
                }}
                className="absolute top-3 right-3 rounded-lg p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="size-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Upload size={28} className="text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">Drop your resume here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse — .txt, .pdf, .docx supported</p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx,.doc,.md"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            className="sr-only"
          />
        </div>

        {/* Manual paste */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Or paste your resume text
          </label>
          <textarea
            rows={6}
            placeholder="Paste your resume content here…"
            value={resumeText}
            onChange={(e) => { setResumeText(e.target.value); setFileName(null); setResult(null) }}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 transition resize-none"
          />
        </div>

        <button
          onClick={handleAnalyse}
          disabled={isAnalysing || !resumeText.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3.5 font-bold text-white transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(147,51,234,0.2)]"
        >
          {isAnalysing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analysing your resume…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Analyse Resume
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-2xl border border-purple-500/20 bg-[#0d1321]/80 p-8 backdrop-blur-xl space-y-6">
          {/* Detected profile */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-4 py-2">
              <UserCheck size={14} className="text-purple-400" />
              <span className="text-xs font-bold text-purple-300">{result.detected_role || 'Professional'}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2">
              <span className="text-xs font-bold text-cyan-300">{result.experience_level}</span>
            </div>
            <span className="text-xs text-slate-400">{result.detected_skills.length} skills detected</span>
          </div>

          {result.summary && (
            <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-purple-500/40 pl-4">{result.summary}</p>
          )}

          {/* Skill selection by domain */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Detected Skills — tick to import</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSkills(new Set(result.detected_skills.map((s) => s.name)))}
                  className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition"
                >
                  Select all
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => setSelectedSkills(new Set())}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(byDomain).map(([domain, skills]) => (
                <div key={domain}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">{domain}</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((sk) => {
                      const cc = CONFIDENCE_CONFIG[sk.confidence]
                      const isSelected = selectedSkills.has(sk.name)
                      return (
                        <button
                          key={sk.name}
                          onClick={() => toggleSkill(sk.name)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            isSelected
                              ? 'border-purple-500/40 bg-purple-500/15 text-purple-300'
                              : `${cc.bg} ${cc.color} opacity-60 hover:opacity-100`
                          }`}
                        >
                          {isSelected ? <CheckCircle2 size={11} /> : <span className={`size-1.5 rounded-full ${isSelected ? 'bg-purple-400' : ''}`} />}
                          {sk.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || selectedSkills.size === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3.5 font-bold text-white transition-all disabled:opacity-50"
          >
            {isImporting ? (
              <><Loader2 size={16} className="animate-spin" />Importing…</>
            ) : (
              <><CheckCircle2 size={16} />Import {selectedSkills.size} Skill{selectedSkills.size !== 1 ? 's' : ''} to Profile</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
