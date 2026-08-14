import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  ChevronRight, 
  ChevronLeft, 
  Brain, 
  Sparkles, 
  Plus, 
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createCareerAnalysis } from '../../services/careerAnalyses'
import { getCurrentUserProfile, upsertProfile } from '../../services/profiles'
import { getTaxonomyRequirements } from '../../services/platformApi'
import type { SkillRequirement } from '../../services/platformApi'

const STEPS = [
  { id: 1, label: 'Current Profile' },
  { id: 2, label: 'Target Role' },
  { id: 3, label: 'Education' },
  { id: 4, label: 'Experience' },
  { id: 5, label: 'Skills' },
]

// Fallback if the target role isn't in the taxonomy
const FALLBACK_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'SQL', 'Node.js',
  'Machine Learning', 'Docker', 'AWS', 'Git', 'System Design', 'Linux',
]

type AnalysisDraft = {
  currentStep: number
  currentRole: string
  yearsExperience: string
  highestEducation: string
  targetCareer: string
  goals: string
  major: string
  institution: string
  projectsDescription: string
  pastCompany: string
  skills: string[]
}

const ANALYSIS_DRAFT_KEY = 'career_analysis_draft'

function readAnalysisDraft(): AnalysisDraft {
  if (typeof window === 'undefined') {
    return {
      currentStep: 1,
      currentRole: '',
      yearsExperience: '0-1 years',
      highestEducation: "Bachelor's Degree",
      targetCareer: '',
      goals: '',
      major: '',
      institution: '',
      projectsDescription: '',
      pastCompany: '',
      skills: [],
    }
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(ANALYSIS_DRAFT_KEY) || '{}') as Partial<AnalysisDraft>
    return {
      currentStep: parsed.currentStep ?? 1,
      currentRole: parsed.currentRole ?? '',
      yearsExperience: parsed.yearsExperience ?? '0-1 years',
      highestEducation: parsed.highestEducation ?? "Bachelor's Degree",
      targetCareer: parsed.targetCareer ?? '',
      goals: parsed.goals ?? '',
      major: parsed.major ?? '',
      institution: parsed.institution ?? '',
      projectsDescription: parsed.projectsDescription ?? '',
      pastCompany: parsed.pastCompany ?? '',
      skills: parsed.skills ?? [],
    }
  } catch {
    return {
      currentStep: 1,
      currentRole: '',
      yearsExperience: '0-1 years',
      highestEducation: "Bachelor's Degree",
      targetCareer: '',
      goals: '',
      major: '',
      institution: '',
      projectsDescription: '',
      pastCompany: '',
      skills: [],
    }
  }
}

function writeAnalysisDraft(draft: AnalysisDraft) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ANALYSIS_DRAFT_KEY, JSON.stringify(draft))
  }
}

function clearAnalysisDraft() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ANALYSIS_DRAFT_KEY)
  }
}

