import { apiClient } from './apiClient'
import type { LearningResource, UserLearningItem } from '../types/database'

export async function browseLearningResources(filters: {
  query?: string
  verification_status?: LearningResource['verification_status']
} = {}) {
  const params = new URLSearchParams()
  if (filters.query) params.set('query', filters.query)
  if (filters.verification_status) params.set('verification_status', filters.verification_status)
  const suffix = params.size ? `?${params}` : ''
  return apiClient.get<{ resources: LearningResource[] }>(`/resources${suffix}`, false)
}

export async function listMyLearningItems() {
  return apiClient.get<{ items: UserLearningItem[] }>('/me/learning-items')
}

export async function updateLearningItem(resourceId: number, item: {
  status: UserLearningItem['status']
  progress_percent?: number
  time_spent_minutes?: number
  notes?: string
  evidence_url?: string
  completion_source?: UserLearningItem['completion_source']
}) {
  return apiClient.put<UserLearningItem>(`/me/learning-items/${resourceId}`, item)
}
