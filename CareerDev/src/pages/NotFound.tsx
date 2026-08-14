import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#050814]">
      {/* Decorative blur orbs */}
      <div className="absolute top-1/3 left-1/3 size-80 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 size-80 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1321]/60 p-10 shadow-2xl backdrop-blur-xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">404</p>
        <h1 className="text-4xl font-extrabold text-white mb-4">Page not found</h1>
        <p className="text-sm text-slate-400 max-w-xs mx-auto mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
