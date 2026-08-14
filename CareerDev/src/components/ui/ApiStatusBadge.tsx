// src/components/ui/ApiStatusBadge.tsx
//
// Reusable component that pings GET /health and shows a live
// "API Online" / "API Offline" indicator. Designed to be embedded
// in the header or home page without layout disruption.

import { useState, useEffect } from 'react'
import { getHealth } from '../../services/platformApi'

type Status = 'checking' | 'online' | 'offline'

interface ApiStatusBadgeProps {
  className?: string
  showLabel?: boolean
}

export default function ApiStatusBadge({
  className = '',
  showLabel = true,
}: ApiStatusBadgeProps) {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const res = await getHealth()
        if (!cancelled) setStatus(res.status === 'ok' ? 'online' : 'offline')
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }

    check()
    const interval = setInterval(check, 30_000) // re-check every 30 s
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const dot =
    status === 'online'
      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
      : status === 'offline'
        ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
        : 'bg-amber-400 animate-pulse'

  const label =
    status === 'online' ? 'API Online' : status === 'offline' ? 'API Offline' : 'Checking…'

  const textColor =
    status === 'online'
      ? 'text-emerald-400'
      : status === 'offline'
        ? 'text-rose-400'
        : 'text-amber-400'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm transition-all duration-500 ${
        status === 'online'
          ? 'border-emerald-500/30 bg-emerald-950/30'
          : status === 'offline'
            ? 'border-rose-500/30 bg-rose-950/30'
            : 'border-amber-500/30 bg-amber-950/20'
      } ${className}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} />
      {showLabel && <span className={textColor}>{label}</span>}
    </span>
  )
}
