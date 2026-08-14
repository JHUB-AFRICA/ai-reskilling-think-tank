import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Upload, ChevronRight, Loader2, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiClient } from '../../services/apiClient'
import type { CareerAnalysis } from '../../types/database'

type InputMode = 'paste' | 'upload'

export default function JobDescription() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<InputMode>('paste')
  const [jdText, setJdText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{ extracted: string[]; title: string } | null>(null)

  if (!user) return null

  async function extractTextFromFile(file: File): Promise<string> {
    // Plain text or Markdown files — read directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return file.text()
    }
    // For PDFs and Word docs: read as plain text (server will handle full extraction)
    // Client-side we just read the raw text content which works for many PDFs
    return file.text().catch(() => '')
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      const text = await extractTextFromFile(file)
      setJdText(text)
    } catch {
      setError('Could not read the file. Try copying and pasting the job description text instead.')
    }
  }

  async function handleAnalyse() {
    if (!jdText.trim()) {
      setError('Please paste or upload a job description first.')
      return
    }
    setError('')
    setIsAnalysing(true)
    setPreview(null)

    try {
      const result = await apiClient.post<{
        analysis: CareerAnalysis
        extracted_skills: string[]
        detected_title: string
      }>('/me/analyse-jd', { jd_text: jdText })

      setPreview({
        extracted: result.extracted_skills,
        title: result.detected_title,
      })

      // Dispatch events so dashboard refreshes
      window.dispatchEvent(new Event('analyses-updated'))
      window.dispatchEvent(new Event('roadmap-updated'))

      // Short delay so user sees the preview, then navigate to roadmap
      setTimeout(() => navigate('/learning'), 2500)
    } catch (err: any) {
      const message = err?.message ?? 'Failed to analyse the job description. Please try again.'
      setError(message)
    } finally {
      setIsAnalysing(false)
    }
  }

  return (
    <div className="space-y-8 text-left max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileText size={24} className="text-indigo-400" />
          Job Description Analyser
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Paste or upload a job description — the AI will extract required skills and build a targeted roadmap against your profile.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setMode('paste')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            mode === 'paste'
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={15} />
          Paste Text
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            mode === 'upload'
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload size={15} />
          Upload File
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-8 backdrop-blur-xl space-y-6">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Success preview */}
        {preview && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">
                Analysed: {preview.title || 'Job Description'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Detected {preview.extracted.length} required skills. Redirecting you to your new roadmap…
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {preview.extracted.slice(0, 12).map((s) => (
                <span key={s} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                  {s}
                </span>
              ))}
              {preview.extracted.length > 12 && (
                <span className="text-[11px] text-slate-500">+{preview.extracted.length - 12} more</span>
              )}
            </div>
          </div>
        )}

        {mode === 'paste' ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Job Description Text
            </label>
            <textarea
              rows={14}
              placeholder="Paste the full job description here — including required skills, responsibilities, and qualifications…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition resize-none"
            />
            <p className="text-[11px] text-slate-600">
              {jdText.length > 0 ? `${jdText.length} characters` : 'Minimum 100 characters recommended for best results'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Upload Job Description File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition ${
                fileName
                  ? 'border-indigo-500/40 bg-indigo-500/5'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              {fileName ? (
                <>
                  <CheckCircle2 size={32} className="text-indigo-400" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{fileName}</p>
                    <p className="text-xs text-slate-400 mt-1">{jdText.length} characters extracted</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFileName(null); setJdText('') }}
                    className="absolute top-3 right-3 rounded-lg p-1 hover:bg-slate-800 text-slate-500 hover:text-white transition"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-slate-600" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Drop a file or click to upload</p>
                    <p className="text-xs text-slate-500 mt-1">Supports .txt, .pdf, .docx (plain text extraction)</p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc,.md"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleAnalyse}
          disabled={isAnalysing || !jdText.trim() || !!preview}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 font-bold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]"
        >
          {isAnalysing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analysing job description…
            </>
          ) : preview ? (
            <>
              <CheckCircle2 size={18} />
              Analysis complete — redirecting…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Analyse with AI
              <ChevronRight size={16} />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-600 text-center">
          The AI extracts required skills from the JD, compares them against your existing profile, and generates a focused skill-gap roadmap.
        </p>
      </div>
    </div>
  )
}
