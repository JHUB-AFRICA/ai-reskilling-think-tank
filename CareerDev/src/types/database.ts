export type Profile = {
  id: string
  email?: string
  role?: 'job_seeker' | 'workforce_analyst' | 'administrator'
  full_name: string | null
  target_career: string | null
  experience_level: string | null
  created_at: string
  updated_at: string
}

export type CareerAnalysis = {
  id: string
  user_id: string
  current_career: string
  target_career: string
  experience_level: string
  current_skills: string[]
  goals: string | null
  readiness_score: number
  summary: string | null
  skill_gaps: SkillGap[]
  learning_recommendations: LearningRecommendation[]
  // True when target_career matched a real O*NET occupation and this
  // analysis is grounded in verified labour-market data. False means
  // it's Gemini-assisted (still taxonomy-checked per skill, but the
  // overall readiness score and gap set are a best-effort estimate,
  // not a verified occupational requirement set). Always show this
  // distinction to the user rather than hiding it -- see
  // src/reskilling/career_analysis.py's module docstring.
  matched_taxonomy: boolean
  created_at: string
}

export type SkillGap = {
  skill: string
  skill_id?: string
  priority: 'low' | 'medium' | 'high'
  reason: string
}

export type LearningRecommendation = {
  title: string
  provider: string
  url: string
  skill: string
  skill_id?: string
}

export type NewCareerAnalysis = {
  user_id: string
  current_career: string
  target_career: string
  experience_level: string
  current_skills: string[]
  goals?: string
  readiness_score?: number
  summary?: string
  skill_gaps?: SkillGap[]
  learning_recommendations?: LearningRecommendation[]
}

export type LearningResource = {
  id: number
  skill_id: string | null
  skill_name: string | null
  title: string
  url: string
  provider: string
  is_free: boolean
  description: string | null
  resource_type: 'course' | 'learning_path' | 'video' | 'article' | 'project' | 'assessment'
  difficulty: string | null
  duration_minutes: number | null
  language: string
  verification_status: 'verified' | 'provider_synced' | 'discovery'
  last_verified_at: string | null
  last_link_status: string | null
}

export type UserLearningItem = {
  id: string
  resource_id: number
  title: string
  url: string
  provider: string
  skill_name: string | null
  is_free: boolean
  resource_type: string
  difficulty: string | null
  duration_minutes: number | null
  verification_status: LearningResource['verification_status']
  status: 'saved' | 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  progress_percent: number
  time_spent_minutes: number
  notes: string | null
  evidence_url: string | null
  completion_source: 'self_reported' | 'verified_certificate' | 'provider_verified' | 'project_evidence'
  started_at: string | null
  completed_at: string | null
  updated_at: string
}
