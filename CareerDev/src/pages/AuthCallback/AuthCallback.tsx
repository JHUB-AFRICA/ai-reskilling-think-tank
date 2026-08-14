import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

/**
 * AuthCallback — handles the redirect link that Supabase sends in the
 * email-confirmation (and password-reset) email.
 *
 * Supabase can embed the verification payload in two ways:
 *   1. PKCE flow  → query-param  ?code=<code>
 *   2. Implicit   → URL hash     #access_token=<token>&...
 *
 * We handle both so the feature works regardless of which flow is active in
 * the Supabase project settings.
 */
function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        // --- PKCE flow: ?code=<authorization_code> ---
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          setStatus('success')
          setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
          return
        }

        // --- Implicit flow: #access_token=<token>&refresh_token=<token>&... ---
        const hash = window.location.hash.slice(1) // strip leading '#'
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
          setStatus('success')
          setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
          return
        }

        // If neither pattern matches the URL is malformed / link was already used
        throw new Error(
          'No verification token found in the URL. The link may have already been used or has expired.',
        )
      } catch (err) {
        setStatus('error')
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred during verification.',
        )
      }
    }

    void handleCallback()
  }, [navigate])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#050814]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/3 left-1/3 size-72 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 size-72 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1321]/60 p-10 shadow-2xl backdrop-blur-xl text-center">
        {status === 'verifying' && (
          <>
            {/* Spinner */}
            <div className="mx-auto mb-6 size-14 rounded-full border-4 border-slate-700 border-t-cyan-400 animate-spin" />
            <h1 className="text-2xl font-extrabold text-white mb-2">Verifying your email…</h1>
            <p className="text-sm text-slate-400">Please wait a moment while we confirm your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            {/* Check mark */}
            <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <svg className="size-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Email confirmed!</h1>
            <p className="text-sm text-slate-400">Your account is verified. Redirecting you to the dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            {/* Error icon */}
            <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-rose-500/15 border border-rose-500/30">
              <svg className="size-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Verification failed</h1>
            <p className="text-sm text-rose-400 mb-6">{errorMessage}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400 transition-all duration-300 text-sm shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallback
