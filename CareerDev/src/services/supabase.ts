import { createClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(value: string | undefined) {
  if (!value) {
    return ''
  }

  try {
    const url = new URL(value.trim())
    url.pathname = url.pathname.replace(/\/(?:rest|auth|storage)\/v1\/?$/i, '')
    url.search = ''
    url.hash = ''

    return url.toString().replace(/\/$/, '')
  } catch {
    return value.trim().replace(/\/(?:rest|auth|storage)\/v1\/?$/i, '').replace(/\/$/, '')
  }
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
)
