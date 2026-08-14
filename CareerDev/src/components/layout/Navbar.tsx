import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        <Link
          to="/"
          className="text-2xl font-bold text-cyan-400"
        >
          CareerDevAI
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="hover:text-cyan-400 transition">
            Home
          </Link>

          <a href="/#features" className="hover:text-cyan-400 transition">
            Features
          </a>

          <a href="/#partners" className="hover:text-cyan-400 transition">
            Partners
          </a>

          <a href="/#about" className="hover:text-cyan-400 transition">
            About
          </a>
        </nav>

        <div className="flex gap-3">

          <Link
            to="/login"
            className="rounded-lg border border-cyan-500 px-4 py-2 hover:bg-cyan-500 hover:text-slate-950 transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition"
          >
            Register
          </Link>

        </div>

      </div>
    </header>
  );
}