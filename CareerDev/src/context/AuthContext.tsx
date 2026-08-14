import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../services/supabase'

type LocalUserRecord = {
  email: string
  password: string
  user: User
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: React.ReactNode
}

function readLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem('local_users') || '[]') as LocalUserRecord[]
  } catch {
    return []
  }
}

function writeLocalUsers(users: LocalUserRecord[]) {
  localStorage.setItem('local_users', JSON.stringify(users))
}

function readLocalSession() {
  try {
    const savedSession = localStorage.getItem('local_session')
    return savedSession ? JSON.parse(savedSession) as Session : null
  } catch (err) {
    console.error('Error parsing local session:', err)
    return null
  }
}

function createLocalUser(email: string) {
  return {
    id: crypto.randomUUID(),
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User
}

function createLocalSession(user: User) {
  return {
    access_token: 'local-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'local-refresh',
    user,
  } as Session
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return ''
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }

  return String(error)
}

function shouldUseLocalFallback(error: unknown) {
  if (!isSupabaseConfigured) {
    return true
  }

  const message = getErrorMessage(error).toLowerCase()

  return [
    'failed to fetch',
    'fetch failed',
    'networkerror',
    'network request failed',
    'invalid path specified in request url',
    'invalid path',
    'invalid api key',
    'invalid apikey',
    'api key is invalid',
    'api key not found',
    'auth api key',
  ].some((pattern) => message.includes(pattern))
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(readLocalSession())
      setIsLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session ?? readLocalSession())
      })
      .catch((error) => {
        console.warn('Falling back to local session after Supabase session failure:', error)
        setSession(readLocalSession())
      })
      .finally(() => setIsLoading(false))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isConfigured: isSupabaseConfigured,
      async signIn(email, password) {
        if (!isSupabaseConfigured) {
          const localUsers = readLocalUsers()
          const found = localUsers.find((userRecord) => userRecord.email === email)
          if (!found) {
            throw new Error('Invalid login credentials.')
          }
          if (found.password !== password) {
            throw new Error('Invalid login credentials.')
          }
          const mockSession = createLocalSession(found.user)

          localStorage.setItem('local_session', JSON.stringify(mockSession))
          setSession(mockSession)
          return
        }

        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password })

          if (error) {
            throw error
          }
        } catch (error) {
          if (!shouldUseLocalFallback(error)) {
            throw error
          }

          const localUsers = readLocalUsers()
          let found = localUsers.find((userRecord) => userRecord.email === email)

          if (!found) {
            found = { email, password, user: createLocalUser(email) }
            localUsers.push(found)
            writeLocalUsers(localUsers)
          } else if (found.password !== password) {
            throw new Error('Invalid login credentials.')
          }

          const localSession = createLocalSession(found.user)
          localStorage.setItem('local_session', JSON.stringify(localSession))
          setSession(localSession)
        }
      },
      async signUp(email, password) {
        if (!isSupabaseConfigured) {
          const localUsers = readLocalUsers()
          if (localUsers.some((userRecord) => userRecord.email === email)) {
            throw new Error('User with this email already exists.')
          }
          const mockUser = createLocalUser(email)
          const mockSession = createLocalSession(mockUser)

          localUsers.push({ email, password, user: mockUser })
          writeLocalUsers(localUsers)
          localStorage.setItem('local_session', JSON.stringify(mockSession))
          setSession(mockSession)
          return
        }

        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })

          if (error) {
            throw error
          }
        } catch (error) {
          if (!shouldUseLocalFallback(error)) {
            throw error
          }

          const localUsers = readLocalUsers()
          if (localUsers.some((userRecord) => userRecord.email === email)) {
            throw new Error('User with this email already exists.')
          }

          const localUser = createLocalUser(email)
          const localSession = createLocalSession(localUser)

          localUsers.push({ email, password, user: localUser })
          writeLocalUsers(localUsers)
          localStorage.setItem('local_session', JSON.stringify(localSession))
          setSession(localSession)
        }
      },
      async signOut() {
        localStorage.removeItem('local_session')

        if (!isSupabaseConfigured) {
          setSession(null)
          return
        }

        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }
      },
      async resetPassword(email) {
        if (!isSupabaseConfigured) {
          const localUsers = readLocalUsers()
          if (!localUsers.some((userRecord) => userRecord.email === email)) {
            throw new Error('No account found with that email address.')
          }
          return
        }

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
          })

          if (error) {
            throw error
          }
        } catch (error) {
          if (shouldUseLocalFallback(error)) {
            const localUsers = readLocalUsers()
            if (!localUsers.some((userRecord) => userRecord.email === email)) {
              throw new Error('No account found with that email address.')
            }
            return
          }
          throw error
        }
      },
    }),
    [isLoading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
