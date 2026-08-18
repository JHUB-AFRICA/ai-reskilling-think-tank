// src/services/apiClient.ts
//
// Connects CareerDev to the reskilling platform's tested FastAPI
// backend, replacing direct client-to-Supabase data access. Supabase
// is still used for authentication only (see supabase.ts and
// AuthContext.tsx, unchanged) -- the access_token it produces is
// exactly what this backend's auth.py verifies, no changes needed on
// either side for that part.
import { supabase } from './supabase'

function normalizeApiUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) return 'http://localhost:8000'
  let url = rawUrl.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  return url.replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined)

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    try {
      const savedSession = localStorage.getItem('local_session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as { access_token?: string; session?: { access_token?: string } }
        if (parsed.access_token) {
          return parsed.access_token
        }
        if (parsed.session?.access_token) {
          return parsed.session.access_token
        }
      }
    } catch {
      // Ignore malformed local storage values and fall back to Supabase.
    }
  }

  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = await getAccessToken()
    if (!token) {
      throw new ApiError('Not signed in.', 401)
    }
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new ApiError(errBody.detail ?? res.statusText, res.status)
  }
  return res.json()
}

export const apiClient = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: 'PATCH', body, auth }),
  put: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: 'PUT', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
}
