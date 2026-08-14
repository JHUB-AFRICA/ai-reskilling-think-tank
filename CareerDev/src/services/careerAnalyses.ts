// src/services/careerAnalyses.ts
//
// Rewired to call the platform's FastAPI backend instead of querying
// the Supabase `career_analyses` table directly. listCareerAnalyses,
// updateAnalysisRecommendations, and resetCareerAnalysesForUser keep
// their original signatures -- no call sites need to change for those.
//
// createCareerAnalysis's contract DOES change: the original version
// persisted an already-computed CareerAnalysis (the caller ran
// generateAIAnalysis() first, then handed the full result here just
// to save it). The new version takes the raw wizard input and the
// backend computes the analysis itself -- grounded against real O*NET
// data when the target career matches a real occupation, Gemini-
// assisted (still taxonomy-checked) otherwise. See
// src/pages/CareerAnalysis/CareerAnalysis.tsx for the updated caller.
import { apiClient, ApiError } from './apiClient'
import type { CareerAnalysis } from '../types/database'

export type CareerAnalysisRequest = {
  current_career: string
  target_career: string
  experience_level: string
  current_skills: string[]
  goals?: string
}

const LOCAL_ANALYSES_KEY = 'local_analyses'

function readLocalAnalyses() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ANALYSES_KEY) || '[]') as CareerAnalysis[]
  } catch {
    return []
  }
}

function writeLocalAnalyses(analyses: CareerAnalysis[]) {
  localStorage.setItem(LOCAL_ANALYSES_KEY, JSON.stringify(analyses))
}

export async function listCareerAnalyses(userId: string) {
  try {
    const data = await apiClient.get<{ analyses: CareerAnalysis[] }>('/me/career-analyses')
    writeLocalAnalyses(data.analyses)
    return data.analyses
  } catch (error) {
    console.warn('Falling back to local career analyses cache:', error)
    return readLocalAnalyses().filter((a) => a.user_id === userId)
  }
}

export async function createCareerAnalysis(request: CareerAnalysisRequest) {
  try {
    const data = await apiClient.post<CareerAnalysis>('/me/career-analysis', request)
    writeLocalAnalyses([data, ...readLocalAnalyses().filter((item) => item.id !== data.id)])
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message)
    }
    throw error
  }
}

export async function updateAnalysisRecommendations(analysisId: string, recommendations: unknown[]) {
  try {
    const data = await apiClient.patch<CareerAnalysis>(
      `/me/career-analyses/${analysisId}/recommendations`,
      { recommendations },
    )
    writeLocalAnalyses(readLocalAnalyses().map((a) => (a.id === analysisId ? data : a)))
    return data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error('Analysis not found.')
    }
    throw error
  }
}

export async function resetCareerAnalysesForUser(userId: string) {
  await apiClient.delete('/me/career-analyses')
  writeLocalAnalyses(readLocalAnalyses().filter((a) => a.user_id !== userId))
}
