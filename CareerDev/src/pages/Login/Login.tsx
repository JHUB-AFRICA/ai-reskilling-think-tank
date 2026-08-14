import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function Login() {
  const { isConfigured, signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from =
    location.state && typeof location.state === 'object' && 'from' in location.state
      ? (location.state as { from: Location }).from.pathname ?? '/dashboard'
      : '/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Please enter your email before requesting a password reset.')
      return
    }

    setError('')
    setMessage('')

    try {
      await resetPassword(email)
      setMessage('If an account exists for that email, a reset link has been sent.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Unable to send reset email.')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#050814]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/3 left-1/3 size-72 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 size-72 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1321]/60 p-8 shadow-2xl backdrop-blur-xl relative">
        <div className="absolute -top-3 -left-3 size-16 rounded-full bg-cyan-500/5 blur-md" />

        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="flex items-center gap-2.5 mb-5">
            <span className="grid size-10 place-items-center rounded-lg bg-cyan-500 text-slate-950 font-bold glow-effect">
              <BriefcaseBusiness size={22} />
            </span>
            <span className="text-xl font-bold text-white tracking-wide">CareerDevAI</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Sign in to access your AI roadmap and career development insights.
          </p>
        </div>

        {!isConfigured ? (
          <div className="mb-6 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-300">
            Running in Local Preview Mode. All data will be saved to this browser's LocalStorage.
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-left">
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition duration-200"
              required
            />
          </div>

          <div className="text-left">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition duration-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3.5 font-bold text-slate-950 hover:bg-cyan-400 transition-all duration-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transform hover:scale-[1.01]"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            Forgot password?
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400 border-t border-slate-850 pt-5">
          New to the platform?{' '}
          <Link to="/register" className="font-bold text-cyan-400 hover:text-cyan-300 transition">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
