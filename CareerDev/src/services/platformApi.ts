// src/services/platformApi.ts
//
// Typed service wrappers for all backend endpoints not yet consumed by
// CareerDev. Built on the same apiClient/apiError pattern as the other
// service files so error handling and auth token injection are consistent.

import { apiClient } from './apiClient'

// ── Health ────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<{ status: string }> {
  return apiClient.get<{ status: string }>('/health', false)
}

// ── Taxonomy ──────────────────────────────────────────────────────────────

export interface TaxonomyStats {
  occupation_count: number
  skill_count: number
  domain_count: number
  technology_skill_count: number
  domain_distribution: Record<string, number>
}

export async function getTaxonomyStats(): Promise<TaxonomyStats> {
  return apiClient.get<TaxonomyStats>('/taxonomy/stats', false)
}

export interface SkillRequirement {
  skill_name: string
  domain: string
  source: string
  importance: number
}

export async function getTaxonomyRequirements(
  occupation: string,
): Promise<{ requirements: SkillRequirement[] }> {
  const encoded = encodeURIComponent(occupation)
  return apiClient.get<{ requirements: SkillRequirement[] }>(
    `/taxonomy/requirements?occupation=${encoded}`,
    false,
  )
}

// ── Occupations ───────────────────────────────────────────────────────────

export async function getOccupations(): Promise<{ occupations: string[] }> {
  return apiClient.get<{ occupations: string[] }>('/occupations', false)
}

// ── LRS Statements ────────────────────────────────────────────────────────

export interface LrsStatement {
  actor?: { mbox?: string; name?: string }
  verb?: { id?: string; display?: Record<string, string> }
  object?: { id?: string; definition?: { name?: Record<string, string> } }
  timestamp?: string
  result?: Record<string, unknown>
  context?: Record<string, unknown>
  [key: string]: unknown
}

export async function getLrsStatements(
  limit = 50,
): Promise<{ statements: LrsStatement[] }> {
  return apiClient.get<{ statements: LrsStatement[] }>(
    `/lrs/statements?limit=${limit}`,
    false,
  )
}

// ── AI Career Guidance ────────────────────────────────────────────────────

export interface CareerGuidanceRequest {
  resume_text: string
  career_goal: string
}

export interface SkillSuggestion {
  skill: string
  reason?: string
  in_taxonomy: boolean
  skill_id?: string
  priority?: string
}

export async function getCareerGuidance(
  req: CareerGuidanceRequest,
): Promise<{ suggestions: SkillSuggestion[]; cached: boolean }> {
  return apiClient.post<{ suggestions: SkillSuggestion[]; cached: boolean }>(
    '/me/career-guidance',
    req,
  )
}

/**
 * SSE streaming variant — returns a ReadableStream of server-sent events.
 * Each data event is a JSON chunk: { chunk: string }
 * A final `event: result` event carries the full classified suggestions.
 */
export async function streamCareerGuidance(
  req: CareerGuidanceRequest,
  token: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiBase =
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

  const res = await fetch(`${apiBase}/me/career-guidance/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  })

  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error((errBody as { detail?: string }).detail ?? res.statusText)
  }

  return res.body
}

// ── Skill Resources ───────────────────────────────────────────────────────

export interface SkillResourceLink {
  title: string
  provider: string
  url: string
  curated?: boolean
}

export async function getSkillResources(
  skills: { skill_id: string; skill_name: string }[],
): Promise<{ resources: Record<string, SkillResourceLink[]> }> {
  return apiClient.post<{ resources: Record<string, SkillResourceLink[]> }>(
    '/skills/resources',
    { skills },
    false,
  )
}

export interface OrgSkillFrameworkEntry {
  role_name: string
  required_skills: string[]
}

export async function getOrgSkillFrameworks(): Promise<{ frameworks: OrgSkillFrameworkEntry[] }> {
  return apiClient.get<{ frameworks: OrgSkillFrameworkEntry[] }>('/org/skill-framework')
}

export async function saveOrgSkillFrameworks(
  frameworks: OrgSkillFrameworkEntry[],
): Promise<{ saved: number; frameworks: OrgSkillFrameworkEntry[] }> {
  return apiClient.post<{ saved: number; frameworks: OrgSkillFrameworkEntry[] }>(
    '/org/skill-framework',
    { frameworks },
  )
}

export interface ProviderConnection {
  id: string
  user_id: string
  provider_name: string
  provider_account?: string
  connected_at: string
  last_sync_at: string | null
}

export interface ProviderProgressItem {
  resource_id: number
  status?: string
  progress_percent?: number
  evidence_url?: string
}

export async function listProviderConnections(): Promise<{ connections: ProviderConnection[] }> {
  return apiClient.get<{ connections: ProviderConnection[] }>('/me/provider-connections')
}

export async function connectProvider(
  provider: Omit<ProviderConnection, 'id' | 'user_id' | 'connected_at' | 'last_sync_at'>,
): Promise<ProviderConnection> {
  return apiClient.post<ProviderConnection>('/me/provider-connections', provider)
}

export async function syncProviderProgress(
  providerName: string,
  progress: ProviderProgressItem[],
): Promise<{ synced: boolean; updated_items: number }> {
  return apiClient.post<{ synced: boolean; updated_items: number }>(
    `/me/provider-connections/${encodeURIComponent(providerName)}/sync`,
    { progress },
  )
}

export async function verifyLearningResourceLink(
  resourceId: number,
): Promise<{ id: number; last_verified_at: string; last_link_status: string }> {
  return apiClient.post<{ id: number; last_verified_at: string; last_link_status: string }>(
    `/resources/${resourceId}/verify`,
    {},
    false,
  )
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  role: string
}

export async function getAdminUsers(): Promise<{ users: AdminUser[] }> {
  return apiClient.get<{ users: AdminUser[] }>('/admin/users')
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<{ user_id: string; role: string }> {
  return apiClient.patch<{ user_id: string; role: string }>(
    `/admin/users/${userId}/role`,
    { role },
  )
}