export default function CareerAnalysis() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialDraft = readAnalysisDraft()
  const [currentStep, setCurrentStep] = useState(initialDraft.currentStep)
  
  // Wizard state values
  const [currentRole, setCurrentRole] = useState(initialDraft.currentRole)
  const [yearsExperience, setYearsExperience] = useState(initialDraft.yearsExperience)
  const [highestEducation, setHighestEducation] = useState(initialDraft.highestEducation)
  
  const [targetCareer, setTargetCareer] = useState(initialDraft.targetCareer)
  const [goals, setGoals] = useState(initialDraft.goals)
  
  const [major, setMajor] = useState(initialDraft.major)
  const [institution, setInstitution] = useState(initialDraft.institution)
  
  const [projectsDescription, setProjectsDescription] = useState(initialDraft.projectsDescription)
  const [pastCompany, setPastCompany] = useState(initialDraft.pastCompany)

  const [skills, setSkills] = useState<string[]>(initialDraft.skills)
  const [skillInput, setSkillInput] = useState('')
  const [taxonomySkills, setTaxonomySkills] = useState<SkillRequirement[]>([])
  const [taxonomyLoading, setTaxonomyLoading] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const prefillOccupation = (location.state as { prefillOccupation?: string } | null)?.prefillOccupation

  // Load profile values if they exist
  useEffect(() => {
    if (user) {
      getCurrentUserProfile(user.id)
        .then((profile) => {
          if (!profile) return
          if (profile.target_career) setTargetCareer(profile.target_career)
          if (profile.experience_level) {
            const mapExp: Record<string, string> = {
              'Junior': '0-2 years',
              'Mid': '2-5 years',
              'Senior': '5+ years',
            }
            setYearsExperience(mapExp[profile.experience_level] || '0-1 years')
          }
        })
        .catch((error) => console.error('Error loading profile for analysis:', error))
    }
  }, [user])

  useEffect(() => {
    if (prefillOccupation) {
      setTargetCareer(prefillOccupation)
      setCurrentStep(2)
    }
  }, [prefillOccupation])

  // When user advances to step 5, load taxonomy skills for their target role
  const loadTaxonomySkills = useCallback(async () => {
    if (!targetCareer) return
    setTaxonomyLoading(true)
    try {
      const res = await getTaxonomyRequirements(targetCareer)
      setTaxonomySkills(res.requirements)
    } catch {
      // Graceful degradation — fall back to static list
      setTaxonomySkills([])
    } finally {
      setTaxonomyLoading(false)
    }
  }, [targetCareer])

  useEffect(() => {
    if (currentStep === 5) loadTaxonomySkills()
  }, [currentStep, loadTaxonomySkills])

  useEffect(() => {
    writeAnalysisDraft({
      currentStep,
      currentRole,
      yearsExperience,
      highestEducation,
      targetCareer,
      goals,
      major,
      institution,
      projectsDescription,
      pastCompany,
      skills,
    })
  }, [currentStep, currentRole, yearsExperience, highestEducation, targetCareer, goals, major, institution, projectsDescription, pastCompany, skills])

  function handleAddSkill(skill: string) {
    const cleaned = skill.trim()
    if (cleaned && !skills.includes(cleaned)) {
      setSkills([...skills, cleaned])
    }
    setSkillInput('')
  }

  function handleRemoveSkill(skill: string) {
    setSkills(skills.filter(s => s !== skill))
  }

  // Next and Back buttons
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to save an analysis.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const mapExp: Record<string, string> = {
        '0-1 years': 'Junior',
        '2-5 years': 'Mid',
        '5+ years': 'Senior',
      }
      await upsertProfile({
        id: user.id,
        target_career: targetCareer,
        experience_level: mapExp[yearsExperience] || 'Junior',
      })

      // The backend computes the analysis itself: a real,
      // importance-weighted readiness score and real skill gaps when
      // targetCareer matches an actual O*NET occupation, or
      // Gemini-assisted (still taxonomy-checked) suggestions when it
      // doesn't. No client-side heuristic here anymore.
      await createCareerAnalysis({
        current_career: currentRole || 'Student',
        target_career: targetCareer,
        experience_level: yearsExperience,
        current_skills: skills,
        goals: goals || undefined,
      })

      clearAnalysisDraft()

      // Dispatch window events so dashboard instantly updates
      window.dispatchEvent(new Event('profile-updated'))
      window.dispatchEvent(new Event('analyses-updated'))
      window.dispatchEvent(new Event('roadmap-updated'))

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('Error submitting career analysis:', err)
      const message = err instanceof Error ? err.message : 'An error occurred while generating analysis. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 text-left max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Brain size={24} className="text-cyan-400" />
          AI Career Advisor
        </h1>
        <p className="text-sm text-slate-400 mt-1">Provide your details to identify skill gaps and generate a customized roadmap.</p>
      </div>

      {prefillOccupation && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          Prefilled from Skill Explorer for <span className="font-semibold text-white">{prefillOccupation}</span>.
        </div>
      )}

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-5 gap-2 pb-2">
        {STEPS.map((step) => (
          <div key={step.id} className="space-y-2">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= step.id ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'bg-slate-800'}`} />
            <span className={`hidden md:block text-xs font-bold transition ${currentStep === step.id ? 'text-white' : 'text-slate-500'}`}>
              {step.id}: {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1321]/60 p-8 backdrop-blur-xl relative">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* STEP 1: Current Profile */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="size-6 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center">1</span>
              Current Profile Status
            </h3>
            <p className="text-xs text-slate-400">Tell us about your current career background and education level.</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="currentRole" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Current Role / Major</label>
                <input
                  id="currentRole"
                  type="text"
                  placeholder="e.g. IT Student, Junior QA, Sales Clerk"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="yearsExp" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Years of Experience</label>
                <select
                  id="yearsExp"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition duration-200"
                >
                  <option value="0-1 years">0-1 years (Entry Level)</option>
                  <option value="2-5 years">2-5 years (Mid Level)</option>
                  <option value="5+ years">5+ years (Senior Level)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="highestEdu" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Highest Education Degree</label>
                <select
                  id="highestEdu"
                  value={highestEducation}
                  onChange={(e) => setHighestEducation(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition duration-200"
                >
                  <option value="High School">High School Diploma</option>
                  <option value="Associate's Degree">Associate's Degree</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD / Doctorate</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Target Role */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="size-6 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center">2</span>
              Target Role Goal
            </h3>
            <p className="text-xs text-slate-400">What is the dream career role you are building towards?</p>

            <div className="space-y-6">
              <div>
                <label htmlFor="targetCareer" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Target Career Role</label>
                <input
                  id="targetCareer"
                  type="text"
                  placeholder="e.g. AI Engineer, Frontend Developer, Cloud Architect"
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 transition duration-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="goals" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Core Goals & Motivation</label>
                <textarea
                  id="goals"
                  rows={4}
                  placeholder="Tell us what you hope to achieve, why you want to transition, or what your target timeline is."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 transition duration-200 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Education Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="size-6 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center">3</span>
              Education Details
            </h3>
            <p className="text-xs text-slate-400">Provide details about your academic studies or degrees.</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="major" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Field of Study / Major</label>
                <input
                  id="major"
                  type="text"
                  placeholder="e.g. Computer Science, Mechanical Engineering, Business"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="institution" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Institution / University</label>
                <input
                  id="institution"
                  type="text"
                  placeholder="e.g. Stanford University, Local College, Coursera"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 transition duration-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Experience / Projects */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="size-6 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center">4</span>
              Past Projects & Companies
            </h3>
            <p className="text-xs text-slate-400">Briefly mention your past employers or key projects you have worked on.</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="company" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Last Employer (Optional)</label>
                <input
                  id="company"
                  type="text"
                  placeholder="e.g. Acme Corp, Freelance"
                  value={pastCompany}
                  onChange={(e) => setPastCompany(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 transition duration-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="projectDesc" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Key Projects / Job Description</label>
                <textarea
                  id="projectDesc"
                  rows={4}
                  placeholder="Describe your primary responsibilities, key tools used, or projects built."
                  value={projectsDescription}
                  onChange={(e) => setProjectsDescription(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-cyan-500 transition duration-200 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Skills — using taxonomy data for the target role */}
        {currentStep === 5 && (() => {
          // Group skills by domain
          const skillsToShow = taxonomySkills.length > 0 ? taxonomySkills : FALLBACK_SKILLS.map(s => ({ skill_name: s, domain: 'General', source: 'fallback', importance: 0 }))
          const byDomain: Record<string, typeof skillsToShow> = {}
          for (const sk of skillsToShow) {
            ;(byDomain[sk.domain] ??= []).push(sk)
          }
          const domains = Object.entries(byDomain).sort((a, b) => b[1].length - a[1].length)

          return (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="size-6 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center">5</span>
                  Which skills do you already have?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {taxonomySkills.length > 0
                    ? `Showing the ${taxonomySkills.length} skills required for ${targetCareer} — tick the ones you already have.`
                    : 'Tick the skills you already have, or type a custom one.'}
                </p>
              </div>

              {taxonomyLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin text-cyan-400" />
                  Loading required skills for {targetCareer}…
                </div>
              )}

              {/* Selected/ticked count */}
              {skills.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
                  <CheckSquare size={14} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                    {skills.length} skill{skills.length > 1 ? 's' : ''} selected as already known
                  </span>
                </div>
              )}

              {/* Domain-grouped skill toggles */}
              {!taxonomyLoading && (
                <div className="space-y-5">
                  {domains.map(([domain, domainSkills]) => (
                    <div key={domain}>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">{domain}</h4>
                      <div className="flex flex-wrap gap-2">
                        {domainSkills.map((sk) => {
                          const name = sk.skill_name
                          const isSelected = skills.includes(name)
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => isSelected ? handleRemoveSkill(name) : handleAddSkill(name)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                isSelected
                                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {isSelected ? <CheckSquare size={11} /> : <Square size={11} />}
                              {name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom skill input */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Add a custom skill not in the list</p>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="e.g. Rust, dbt, Figma"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(skillInput))}
                    className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Form Action Controls */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-800/80">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:border-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !targetCareer}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              {isSubmitting ? (
                <>
                  <Sparkles size={16} className="animate-pulse" />
                  Generating Analysis...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  Analyze Career with AI
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
