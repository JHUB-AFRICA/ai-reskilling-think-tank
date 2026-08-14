# Reskilling Platform — Web Frontend (Phase B)

Next.js 14 (App Router) + TypeScript, calling the FastAPI service in `app_api/`
via `lib/api.ts`. Mirrors every page in the Streamlit app (`app/`), proving the
API is the single source of truth both frontends depend on.

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local   # adjust NEXT_PUBLIC_API_URL if needed
npm run dev
```

Requires the FastAPI service running separately:

```bash
uvicorn app_api.main:app --reload
```

## Verification status (as of this build)

- `npx tsc --noEmit` — passes, zero type errors, confirmed both before and
  after restoring the real `next/font` Google Fonts configuration.
- `npm run build` — fails in this sandbox specifically and only at the
  `next/font` Google Fonts fetch step (`fonts.googleapis.com` is not on this
  sandbox's network allowlist). Isolated this by temporarily stripping
  `next/font` from `app/layout.tsx`: with that one change, `npm run build`
  succeeds completely -- all 5 routes (`/`, `/upload`, `/trends`, `/pathway`,
  `/lrs`) compile, type-check, and statically generate with no errors. This
  confirms the font fetch is the *only* blocker, not a symptom of something
  else. Run `npm run build` on a machine with normal internet access (or let
  Vercel build it, which is the actual deploy target) for final confirmation.
- `npm audit` — 2 known advisories remain after pinning to the latest patched
  Next.js 14.x release (14.2.35). Full resolution requires Next.js 16, a
  breaking major-version change deliberately deferred rather than forced in
  an unverified scaffold. The remaining advisories concern Image
  Optimization, Middleware, and i18n routing -- none of which this codebase
  currently uses. Re-run `npm audit` and reassess before any real deployment.

## Structure

- `app/` — one route per platform page (dashboard, upload, trends, pathway, lrs)
- `lib/api.ts` — TypeScript API client, mirrors `app/api_client.py` exactly
- `lib/state.tsx` — React Context playing the same role as Streamlit's `st.session_state`
- `components/` — Sidebar, ReadinessGauge (the platform's one signature visual element), LatestReadiness
