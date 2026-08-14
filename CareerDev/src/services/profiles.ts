// src/services/profiles.ts
//
// Rewired to call the platform's FastAPI backend (GET/PATCH /me/profile)
// instead of querying the Supabase `profiles` table directly from the
// browser. Function names and signatures are unchanged from the
// original -- every page that imports these keeps working with no
// changes required.
import { apiClient, ApiError } from './apiClient'
import type { Profile } from '../types/database'

function profileKey(userId: string) {
  return `user_profile:${userId}`
}

function readLocalProfile(userId: string) {
  try {
    const userProfile = localStorage.getItem(profileKey(userId))
    return JSON.parse(userProfile || 'null') as Profile | null
  } catch {
    return null
  }
}

function writeLocalProfile(profile: Profile) {
  localStorage.setItem(profileKey(profile.id), JSON.stringify(profile))
}

export async function getCurrentUserProfile(userId: string) {
  try {
    const data = await apiClient.get<Profile>('/me/profile')
    writeLocalProfile(data)
    return data
  } catch (error) {
    // Not signed in, or the API is unreachable -- fall back to
    // whatever was last cached locally rather than breaking the page.
    console.warn('Falling back to local profile cache:', error)
    return readLocalProfile(userId)
  }
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  try {
    const data = await apiClient.patch<Profile>('/me/profile', {
      full_name: profile.full_name,
      target_career: profile.target_career,
      experience_level: profile.experience_level,
    })
    writeLocalProfile(data)
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to save profile.')
  }
}
